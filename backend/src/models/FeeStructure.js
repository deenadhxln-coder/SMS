const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FeeStructure = sequelize.define('FeeStructure', {
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
  classId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'class_id',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  academicYearId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'academic_year_id',
  },
}, {
  tableName: 'fee_structures',
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
FeeStructure.addHook('beforeValidate', async (instance) => {
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

module.exports = FeeStructure;
