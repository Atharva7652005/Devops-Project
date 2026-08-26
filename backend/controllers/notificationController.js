const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const User = require('../models/User');

const templates = {
  request_update: {
    subject: 'RepairHub request update',
    message: 'Your RepairHub service request has been updated.',
  },
  payment_confirmation: {
    subject: 'RepairHub payment confirmation',
    message: 'Your RepairHub payment was received successfully.',
  },
  appointment_reminder: {
    subject: 'RepairHub appointment reminder',
    message: 'This is a reminder about your upcoming repair appointment.',
  },
};

const sendNotification = asyncHandler(async (req, res) => {
  const { channel, template, message, subject } = req.body;
  if (!['sms', 'email'].includes(channel) || !template) {
    res.status(400);
    throw new Error('A valid channel and template are required');
  }

  const user = await User.findById(req.user._id);
  const recipient = channel === 'sms' ? user.phone : user.email;
  if (!recipient) {
    res.status(400);
    throw new Error(`No ${channel} recipient is configured on your profile`);
  }
  if (channel === 'sms' && !user.notifications.sms) {
    res.status(400);
    throw new Error('SMS notifications are disabled in your profile');
  }
  if (channel === 'email' && !user.notifications.email) {
    res.status(400);
    throw new Error('Email notifications are disabled in your profile');
  }

  const fallback = templates[template] || {};
  const notification = await Notification.create({
    user: user._id,
    channel,
    recipient,
    template,
    subject: channel === 'email' ? (subject || fallback.subject || 'RepairHub notification') : undefined,
    message: message || fallback.message || 'RepairHub notification',
    status: 'sent',
    provider: channel === 'sms' ? 'mock-sms' : 'mock-email',
    providerReference: `MOCK-${channel.toUpperCase()}-${Date.now()}`,
    sentAt: new Date(),
  });

  res.status(201).json(notification);
});

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(notifications);
});

const getTemplates = asyncHandler(async (req, res) => {
  res.json(templates);
});

module.exports = { sendNotification, getMyNotifications, getTemplates };