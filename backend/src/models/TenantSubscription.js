const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TenantSubscription = sequelize.define('TenantSubscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
    unique: true,
  },
  planId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'plan_id',
  },
  planType: {
    type: DataTypes.ENUM('FREE', 'STANDARD', 'PREMIUM'),
    defaultValue: 'FREE',
    allowNull: false,
    field: 'plan_type',
  },
  gatewayCustomerId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'gateway_customer_id',
  },
  gatewaySubscriptionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'gateway_subscription_id',
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'AUTHENTICATED'),
    defaultValue: 'ACTIVE',
    allowNull: false,
  },
  currentPeriodStart: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'current_period_start',
  },
  currentPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'current_period_end',
  },
  cancelAtPeriodEnd: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'cancel_at_period_end',
  },
}, {
  tableName: 'tenant_subscriptions',
  timestamps: true,
  underscored: true,
});

module.exports = TenantSubscription;
