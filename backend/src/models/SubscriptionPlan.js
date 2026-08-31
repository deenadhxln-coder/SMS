const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  maxStudents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'max_students',
  },
  maxTeachers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'max_teachers',
  },
  featuresJson: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'features_json',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
}, {
  tableName: 'subscription_plans',
  timestamps: true,
});

module.exports = SubscriptionPlan;
