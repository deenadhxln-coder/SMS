const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ExamSubject = sequelize.define('ExamSubject', {
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
  examId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'exam_id',
  },
  subjectId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'subject_id',
  },
  classId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'class_id',
  },
  examDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'exam_date',
  },
  maxMarks: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 100.0,
    field: 'max_marks',
  },
}, {
  tableName: 'exam_subjects',
});

module.exports = ExamSubject;
