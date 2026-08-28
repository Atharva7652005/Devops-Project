const express = require('express');
const router = express.Router();
const { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } = require('../controllers/inventoryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, adminOnly, getInventory)
  .post(protect, adminOnly, createInventoryItem);

router.route('/:id')
  .put(protect, adminOnly, updateInventoryItem)
  .delete(protect, adminOnly, deleteInventoryItem);

module.exports = router;
