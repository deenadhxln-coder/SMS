const bcrypt = require('bcryptjs');
const { Tenant, User, Role, PlatformAuditLog, sequelize } = require('../models');
const { logPlatformAudit } = require('../services/auditService');

// @desc    List all onboarded school tenants
// @route   GET /api/superadmin/tenants
// @access  Private (Super Admin)
const getTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.json({ success: true, tenants });
  } catch (error) {
    next(error);
  }
};

// @desc    Onboard a new school tenant (creates tenant + default school admin)
// @route   POST /api/superadmin/tenants
// @access  Private (Super Admin)
const createTenant = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { schoolName, slug, logoUrl, planType, contactEmail, adminName, adminEmail, adminPassword } = req.body;

    if (!schoolName || !slug || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, message: 'Please provide schoolName, slug, adminName, adminEmail and adminPassword' });
    }

    if (planType && !['FREE', 'STANDARD', 'PREMIUM'].includes(planType)) {
      return res.status(400).json({ success: false, message: 'Invalid plan type. Allowed: FREE, STANDARD, PREMIUM' });
    }

    // Check slug unique
    const slugExists = await Tenant.findOne({ where: { slug }, transaction });
    if (slugExists) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'A school with this URL slug already exists.' });
    }

    // Check admin email unique
    const emailExists = await User.findOne({ where: { email: adminEmail }, transaction });
    if (emailExists) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'User email already in use.' });
    }

    // Find School Admin role
    const adminRole = await Role.findOne({ where: { name: 'School Admin' }, transaction });
    if (!adminRole) {
      await transaction.rollback();
      return res.status(500).json({ success: false, message: 'System School Admin role not found. Run migrations.' });
    }

    // 1. Create Tenant
    const tenant = await Tenant.create({
      schoolName,
      slug,
      logoUrl: logoUrl || null,
      planType: planType || 'FREE',
      status: 'ACTIVE',
      contactEmail: contactEmail || adminEmail,
      createdByAdminId: req.user?.id || null
    }, { transaction });

    // 2. Hash Password and Create Initial School Admin User
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash: hashedPassword,
      roleId: adminRole.id,
      status: 'ACTIVE',
      tenantId: tenant.id
    }, { transaction });

    // 3. Create Default Active Academic Year
    const { AcademicYear } = require('../models');
    await AcademicYear.create({
      tenantId: tenant.id,
      name: '2026-2027',
      startDate: '2026-06-01',
      endDate: '2027-05-31',
      isCurrent: true,
      status: 'ACTIVE',
    }, { transaction });

    await transaction.commit();
    await logPlatformAudit(req.user.id, 'CREATE_SCHOOL', tenant.id, { schoolName, slug, planType });

    return res.status(201).json({
      success: true,
      message: `Tenant ${schoolName} onboarded successfully.`,
      tenant,
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// @desc    Update school tenant plan or status
// @route   PUT /api/superadmin/tenants/:id
// @access  Private (Super Admin)
const updateTenant = async (req, res, next) => {
  try {
    const { planType, status, logoUrl } = req.body;

    if (planType && !['FREE', 'STANDARD', 'PREMIUM'].includes(planType)) {
      return res.status(400).json({ success: false, message: 'Invalid plan type. Allowed: FREE, STANDARD, PREMIUM' });
    }

    if (status && !['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Allowed: ACTIVE, SUSPENDED' });
    }

    const tenant = await Tenant.findByPk(req.params.id);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant school not found.' });
    }

    if (planType) tenant.planType = planType;
    if (status) tenant.status = status;
    if (logoUrl !== undefined) tenant.logoUrl = logoUrl;

    await tenant.save();
    await logPlatformAudit(req.user.id, 'UPDATE_SCHOOL_CONFIG', tenant.id, { planType, status });

    return res.json({
      success: true,
      message: 'Tenant configuration updated successfully.',
      tenant
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all platform administrative audit logs
// @route   GET /api/superadmin/audit-logs
// @access  Private (Super Admin)
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await PlatformAuditLog.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTenants,
  createTenant,
  updateTenant,
  getAuditLogs
};
