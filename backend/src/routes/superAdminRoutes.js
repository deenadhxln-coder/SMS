const express = require('express');
const router = express.Router();
const { getTenants, createTenant, updateTenant, getAuditLogs } = require('../controllers/superAdminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

// Secure all endpoints under Super Admin namespace
router.use(protect);
router.use(authorize('Super Admin'));

router.get('/tenants', getTenants);
router.post('/tenants', createTenant);
router.put('/tenants/:id', updateTenant);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
