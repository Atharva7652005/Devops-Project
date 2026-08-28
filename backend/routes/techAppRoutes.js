const express = require('express');
const router = express.Router();
const {
  getTechnicianRequests,
  respondToRequest,
  updateRequestStatus
} = require('../controllers/techAppController');
const { protect } = require('../middleware/authMiddleware');

// Custom middleware to ensure only technicians can access
const technicianOnly = (req, res, next) => {
  if (req.user && req.user.role === 'technician') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as technician');
  }
};

router.route('/requests').get(protect, technicianOnly, getTechnicianRequests);
router.route('/requests/:id/respond').post(protect, technicianOnly, respondToRequest);
router.route('/requests/:id/status').put(protect, technicianOnly, updateRequestStatus);

module.exports = router;
