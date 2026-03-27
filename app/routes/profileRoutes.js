const express = require('express');
const { getMyProfile, updateMyProfile } = require('../controllers/profileController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, updateMyProfile);

module.exports = router;
