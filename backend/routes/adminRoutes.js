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
  deleteUser,
  getAnalytics,
  autoAssignRequest,
  assignTechnicianBid
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Requests
router.route('/requests').get(protect, adminOnly, getAllRequests);
router.route('/requests/:id/status').put(protect, adminOnly, updateRequestStatus);
router.route('/requests/:id/auto-assign').post(protect, adminOnly, autoAssignRequest);
router.route('/requests/:id/assign-bid').post(protect, adminOnly, assignTechnicianBid);
router.route('/requests/:id').delete(protect, adminOnly, deleteAnyRequest);

// Analytics
router.route('/analytics').get(protect, adminOnly, getAnalytics);

// Internal Notes
router.route('/requests/:id/notes').post(protect, adminOnly, addAdminNote);
router.route('/requests/:id/notes/:noteId').delete(protect, adminOnly, deleteAdminNote);

// Users Management
router.route('/users').get(protect, adminOnly, getUsers);
router.route('/users/:id')
  .put(protect, adminOnly, updateUser)
  .delete(protect, adminOnly, deleteUser);

module.exports = router;
