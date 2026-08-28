const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const AuditLog = require('../models/AuditLog');

// @desc    Get all technicians (Users with role='technician')
// @route   GET /api/admin/technicians
// @access  Private/Admin
const getTechnicians = asyncHandler(async (req, res) => {
  const technicians = await User.find({ role: 'technician' }).select('-password');
  res.json(technicians.map(t => ({
    _id: t._id,
    name: t.name,
    specialization: t.specialization,
    contactInfo: t.phone,
    isAvailable: t.isAvailable,
    email: t.email
  })));
});

// @desc    Create a technician
// @route   POST /api/admin/technicians
// @access  Private/Admin
const createTechnician = asyncHandler(async (req, res) => {
  const { name, email, password, specialization, contactInfo, isAvailable } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const technician = await User.create({
    name,
    email: email || `${name.toLowerCase().replace(/\s/g, '')}@technician.com`,
    password: password || '123456', // default password if not provided
    role: 'technician',
    specialization,
    phone: contactInfo,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
  });

  if (technician) {
    res.status(201).json({
      _id: technician._id,
      name: technician.name,
      specialization: technician.specialization,
      contactInfo: technician.phone,
      isAvailable: technician.isAvailable,
      email: technician.email
    });
  } else {
    res.status(400);
    throw new Error('Invalid technician data');
  }
});

// @desc    Update a technician
// @route   PUT /api/admin/technicians/:id
// @access  Private/Admin
const updateTechnician = asyncHandler(async (req, res) => {
  const technician = await User.findById(req.params.id);

  if (technician && technician.role === 'technician') {
    technician.name = req.body.name || technician.name;
    technician.specialization = req.body.specialization || technician.specialization;
    technician.phone = req.body.contactInfo || technician.phone;
    technician.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : technician.isAvailable;
    
    if (req.body.email) technician.email = req.body.email;
    if (req.body.password) technician.password = req.body.password;

    const updatedTechnician = await technician.save();
    res.json({
      _id: updatedTechnician._id,
      name: updatedTechnician.name,
      specialization: updatedTechnician.specialization,
      contactInfo: updatedTechnician.phone,
      isAvailable: updatedTechnician.isAvailable,
      email: updatedTechnician.email
    });
  } else {
    res.status(404);
    throw new Error('Technician not found');
  }
});

// @desc    Delete a technician
// @route   DELETE /api/admin/technicians/:id
// @access  Private/Admin
const deleteTechnician = asyncHandler(async (req, res) => {
  const technician = await User.findById(req.params.id);

  if (technician && technician.role === 'technician') {
    // 1. Log the deletion
    await AuditLog.create({
      action: 'TECHNICIAN_DELETED',
      adminId: req.user._id,
      details: {
        userId: technician._id,
        name: technician.name,
        email: technician.email,
        specialization: technician.specialization
      }
    });

    // 2. Cascade delete
    await ServiceRequest.deleteMany({ technician: technician._id });
    // Also remove their bids from any pending requests (this requires pulling from the array)
    await ServiceRequest.updateMany(
      { 'technicianResponses.technicianId': technician._id },
      { $pull: { technicianResponses: { technicianId: technician._id } } }
    );
    await Review.deleteMany({ technician: technician._id });
    await Notification.deleteMany({ user: technician._id });
    await Message.deleteMany({ $or: [{ sender: technician._id }, { receiver: technician._id }] });

    // 3. Delete user
    await technician.deleteOne();
    
    res.json({ message: 'Technician and all related data removed' });
  } else {
    res.status(404);
    throw new Error('Technician not found');
  }
});

module.exports = {
  getTechnicians,
  createTechnician,
  updateTechnician,
  deleteTechnician,
};
