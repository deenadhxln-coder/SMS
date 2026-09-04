const { AuditLog, PlatformAuditLog } = require('../models');
const tenantStorage = require('../utils/tenantContext');

const logAudit = async (userId, action, entity, entityId = null, tenantId = null) => {
  try {
    const resolvedTenantId = tenantId || tenantStorage.getStore();
    if (!resolvedTenantId) {
      console.warn(`[AUDIT WARNING] Skipped writing AuditLog for action ${action} on ${entity}: missing tenantId context.`);
      return;
    }
    await AuditLog.create({
      tenantId: resolvedTenantId,
      userId,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
    });
  } catch (error) {
    console.error('Audit Log failed to write:', error.message);
  }
};

const logPlatformAudit = async (adminId, action, tenantId = null, metadata = null) => {
  try {
    let resolvedAdminId = adminId;
    if (!resolvedAdminId) {
      const { PlatformAdmin } = require('../models');
      const systemAdmin = await PlatformAdmin.findOne();
      if (systemAdmin) {
        resolvedAdminId = systemAdmin.id;
      }
    }
    if (!resolvedAdminId) {
      console.warn(`[AUDIT WARNING] Skipped PlatformAuditLog for action ${action}: missing adminId.`);
      return;
    }
    await PlatformAuditLog.create({
      adminId: resolvedAdminId,
      action,
      tenantId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (error) {
    console.error('Platform Audit Log failed to write:', error.message);
  }
};

module.exports = { logAudit, logPlatformAudit };
