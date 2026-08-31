const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Class = sequelize.define('Class', {
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
  academicYearId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'academic_year_id',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'classes',
});

module.exports = Class;
