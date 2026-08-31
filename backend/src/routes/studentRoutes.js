const express = require('express');
const router = express.Router();
const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.use(protect);

router.get('/', authorize('Super Admin', 'School Admin', 'Teacher'), getStudents);
router.get('/:id', authorize('Super Admin', 'School Admin', 'Teacher', 'Student', 'Parent'), getStudentById);
router.post('/', authorize('Super Admin', 'School Admin'), createStudent);
router.put('/:id', authorize('Super Admin', 'School Admin'), updateStudent);
router.delete('/:id', authorize('Super Admin', 'School Admin'), deleteStudent);

module.exports = router;
