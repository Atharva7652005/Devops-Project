const asyncHandler = require('express-async-handler');
const Announcement = require('../models/Announcement');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public (or protected based on role)
const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({ isActive: true }).sort('-createdAt');
  res.json(announcements);
});

// @desc    Create announcement
// @route   POST /api/admin/announcements
// @access  Admin
const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.create(req.body);
  res.status(201).json(announcement);
});

// @desc    Delete announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Admin
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }
  res.json({ message: 'Announcement deleted' });
});

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
