const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const ServiceRequest = require('../models/ServiceRequest');

const createPayment = asyncHandler(async (req, res) => {
  const { serviceRequest, amount, method = 'card' } = req.body;
  const request = await ServiceRequest.findOne({ _id: serviceRequest, user: req.user._id });

  if (!request) {
    res.status(404);
    throw new Error('Service request not found');
  }
  if (!amount || Number(amount) <= 0) {
    res.status(400);
    throw new Error('Payment amount must be greater than zero');
  }

  const payment = await Payment.create({
    user: req.user._id,
    serviceRequest: request._id,
    amount: Number(amount),
    method,
    status: 'pending',
  });

  res.status(201).json(payment);
});

const confirmPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, user: req.user._id });
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }
  if (payment.status !== 'pending') {
    res.status(400);
    throw new Error('Payment is no longer pending');
  }

  const { cardLast4 } = req.body;
  if (payment.method === 'card' && (!/^\d{4}$/.test(String(cardLast4 || '')))) {
    payment.status = 'failed';
    payment.failureReason = 'A four-digit mock card suffix is required';
    await payment.save();
    res.status(400);
    throw new Error(payment.failureReason);
  }

  payment.status = 'succeeded';
  payment.providerReference = `MOCK-${Date.now()}`;
  await payment.save();
  res.json(payment);
});

const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate('serviceRequest', 'title status')
    .sort({ createdAt: -1 });
  res.json(payments);
});

module.exports = { createPayment, confirmPayment, getMyPayments };