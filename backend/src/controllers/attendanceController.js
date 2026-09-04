const { Attendance, Student, User, Class, sequelize } = require('../models');
const { logAudit } = require('../services/auditService');
const { invalidateDashboardCache } = require('../utils/cacheHelper');

// @desc    Bulk mark attendance for a class
// @route   POST /api/attendance
// @access  Private (Admin/Teacher)
const markAttendance = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { classId, date, markings } = req.body; // markings: [{ studentId, status: 'PRESENT'|'ABSENT'|'LATE' }]
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);

    if (!tenantId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    if (!classId || !date || !markings || !Array.isArray(markings)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Please provide classId, date and markings array' });
    }

    // Future-date validation: reject attendance dates beyond today
    const todayUtc = new Date().toISOString().split('T')[0];
    const localToday = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const maxAllowedDate = localToday > todayUtc ? localToday : todayUtc;
    const inputDateStr = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];

    if (inputDateStr > maxAllowedDate) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Cannot record attendance for future dates' });
    }

    // Verify class belongs to the authenticated school tenant
    const classExists = await Class.findOne({ where: { id: classId, tenantId }, transaction });
    if (!classExists) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Referenced class not found in this school' });
    }

    const savedMarkings = [];
    
    // Validate markings payload uniqueness
    const studentIds = markings.map(m => m.studentId);
    if (new Set(studentIds).size !== studentIds.length) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Duplicate student entries inside the markings array are not allowed.' });
    }

    for (const item of markings) {
      const { studentId, status } = item;

      if (!['PRESENT', 'ABSENT', 'LATE'].includes(status)) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: `Invalid status: ${status} for student ${studentId}` });
      }

      // Check if student belongs to class within this school tenant
      const student = await Student.findOne({ where: { id: studentId, classId, tenantId }, transaction });
      if (!student) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: `Student ${studentId} does not belong to class ${classId} in this school` });
      }

      // Check for existing attendance on this date (upsert to prevent duplicate index violation)
      const existing = await Attendance.findOne({
        where: { studentId, date, tenantId },
        transaction,
      });

      if (existing) {
        // Update existing record
        existing.status = status;
        existing.markedBy = req.user.id;
        await existing.save({ transaction });
        savedMarkings.push(existing);
      } else {
        // Create new record with explicit tenantId
        const record = await Attendance.create({
          studentId,
          classId,
          date,
          status,
          markedBy: req.user.id,
          tenantId,
        }, { transaction });
        savedMarkings.push(record);
      }
    }

    await transaction.commit();

    // Log action & clear dashboard cache
    await logAudit(req.user.id, 'MARK_ATTENDANCE', 'Class', classId, tenantId);
    await invalidateDashboardCache(tenantId);

    return res.json({
      success: true,
      message: 'Attendance saved successfully',
      records: savedMarkings,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// @desc    Get attendance history (for students/parents/teachers)
// @route   GET /api/attendance
// @access  Private
const getAttendanceHistory = async (req, res, next) => {
  try {
    const { studentId, classId, startDate, endDate } = req.query;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const whereClause = { tenantId };

    // RBAC and user context filtering
    const roleName = req.user.role?.name || req.user.role;
    if (roleName === 'Student') {
      // Find current student profile
      const student = await Student.findOne({ where: { userId: req.user.id, tenantId } });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }
      whereClause.studentId = student.id;
    } else if (roleName === 'Parent') {
      // If parent, check if requested studentId is indeed their child in this tenant
      if (!studentId) {
        return res.status(400).json({ success: false, message: 'Please specify child studentId' });
      }
      const isChild = await Student.findOne({ where: { id: studentId, parentId: req.user.id, tenantId } });
      if (!isChild) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this student history' });
      }
      whereClause.studentId = studentId;
    } else {
      // Admin/Teacher can query freely within tenant
      if (studentId) {
        const studentExists = await Student.findOne({ where: { id: studentId, tenantId } });
        if (!studentExists) {
          return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        whereClause.studentId = studentId;
      }
      if (classId) {
        const classExists = await Class.findOne({ where: { id: classId, tenantId } });
        if (!classExists) {
          return res.status(404).json({ success: false, message: 'Class not found' });
        }
        whereClause.classId = classId;
      }
    }

    // Date filters
    if (startDate && endDate) {
      whereClause.date = {
        [sequelize.Sequelize.Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      whereClause.date = {
        [sequelize.Sequelize.Op.gte]: startDate,
      };
    }

    const records = await Attendance.findAll({
      where: whereClause,
      order: [['date', 'DESC']],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'admissionNo'],
          include: [{ model: User, as: 'user', attributes: ['name'] }],
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.json({ success: true, records });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getAttendanceHistory,
};
