const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Timetable = sequelize.define('Timetable', {
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
  subjectId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'subject_id',
  },
  teacherId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'teacher_id',
  },
  dayOfWeek: {
    type: DataTypes.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
    allowNull: false,
    field: 'day_of_week',
  },
  startTime: {
    type: DataTypes.STRING, // e.g. '09:00'
    allowNull: false,
    field: 'start_time',
  },
  endTime: {
    type: DataTypes.STRING, // e.g. '10:00'
    allowNull: false,
    field: 'end_time',
  },
  roomNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'room_number',
  },
}, {
  tableName: 'timetables',
  timestamps: true,
  indexes: [
    {
      name: 'idx_timetables_tenant_class_dow',
      fields: ['tenant_id', 'class_id', 'day_of_week'],
    },
  ],
});

module.exports = Timetable;
