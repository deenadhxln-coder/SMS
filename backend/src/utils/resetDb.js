const { sequelize } = require('../config/db');
const seedDatabase = require('./seeder');

const resetDb = async () => {
  try {
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

resetDb();
