const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Invoice = sequelize.define('Invoice', {
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
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount',
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'paid_amount',
  },
  dueAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'due_amount',
  },
  status: {
    type: DataTypes.ENUM('PAID', 'PARTIAL', 'UNPAID'),
    defaultValue: 'UNPAID',
    allowNull: false,
  },
}, {
  tableName: 'invoices',
  indexes: [
    {
      name: 'idx_invoices_tenant_status',
      fields: ['tenant_id', 'status'],
    },
    {
      name: 'idx_invoices_tenant_student',
      fields: ['tenant_id', 'student_id'],
    },
  ],
});

module.exports = Invoice;
