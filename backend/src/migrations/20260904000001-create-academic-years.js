const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = {
  up: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 7] CREATE ACADEMIC YEARS TABLE & STAGED BACKFILL ---');

    // 1. Create academic_years table
    const [existingTables] = await queryInterface.sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'academic_years'"
    );

    if (existingTables.length === 0) {
      console.log('Creating academic_years table...');
      await queryInterface.createTable('academic_years', {
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
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        start_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        end_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        is_current: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('UPCOMING', 'ACTIVE', 'ARCHIVED'),
          defaultValue: 'ACTIVE',
          allowNull: false,
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

      await queryInterface.addIndex('academic_years', ['tenant_id', 'name'], {
        name: 'uniq_ay_tenant_name',
        unique: true,
      });

      await queryInterface.addIndex('academic_years', ['tenant_id', 'is_current'], {
        name: 'idx_ay_tenant_current',
      });
      console.log('✅ Created academic_years table and composite indexes.');
    }

    // 2. Staged Backfill of Legacy String Academic Year References
    console.log('Scanning classes, exams, and fee_structures for legacy academic-year strings...');
    const tablesToBackfill = ['classes', 'exams', 'fee_structures'];
    const distinctPairs = new Map(); // key: `${tenant_id}:::${legacy_string}`, value: { tenant_id, name }

    for (const tableName of tablesToBackfill) {
      try {
        const [rows] = await queryInterface.sequelize.query(
          `SELECT DISTINCT \`tenant_id\`, \`academic_year_id\` FROM \`${tableName}\` WHERE \`academic_year_id\` IS NOT NULL AND \`academic_year_id\` != ''`
        );
        for (const row of rows) {
          const key = `${row.tenant_id}:::${row.academic_year_id}`;
          if (!distinctPairs.has(key)) {
            distinctPairs.set(key, { tenant_id: row.tenant_id, name: row.academic_year_id });
          }
        }
      } catch (err) {
        console.warn(`Could not read distinct academic years from ${tableName}:`, err.message);
      }
    }

    console.log(`Found ${distinctPairs.size} distinct legacy (tenant, academic_year) pair(s).`);

    // Map each legacy pair to an official AcademicYear UUID
    const legacyToIdMap = new Map();

    for (const [key, pair] of distinctPairs.entries()) {
      const [existingAy] = await queryInterface.sequelize.query(
        `SELECT \`id\` FROM \`academic_years\` WHERE \`tenant_id\` = '${pair.tenant_id}' AND \`name\` = ${queryInterface.sequelize.escape(pair.name)}`
      );

      let ayId;
      if (existingAy.length > 0) {
        ayId = existingAy[0].id;
      } else {
        ayId = crypto.randomUUID();
        await queryInterface.sequelize.query(
          `INSERT INTO \`academic_years\` (\`id\`, \`tenant_id\`, \`name\`, \`start_date\`, \`end_date\`, \`is_current\`, \`status\`, \`created_at\`, \`updated_at\`)
           VALUES ('${ayId}', '${pair.tenant_id}', ${queryInterface.sequelize.escape(pair.name)}, '2026-06-01', '2027-05-31', 1, 'ACTIVE', NOW(), NOW())`
        );
        console.log(`Backfilled AcademicYear '${pair.name}' (${ayId}) for tenant ${pair.tenant_id}`);
      }
      legacyToIdMap.set(key, ayId);
    }

    // Update references in classes, exams, fee_structures
    for (const [key, pair] of distinctPairs.entries()) {
      const newId = legacyToIdMap.get(key);
      if (!newId) continue;

      for (const tableName of tablesToBackfill) {
        await queryInterface.sequelize.query(
          `UPDATE \`${tableName}\` 
           SET \`academic_year_id\` = '${newId}' 
           WHERE \`tenant_id\` = '${pair.tenant_id}' AND \`academic_year_id\` = ${queryInterface.sequelize.escape(pair.name)}`
        );
      }
    }

    // 3. Alter columns to CHAR(36) and attach Foreign Key constraints
    console.log('Enforcing strict foreign keys on classes, exams, and fee_structures...');
    for (const tableName of tablesToBackfill) {
      // Modify column definition to CHAR(36) matching UUID
      await queryInterface.changeColumn(tableName, 'academic_year_id', {
        type: DataTypes.UUID,
        allowNull: false,
      });

      // Check if FK constraint already exists
      const [existingFks] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' AND COLUMN_NAME = 'academic_year_id' AND REFERENCED_TABLE_NAME = 'academic_years'`
      );

      if (existingFks.length === 0) {
        const fkName = `fk_${tableName}_academic_year`;
        await queryInterface.addConstraint(tableName, {
          fields: ['academic_year_id'],
          type: 'foreign key',
          name: fkName,
          references: {
            table: 'academic_years',
            field: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        });
        console.log(`Added FK constraint ${fkName} on ${tableName}(academic_year_id).`);
      }
    }

    console.log('✅ Successfully completed AcademicYear migration and relational foreign key enforcement.');
  },

  down: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 7 ROLLBACK] REVERT ACADEMIC YEARS ---');
    const tablesToRevert = ['classes', 'exams', 'fee_structures'];

    for (const tableName of tablesToRevert) {
      try {
        const fkName = `fk_${tableName}_academic_year`;
        await queryInterface.removeConstraint(tableName, fkName);
        console.log(`Removed FK constraint ${fkName} from ${tableName}.`);
      } catch (err) {
        console.warn(`Could not drop FK on ${tableName}:`, err.message);
      }

      try {
        await queryInterface.changeColumn(tableName, 'academic_year_id', {
          type: DataTypes.STRING(255),
          allowNull: false,
        });
      } catch (err) {
        console.warn(`Could not revert column type on ${tableName}:`, err.message);
      }
    }

    await queryInterface.dropTable('academic_years');
    console.log('Rollback of academic_years table completed.');
  },
};
