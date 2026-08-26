const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createPayment, confirmPayment, getMyPayments } = require('../controllers/paymentController');

const router = express.Router();
router.get('/my-payments', protect, getMyPayments);
router.post('/', protect, createPayment);
router.post('/:id/confirm', protect, confirmPayment);

module.exports = router;