const pool = require('../../config/db');

const listNotificationsByUser = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT id, title, message, notification_type AS notificationType, is_read AS isRead, created_at AS createdAt
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 100`,
    [userId]
  );

  const unreadCount = rows.filter((item) => !item.isRead).length;

  return {
    unreadCount,
    notifications: rows.map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      notificationType: row.notificationType,
      isRead: Boolean(row.isRead),
      createdAt: row.createdAt,
    })),
  };
};

const markNotificationRead = async (userId, notificationId) => {
  const [result] = await pool.execute(
    `UPDATE notifications
     SET is_read = 1
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );

  return result.affectedRows > 0;
};

const markAllNotificationsRead = async (userId) => {
  await pool.execute(
    `UPDATE notifications
     SET is_read = 1
     WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
};

module.exports = {
  listNotificationsByUser,
  markNotificationRead,
  markAllNotificationsRead,
};
