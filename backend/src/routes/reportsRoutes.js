const express = require('express');
const router = express.Router();
const { getReportData } = require('../controllers/reportsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.get('/:type', protect, authorize('Super Admin', 'School Admin', 'Teacher'), getReportData);

module.exports = router;
