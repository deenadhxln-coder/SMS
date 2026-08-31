const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Student = sequelize.define('Student', {
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
  admissionNo: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'admission_no',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  classId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'class_id',
  },
  sectionId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'section_id',
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'parent_id', // links to the Parent user profile in users table
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE',
    allowNull: false,
  },
}, {
  tableName: 'students',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'admission_no'],
    },
  ],
});

module.exports = Student;
