const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  schoolName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'school_name',
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'logo_url',
  },
  planType: {
    type: DataTypes.ENUM('FREE', 'STANDARD', 'PREMIUM'),
    defaultValue: 'FREE',
    allowNull: false,
    field: 'plan_type',
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'),
    defaultValue: 'ACTIVE',
    allowNull: false,
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'contact_email',
  },
  createdByAdminId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by_admin_id',
  },
}, {
  tableName: 'tenants',
  timestamps: true,
});

module.exports = Tenant;
