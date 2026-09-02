const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Exam = sequelize.define('Exam', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  academicYearId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'academic_year_id',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date',
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'PUBLISHED'),
    defaultValue: 'DRAFT',
    allowNull: false,
  },
}, {
  tableName: 'exams',
  indexes: [
    {
      name: 'idx_exams_tenant_ay',
      fields: ['tenant_id', 'academic_year_id'],
    },
  ],
});

module.exports = Exam;
