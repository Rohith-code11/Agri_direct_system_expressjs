const express = require('express');
const { growerDashboard, buyerDashboard, growerInventory } = require('../controllers/dashboardController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/grower', authenticate, authorizeRoles('grower'), growerDashboard);
router.get('/grower/inventory', authenticate, authorizeRoles('grower'), growerInventory);
router.get('/buyer', authenticate, authorizeRoles('buyer'), buyerDashboard);

module.exports = router;
