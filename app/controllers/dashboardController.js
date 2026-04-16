const { getGrowerSummary, getBuyerSummary, getGrowerInventory, getActiveCategories } = require('../models/dashboardModel');
const { sendSuccess, sendError } = require('../../utils/response');

const getErrorDetails = (error) => {
  if (!error) {
    return 'Unknown error';
  }

  return error.sqlMessage || error.message || error.code || String(error);
};

const growerDashboard = async (req, res) => {
  try {
    const summary = await getGrowerSummary(req.user.id);
    return sendSuccess(res, { summary, user: req.user }, 'Grower dashboard fetched');
  } catch (error) {
    return sendError(res, 'Failed to fetch grower dashboard', 500, getErrorDetails(error));
  }
};

const buyerDashboard = async (req, res) => {
  try {
    const summary = await getBuyerSummary(req.user.id);
    return sendSuccess(res, { summary, user: req.user }, 'Buyer dashboard fetched');
  } catch (error) {
    return sendError(res, 'Failed to fetch buyer dashboard', 500, getErrorDetails(error));
  }
};

const growerInventory = async (req, res) => {
  try {
    const [inventory, categories] = await Promise.all([
      getGrowerInventory(req.user.id),
      getActiveCategories(),
    ]);
    return sendSuccess(res, { inventory, categories }, 'Grower inventory fetched');
  } catch (error) {
    return sendError(res, 'Failed to fetch grower inventory', 500, getErrorDetails(error));
  }
};

module.exports = {
  growerDashboard,
  buyerDashboard,
  growerInventory,
};
