const { sendSuccess, sendError } = require('../../utils/response');
const { listNotificationsByUser, markNotificationRead, markAllNotificationsRead } = require('../models/notificationModel');

const getErrorDetails = (error) => error?.sqlMessage || error?.message || error?.code || 'Unknown error';

const getMyNotifications = async (req, res) => {
  try {
    const data = await listNotificationsByUser(req.user.id);
    return sendSuccess(res, data, 'Notifications fetched');
  } catch (error) {
    return sendError(res, 'Failed to fetch notifications', 500, getErrorDetails(error));
  }
};

const readNotification = async (req, res) => {
  try {
    const updated = await markNotificationRead(req.user.id, Number(req.params.notificationId));
    if (!updated) {
      return sendError(res, 'Notification not found', 404);
    }

    const data = await listNotificationsByUser(req.user.id);
    return sendSuccess(res, data, 'Notification marked as read');
  } catch (error) {
    return sendError(res, 'Failed to update notification', 500, getErrorDetails(error));
  }
};

const readAllNotifications = async (req, res) => {
  try {
    await markAllNotificationsRead(req.user.id);
    const data = await listNotificationsByUser(req.user.id);
    return sendSuccess(res, data, 'All notifications marked as read');
  } catch (error) {
    return sendError(res, 'Failed to update notifications', 500, getErrorDetails(error));
  }
};

module.exports = {
  getMyNotifications,
  readNotification,
  readAllNotifications,
};
