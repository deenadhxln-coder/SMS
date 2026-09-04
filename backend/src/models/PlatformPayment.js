const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PlatformPayment = sequelize.define('PlatformPayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'subscription_id',
  },
  gatewayPaymentId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'gateway_payment_id',
  },
  gatewayOrderId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'gateway_order_id',
  },
  gatewayInvoiceId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'gateway_invoice_id',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR',
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('SUCCEEDED', 'PENDING', 'FAILED', 'REFUNDED'),
    defaultValue: 'PENDING',
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'payment_method',
  },
  receiptUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'receipt_url',
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paid_at',
  },
}, {
  tableName: 'platform_payments',
  timestamps: true,
  underscored: true,
});

module.exports = PlatformPayment;
