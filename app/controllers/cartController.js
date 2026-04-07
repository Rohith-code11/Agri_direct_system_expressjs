const { sendSuccess, sendError } = require('../../utils/response');
const { getCartByBuyerId, addCartItem, updateCartItemQuantity, removeCartItem } = require('../models/cartModel');
const { createOrdersFromCart } = require('../models/orderModel');

const getErrorDetails = (error) => error?.sqlMessage || error?.message || error?.code || 'Unknown error';

const getMyCart = async (req, res) => {
  try {
    const cart = await getCartByBuyerId(req.user.id);
    return sendSuccess(res, cart, 'Cart fetched');
  } catch (error) {
    return sendError(res, 'Failed to fetch cart', 500, getErrorDetails(error));
  }
};

const addItemToCart = async (req, res) => {
  try {
    const { listingId, quantity } = req.body;
    if (!listingId || !quantity) {
      return sendError(res, 'listingId and quantity are required', 400);
    }

    const cart = await addCartItem(req.user.id, Number(listingId), Number(quantity));
    return sendSuccess(res, cart, 'Item added to cart', 201);
  } catch (error) {
    const statusCode = /not found|not available|Quantity|stock|Minimum/.test(error.message) ? 400 : 500;
    return sendError(res, 'Failed to add item to cart', statusCode, getErrorDetails(error));
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity) {
      return sendError(res, 'quantity is required', 400);
    }

    const cart = await updateCartItemQuantity(req.user.id, Number(req.params.itemId), Number(quantity));
    return sendSuccess(res, cart, 'Cart item updated');
  } catch (error) {
    const statusCode = /not found|Quantity|stock|Minimum/.test(error.message) ? 400 : 500;
    return sendError(res, 'Failed to update cart item', statusCode, getErrorDetails(error));
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const cart = await removeCartItem(req.user.id, Number(req.params.itemId));
    return sendSuccess(res, cart, 'Cart item removed');
  } catch (error) {
    const statusCode = /not found/.test(error.message) ? 404 : 500;
    return sendError(res, 'Failed to remove cart item', statusCode, getErrorDetails(error));
  }
};

const checkoutCart = async (req, res) => {
  try {
    const orders = await createOrdersFromCart(req.user, {
      paymentMethod: req.body.paymentMethod,
      notes: (req.body.notes || '').trim(),
    });

    return sendSuccess(res, { orders }, 'Checkout completed successfully', 201);
  } catch (error) {
    const statusCode = /Cart is empty|stock|Minimum/.test(error.message) ? 400 : 500;
    return sendError(res, 'Failed to complete checkout', statusCode, getErrorDetails(error));
  }
};

module.exports = {
  getMyCart,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
  checkoutCart,
};
