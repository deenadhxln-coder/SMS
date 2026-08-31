const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceHistory } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.use(protect);

router.post('/', authorize('Super Admin', 'School Admin', 'Teacher'), markAttendance);
router.get('/', getAttendanceHistory);

module.exports = router;
