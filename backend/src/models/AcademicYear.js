const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AcademicYear = sequelize.define('AcademicYear', {
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
  },
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date',
  },
  isCurrent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'is_current',
  },
  status: {
    type: DataTypes.ENUM('UPCOMING', 'ACTIVE', 'ARCHIVED'),
    defaultValue: 'ACTIVE',
    allowNull: false,
  },
}, {
  tableName: 'academic_years',
  indexes: [
    {
      name: 'uniq_ay_tenant_name',
      unique: true,
      fields: ['tenant_id', 'name'],
    },
    {
      name: 'idx_ay_tenant_current',
      fields: ['tenant_id', 'is_current'],
    },
  ],
});

module.exports = AcademicYear;
