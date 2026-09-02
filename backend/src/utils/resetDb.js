const { sequelize } = require('../config/db');
const seedDatabase = require('./seeder');

/**
 * Multi-Factor Safety Guard for Destructive Database Resets:
 * 1. Requires explicit TEST_DB_NAME environment variable.
 * 2. Targeted Sequelize DB must match TEST_DB_NAME exactly.
 * 3. Requires NODE_ENV !== 'production'.
 * 4. Requires explicit opt-in: ALLOW_DESTRUCTIVE_DB_RESET=true.
 * 5. Rejects production/suspicious database names as defense-in-depth.
 */
const assertDestructiveResetAllowed = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    throw new Error('FATAL: Destructive database reset is strictly forbidden in production environment (NODE_ENV=production).');
  }

  const allowOptIn = process.env.ALLOW_DESTRUCTIVE_DB_RESET;
  if (allowOptIn !== 'true') {
    throw new Error('FATAL: Destructive database reset requires explicit ALLOW_DESTRUCTIVE_DB_RESET=true environment variable.');
  }

  const testDbName = process.env.TEST_DB_NAME;
  if (!testDbName) {
    throw new Error('FATAL: Destructive database reset requires explicit TEST_DB_NAME environment variable to be configured.');
  }

  const targetDbName = sequelize.config.database || process.env.DB_NAME;
  if (targetDbName !== testDbName) {
    throw new Error(`FATAL: Targeted database "${targetDbName}" does not match configured TEST_DB_NAME "${testDbName}". Reset aborted.`);
  }

  // Reject production / suspicious database names (defense-in-depth)
  const suspiciousKeywords = ['prod', 'production', 'live', 'master'];
  const lowerDbName = targetDbName.toLowerCase();
  for (const keyword of suspiciousKeywords) {
    if (lowerDbName.includes(keyword) && !lowerDbName.includes('test')) {
      throw new Error(`FATAL: Targeted database "${targetDbName}" contains suspicious keyword "${keyword}". Destructive reset rejected.`);
    }
  }
};

const resetDb = async () => {
  try {
    assertDestructiveResetAllowed();

    console.log('Connecting to database...');
    // Force synchronize will drop all existing tables and recreate them cleanly
    console.log('WARNING: Dropping all database tables and recreating them...');
    await sequelize.sync({ force: true });
    console.log('Database schema recreated successfully.');

    console.log('Seeding fresh default records (plans, roles, platform admin)...');
    await seedDatabase();
    console.log('Database reset and seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database reset failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  resetDb();
}

module.exports = { resetDb, assertDestructiveResetAllowed };

