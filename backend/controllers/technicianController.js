const asyncHandler = require('express-async-handler');
const Technician = require('../models/Technician');

// @desc    Get all technicians
// @route   GET /api/admin/technicians
// @access  Private/Admin
const getTechnicians = asyncHandler(async (req, res) => {
  const technicians = await Technician.find({});
  res.json(technicians);
});

// @desc    Create a technician
// @route   POST /api/admin/technicians
// @access  Private/Admin
const createTechnician = asyncHandler(async (req, res) => {
  const { name, specialization, contactInfo, isAvailable } = req.body;

  const technician = await Technician.create({
    name,
    specialization,
    contactInfo,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
  });

  res.status(201).json(technician);
});

// @desc    Update a technician
// @route   PUT /api/admin/technicians/:id
// @access  Private/Admin
const updateTechnician = asyncHandler(async (req, res) => {
  const technician = await Technician.findById(req.params.id);

  if (technician) {
    technician.name = req.body.name || technician.name;
    technician.specialization = req.body.specialization || technician.specialization;
    technician.contactInfo = req.body.contactInfo || technician.contactInfo;
    technician.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : technician.isAvailable;

    const updatedTechnician = await technician.save();
    res.json(updatedTechnician);
  } else {
    res.status(404);
    throw new Error('Technician not found');
  }
});

// @desc    Delete a technician
// @route   DELETE /api/admin/technicians/:id
// @access  Private/Admin
const deleteTechnician = asyncHandler(async (req, res) => {
  const technician = await Technician.findById(req.params.id);

  if (technician) {
    await technician.deleteOne();
    res.json({ message: 'Technician removed' });
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
