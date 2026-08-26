const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    serviceRequest: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'ServiceRequest' },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'INR', uppercase: true },
    method: { type: String, enum: ['card', 'upi', 'cash'], default: 'card' },
    status: { type: String, enum: ['pending', 'succeeded', 'failed', 'refunded'], default: 'pending' },
    provider: { type: String, default: 'mock-payments' },
    providerReference: { type: String },
    failureReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);