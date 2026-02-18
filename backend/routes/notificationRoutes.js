const express = require('express');
const { getMyNotifications, markAsRead, clearAll } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .get(protect, getMyNotifications)
    .delete(protect, clearAll);

router.put('/:id/read', protect, markAsRead);

module.exports = router;
