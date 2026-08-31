const { User, Teacher, Role, SubscriptionPlan, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../services/auditService');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private (Admin/Teacher)
const getTeachers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const teacherWhere = {};
    if (status) {
      teacherWhere.status = status;
    } else {
      teacherWhere.status = 'ACTIVE';
    }

    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { '$teacher.employee_no$': { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Teacher.findAndCountAll({
      where: teacherWhere,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          where: search ? userWhere : undefined,
          attributes: ['id', 'name', 'email', 'status']
        }
      ]
    });

    return res.json({
      success: true,
      teachers: rows,
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

// @desc    Get teacher by ID
// @route   GET /api/teachers/:id
// @access  Private (Admin/Teacher)
const getTeacherById = async (req, res, next) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'status']
        }
      ]
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    return res.json({ success: true, teacher });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new teacher
// @route   POST /api/teachers
// @access  Private (Admin)
const createTeacher = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
    }

    // Enforce subscription plan limits for teachers
    if (req.tenant) {
      const plan = await SubscriptionPlan.findOne({ where: { name: req.tenant.planType } });
      if (plan) {
        const limit = plan.maxTeachers;
        const currentCount = await Teacher.count();
        if (currentCount >= limit) {
          return res.status(403).json({
            success: false,
            message: `Subscription limit reached. The [${req.tenant.planType}] plan allows a maximum of ${limit} teachers. Please upgrade your subscription plan.`
          });
        }
      }
    }

    // Verify email unique
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const role = await Role.findOne({ where: { name: 'Teacher' } });
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User record
    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      roleId: role.id,
      status: 'ACTIVE',
    }, { transaction });

    // Create Teacher profile
    const employeeNo = `EMP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const teacher = await Teacher.create({
      employeeNo,
      userId: user.id,
      department,
      status: 'ACTIVE',
    }, { transaction });

    await transaction.commit();

    await logAudit(req.user.id, 'CREATE_TEACHER', 'Teacher', teacher.id);

    return res.status(201).json({
      success: true,
      message: 'Teacher profile created successfully',
      teacher,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// @desc    Update teacher profile
// @route   PUT /api/teachers/:id
// @access  Private (Admin)
const updateTeacher = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, email, department, status } = req.body;
    const teacher = await Teacher.findByPk(req.params.id, { transaction });

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    // Update User record
    const user = await User.findByPk(teacher.userId, { transaction });
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

    // Update Teacher details
    if (department) teacher.department = department;
    if (status !== undefined) teacher.status = status;
    await teacher.save({ transaction });

    await transaction.commit();

    await logAudit(req.user.id, 'UPDATE_TEACHER', 'Teacher', teacher.id);

    return res.json({
      success: true,
      message: 'Teacher updated successfully',
      teacher,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// @desc    Soft delete teacher profile
// @route   DELETE /api/teachers/:id
// @access  Private (Admin)
const deleteTeacher = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const teacher = await Teacher.findByPk(req.params.id, { transaction });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    // Soft delete teacher profile & linked user account
    teacher.status = 'INACTIVE';
    await teacher.save({ transaction });

    const user = await User.findByPk(teacher.userId, { transaction });
    if (user) {
      user.status = 'INACTIVE';
      await user.save({ transaction });
    }

    await transaction.commit();

    await logAudit(req.user.id, 'DELETE_TEACHER_SOFT', 'Teacher', teacher.id);

    return res.json({
      success: true,
      message: 'Teacher profile deactivated successfully (soft deleted)',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
