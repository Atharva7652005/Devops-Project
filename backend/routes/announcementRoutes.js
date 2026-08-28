const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(getAnnouncements) // Anyone can get active announcements
  .post(protect, adminOnly, createAnnouncement);

router.route('/:id')
  .delete(protect, adminOnly, deleteAnnouncement);

module.exports = router;
