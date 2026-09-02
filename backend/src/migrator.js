const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize } = require('./config/db');

const migrator = new Umzug({
  migrations: {
    glob: ['migrations/*.js', { cwd: __dirname }],
    resolve: ({ name, path: migrationPath, context }) => {
      const migration = require(migrationPath);
      return {
        name,
        up: async () => migration.up({ context }),
        down: async () => migration.down({ context }),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({
    sequelize,
    tableName: 'SequelizeMeta',
  }),
  logger: console,
});

/**
 * Programmatic migration runner for CI/CD, CLI scripts, tests, and reset tooling.
 */
async function runMigrations() {
  return await migrator.up();
}

/**
 * Read-only pending migration checker for server boot diagnostics.
 */
async function checkPendingMigrations() {
  const pending = await migrator.pending();
  return pending;
}

module.exports = {
  migrator,
  runMigrations,
  checkPendingMigrations,
};
