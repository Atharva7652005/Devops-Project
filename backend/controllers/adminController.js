const asyncHandler = require('express-async-handler');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const AuditLog = require('../models/AuditLog');


// --- REQUEST MANAGEMENT ---

// @desc    Get all requests
// @route   GET /api/admin/requests
// @access  Private/Admin
const getAllRequests = asyncHandler(async (req, res) => {
  const { status, category } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (category) filter.category = category;

  const requests = await ServiceRequest.find(filter)
    .populate('user', 'id name email phone address city pincode isBlocked')
    .populate('technician', 'name specialization phone') // Changed contactInfo to phone since it's User model
    .populate('technicianResponses.technicianId', 'name phone')
    .sort({ createdAt: -1 });

  res.json(requests);
});

// @desc    Update request status/details
// @route   PUT /api/admin/requests/:id/status
// @access  Private/Admin
const updateRequestStatus = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  const { status, assignedTechnician, technician, estimatedCost } = req.body;

  if (status) request.status = status;
  if (assignedTechnician !== undefined) request.assignedTechnician = assignedTechnician;
  if (technician !== undefined) request.technician = technician || null; // allow unsetting
  if (estimatedCost !== undefined) request.estimatedCost = estimatedCost;

  const updatedRequest = await request.save();
  res.json(updatedRequest);
});

// @desc    Delete any request
// @route   DELETE /api/admin/requests/:id
// @access  Private/Admin
const deleteAnyRequest = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  await request.deleteOne();
  res.json({ message: 'Request removed by admin' });
});

// --- INTERNAL ADMIN NOTES ---

// @desc    Add admin note to request
// @route   POST /api/admin/requests/:id/notes
// @access  Private/Admin
const addAdminNote = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  request.adminNotes.push({
    note,
    adminUser: req.user.name || req.user.email,
  });

  await request.save();
  res.status(201).json(request);
});

// @desc    Delete admin note from request
// @route   DELETE /api/admin/requests/:id/notes/:noteId
// @access  Private/Admin
const deleteAdminNote = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  request.adminNotes = request.adminNotes.filter(
    (n) => n._id.toString() !== req.params.noteId
  );

  await request.save();
  res.json({ message: 'Note removed' });
});



// --- ANALYTICS ---
// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = asyncHandler(async (req, res) => {
  const totalRevenueAggr = await ServiceRequest.aggregate([
    { $match: { status: 'Completed' } },
    { $group: { _id: null, total: { $sum: '$estimatedCost' } } }
  ]);
  const totalRevenue = totalRevenueAggr.length > 0 ? totalRevenueAggr[0].total : 0;

  const categoryAggr = await ServiceRequest.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  
  const techPerformance = await ServiceRequest.aggregate([
    { $match: { status: 'Completed', technician: { $ne: null } } },
    { $group: { _id: '$technician', completed: { $sum: 1 } } }
  ]);

  res.json({ totalRevenue, requestsByCategory: categoryAggr, techPerformance });
});

// --- SMART ASSIGN ---
// @desc    Auto-assign request to best available technician
// @route   POST /api/admin/requests/:id/auto-assign
// @access  Private/Admin
const autoAssignRequest = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  // Find all available technicians with matching specialization
  const technicians = await User.find({
    role: 'technician',
    isAvailable: true,
    specialization: request.category
  });

  if (technicians.length === 0) {
    res.status(400);
    throw new Error('No available technicians matching this category.');
  }

  // Pick the first available one (can be enhanced to check workload)
  const bestTech = technicians[0];

  request.technician = bestTech._id;
  request.assignedTechnician = bestTech.name;
  request.status = 'Scheduled';
  request.statusLog.push({ status: 'Scheduled', date: new Date() });
  
  await request.save();

  res.json({ message: `Assigned to ${bestTech.name}`, request });
});

// --- ASSIGN TECHNICIAN BID ---
// @desc    Assign a technician based on their bid response
// @route   POST /api/admin/requests/:id/assign-bid
// @access  Private/Admin
const assignTechnicianBid = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  const { technicianId, basePrice } = req.body;

  const techUser = await User.findById(technicianId);
  if (!techUser || techUser.role !== 'technician') {
    res.status(404);
    throw new Error('Technician not found');
  }

  request.technician = techUser._id;
  request.assignedTechnician = techUser.name;
  request.estimatedCost = basePrice;
  request.status = 'Scheduled';
  request.statusLog.push({ status: 'Scheduled', date: new Date() });

  await request.save();

  res.json({ message: `Assigned to ${techUser.name}`, request });
});

// --- USER MANAGEMENT ---

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc    Update user (block/role)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.role = req.body.role || user.role;
    user.isBlocked = req.body.isBlocked !== undefined ? req.body.isBlocked : user.isBlocked;

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isBlocked: updatedUser.isBlocked,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // 1. Log the deletion
    await AuditLog.create({
      action: 'CUSTOMER_DELETED',
      adminId: req.user._id,
      details: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    // 2. Cascade delete
    await ServiceRequest.deleteMany({ user: user._id });
    await Payment.deleteMany({ user: user._id });
    await Review.deleteMany({ user: user._id });
    await Notification.deleteMany({ user: user._id });
    await Message.deleteMany({ $or: [{ sender: user._id }, { receiver: user._id }] });

    // 3. Delete user
    await user.deleteOne();
    
    res.json({ message: 'User and all related data removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  getAllRequests,
  updateRequestStatus,
  deleteAnyRequest,
  addAdminNote,
  deleteAdminNote,
  getUsers,
  updateUser,
  deleteUser,
  getAnalytics,
  autoAssignRequest,
  assignTechnicianBid,
};
