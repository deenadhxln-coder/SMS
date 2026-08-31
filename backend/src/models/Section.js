const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Section = sequelize.define('Section', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  classTeacherId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'class_teacher_id', // links to Teacher
  },
}, {
  tableName: 'sections',
});

module.exports = Section;
