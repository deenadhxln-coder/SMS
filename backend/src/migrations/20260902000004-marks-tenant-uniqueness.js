module.exports = {
  up: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 4] MARKS TENANT-SCOPED UNIQUENESS & LOOKUP INDEX ---');

    // 1. Preflight duplicate check: Marks (tenant_id, exam_subject_id, student_id)
    const [markDupes] = await queryInterface.sequelize.query(`
      SELECT tenant_id, exam_subject_id, student_id, COUNT(*) as count
      FROM marks
      GROUP BY tenant_id, exam_subject_id, student_id
      HAVING count > 1
    `);

    if (markDupes.length > 0) {
      console.error(`\n❌ MARKS CONFLICT: Found ${markDupes.length} duplicate group(s) on (tenant_id, exam_subject_id, student_id):`);
      console.error(markDupes);
      throw new Error(
        `Cannot add tenant-scoped unique constraint on marks: ${markDupes.length} duplicate group(s) detected. ` +
        `Manual resolution required. Automated migration will NOT delete or mutate records.`
      );
    }

    console.log('✅ Preflight validated: 0 duplicates detected in marks table.');

    // 2. Marks Index Updates
    const [markIndexes] = await queryInterface.sequelize.query('SHOW INDEX FROM marks');
    const existingMarkIndexNames = [...new Set(markIndexes.map(i => i.Key_name))];

    // Ensure exam_subject_id has a supporting index for its foreign key constraint
    if (!existingMarkIndexNames.includes('idx_marks_exam_subject_id') && !existingMarkIndexNames.includes('exam_subject_id')) {
      console.log('Adding supporting index idx_marks_exam_subject_id for exam_subject_id foreign key...');
      await queryInterface.sequelize.query('ALTER TABLE marks ADD INDEX `idx_marks_exam_subject_id` (`exam_subject_id`)');
    }

    // 3. Add composite unique constraint
    if (!existingMarkIndexNames.includes('uniq_marks_tenant_exam_sub_student')) {
      console.log('Adding composite unique index uniq_marks_tenant_exam_sub_student on marks(tenant_id, exam_subject_id, student_id)...');
      await queryInterface.sequelize.query(
        'ALTER TABLE marks ADD CONSTRAINT `uniq_marks_tenant_exam_sub_student` UNIQUE (`tenant_id`, `exam_subject_id`, `student_id`)'
      );
    }

    // 4. Add composite lookup index on (tenant_id, exam_subject_id)
    if (!existingMarkIndexNames.includes('idx_marks_tenant_exam_sub')) {
      console.log('Adding performance index idx_marks_tenant_exam_sub on marks(tenant_id, exam_subject_id)...');
      await queryInterface.sequelize.query(
        'ALTER TABLE marks ADD INDEX `idx_marks_tenant_exam_sub` (`tenant_id`, `exam_subject_id`)'
      );
    }

    // 5. Now safely drop legacy unique indexes on marks
    for (const idxName of ['marks_exam_subject_id_student_id', 'exam_subject_id_student_id', 'marks_exam_subject_id_student_id_unique']) {
      if (existingMarkIndexNames.includes(idxName)) {
        console.log(`Dropping legacy index ${idxName} on marks...`);
        await queryInterface.sequelize.query(`ALTER TABLE marks DROP INDEX \`${idxName}\``);
      }
    }

    console.log('✅ Successfully applied tenant-scoped unique constraint and index to marks table.');
  },

  down: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 4 ROLLBACK] REVERT MARKS UNIQUENESS & INDEX ---');
    try {
      await queryInterface.sequelize.query('ALTER TABLE marks DROP INDEX `idx_marks_tenant_exam_sub`');
    } catch (e) {
      console.warn('Drop idx_marks_tenant_exam_sub warning:', e.message);
    }

    try {
      await queryInterface.sequelize.query('ALTER TABLE marks DROP INDEX `uniq_marks_tenant_exam_sub_student`');
      await queryInterface.sequelize.query('ALTER TABLE marks ADD UNIQUE `marks_exam_subject_id_student_id` (`exam_subject_id`, `student_id`)');
    } catch (e) {
      console.warn('Restore marks legacy index warning:', e.message);
    }
    console.log('Reverted marks unique constraint and index.');
  },
};
