const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FeeStructure = sequelize.define('FeeStructure', {
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
  classId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'class_id',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  academicYearId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'academic_year_id',
  },
}, {
  tableName: 'fee_structures',
});

module.exports = FeeStructure;
