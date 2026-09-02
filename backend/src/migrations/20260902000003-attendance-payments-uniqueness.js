module.exports = {
  up: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 3] TENANT-SCOPED UNIQUENESS (ATTENDANCE & PAYMENTS) ---');

    // 1. Preflight duplicate check: Attendance (tenant_id, student_id, date)
    const [attDupes] = await queryInterface.sequelize.query(`
      SELECT tenant_id, student_id, date, COUNT(*) as count
      FROM attendance
      GROUP BY tenant_id, student_id, date
      HAVING count > 1
    `);

    if (attDupes.length > 0) {
      console.error(`\n❌ ATTENDANCE CONFLICT: Found ${attDupes.length} duplicate group(s) on (tenant_id, student_id, date):`);
      console.error(attDupes);
      throw new Error(
        `Cannot add tenant-scoped unique constraint on attendance: ${attDupes.length} duplicate group(s) detected. ` +
        `Manual resolution required. Automated migration will NOT delete or mutate records.`
      );
    }

    // 2. Preflight duplicate check: Payments (tenant_id, transaction_ref)
    const [payDupes] = await queryInterface.sequelize.query(`
      SELECT tenant_id, transaction_ref, COUNT(*) as count
      FROM payments
      GROUP BY tenant_id, transaction_ref
      HAVING count > 1
    `);

    if (payDupes.length > 0) {
      console.error(`\n❌ PAYMENTS CONFLICT: Found ${payDupes.length} duplicate group(s) on (tenant_id, transaction_ref):`);
      console.error(payDupes);
      throw new Error(
        `Cannot add tenant-scoped unique constraint on payments: ${payDupes.length} duplicate group(s) detected. ` +
        `Manual resolution required. Automated migration will NOT delete or mutate records.`
      );
    }

    console.log('✅ Preflight validated: 0 duplicates detected in attendance and payments.');

    // 3. Attendance Index Updates
    const [attIndexes] = await queryInterface.sequelize.query('SHOW INDEX FROM attendance');
    const existingAttIndexNames = [...new Set(attIndexes.map(i => i.Key_name))];

    // Ensure student_id has a supporting index for its foreign key constraint
    if (!existingAttIndexNames.includes('idx_attendance_student_id') && !existingAttIndexNames.includes('student_id')) {
      console.log('Adding supporting index idx_attendance_student_id for student_id foreign key...');
      await queryInterface.sequelize.query('ALTER TABLE attendance ADD INDEX `idx_attendance_student_id` (`student_id`)');
    }

    // Add tenant-scoped unique constraint on attendance
    if (!existingAttIndexNames.includes('uniq_attendance_tenant_student_date')) {
      console.log('Adding composite unique index uniq_attendance_tenant_student_date on attendance(tenant_id, student_id, date)...');
      await queryInterface.sequelize.query(
        'ALTER TABLE attendance ADD CONSTRAINT `uniq_attendance_tenant_student_date` UNIQUE (`tenant_id`, `student_id`, `date`)'
      );
    }

    // Now safely drop legacy unique indexes on attendance
    for (const idxName of ['attendance_student_id_date', 'student_id_date', 'attendance_student_id_date_unique']) {
      if (existingAttIndexNames.includes(idxName)) {
        console.log(`Dropping legacy index ${idxName} on attendance...`);
        await queryInterface.sequelize.query(`ALTER TABLE attendance DROP INDEX \`${idxName}\``);
      }
    }

    // 4. Drop legacy unique indexes on payments
    const [payIndexes] = await queryInterface.sequelize.query('SHOW INDEX FROM payments');
    const existingPayIndexNames = [...new Set(payIndexes.map(i => i.Key_name))];

    for (const idxName of ['transaction_ref', 'transaction_ref_2', 'transaction_ref_unique']) {
      if (existingPayIndexNames.includes(idxName)) {
        console.log(`Dropping legacy index ${idxName} on payments...`);
        await queryInterface.sequelize.query(`ALTER TABLE payments DROP INDEX \`${idxName}\``);
      }
    }

    // Add tenant-scoped unique constraint on payments
    if (!existingPayIndexNames.includes('uniq_payments_tenant_txn_ref')) {
      console.log('Adding composite unique index uniq_payments_tenant_txn_ref on payments(tenant_id, transaction_ref)...');
      await queryInterface.sequelize.query(
        'ALTER TABLE payments ADD CONSTRAINT `uniq_payments_tenant_txn_ref` UNIQUE (`tenant_id`, `transaction_ref`)'
      );
    }

    console.log('✅ Successfully applied tenant-scoped unique constraints to attendance and payments.');
  },

  down: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 3 ROLLBACK] REVERT ATTENDANCE & PAYMENTS UNIQUENESS ---');
    try {
      await queryInterface.sequelize.query('ALTER TABLE attendance DROP INDEX `uniq_attendance_tenant_student_date`');
      await queryInterface.sequelize.query('ALTER TABLE attendance ADD UNIQUE `attendance_student_id_date` (`student_id`, `date`)');
    } catch (e) {
      console.warn('Attendance rollback warning:', e.message);
    }

    try {
      await queryInterface.sequelize.query('ALTER TABLE payments DROP INDEX `uniq_payments_tenant_txn_ref`');
      await queryInterface.sequelize.query('ALTER TABLE payments ADD UNIQUE `transaction_ref` (`transaction_ref`)');
    } catch (e) {
      console.warn('Payments rollback warning:', e.message);
    }
    console.log('Reverted attendance and payments unique constraints.');
  },
};
