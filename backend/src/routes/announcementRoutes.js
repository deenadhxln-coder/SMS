const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { authorize } = require('../middleware/roleGuard');
const { validateParamsUUID } = require('../middleware/validate');

// All endpoints require verified authentication and tenant context (applied at server.js mount)

// GET: All authenticated school roles can view announcements (filtered by role targeting)
router.get('/', authorize('School Admin', 'Teacher', 'Student', 'Parent'), getAnnouncements);

// POST: School Admin only
router.post('/', authorize('School Admin'), createAnnouncement);

// DELETE: School Admin only
router.delete('/:id', validateParamsUUID('id'), authorize('School Admin'), deleteAnnouncement);

module.exports = router;
