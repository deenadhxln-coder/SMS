const redisClient = require('../config/redis');

const invalidateDashboardCache = async (tenantId) => {
  try {
    if (tenantId) {
      await redisClient.del(`tenant:${tenantId}:dashboard:summary`);
      console.log(`Redis Cache Invalidation: Deleted tenant:${tenantId}:dashboard:summary`);
    } else {
      // Fallback
      await redisClient.del('tenant:default:dashboard:summary');
      const keys = await redisClient.keys('tenant:*:dashboard:summary');
      if (keys && keys.length > 0) {
        await redisClient.del(keys);
      }
    }
  } catch (error) {
    console.error('Failed to invalidate Redis cache:', error.message);
  }
};

module.exports = {
  invalidateDashboardCache,
};
