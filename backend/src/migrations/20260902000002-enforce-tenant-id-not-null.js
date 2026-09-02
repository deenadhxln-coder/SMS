module.exports = {
  up: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 2] ENFORCE NOT NULL ON TENANT_ID (USERS & AUDIT_LOGS) ---');

    // 1. Preflight check: users with NULL tenant_id
    const [nullUsers] = await queryInterface.sequelize.query(
      'SELECT id, name, email, role_id FROM users WHERE tenant_id IS NULL'
    );

    if (nullUsers.length > 0) {
      console.error(`\n❌ TENANT INTEGRITY ERROR: Found ${nullUsers.length} user(s) with NULL tenant_id:`);
      nullUsers.forEach(u => console.error(`  - ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | RoleID: ${u.role_id}`));
      throw new Error(
        `Cannot enforce NOT NULL on users.tenant_id: ${nullUsers.length} record(s) have NULL tenant_id. ` +
        `Manual resolution required. Automated migration will NOT guess or assign tenant ownership.`
      );
    }

    // 2. Preflight check: audit_logs with NULL tenant_id
    const [nullAuditLogs] = await queryInterface.sequelize.query(
      'SELECT id, user_id, action, entity FROM audit_logs WHERE tenant_id IS NULL'
    );

    if (nullAuditLogs.length > 0) {
      console.error(`\n❌ TENANT INTEGRITY ERROR: Found ${nullAuditLogs.length} audit_log(s) with NULL tenant_id:`);
      nullAuditLogs.forEach(l => console.error(`  - ID: ${l.id} | UserID: ${l.user_id} | Action: ${l.action} | Entity: ${l.entity}`));
      throw new Error(
        `Cannot enforce NOT NULL on audit_logs.tenant_id: ${nullAuditLogs.length} record(s) have NULL tenant_id. ` +
        `Manual resolution required. Automated migration will NOT guess or assign tenant ownership.`
      );
    }

    console.log('✅ Preflight validated: 0 NULL tenant_id rows detected in users and audit_logs.');

    // Helper to drop foreign keys on a column
    const dropForeignKeyOnColumn = async (tableName, columnName) => {
      const [fks] = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_NAME = '${tableName}'
          AND COLUMN_NAME = '${columnName}'
          AND REFERENCED_TABLE_NAME IS NOT NULL
          AND TABLE_SCHEMA = DATABASE()
      `);

      for (const fk of fks) {
        console.log(`Dropping foreign key constraint ${fk.CONSTRAINT_NAME} from ${tableName}...`);
        await queryInterface.sequelize.query(`ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
      }
    };

    // 3. Enforce NOT NULL on users.tenant_id
    console.log('Processing users.tenant_id...');
    await dropForeignKeyOnColumn('users', 'tenant_id');
    console.log('Altering users.tenant_id to NOT NULL with matching charset/collation...');
    await queryInterface.sequelize.query(
      'ALTER TABLE users MODIFY COLUMN tenant_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL'
    );
    console.log('Re-adding foreign key fk_users_tenant_id (ON DELETE RESTRICT ON UPDATE CASCADE)...');
    await queryInterface.sequelize.query(
      'ALTER TABLE users ADD CONSTRAINT `fk_users_tenant_id` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE'
    );

    // 4. Enforce NOT NULL on audit_logs.tenant_id
    console.log('Processing audit_logs.tenant_id...');
    await dropForeignKeyOnColumn('audit_logs', 'tenant_id');
    console.log('Altering audit_logs.tenant_id to NOT NULL with matching charset/collation...');
    await queryInterface.sequelize.query(
      'ALTER TABLE audit_logs MODIFY COLUMN tenant_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL'
    );
    console.log('Re-adding foreign key fk_audit_logs_tenant_id (ON DELETE RESTRICT ON UPDATE CASCADE)...');
    await queryInterface.sequelize.query(
      'ALTER TABLE audit_logs ADD CONSTRAINT `fk_audit_logs_tenant_id` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE'
    );

    console.log('✅ Successfully enforced NOT NULL on users.tenant_id and audit_logs.tenant_id with safe referential integrity.');
  },

  down: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 2 ROLLBACK] REVERT NOT NULL ON TENANT_ID ---');
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE users MODIFY COLUMN tenant_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL'
      );
    } catch (e) {
      console.warn('users rollback warning:', e.message);
    }
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE audit_logs MODIFY COLUMN tenant_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL'
      );
    } catch (e) {
      console.warn('audit_logs rollback warning:', e.message);
    }
    console.log('Reverted users.tenant_id and audit_logs.tenant_id to NULLable.');
  },
};
