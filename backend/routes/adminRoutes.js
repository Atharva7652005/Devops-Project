const express = require('express');
const router = express.Router();
const {
  getAllRequests,
  updateRequestStatus,
  deleteAnyRequest,
  addAdminNote,
  deleteAdminNote,
  getUsers,
  updateUser,
  deleteUser
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Requests
router.route('/').get(protect, adminOnly, getAllRequests);
router.route('/:id/status').put(protect, adminOnly, updateRequestStatus);
router.route('/:id').delete(protect, adminOnly, deleteAnyRequest);

// Internal Notes
router.route('/:id/notes').post(protect, adminOnly, addAdminNote);
router.route('/:id/notes/:noteId').delete(protect, adminOnly, deleteAdminNote);

// Users Management
router.route('/users').get(protect, adminOnly, getUsers);
router.route('/users/:id')
  .put(protect, adminOnly, updateUser)
  .delete(protect, adminOnly, deleteUser);

module.exports = router;
