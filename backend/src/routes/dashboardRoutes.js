const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.get('/summary', protect, authorize('Super Admin', 'School Admin', 'Teacher'), getDashboardSummary);

module.exports = router;
