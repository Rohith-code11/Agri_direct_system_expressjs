const { sendSuccess, sendError } = require('../../utils/response');
const { listBuyerOrders, listGrowerOrders, updateGrowerOrderStatus } = require('../models/orderModel');

const getErrorDetails = (error) => error?.sqlMessage || error?.message || error?.code || 'Unknown error';

const getBuyerOrders = async (req, res) => {
  try {
    const orders = await listBuyerOrders(req.user.id);
    return sendSuccess(res, { orders }, 'Buyer orders fetched');
  } catch (error) {
    return sendError(res, 'Failed to fetch buyer orders', 500, getErrorDetails(error));
  }
};

const getGrowerOrders = async (req, res) => {
  try {
    const orders = await listGrowerOrders(req.user.id);
    return sendSuccess(res, { orders }, 'Grower orders fetched');
  } catch (error) {
    return sendError(res, 'Failed to fetch grower orders', 500, getErrorDetails(error));
  }
};

const patchGrowerOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return sendError(res, 'status is required', 400);
    }

    const order = await updateGrowerOrderStatus(req.user.id, Number(req.params.orderId), String(status).trim());
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    return sendSuccess(res, { order }, 'Order status updated');
  } catch (error) {
    const statusCode = /not found|Invalid/.test(error.message) ? 400 : 500;
    return sendError(res, 'Failed to update order status', statusCode, getErrorDetails(error));
  }
};

module.exports = {
  getBuyerOrders,
  getGrowerOrders,
  patchGrowerOrderStatus,
};
