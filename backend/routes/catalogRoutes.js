const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/catalogController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getCategories)
  .post(protect, adminOnly, createCategory);

router.route('/:id')
  .put(protect, adminOnly, updateCategory)
  .delete(protect, adminOnly, deleteCategory);

module.exports = router;
