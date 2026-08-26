const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { sendNotification, getMyNotifications, getTemplates } = require('../controllers/notificationController');

const router = express.Router();
router.get('/', protect, getMyNotifications);
router.get('/templates', protect, getTemplates);
router.post('/send', protect, sendNotification);

module.exports = router;