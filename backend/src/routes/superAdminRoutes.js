const express = require('express');
const router = express.Router();
const { getTenants, createTenant, updateTenant, getAuditLogs } = require('../controllers/superAdminController');
const { getBillingSummary } = require('../controllers/superAdminBillingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');
const { validateParamsUUID } = require('../middleware/validate');

// Secure all endpoints under Super Admin namespace
router.use(protect);
router.use(authorize('Super Admin'));

router.get('/tenants', getTenants);
router.post('/tenants', createTenant);
router.put('/tenants/:id', validateParamsUUID('id'), updateTenant);
router.get('/audit-logs', getAuditLogs);
router.get('/billing/summary', getBillingSummary);

module.exports = router;

