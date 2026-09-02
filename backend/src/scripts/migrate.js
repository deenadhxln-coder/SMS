const { migrator } = require('../migrator');
const { sequelize } = require('../config/db');

async function main() {
  const command = process.argv[2] || 'up';

  try {
    await sequelize.authenticate();
    console.log('Database connection authenticated.');

    if (command === 'status') {
      const executed = await migrator.executed();
      const pending = await migrator.pending();

      console.log('\n=== EXECUTED MIGRATIONS ===');
      if (executed.length === 0) {
        console.log('  (none)');
      } else {
        executed.forEach(m => console.log(`  ✓ ${m.name}`));
      }

      console.log('\n=== PENDING MIGRATIONS ===');
      if (pending.length === 0) {
        console.log('  (none - schema is up to date)');
      } else {
        pending.forEach(m => console.log(`  ⏳ ${m.name}`));
      }
      console.log('');
      process.exit(0);
    }

    if (command === 'up') {
      console.log('Running pending migrations...');
      const migrations = await migrator.up();
      if (migrations.length === 0) {
        console.log('No pending migrations to run. Schema is already up to date.');
      } else {
        console.log(`Successfully applied ${migrations.length} migration(s):`);
        migrations.forEach(m => console.log(`  ✓ ${m.name}`));
      }
      process.exit(0);
    }

    if (command === 'down') {
      console.log('Reverting last migration...');
      const migrations = await migrator.down();
      if (migrations.length === 0) {
        console.log('No migrations to revert.');
      } else {
        console.log(`Reverted migration: ${migrations[0].name}`);
      }
      process.exit(0);
    }

    console.error(`Unknown command: "${command}". Allowed commands: up, down, status.`);
    process.exit(1);
  } catch (error) {
    console.error('\n❌ MIGRATION ERROR:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
