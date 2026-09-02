const express = require('express');
const router = express.Router();
const { getTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacherController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');
const { validateParamsUUID } = require('../middleware/validate');

router.use(protect);

router.get('/', authorize('Super Admin', 'School Admin', 'Teacher'), getTeachers);
router.get('/:id', validateParamsUUID('id'), authorize('Super Admin', 'School Admin', 'Teacher'), getTeacherById);
router.post('/', authorize('Super Admin', 'School Admin'), createTeacher);
router.put('/:id', validateParamsUUID('id'), authorize('Super Admin', 'School Admin'), updateTeacher);
router.delete('/:id', validateParamsUUID('id'), authorize('Super Admin', 'School Admin'), deleteTeacher);

module.exports = router;

