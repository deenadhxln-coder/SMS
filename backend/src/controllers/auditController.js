const { Op } = require('sequelize');
const { AuditLog, User } = require('../models');
const { UUID_REGEX } = require('../middleware/validate');

/**
 * GET /api/audit-logs
 * Retrieves paginated and filtered audit logs for the authenticated tenant.
 * Scoped strictly to req.user.tenantId (ignoring any client-provided tenantId).
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Tenant context is missing from verified session.',
      });
    }

    const {
      action,
      entity,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    // Validate date filters if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDate parameter. Expected a valid ISO-8601 date string.',
      });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDate parameter. Expected a valid ISO-8601 date string.',
      });
    }

    // Validate userId format if provided
    if (userId && !UUID_REGEX.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId parameter. Expected a valid UUID string.',
      });
    }

    // Build strictly tenant-scoped filter criteria
    const where = { tenantId };

    if (action && typeof action === 'string' && action.trim() !== '') {
      where.action = action.trim();
    }

    if (entity && typeof entity === 'string' && entity.trim() !== '') {
      where.entity = entity.trim();
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate && endDate) {
      where.timestamp = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
      where.timestamp = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.timestamp = { [Op.lte]: new Date(endDate) };
    }

    // Sanitize pagination bounds
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      limit: safeLimit,
      offset,
      order: [
        ['timestamp', 'DESC'],
        ['id', 'DESC'],
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      total: count,
      page: safePage,
      totalPages: Math.ceil(count / safeLimit) || 1,
      limit: safeLimit,
      logs: rows,
    });
  } catch (error) {
    console.error('Failed to retrieve school audit logs:', error);
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
