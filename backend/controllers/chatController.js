const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');

// @desc    Get messages for a service request
// @route   GET /api/chat/:requestId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ serviceRequest: req.params.requestId })
    .populate('sender', 'name role')
    .sort('createdAt');
  res.json(messages);
});

// @desc    Send a message
// @route   POST /api/chat/:requestId
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    res.status(400);
    throw new Error('Message content is required');
  }

  const message = await Message.create({
    serviceRequest: req.params.requestId,
    sender: req.user._id,
    senderModel: 'User',
    content,
  });

  const populatedMessage = await Message.findById(message._id).populate('sender', 'name role');

  res.status(201).json(populatedMessage);
});

module.exports = { getMessages, sendMessage };
