const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Announcement = sequelize.define('Announcement', {
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Title is required' },
      len: { args: [3, 255], msg: 'Title must be between 3 and 255 characters' },
    },
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Body content is required' },
    },
  },
  targetRole: {
    type: DataTypes.ENUM('ALL', 'Teacher', 'Student', 'Parent'),
    defaultValue: 'ALL',
    allowNull: false,
    field: 'target_role',
    validate: {
      isIn: {
        args: [['ALL', 'Teacher', 'Student', 'Parent']],
        msg: 'Target role must be ALL, Teacher, Student, or Parent',
      },
    },
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'created_by',
  },
}, {
  tableName: 'announcements',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_announcements_tenant_created',
      fields: ['tenant_id', 'created_at'],
    },
  ],
});

module.exports = Announcement;
