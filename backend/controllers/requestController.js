const asyncHandler = require('express-async-handler');
const { uploadToS3 } = require('../utils/s3Upload');
const ServiceRequest = require('../models/ServiceRequest');
const Review = require('../models/Review');
const socket = require('../config/socket');

// @desc    Create new service request
// @route   POST /api/requests
// @access  Private (Customer)
const createRequest = asyncHandler(async (req, res) => {
  const { category, title, description, preferredDate, requestedMaximumCharge } = req.body;

  if (!category || !title || !description || !preferredDate || !requestedMaximumCharge) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const attachments = [];
  if (req.files && req.files.length > 0) {
    try {
      const uploadPromises = req.files.map(file => uploadToS3(file));
      const s3Urls = await Promise.all(uploadPromises);
      attachments.push(...s3Urls);
    } catch (err) {
      console.error('Error uploading files to S3:', err);
      res.status(500);
      throw new Error('Failed to upload attachments to S3');
    }
  }

  const request = new ServiceRequest({
    user: req.user._id,
    category,
    title,
    description,
    preferredDate,
    requestedMaximumCharge,
    attachments,
  });

  const createdRequest = await request.save();

  // Populate user info so the technician UI has it right away
  await createdRequest.populate('user', 'name city pincode');

  // Emit event to all technicians (in real app, we might room them by category)
  try {
    const io = socket.getIO();
    io.emit('new_request', createdRequest);
  } catch (err) {
    console.error('Socket error emitting new_request:', err);
  }

  res.status(201).json(createdRequest);
});

// @desc    Get logged in user requests
// @route   GET /api/requests/my-requests
// @access  Private (Customer)
const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await ServiceRequest.find({ user: req.user._id })
    .populate('technician', 'name specialization contactInfo')
    .sort({ createdAt: -1 });
  res.json(requests);
});

// @desc    Update service request
// @route   PUT /api/requests/:id
// @access  Private (Customer)
const updateRequest = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this request');
  }

  if (request.status !== 'Pending') {
    res.status(400);
    throw new Error('Cannot update request after it has been processed');
  }

  const { description, preferredDate } = req.body;

  if (description) request.description = description;
  if (preferredDate) request.preferredDate = preferredDate;

  const updatedRequest = await request.save();
  res.json(updatedRequest);
});

// @desc    Delete service request
// @route   DELETE /api/requests/:id
// @access  Private (Customer)
const deleteRequest = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this request');
  }

  if (request.status !== 'Pending') {
    res.status(400);
    throw new Error('Cannot delete request after it has been processed');
  }

  await request.deleteOne();
  res.json({ message: 'Request removed' });
});

// @desc    Create review for completed request
// @route   POST /api/requests/:id/reviews
// @access  Private (Customer)
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (request.status !== 'Completed') {
    res.status(400);
    throw new Error('Can only review completed requests');
  }

  const alreadyReviewed = await Review.findOne({ serviceRequest: req.params.id });
  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Request already reviewed');
  }

  const review = await Review.create({
    user: req.user._id,
    serviceRequest: req.params.id,
    rating: Number(rating),
    comment,
  });

  res.status(201).json(review);
});

// @desc    Reschedule request
// @route   PUT /api/requests/:id/reschedule
// @access  Private (Customer)
const rescheduleRequest = asyncHandler(async (req, res) => {
  const { requestedDate, reason } = req.body;
  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (request.status === 'Completed' || request.status === 'Cancelled') {
    res.status(400);
    throw new Error('Cannot reschedule completed or cancelled requests');
  }

  request.rescheduleRequests.push({
    requestedDate,
    reason,
  });

  await request.save();
  res.status(201).json(request);
});

// @desc    Upload attachment to request
// @route   POST /api/requests/:id/attachments
// @access  Private (Customer)
const uploadAttachment = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (request.status !== 'Pending') {
    res.status(400);
    throw new Error('Can only add attachments to Pending requests');
  }

  if (!req.file) {
    console.error('File upload failed: req.file is undefined. Check multer config or incoming formData.');
    res.status(400);
    throw new Error('No file uploaded');
  }

  try {
    const fileUrl = await uploadToS3(req.file);
    request.attachments.push(fileUrl);
    
    await request.save();
    res.status(201).json({ message: 'Attachment uploaded', url: fileUrl });
  } catch (err) {
    console.error('S3 upload error:', err);
    res.status(500);
    throw new Error('Failed to upload file to S3');
  }
});

// @desc    Remove attachment from request
// @route   DELETE /api/requests/:id/attachments
// @access  Private (Customer)
const removeAttachment = asyncHandler(async (req, res) => {
  const { url } = req.body;
  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (request.status !== 'Pending') {
    res.status(400);
    throw new Error('Can only remove attachments from Pending requests');
  }

  request.attachments = request.attachments.filter((attachment) => attachment !== url);
  await request.save();
  
  res.json({ message: 'Attachment reference removed' });
});

// @desc    Approve or decline a quotation
// @route   PUT /api/requests/:id/quotation
// @access  Private (Customer)
const updateQuotationStatus = asyncHandler(async (req, res) => {
  const { quotationStatus } = req.body;
  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // quotationStatus comes from frontend (Approved or Declined)
  if (!['Approved', 'Declined'].includes(quotationStatus)) {
    res.status(400);
    throw new Error('Invalid quotation status');
  }

  request.quotationStatus = quotationStatus;
  
  if (quotationStatus === 'Approved') {
    // Optionally move to scheduled or keep pending, according to business logic.
    // The previous frontend might just update the field.
  } else if (quotationStatus === 'Declined') {
    request.status = 'Cancelled';
  }

  const updatedRequest = await request.save();
  res.json(updatedRequest);
});

module.exports = {
  createRequest,
  getMyRequests,
  updateRequest,
  deleteRequest,
  createReview,
  rescheduleRequest,
  uploadAttachment,
  removeAttachment,
  updateQuotationStatus,
};
