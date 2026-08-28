const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  createRequest,
  getMyRequests,
  updateRequest,
  deleteRequest,
  createReview,
  rescheduleRequest,
  uploadAttachment,
  removeAttachment,
  updateQuotationStatus
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

// Multer config for S3 memory buffer
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
});

router.route('/').post(protect, upload.array('attachments', 5), createRequest);
router.route('/my-requests').get(protect, getMyRequests);
router
  .route('/:id')
  .put(protect, updateRequest)
  .delete(protect, deleteRequest);

// New Routes
router.route('/:id/reviews').post(protect, createReview);
router.route('/:id/reschedule').put(protect, rescheduleRequest);
router.route('/:id/attachments')
  .post(protect, upload.single('attachment'), uploadAttachment)
  .delete(protect, removeAttachment);

router.route('/:id/quotation').put(protect, updateQuotationStatus);

module.exports = router;
