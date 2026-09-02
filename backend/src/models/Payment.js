const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
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
  invoiceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'invoice_id',
  },
  amountPaid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'amount_paid',
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'payment_method',
  },
  transactionRef: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'transaction_ref',
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'paid_at',
  },
}, {
  tableName: 'payments',
  indexes: [
    {
      name: 'uniq_payments_tenant_txn_ref',
      unique: true,
      fields: ['tenant_id', 'transaction_ref'],
    },
    {
      name: 'idx_payments_tenant_invoice',
      fields: ['tenant_id', 'invoice_id'],
    },
  ],
});

module.exports = Payment;
