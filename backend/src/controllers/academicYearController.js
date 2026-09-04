const { Op } = require('sequelize');
const { AcademicYear, Class, Exam, FeeStructure, sequelize } = require('../models');
const { logAudit } = require('../services/auditService');

/**
 * GET /api/academic-years
 * List academic years for authenticated tenant.
 * Accessible by Admin, Teacher, Student, Parent.
 */
const getAcademicYears = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const { status } = req.query;
    const where = { tenantId };

    if (status && ['UPCOMING', 'ACTIVE', 'ARCHIVED'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    const academicYears = await AcademicYear.findAll({
      where,
      order: [
        ['isCurrent', 'DESC'],
        ['startDate', 'DESC'],
        ['name', 'ASC'],
      ],
    });

    return res.json({ success: true, academicYears });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/academic-years
 * Create a new academic year for tenant.
 * Accessible strictly by School Admin.
 */
const createAcademicYear = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const { name, startDate, endDate, isCurrent = false, status = 'ACTIVE' } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Academic year name is required and must be between 1 and 100 characters.',
      });
    }
    const trimmedName = name.trim();

    // Validate dates
    if (!startDate || isNaN(Date.parse(startDate))) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Valid startDate is required (YYYY-MM-DD).' });
    }
    if (!endDate || isNaN(Date.parse(endDate))) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Valid endDate is required (YYYY-MM-DD).' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid date range: startDate must be strictly before endDate.',
      });
    }

    // Validate status
    const validStatus = status ? status.toUpperCase() : 'ACTIVE';
    if (!['UPCOMING', 'ACTIVE', 'ARCHIVED'].includes(validStatus)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Status must be one of UPCOMING, ACTIVE, or ARCHIVED.',
      });
    }

    if (validStatus === 'ARCHIVED' && isCurrent) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'An archived academic year cannot be set as the current active year.',
      });
    }

    // Check duplicate name within tenant
    const existing = await AcademicYear.findOne({
      where: { tenantId, name: trimmedName },
      transaction,
    });
    if (existing) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `An academic year with the name '${trimmedName}' already exists in your school.`,
      });
    }

    // Atomic single-current-year invariant
    if (isCurrent) {
      await AcademicYear.update(
        { isCurrent: false },
        { where: { tenantId }, transaction }
      );
    }

    const newYear = await AcademicYear.create({
      tenantId,
      name: trimmedName,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      isCurrent: Boolean(isCurrent),
      status: validStatus,
    }, { transaction });

    await transaction.commit();

    await logAudit(req.user.id, 'CREATE_ACADEMIC_YEAR', 'AcademicYear', newYear.id, tenantId);

    return res.status(201).json({
      success: true,
      message: 'Academic year created successfully',
      academicYear: newYear,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * PUT /api/academic-years/:id
 * Update academic year details.
 * Accessible strictly by School Admin.
 */
const updateAcademicYear = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const targetYear = await AcademicYear.findOne({
      where: { id: req.params.id, tenantId },
      transaction,
    });
    if (!targetYear) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Academic year not found' });
    }

    const { name, startDate, endDate, status } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Academic year name must be between 1 and 100 characters.',
        });
      }
      const trimmedName = name.trim();
      const duplicate = await AcademicYear.findOne({
        where: {
          tenantId,
          name: trimmedName,
          id: { [Op.ne]: targetYear.id },
        },
        transaction,
      });
      if (duplicate) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `An academic year with the name '${trimmedName}' already exists.`,
        });
      }
      targetYear.name = trimmedName;
    }

    const newStart = startDate !== undefined ? new Date(startDate) : new Date(targetYear.startDate);
    const newEnd = endDate !== undefined ? new Date(endDate) : new Date(targetYear.endDate);

    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime()) || newStart >= newEnd) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid date range: startDate must be strictly before endDate.',
      });
    }

    if (startDate !== undefined) targetYear.startDate = newStart.toISOString().split('T')[0];
    if (endDate !== undefined) targetYear.endDate = newEnd.toISOString().split('T')[0];

    if (status !== undefined) {
      const validStatus = status.toUpperCase();
      if (!['UPCOMING', 'ACTIVE', 'ARCHIVED'].includes(validStatus)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Status must be one of UPCOMING, ACTIVE, or ARCHIVED.',
        });
      }
      targetYear.status = validStatus;
      if (validStatus === 'ARCHIVED' && targetYear.isCurrent) {
        targetYear.isCurrent = false;
      }
    }

    await targetYear.save({ transaction });
    await transaction.commit();

    await logAudit(req.user.id, 'UPDATE_ACADEMIC_YEAR', 'AcademicYear', targetYear.id, tenantId);

    return res.json({
      success: true,
      message: 'Academic year updated successfully',
      academicYear: targetYear,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * PUT /api/academic-years/:id/set-current
 * Set the specified academic year as current for the tenant.
 * Atomically clears any existing current year.
 * Accessible strictly by School Admin.
 */
const setCurrentAcademicYear = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const targetYear = await AcademicYear.findOne({
      where: { id: req.params.id, tenantId },
      transaction,
    });
    if (!targetYear) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Academic year not found in this school' });
    }

    if (targetYear.status === 'ARCHIVED') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot set an ARCHIVED academic year as the current active year.',
      });
    }

    // Atomically clear current flag for all other years in this tenant
    await AcademicYear.update(
      { isCurrent: false },
      { where: { tenantId }, transaction }
    );

    targetYear.isCurrent = true;
    await targetYear.save({ transaction });

    await transaction.commit();

    await logAudit(req.user.id, 'SET_CURRENT_ACADEMIC_YEAR', 'AcademicYear', targetYear.id, tenantId);

    return res.json({
      success: true,
      message: `Academic year '${targetYear.name}' set as the current active academic year.`,
      academicYear: targetYear,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * PUT /api/academic-years/:id/archive
 * Archive an academic year.
 * Accessible strictly by School Admin.
 */
const archiveAcademicYear = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const targetYear = await AcademicYear.findOne({
      where: { id: req.params.id, tenantId },
    });
    if (!targetYear) {
      return res.status(404).json({ success: false, message: 'Academic year not found' });
    }

    targetYear.status = 'ARCHIVED';
    if (targetYear.isCurrent) {
      targetYear.isCurrent = false;
    }
    await targetYear.save();

    await logAudit(req.user.id, 'ARCHIVE_ACADEMIC_YEAR', 'AcademicYear', targetYear.id, tenantId);

    return res.json({
      success: true,
      message: `Academic year '${targetYear.name}' has been archived successfully.`,
      academicYear: targetYear,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/academic-years/:id
 * Delete an unreferenced academic year.
 * Rejects deletion if referenced by classes, exams, or fee structures.
 * Accessible strictly by School Admin.
 */
const deleteAcademicYear = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const targetYear = await AcademicYear.findOne({
      where: { id: req.params.id, tenantId },
    });
    if (!targetYear) {
      return res.status(404).json({ success: false, message: 'Academic year not found' });
    }

    // Check references in classes, exams, fee_structures
    const [classCount, examCount, feeCount] = await Promise.all([
      Class.count({ where: { academicYearId: targetYear.id, tenantId } }),
      Exam.count({ where: { academicYearId: targetYear.id, tenantId } }),
      FeeStructure.count({ where: { academicYearId: targetYear.id, tenantId } }),
    ]);

    if (classCount > 0 || examCount > 0 || feeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete academic year '${targetYear.name}' because it is referenced by active classes (${classCount}), exams (${examCount}), or fee structures (${feeCount}). Please archive it instead.`,
      });
    }

    await targetYear.destroy();

    await logAudit(req.user.id, 'DELETE_ACADEMIC_YEAR', 'AcademicYear', targetYear.id, tenantId);

    return res.json({
      success: true,
      message: `Academic year '${targetYear.name}' deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  setCurrentAcademicYear,
  archiveAcademicYear,
  deleteAcademicYear,
};
