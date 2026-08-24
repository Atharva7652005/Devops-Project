const asyncHandler = require('express-async-handler');
const PromoCode = require('../models/PromoCode');

// @desc    Get all promo codes
// @route   GET /api/admin/promos
// @access  Private/Admin
const getPromos = asyncHandler(async (req, res) => {
  const promos = await PromoCode.find({});
  res.json(promos);
});

// @desc    Create a promo code
// @route   POST /api/admin/promos
// @access  Private/Admin
const createPromo = asyncHandler(async (req, res) => {
  const { code, discountValue, expiryDate, isActive } = req.body;

  const promoExists = await PromoCode.findOne({ code: code.toUpperCase() });
  if (promoExists) {
    res.status(400);
    throw new Error('Promo code already exists');
  }

  const promo = await PromoCode.create({
    code,
    discountValue,
    expiryDate,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json(promo);
});

// @desc    Update a promo code
// @route   PUT /api/admin/promos/:id
// @access  Private/Admin
const updatePromo = asyncHandler(async (req, res) => {
  const promo = await PromoCode.findById(req.params.id);

  if (promo) {
    promo.code = req.body.code ? req.body.code.toUpperCase() : promo.code;
    promo.discountValue = req.body.discountValue !== undefined ? req.body.discountValue : promo.discountValue;
    promo.expiryDate = req.body.expiryDate || promo.expiryDate;
    promo.isActive = req.body.isActive !== undefined ? req.body.isActive : promo.isActive;

    const updatedPromo = await promo.save();
    res.json(updatedPromo);
  } else {
    res.status(404);
    throw new Error('Promo code not found');
  }
});

// @desc    Delete a promo code
// @route   DELETE /api/admin/promos/:id
// @access  Private/Admin
const deletePromo = asyncHandler(async (req, res) => {
  const promo = await PromoCode.findById(req.params.id);

  if (promo) {
    await promo.deleteOne();
    res.json({ message: 'Promo code removed' });
  } else {
    res.status(404);
    throw new Error('Promo code not found');
  }
});

module.exports = {
  getPromos,
  createPromo,
  updatePromo,
  deletePromo,
};
