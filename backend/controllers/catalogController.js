const asyncHandler = require('express-async-handler');
const ServiceCategory = require('../models/ServiceCategory');

// @desc    Get all categories
// @route   GET /api/admin/catalog
// @access  Private/Admin
const getCategories = asyncHandler(async (req, res) => {
  const categories = await ServiceCategory.find({});
  res.json(categories);
});

// @desc    Create a category
// @route   POST /api/admin/catalog
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, basePrice, description } = req.body;

  const categoryExists = await ServiceCategory.findOne({ name });
  if (categoryExists) {
    res.status(400);
    throw new Error('Category already exists');
  }

  const category = await ServiceCategory.create({
    name,
    basePrice,
    description,
  });

  res.status(201).json(category);
});

// @desc    Update a category
// @route   PUT /api/admin/catalog/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findById(req.params.id);

  if (category) {
    category.name = req.body.name || category.name;
    category.basePrice = req.body.basePrice !== undefined ? req.body.basePrice : category.basePrice;
    category.description = req.body.description || category.description;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

// @desc    Delete a category
// @route   DELETE /api/admin/catalog/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findById(req.params.id);

  if (category) {
    await category.deleteOne();
    res.json({ message: 'Category removed' });
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
