const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Teacher = sequelize.define('Teacher', {
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
  employeeNo: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'employee_no',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE',
    allowNull: false,
  },
}, {
  tableName: 'teachers',
  indexes: [
    {
      name: 'teachers_tenant_id_employee_no',
      unique: true,
      fields: ['tenant_id', 'employee_no'],
    },
    {
      name: 'idx_teachers_tenant_dept',
      fields: ['tenant_id', 'department'],
    },
  ],
});

module.exports = Teacher;
