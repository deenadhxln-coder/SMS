const { DataTypes } = require('sequelize');

module.exports = {
  up: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 6] CREATE ANNOUNCEMENTS TABLE ---');

    await queryInterface.createTable('announcements', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      target_role: {
        type: DataTypes.ENUM('ALL', 'Teacher', 'Student', 'Parent'),
        defaultValue: 'ALL',
        allowNull: false,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('announcements', ['tenant_id', 'created_at'], {
      name: 'idx_announcements_tenant_created',
    });

    console.log('✅ Successfully created announcements table and composite index.');
  },

  down: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 6 ROLLBACK] DROP ANNOUNCEMENTS TABLE ---');
    await queryInterface.dropTable('announcements');
    console.log('Rollback of announcements table completed.');
  },
};
