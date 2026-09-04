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
    type: DataTypes.UUID,
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
Exam.addHook('beforeValidate', async (instance) => {
  if (instance.tenantId) {
    const AcademicYear = require('./AcademicYear');
    if (!instance.academicYearId || !UUID_REGEX.test(instance.academicYearId)) {
      const [ay] = await AcademicYear.findOrCreate({
        where: { tenantId: instance.tenantId, name: instance.academicYearId || '2026-2027' },
        defaults: {
          startDate: '2026-06-01',
          endDate: '2027-05-31',
          isCurrent: true,
          status: 'ACTIVE',
        },
      });
      instance.academicYearId = ay.id;
    }
  }
});

module.exports = Exam;
