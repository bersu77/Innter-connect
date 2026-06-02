import Notification from '../models/Notification.js';

// @route GET /api/notifications
export const listNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort('-createdAt')
      .limit(50);
    const unread = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ success: true, notifications, unread });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/notifications/:id/read
export const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true, readAt: new Date() },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/notifications/read-all
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true, readAt: new Date() },
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
