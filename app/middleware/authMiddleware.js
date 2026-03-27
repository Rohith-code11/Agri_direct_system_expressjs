const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/userModel');
const { sendError } = require('../../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return sendError(res, 'Authorization token is required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const user = await findUserById(decoded.userId);

    if (!user) {
      return sendError(res, 'Invalid token user', 401);
    }

    req.user = user;
    return next();
  } catch (error) {
    return sendError(res, 'Unauthorized', 401, error.message || 'Invalid token');
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return sendError(res, 'Forbidden', 403);
    }

    return next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles,
};
