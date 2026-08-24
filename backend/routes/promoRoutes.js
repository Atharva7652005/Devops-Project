const express = require('express');
const router = express.Router();
const {
  getPromos,
  createPromo,
  updatePromo,
  deletePromo,
} = require('../controllers/promoController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, adminOnly, getPromos)
  .post(protect, adminOnly, createPromo);

router.route('/:id')
  .put(protect, adminOnly, updatePromo)
  .delete(protect, adminOnly, deletePromo);

module.exports = router;
