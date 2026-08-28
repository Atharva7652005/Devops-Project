const asyncHandler = require('express-async-handler');
const InventoryItem = require('../models/InventoryItem');

// @desc    Get all inventory items
// @route   GET /api/admin/inventory
const getInventory = asyncHandler(async (req, res) => {
  const items = await InventoryItem.find({});
  res.json(items);
});

// @desc    Create new inventory item
// @route   POST /api/admin/inventory
const createInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.create(req.body);
  res.status(201).json(item);
});

// @desc    Update inventory item
// @route   PUT /api/admin/inventory/:id
const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }
  res.json(item);
});

// @desc    Delete inventory item
// @route   DELETE /api/admin/inventory/:id
const deleteInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByIdAndDelete(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }
  res.json({ message: 'Item removed' });
});

module.exports = { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem };
