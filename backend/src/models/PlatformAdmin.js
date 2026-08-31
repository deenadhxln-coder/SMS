const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PlatformAdmin = sequelize.define('PlatformAdmin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash',
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE',
    allowNull: false,
  },
}, {
  tableName: 'platform_admins',
  timestamps: true,
});

module.exports = PlatformAdmin;
