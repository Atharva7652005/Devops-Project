const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, specialization, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please include all required fields');
  }

  if (role === 'technician' && !specialization) {
    res.status(400);
    throw new Error('Technicians must provide a specialization');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user - password will be hashed in pre-save middleware
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'customer',
    specialization: role === 'technician' ? specialization : undefined,
    phone: phone || undefined,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      pincode: user.pincode,
      notifications: user.notifications,
      role: user.role,
      specialization: user.specialization,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      pincode: user.pincode,
      notifications: user.notifications,
      role: user.role,
      specialization: user.specialization,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

module.exports = {
  registerUser,
  loginUser,
};
