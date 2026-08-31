const express = require('express');
const router = express.Router();
const {
  getClasses, createClass, updateClass, deleteClass,
  getSections, createSection, updateSection, deleteSection,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getClassSubjects, createClassSubject, deleteClassSubject,
  getTimetables, createTimetable, deleteTimetable
} = require('../controllers/academicsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

// Secure all endpoints
router.use(protect);

// Classes
router.get('/classes', getClasses);
router.post('/classes', authorize('Super Admin', 'School Admin'), createClass);
router.put('/classes/:id', authorize('Super Admin', 'School Admin'), updateClass);
router.delete('/classes/:id', authorize('Super Admin', 'School Admin'), deleteClass);

// Sections
router.get('/sections', getSections);
router.post('/sections', authorize('Super Admin', 'School Admin'), createSection);
router.put('/sections/:id', authorize('Super Admin', 'School Admin'), updateSection);
router.delete('/sections/:id', authorize('Super Admin', 'School Admin'), deleteSection);

// Subjects
router.get('/subjects', getSubjects);
router.post('/subjects', authorize('Super Admin', 'School Admin'), createSubject);
router.put('/subjects/:id', authorize('Super Admin', 'School Admin'), updateSubject);
router.delete('/subjects/:id', authorize('Super Admin', 'School Admin'), deleteSubject);

// Class-Subject mappings
router.get('/class-subjects', getClassSubjects);
router.post('/class-subjects', authorize('Super Admin', 'School Admin'), createClassSubject);
router.delete('/class-subjects', authorize('Super Admin', 'School Admin'), deleteClassSubject);

// Timetable
router.get('/timetable', getTimetables);
router.post('/timetable', authorize('Super Admin', 'School Admin'), createTimetable);
router.delete('/timetable/:id', authorize('Super Admin', 'School Admin'), deleteTimetable);

module.exports = router;
