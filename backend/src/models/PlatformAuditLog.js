const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PlatformAuditLog = sequelize.define('PlatformAuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'admin_id',
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'tenant_id',
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'platform_audit_logs',
  timestamps: true,
  updatedAt: false,
  indexes: [
    {
      name: 'idx_platform_audit_admin_created',
      fields: ['admin_id', 'created_at'],
    },
    {
      name: 'idx_platform_audit_tenant_created',
      fields: ['tenant_id', 'created_at'],
    },
  ],
});

module.exports = PlatformAuditLog;
