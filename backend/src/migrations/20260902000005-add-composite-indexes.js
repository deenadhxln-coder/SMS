const INDEXES_TO_CREATE = [
  { table: 'attendance', name: 'idx_attendance_tenant_date', columns: ['tenant_id', 'date'] },
  { table: 'exams', name: 'idx_exams_tenant_ay', columns: ['tenant_id', 'academic_year_id'] },
  { table: 'invoices', name: 'idx_invoices_tenant_status', columns: ['tenant_id', 'status'] },
  { table: 'invoices', name: 'idx_invoices_tenant_student', columns: ['tenant_id', 'student_id'] },
  { table: 'students', name: 'idx_students_tenant_class_sec', columns: ['tenant_id', 'class_id', 'section_id'] },
  { table: 'teachers', name: 'idx_teachers_tenant_dept', columns: ['tenant_id', 'department'] },
  { table: 'timetables', name: 'idx_timetables_tenant_class_dow', columns: ['tenant_id', 'class_id', 'day_of_week'] },
  { table: 'payments', name: 'idx_payments_tenant_invoice', columns: ['tenant_id', 'invoice_id'] },
  { table: 'audit_logs', name: 'idx_audit_logs_tenant_timestamp', columns: ['tenant_id', 'timestamp'] },
  { table: 'platform_audit_logs', name: 'idx_platform_audit_admin_created', columns: ['admin_id', 'created_at'] },
  { table: 'platform_audit_logs', name: 'idx_platform_audit_tenant_created', columns: ['tenant_id', 'created_at'] },
];

module.exports = {
  up: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 5] ADD HIGH-PERFORMANCE COMPOSITE INDEXES ---');

    for (const item of INDEXES_TO_CREATE) {
      const [indexes] = await queryInterface.sequelize.query(`SHOW INDEX FROM \`${item.table}\``);
      const existingNames = indexes.map(i => i.Key_name);

      if (!existingNames.includes(item.name)) {
        console.log(`Adding index ${item.name} on ${item.table}(${item.columns.join(', ')})...`);
        const colsSql = item.columns.map(c => `\`${c}\``).join(', ');
        await queryInterface.sequelize.query(`ALTER TABLE \`${item.table}\` ADD INDEX \`${item.name}\` (${colsSql})`);
      } else {
        console.log(`Index ${item.name} on ${item.table} already exists. Skipping.`);
      }
    }

    console.log('✅ Successfully created all operational composite indexes.');
  },

  down: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 5 ROLLBACK] REMOVE COMPOSITE INDEXES ---');
    for (const item of INDEXES_TO_CREATE) {
      try {
        const [indexes] = await queryInterface.sequelize.query(`SHOW INDEX FROM \`${item.table}\``);
        const existingNames = indexes.map(i => i.Key_name);
        if (existingNames.includes(item.name)) {
          console.log(`Dropping index ${item.name} from ${item.table}...`);
          await queryInterface.sequelize.query(`ALTER TABLE \`${item.table}\` DROP INDEX \`${item.name}\``);
        }
      } catch (err) {
        console.warn(`Could not drop index ${item.name} on ${item.table}:`, err.message);
      }
    }
    console.log('Rollback of composite indexes completed.');
  },
};
