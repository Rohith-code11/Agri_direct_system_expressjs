const express = require('express');
const { getMyCart, addItemToCart, updateCartItem, deleteCartItem, checkoutCart } = require('../controllers/cartController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, authorizeRoles('buyer'));

router.get('/me', getMyCart);
router.post('/items', addItemToCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', deleteCartItem);
router.post('/checkout', checkoutCart);

module.exports = router;
