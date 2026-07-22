const Notification = require("../models/Notification");

async function getMyNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyNotifications };
