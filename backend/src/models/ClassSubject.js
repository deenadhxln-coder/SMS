const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ClassSubject = sequelize.define('ClassSubject', {
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
  },
  classId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'class_id',
    primaryKey: true,
  },
  subjectId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'subject_id',
    primaryKey: true,
  },
  teacherId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'teacher_id',
    primaryKey: true,
  },
}, {
  tableName: 'class_subjects',
  timestamps: false,
});

module.exports = ClassSubject;
