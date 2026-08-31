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
    unique: true,
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
});

module.exports = Payment;
