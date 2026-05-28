// src/controllers/notification.controller.js
export const getUserNotifications = async (req, res) => {
  res.json([]);
};

export const markAsRead = async (req, res) => {
  res.json({ message: 'Marked as read' });
};
