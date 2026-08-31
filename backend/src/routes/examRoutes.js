const express = require('express');
const router = express.Router();
const { createExam, getExams, addExamSchedule, submitMarks, getReportCard } = require('../controllers/examController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.use(protect);

router.post('/', authorize('Super Admin', 'School Admin'), createExam);
router.get('/', getExams);
router.post('/:id/schedule', authorize('Super Admin', 'School Admin'), addExamSchedule);
router.post('/:examId/marks', authorize('Super Admin', 'School Admin', 'Teacher'), submitMarks);
router.get('/report-card/:studentId', getReportCard);

module.exports = router;
