const tenantStorage = require('../utils/tenantContext');

const verifyTenant = async (req, res, next) => {
  try {
    // Auth middleware must set req.user first
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { tenantId, role } = req.user;

    // Super Admin has global platform access and defaults to the master tenant context
    if (role === 'Super Admin' || (role && role.name === 'Super Admin')) {
      const targetTenantId = req.headers['x-tenant-id'] || 'd0000000-0000-0000-0000-000000000000';
      tenantStorage.enterWith(targetTenantId);
      return next();
    }

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

    // Set the tenant context for the current async execution chain
    tenantStorage.enterWith(tenantId);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyTenant };
