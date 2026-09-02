const tenantStorage = require('../utils/tenantContext');

const verifyTenant = async (req, res, next) => {
  try {
    // Auth middleware must set req.user first
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { tenantId, role } = req.user;
    const isSuperAdmin = role === 'Super Admin' || (role && role.name === 'Super Admin');

    // Super Admin has global platform access and may target a specific tenant context
    if (isSuperAdmin) {
      const headerTenantId = req.headers['x-tenant-id'];
      if (headerTenantId) {
        const { Tenant } = require('../models');
        const targetTenant = await Tenant.findByPk(headerTenantId);
        if (!targetTenant) {
          return res.status(404).json({ success: false, message: 'Target school tenant not found' });
        }
        req.tenant = targetTenant;
        return tenantStorage.run(targetTenant.id, () => next());
      }
      // Super Admin without targeted header defaults to the master default tenant context
      const defaultTenantId = 'd0000000-0000-0000-0000-000000000000';
      const { Tenant } = require('../models');
      const defaultTenant = await Tenant.findByPk(defaultTenantId);
      if (defaultTenant) {
        req.tenant = defaultTenant;
      }
      return tenantStorage.run(defaultTenantId, () => next());
    }

    // Normal school requests: tenant_id MUST strictly originate from verified user context
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID context missing' });
    }

    // Import Tenant model inline to prevent circular references during start
    const { Tenant } = require('../models');
    
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Registered school tenant not found' });
    }

    if (tenant.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Subscription suspended. Contact support.' });
    }

    req.tenant = tenant;

    // Run downstream Express handlers inside isolated AsyncLocalStorage tenant context
    return tenantStorage.run(tenantId, () => next());
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyTenant };
