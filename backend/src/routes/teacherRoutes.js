const express = require('express');
const router = express.Router();
const { getTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacherController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.use(protect);

router.get('/', authorize('Super Admin', 'School Admin', 'Teacher'), getTeachers);
router.get('/:id', authorize('Super Admin', 'School Admin', 'Teacher'), getTeacherById);
router.post('/', authorize('Super Admin', 'School Admin'), createTeacher);
router.put('/:id', authorize('Super Admin', 'School Admin'), updateTeacher);
router.delete('/:id', authorize('Super Admin', 'School Admin'), deleteTeacher);

module.exports = router;
