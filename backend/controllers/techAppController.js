const asyncHandler = require('express-async-handler');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const socket = require('../config/socket');

// @desc    Get job board (pending requests matching specialization) and assigned requests
// @route   GET /api/technician/requests
// @access  Private/Technician
const getTechnicianRequests = asyncHandler(async (req, res) => {
  const specialization = req.user.specialization;

  // Pending requests that match the technician's specialization
  // We use a case-insensitive regex to avoid mismatching due to minor typos
  const jobBoard = await ServiceRequest.find({
    category: { $regex: new RegExp(`^${specialization}$`, 'i') },
    status: 'Pending'
  }).populate('user', 'name city pincode').sort({ createdAt: -1 });

  // Requests assigned to this technician
  const mySchedule = await ServiceRequest.find({
    technician: req.user._id,
    status: { $in: ['Scheduled', 'In Progress', 'Completed'] }
  }).populate('user', 'name address city pincode phone email').sort({ createdAt: -1 });

  res.json({ jobBoard, mySchedule });
});

// @desc    Respond to a request (Bid / Confirm / Reject)
// @route   POST /api/technician/requests/:id/respond
// @access  Private/Technician
const respondToRequest = asyncHandler(async (req, res) => {
  const { status, basePrice } = req.body; // status: 'Confirmed' or 'Rejected'
  
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.status !== 'Pending') {
    res.status(400);
    throw new Error('Request is no longer pending.');
  }

  if (status === 'Confirmed') {
    // Uber-style First-To-Claim Logic
    request.status = 'Scheduled';
    request.technician = req.user._id;
    request.assignedTechnician = req.user.name;
    request.quotedCost = basePrice;
    request.statusLog.push({ status: 'Scheduled', date: new Date() });
    
    // We can keep a record in responses for audit, but it's not strictly necessary for the flow
    request.technicianResponses.push({
      technicianId: req.user._id,
      status: 'Confirmed',
      basePrice
    });

    const updatedRequest = await request.save();

    // Emit event to remove from other technicians' job boards
    try {
      const io = socket.getIO();
      io.emit('request_claimed', { requestId: updatedRequest._id });
    } catch (err) {
      console.error('Socket error emitting request_claimed:', err);
    }

    res.json(updatedRequest);
  } else {
    // If they just rejected it, we just record it in responses so it doesn't show up for them anymore
    const existingResponseIndex = request.technicianResponses.findIndex(
      r => r.technicianId.toString() === req.user._id.toString()
    );

    if (existingResponseIndex !== -1) {
      request.technicianResponses[existingResponseIndex].status = status;
      request.technicianResponses[existingResponseIndex].date = Date.now();
    } else {
      request.technicianResponses.push({
        technicianId: req.user._id,
        status
      });
    }

    await request.save();
    res.json(request);
  }
});

// @desc    Update status of assigned request
// @route   PUT /api/technician/requests/:id/status
// @access  Private/Technician
const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.technician.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this request');
  }

  request.status = status;
  request.statusLog.push({ status, date: new Date() });
  
  const updatedRequest = await request.save();
  res.json(updatedRequest);
});

module.exports = {
  getTechnicianRequests,
  respondToRequest,
  updateRequestStatus
};
