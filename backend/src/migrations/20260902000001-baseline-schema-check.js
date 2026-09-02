const { sequelize } = require('../config/db');

const EXPECTED_TABLES = [
  'tenants',
  'platform_admins',
  'subscription_plans',
  'platform_audit_logs',
  'roles',
  'users',
  'teachers',
  'students',
  'classes',
  'sections',
  'subjects',
  'class_subjects',
  'timetables',
  'attendance',
  'exams',
  'exam_subjects',
  'marks',
  'fee_structures',
  'invoices',
  'payments',
  'audit_logs',
];

module.exports = {
  up: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 1] BASELINE SCHEMA TRI-STATE CHECK ---');

    // 1. Fetch current tables in database
    const [rawTables] = await queryInterface.sequelize.query('SHOW TABLES');
    const existingTables = rawTables
      .map(row => Object.values(row)[0].toLowerCase())
      .filter(t => t !== 'sequelizemeta');

    console.log(`Detected ${existingTables.length} existing application table(s).`);

    const missingTables = EXPECTED_TABLES.filter(t => !existingTables.includes(t));
    const extraTables = existingTables.filter(t => !EXPECTED_TABLES.includes(t));

    // STATE A: Complete Database (All 21 tables present)
    if (missingTables.length === 0) {
      console.log('✅ STATE A DETECTED: Full 21-table application schema already present.');
      console.log('Registering baseline in SequelizeMeta without executing DDL or mutating data.');
      return;
    }

    // STATE B: Empty Database (0 application tables present)
    if (existingTables.length === 0) {
      console.log('🆕 STATE B DETECTED: Blank database. Initializing baseline schema matching Sequelize models...');
      // Load all model associations
      require('../models/index');
      // Create tables non-destructively
      await sequelize.sync();
      console.log('✅ Successfully initialized baseline 21-table schema on fresh database.');
      return;
    }

    // STATE C: Inconsistent / Partially Initialized Database
    console.error('❌ STATE C DETECTED: Inconsistent / Partial Database State.');
    console.error(`Existing tables (${existingTables.length}):`, existingTables);
    console.error(`Missing expected tables (${missingTables.length}):`, missingTables);
    if (extraTables.length > 0) {
      console.error(`Unrecognized extra tables:`, extraTables);
    }
    throw new Error(
      `Baseline verification failed: Database is partially initialized (${existingTables.length}/${EXPECTED_TABLES.length} tables present). ` +
      `Missing tables: [${missingTables.join(', ')}]. Manual inspection required to avoid data loss.`
    );
  },

  down: async ({ context: queryInterface }) => {
    console.log('[MIGRATION 1] Baseline rollback: No-op to prevent destructive data loss.');
  },
};
