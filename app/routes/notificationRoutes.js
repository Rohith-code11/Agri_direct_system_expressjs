const express = require('express');
const { getMyNotifications, readNotification, readAllNotifications } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/read-all', readAllNotifications);
router.patch('/:notificationId/read', readNotification);

module.exports = router;
