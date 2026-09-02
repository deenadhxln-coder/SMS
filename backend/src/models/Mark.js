const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Mark = sequelize.define('Mark', {
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
  examSubjectId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'exam_subject_id', // Links to ExamSubject
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'student_id',
  },
  marksObtained: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: 'marks_obtained',
  },
  maxMarks: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: 'max_marks',
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'marks',
  indexes: [
    {
      name: 'uniq_marks_tenant_exam_sub_student',
      unique: true,
      fields: ['tenant_id', 'exam_subject_id', 'student_id'],
    },
    {
      name: 'idx_marks_tenant_exam_sub',
      fields: ['tenant_id', 'exam_subject_id'],
    },
  ],
});

module.exports = Mark;
