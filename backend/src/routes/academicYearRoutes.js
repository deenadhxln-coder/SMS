const express = require('express');
const router = express.Router();
const {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  setCurrentAcademicYear,
  archiveAcademicYear,
  deleteAcademicYear,
} = require('../controllers/academicYearController');
const { authorize } = require('../middleware/roleGuard');

// GET /api/academic-years - Accessible by all authenticated tenant roles
router.get('/', getAcademicYears);

// Administrative operations - Accessible strictly by School Admin
router.post('/', authorize('School Admin'), createAcademicYear);
router.put('/:id', authorize('School Admin'), updateAcademicYear);
router.put('/:id/set-current', authorize('School Admin'), setCurrentAcademicYear);
router.put('/:id/archive', authorize('School Admin'), archiveAcademicYear);
router.delete('/:id', authorize('School Admin'), deleteAcademicYear);

module.exports = router;
