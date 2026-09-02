const { Student, Teacher, Class, Invoice, AuditLog, User, sequelize } = require('../models');
const redisClient = require('../config/redis');

// @desc    Get dashboard metrics (aggregated cards & activities)
// @route   GET /api/dashboard/summary
// @access  Private (Admin/Teacher)
const getDashboardSummary = async (req, res, next) => {
  const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
  if (!tenantId) {
    return res.status(400).json({ success: false, message: 'Tenant context required' });
  }
  const cacheKey = `tenant:${tenantId}:dashboard:summary`;
  try {
    // 1. Check Redis Cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('Redis Cache Hit: dashboard:summary');
      return res.json({ success: true, fromCache: true, summary: JSON.parse(cachedData) });
    }

    console.log('Redis Cache Miss: Querying MySQL...');

    // 2. Fetch Aggregations from MySQL with explicit tenantId scoping
    const totalStudents = await Student.count({ where: { tenantId, status: 'ACTIVE' } });
    const totalTeachers = await Teacher.count({ where: { tenantId, status: 'ACTIVE' } });
    const totalClasses = await Class.count({ where: { tenantId } });

    // Financial calculations with explicit tenantId scoping
    const financialStats = await Invoice.findAll({
      where: { tenantId },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalInvoiced'],
        [sequelize.fn('SUM', sequelize.col('paid_amount')), 'totalPaid'],
        [sequelize.fn('SUM', sequelize.col('due_amount')), 'totalDue'],
      ],
      raw: true,
    });

    const stats = financialStats[0] || {};
    const totalInvoiced = parseFloat(stats.totalInvoiced || 0).toFixed(2);
    const totalPaid = parseFloat(stats.totalPaid || 0).toFixed(2);
    const totalDue = parseFloat(stats.totalDue || 0).toFixed(2);

    // Recent Activity logs with explicit tenantId scoping
    const recentActivity = await AuditLog.findAll({
      where: { tenantId },
      limit: 10,
      order: [['timestamp', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
    });

    const summary = {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalInvoiced,
      totalPaid,
      totalDue,
      recentActivity,
      updatedAt: new Date(),
    };

    // 3. Cache in Redis (300 seconds TTL)
    await redisClient.setex(cacheKey, 300, JSON.stringify(summary));
    console.log('Redis Cache Populated: dashboard:summary');

    return res.json({ success: true, fromCache: false, summary });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
};
