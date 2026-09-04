const { User, Student, Class, Section, Role, Invoice, FeeStructure, SubscriptionPlan, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../services/auditService');
const { invalidateDashboardCache } = require('../utils/cacheHelper');

// @desc    Get all students (with search, filtering & pagination)
// @route   GET /api/students
// @access  Private (Admin/Teacher)
const getStudents = async (req, res, next) => {
  try {
    const { search, classId, sectionId, status, page = 1, limit = 10 } = req.query;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    // Pagination safety: enforce bounds between 1 and 100
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    // Build Student where clauses with explicit tenantId
    const studentWhere = { tenantId };
    if (status) {
      studentWhere.status = status;
    } else {
      studentWhere.status = 'ACTIVE'; // default to active only
    }

    if (classId) studentWhere.classId = classId;
    if (sectionId) studentWhere.sectionId = sectionId;

    // Build User search clauses
    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { '$student.admission_no$': { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Student.findAndCountAll({
      where: studentWhere,
      limit: safeLimit,
      offset: offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          where: search ? userWhere : undefined,
          attributes: ['id', 'name', 'email', 'status']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'parent',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return res.json({
      success: true,
      students: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / safeLimit),
        currentPage: safePage,
        limit: safeLimit
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get children belonging to authenticated parent
// @route   GET /api/students/my-children
// @access  Private (Parent)
const getMyChildren = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const children = await Student.findAll({
      where: { parentId: req.user.id, tenantId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'status']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'academicYearId']
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    return res.json({ success: true, children });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private (Admin/Teacher/Student/Parent)
const getStudentById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const student = await Student.findOne({
      where: { id: req.params.id, tenantId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'status']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'academicYearId']
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'parent',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Role-based object-level ownership check (BOLA / IDOR protection)
    const roleName = req.user.role?.name || req.user.role;
    if (roleName === 'Student') {
      if (student.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to student profile' });
      }
    } else if (roleName === 'Parent') {
      if (student.parentId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to student profile' });
      }
    }

    return res.json({ success: true, student });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin)
const createStudent = async (req, res, next) => {
  try {
    const { name, email, password, classId, sectionId, parentId } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    // Verify foreign keys belong to the authenticated tenant
    if (classId) {
      const classExists = await Class.findOne({ where: { id: classId, tenantId } });
      if (!classExists) {
        return res.status(400).json({ success: false, message: 'Referenced class not found in this school' });
      }
    }

    if (sectionId) {
      const sectionExists = await Section.findOne({ where: { id: sectionId, ...(classId ? { classId } : {}), tenantId } });
      if (!sectionExists) {
        return res.status(400).json({ success: false, message: 'Referenced section not found in this school' });
      }
    }

    if (parentId) {
      const parentUser = await User.findOne({
        where: { id: parentId, tenantId },
        include: [{ model: Role, as: 'role', where: { name: 'Parent' } }]
      });
      if (!parentUser) {
        return res.status(400).json({ success: false, message: 'Referenced parent user not found in this school' });
      }
    }

    // Enforce subscription plan limits explicitly within tenant
    if (req.tenant) {
      const plan = await SubscriptionPlan.findOne({ where: { name: req.tenant.planType } });
      if (plan) {
        const limit = plan.maxStudents;
        const currentCount = await Student.count({ where: { tenantId, status: 'ACTIVE' } });
        if (currentCount >= limit) {
          return res.status(403).json({
            success: false,
            message: `Subscription limit reached. The [${req.tenant.planType}] plan allows a maximum of ${limit} students. Please upgrade your subscription plan.`
          });
        }
      }
    }

    const transaction = await sequelize.transaction();
    try {

    // Verify email unique
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    // Resolve Role
    const role = await Role.findOne({ where: { name: 'Student' } });
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User record with explicit tenantId
    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      roleId: role.id,
      status: 'ACTIVE',
      tenantId,
    }, { transaction });

    // Create Student profile with explicit tenantId
    const admissionNo = `ADM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const student = await Student.create({
      admissionNo,
      userId: user.id,
      classId: classId || null,
      sectionId: sectionId || null,
      parentId: parentId || null,
      status: 'ACTIVE',
      tenantId,
    }, { transaction });

    // Auto-generate invoice if class has fee structures within tenant
    if (classId) {
      const feeStructures = await FeeStructure.findAll({ where: { classId, tenantId }, transaction });
      let totalFee = 0;
      feeStructures.forEach(fee => {
        totalFee += parseFloat(fee.amount);
      });

      if (totalFee > 0) {
        await Invoice.create({
          studentId: student.id,
          totalAmount: totalFee,
          paidAmount: 0.00,
          dueAmount: totalFee,
          status: 'UNPAID',
          tenantId,
        }, { transaction });
      }
    }

    await transaction.commit();

    // Log action & clear dashboard cache with explicit tenantId
    await logAudit(req.user.id, 'CREATE_STUDENT', 'Student', student.id, tenantId);
    await invalidateDashboardCache(tenantId);

    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      student,
    });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update student profile
// @route   PUT /api/students/:id
// @access  Private (Admin)
const updateStudent = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, email, classId, sectionId, parentId, status } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);

    if (!tenantId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const student = await Student.findOne({ where: { id: req.params.id, tenantId }, transaction });

    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Input validation: status enum
    if (status !== undefined && !['ACTIVE', 'INACTIVE'].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Invalid status value. Allowed: ACTIVE, INACTIVE' });
    }

    // Foreign key tenant validation
    if (classId !== undefined && classId !== null) {
      const classExists = await Class.findOne({ where: { id: classId, tenantId }, transaction });
      if (!classExists) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Referenced class not found in this school' });
      }
    }

    if (sectionId !== undefined && sectionId !== null) {
      const targetClassId = classId !== undefined ? classId : student.classId;
      const sectionExists = await Section.findOne({
        where: { id: sectionId, ...(targetClassId ? { classId: targetClassId } : {}), tenantId },
        transaction
      });
      if (!sectionExists) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Referenced section not found in this school' });
      }
    }

    if (parentId !== undefined && parentId !== null) {
      const parentUser = await User.findOne({
        where: { id: parentId, tenantId },
        include: [{ model: Role, as: 'role', where: { name: 'Parent' } }],
        transaction
      });
      if (!parentUser) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Referenced parent user not found in this school' });
      }
    }

    // Update User record
    const user = await User.findOne({ where: { id: student.userId, tenantId }, transaction });
    if (user) {
      if (name) user.name = name;
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ where: { email }, transaction });
        if (emailExists) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Email already in use' });
        }
        user.email = email;
      }
      if (status) user.status = status;
      await user.save({ transaction });
    }

    // Update Student details
    if (classId !== undefined) student.classId = classId;
    if (sectionId !== undefined) student.sectionId = sectionId;
    if (parentId !== undefined) student.parentId = parentId;
    if (status !== undefined) student.status = status;
    await student.save({ transaction });

    await transaction.commit();

    await logAudit(req.user.id, 'UPDATE_STUDENT', 'Student', student.id, tenantId);
    await invalidateDashboardCache(tenantId);

    return res.json({
      success: true,
      message: 'Student updated successfully',
      student,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// @desc    Soft delete student profile
// @route   DELETE /api/students/:id
// @access  Private (Admin)
const deleteStudent = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);

    if (!tenantId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const student = await Student.findOne({ where: { id: req.params.id, tenantId }, transaction });
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Soft delete student profile & linked user account
    student.status = 'INACTIVE';
    await student.save({ transaction });

    const user = await User.findOne({ where: { id: student.userId, tenantId }, transaction });
    if (user) {
      user.status = 'INACTIVE';
      await user.save({ transaction });
    }

    await transaction.commit();

    await logAudit(req.user.id, 'DELETE_STUDENT_SOFT', 'Student', student.id, tenantId);
    await invalidateDashboardCache(tenantId);

    return res.json({
      success: true,
      message: 'Student profile deactivated successfully (soft deleted)',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  getStudents,
  getMyChildren,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
