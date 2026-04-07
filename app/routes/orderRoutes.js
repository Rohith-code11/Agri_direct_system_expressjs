const express = require('express');
const { getBuyerOrders, getGrowerOrders, patchGrowerOrderStatus } = require('../controllers/orderController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/buyer', authenticate, authorizeRoles('buyer'), getBuyerOrders);
router.get('/grower', authenticate, authorizeRoles('grower'), getGrowerOrders);
router.patch('/:orderId/status', authenticate, authorizeRoles('grower'), patchGrowerOrderStatus);

module.exports = router;
