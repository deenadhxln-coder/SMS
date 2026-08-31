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
    const offset = (page - 1) * limit;

    // Build Student where clauses
    const studentWhere = {};
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
      limit: parseInt(limit),
      offset: parseInt(offset),
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
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private (Admin/Teacher/Student/Parent)
const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, {
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

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    // Enforce subscription plan limits
    if (req.tenant) {
      const plan = await SubscriptionPlan.findOne({ where: { name: req.tenant.planType } });
      if (plan) {
        const limit = plan.maxStudents;
        const currentCount = await Student.count();
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
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    // Resolve Role
    const role = await Role.findOne({ where: { name: 'Student' } });
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User record
    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      roleId: role.id,
      status: 'ACTIVE',
    }, { transaction });

    // Create Student profile
    const admissionNo = `ADM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const student = await Student.create({
      admissionNo,
      userId: user.id,
      classId: classId || null,
      sectionId: sectionId || null,
      parentId: parentId || null,
      status: 'ACTIVE',
    }, { transaction });

    // Auto-generate invoice if class has fee structures
    if (classId) {
      const feeStructures = await FeeStructure.findAll({ where: { classId } });
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
        }, { transaction });
      }
    }

    await transaction.commit();

    // Log action & clear dashboard cache
    await logAudit(req.user.id, 'CREATE_STUDENT', 'Student', student.id);
    await invalidateDashboardCache(req.user.tenantId);

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
    const student = await Student.findByPk(req.params.id, { transaction });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Update User record
    const user = await User.findByPk(student.userId, { transaction });
    if (name) user.name = name;
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email }, transaction });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      user.email = email;
    }
    if (status) user.status = status;
    await user.save({ transaction });

    // Update Student details
    if (classId !== undefined) student.classId = classId;
    if (sectionId !== undefined) student.sectionId = sectionId;
    if (parentId !== undefined) student.parentId = parentId;
    if (status !== undefined) student.status = status;
    await student.save({ transaction });

    await transaction.commit();

    await logAudit(req.user.id, 'UPDATE_STUDENT', 'Student', student.id);
    await invalidateDashboardCache(req.user.tenantId);

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
    const student = await Student.findByPk(req.params.id, { transaction });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Soft delete student profile & linked user account
    student.status = 'INACTIVE';
    await student.save({ transaction });

    const user = await User.findByPk(student.userId, { transaction });
    if (user) {
      user.status = 'INACTIVE';
      await user.save({ transaction });
    }

    await transaction.commit();

    await logAudit(req.user.id, 'DELETE_STUDENT_SOFT', 'Student', student.id);
    await invalidateDashboardCache(req.user.tenantId);

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
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
