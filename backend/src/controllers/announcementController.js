const { Op } = require('sequelize');
const { Announcement, User } = require('../models');
const { logAudit } = require('../services/auditService');
const { broadcastToTenant, sendToRole } = require('../services/notificationService');

// @desc    Create & broadcast announcement
// @route   POST /api/announcements
// @access  Private (School Admin)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, body, targetRole = 'ALL' } = req.body;
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 255) {
      return res.status(400).json({ success: false, message: 'Title must be between 3 and 255 characters' });
    }

    if (!body || typeof body !== 'string' || body.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Body content must be at least 5 characters' });
    }

    const validRoles = ['ALL', 'Teacher', 'Student', 'Parent'];
    const resolvedRole = targetRole || 'ALL';
    if (!validRoles.includes(resolvedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid target audience. Allowed roles: ${validRoles.join(', ')}`,
      });
    }

    // Persist first before broadcasting (persistence is source of truth)
    const announcement = await Announcement.create({
      tenantId,
      title: title.trim(),
      body: body.trim(),
      targetRole: resolvedRole,
      createdBy: req.user.id,
    });

    // Write audit log
    await logAudit(req.user.id, 'CREATE_ANNOUNCEMENT', 'Announcement', announcement.id, tenantId);

    // Socket.IO broadcast strictly scoped to tenant and target room
    try {
      const socketPayload = {
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        targetRole: announcement.targetRole,
        createdAt: announcement.createdAt,
        message: `[Announcement] ${announcement.title}`,
      };

      if (resolvedRole === 'ALL') {
        broadcastToTenant(tenantId, 'NEW_ANNOUNCEMENT', socketPayload);
      } else {
        sendToRole(tenantId, resolvedRole, 'NEW_ANNOUNCEMENT', socketPayload);
      }
    } catch (socketErr) {
      console.warn('Socket announcement broadcast error (non-fatal):', socketErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Announcement published successfully',
      announcement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get persistent announcements feed
// @route   GET /api/announcements
// @access  Private (All Authenticated School Roles)
const getAnnouncements = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const { page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    const roleName = req.user.role?.name || req.user.role;

    // Build role-targeted filter scoped strictly by tenantId
    const where = { tenantId };
    if (roleName !== 'School Admin') {
      where.targetRole = { [Op.in]: ['ALL', roleName] };
    }

    const { count, rows } = await Announcement.findAndCountAll({
      where,
      limit: safeLimit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return res.json({
      success: true,
      announcements: rows,
      total: count,
      page: safePage,
      totalPages: Math.ceil(count / safeLimit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (School Admin)
const deleteAnnouncement = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const announcement = await Announcement.findOne({
      where: { id, tenantId },
    });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await announcement.destroy();

    await logAudit(req.user.id, 'DELETE_ANNOUNCEMENT', 'Announcement', id, tenantId);

    return res.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
};
