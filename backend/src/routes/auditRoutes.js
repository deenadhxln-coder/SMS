const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { authorize } = require('../middleware/roleGuard');

// GET /api/audit-logs - Accessible strictly by School Admin
router.get('/', authorize('School Admin'), getAuditLogs);

module.exports = router;
