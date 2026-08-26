const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    channel: { type: String, enum: ['sms', 'email'], required: true },
    recipient: { type: String, required: true },
    template: { type: String, required: true },
    subject: { type: String },
    message: { type: String, required: true },
    status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' },
    provider: { type: String, required: true },
    providerReference: { type: String },
    sentAt: { type: Date },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);