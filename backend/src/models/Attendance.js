const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Attendance = sequelize.define('Attendance', {
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
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'student_id',
  },
  classId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'class_id',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LATE'),
    allowNull: false,
  },
  markedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'marked_by', // links to User ID who marked this attendance
  },
}, {
  tableName: 'attendance',
  indexes: [
    {
      name: 'uniq_attendance_tenant_student_date',
      unique: true,
      fields: ['tenant_id', 'student_id', 'date'],
    },
    {
      name: 'idx_attendance_tenant_date',
      fields: ['tenant_id', 'date'],
    },
  ],
});

module.exports = Attendance;
