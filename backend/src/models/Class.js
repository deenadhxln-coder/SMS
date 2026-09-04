const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Class = sequelize.define('Class', {
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
  academicYearId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'academic_year_id',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'classes',
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
Class.addHook('beforeValidate', async (instance) => {
  if (instance.academicYearId && typeof instance.academicYearId === 'string' && !UUID_REGEX.test(instance.academicYearId) && instance.tenantId) {
    const AcademicYear = require('./AcademicYear');
    const [ay] = await AcademicYear.findOrCreate({
      where: { tenantId: instance.tenantId, name: instance.academicYearId },
      defaults: {
        startDate: '2026-06-01',
        endDate: '2027-05-31',
        isCurrent: true,
        status: 'ACTIVE',
      },
    });
    instance.academicYearId = ay.id;
  }
});

module.exports = Class;
