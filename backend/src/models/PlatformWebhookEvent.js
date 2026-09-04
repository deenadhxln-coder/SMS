const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PlatformWebhookEvent = sequelize.define('PlatformWebhookEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  gatewayEventId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'gateway_event_id',
  },
  eventType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'event_type',
  },
  status: {
    type: DataTypes.ENUM('PROCESSED', 'FAILED', 'IGNORED'),
    defaultValue: 'PROCESSED',
    allowNull: false,
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'processed_at',
  },
}, {
  tableName: 'platform_webhook_events',
  timestamps: true,
  underscored: true,
});

module.exports = PlatformWebhookEvent;
