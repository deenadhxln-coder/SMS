const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User, Role, Student, Teacher, Tenant, PlatformAdmin } = require('../models');
const { logAudit, logPlatformAudit } = require('../services/auditService');

// Generate JWT Token including tenantId
const generateToken = (user) => {
  const roleName = (user.role && typeof user.role === 'object') ? user.role.name : (user.role || 'Super Admin');
  return jwt.sign(
    { id: user.id, role: roleName, tenantId: user.tenantId || null },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public / Tenant Scoped
const register = async (req, res, next) => {
  try {
    const { name, email, password, roleName, department, parentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    // Role Whitelisting: Self-registration strictly allows Student, Teacher, Parent
    const ALLOWED_REGISTRATION_ROLES = ['Student', 'Teacher', 'Parent'];
    const targetRoleName = roleName || 'Student';

    if (!ALLOWED_REGISTRATION_ROLES.includes(targetRoleName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or unauthorized role for self-registration: ${targetRoleName}. Allowed roles are: [${ALLOWED_REGISTRATION_ROLES.join(', ')}]`,
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Resolve Role
    const role = await Role.findOne({ where: { name: targetRoleName } });
    if (!role) {
      return res.status(400).json({ success: false, message: `Invalid role specified: ${targetRoleName}` });
    }

    // Tenant Context Enforcement: strictly derived from trusted server-side context or verified auth token
    let authUser = req.user;
    if (!authUser && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, config.jwtSecret);
        if (decoded.role === 'Super Admin') {
          const { PlatformAdmin } = require('../models');
          authUser = await PlatformAdmin.findByPk(decoded.id);
          if (authUser) authUser.role = { name: 'Super Admin' };
        }
        if (!authUser) {
          authUser = await User.findByPk(decoded.id, {
            include: [{ model: Role, as: 'role' }]
          });
        }
      } catch (err) {
        // Ignore invalid token and fail closed below
      }
    }

    let targetTenantId = authUser?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!targetTenantId && authUser && (authUser.role?.name === 'Super Admin' || authUser.role === 'Super Admin')) {
      const headerTenantId = req.headers['x-tenant-id'];
      if (headerTenantId) {
        const targetTenant = await Tenant.findByPk(headerTenantId);
        if (targetTenant) targetTenantId = targetTenant.id;
      } else {
        const defaultTenant = await Tenant.findOne();
        if (defaultTenant) targetTenantId = defaultTenant.id;
      }
    }

    if (!targetTenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required for registration. Public un-scoped registration is not permitted.',
      });
    }

    // Validate Parent relationship within the same tenant if specified
    let validatedParentId = null;
    if (parentId && targetRoleName === 'Student') {
      const parentUser = await User.findOne({
        where: { id: parentId, tenantId: targetTenantId },
        include: [{ model: Role, as: 'role', where: { name: 'Parent' } }]
      });
      if (!parentUser) {
        return res.status(400).json({ success: false, message: 'Invalid or cross-tenant parentId specified' });
      }
      validatedParentId = parentUser.id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      roleId: role.id,
      status: 'ACTIVE',
      tenantId: targetTenantId
    });

    // Handle profile creation based on role
    let profile = null;
    if (targetRoleName === 'Student') {
      const admissionNo = `ADM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      profile = await Student.create({
        admissionNo,
        userId: user.id,
        status: 'ACTIVE',
        parentId: validatedParentId,
        tenantId: targetTenantId
      });
    } else if (targetRoleName === 'Teacher') {
      const employeeNo = `EMP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      profile = await Teacher.create({
        employeeNo,
        userId: user.id,
        department: department || 'General',
        status: 'ACTIVE',
        tenantId: targetTenantId
      });
    }

    // Fetch user with role for generating token payload
    const userWithRole = await User.findByPk(user.id, {
      include: [
        { model: Role, as: 'role' },
        { model: Tenant, as: 'tenant' }
      ],
    });

    // Write audit log with explicit tenantId
    await logAudit(user.id, 'REGISTER', 'User', user.id, targetTenantId);

    const token = generateToken(userWithRole);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: targetRoleName,
        tenantId: user.tenantId,
        tenant: userWithRole.tenant,
        profile: profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // 1. Check PlatformAdmin first (Super Admin table)
    const platformAdmin = await PlatformAdmin.findOne({ where: { email } });
    if (platformAdmin) {
      if (platformAdmin.status === 'INACTIVE') {
        return res.status(403).json({ success: false, message: 'Your account is deactivated' });
      }

      const isMatch = await bcrypt.compare(password, platformAdmin.passwordHash);
      if (!isMatch) {
        try {
          await logPlatformAudit(platformAdmin.id, 'LOGIN_FAILED', null, { details: 'Failed authentication attempt' });
        } catch (_) {}
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      await logPlatformAudit(platformAdmin.id, 'LOGIN', null, { details: 'Platform Admin login' });

      const token = generateToken({
        id: platformAdmin.id,
        role: 'Super Admin',
        tenantId: null
      });

      return res.json({
        success: true,
        token,
        user: {
          id: platformAdmin.id,
          name: platformAdmin.name,
          email: platformAdmin.email,
          role: 'Super Admin',
          tenantId: null,
          tenant: null,
        },
      });
    }

    // 2. Otherwise fallback to User (school users table)
    const user = await User.findOne({
      where: { email },
      include: [
        { model: Role, as: 'role' },
        { model: Student, as: 'student' },
        { model: Teacher, as: 'teacher' },
        { model: Tenant, as: 'tenant' }
      ],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated' });
    }

    if (user.tenant && user.tenant.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Your school subscription is suspended. Please contact platform support.' });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      try {
        await logAudit(user.id, 'LOGIN_FAILED', 'User', user.id, user.tenantId);
      } catch (_) {}
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Write audit log
    await logAudit(user.id, 'LOGIN', 'User', user.id, user.tenantId);

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        tenantId: user.tenantId,
        tenant: user.tenant,
        studentProfile: user.student,
        teacherProfile: user.teacher,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    if (req.user.role && req.user.role.name === 'Super Admin') {
      return res.json({
        success: true,
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: 'Super Admin',
          tenantId: null,
          tenant: null,
        },
      });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        { model: Role, as: 'role' },
        { model: Student, as: 'student' },
        { model: Teacher, as: 'teacher' },
        { model: Tenant, as: 'tenant' }
      ],
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        tenantId: user.tenantId,
        tenant: user.tenant,
        studentProfile: user.student,
        teacherProfile: user.teacher,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
