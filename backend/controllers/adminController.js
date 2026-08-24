const asyncHandler = require('express-async-handler');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

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
    .populate('user', 'id name email phone')
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

  const { status, assignedTechnician, estimatedCost } = req.body;

  if (status) request.status = status;
  if (assignedTechnician !== undefined) request.assignedTechnician = assignedTechnician;
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
    await user.deleteOne();
    // Optional: Delete their requests too, or keep them for records. We'll delete for cleanliness.
    await ServiceRequest.deleteMany({ user: user._id });
    res.json({ message: 'User removed' });
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
};
