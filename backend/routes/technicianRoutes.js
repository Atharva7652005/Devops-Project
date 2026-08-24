const express = require('express');
const router = express.Router();
const {
  getTechnicians,
  createTechnician,
  updateTechnician,
  deleteTechnician,
} = require('../controllers/technicianController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, adminOnly, getTechnicians)
  .post(protect, adminOnly, createTechnician);

router.route('/:id')
  .put(protect, adminOnly, updateTechnician)
  .delete(protect, adminOnly, deleteTechnician);

module.exports = router;
