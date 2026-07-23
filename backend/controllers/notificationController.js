const Notification = require("../models/Notification");
const DeviceToken = require("../models/DeviceToken");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @route  GET /api/v1/notifications
const getNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  new ApiResponse(200, "Notifications fetched.", { notifications }).send(res);
});

// @route  PATCH /api/v1/notifications/:id/read
const markAsRead = catchAsync(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, "Notification not found.");
  new ApiResponse(200, "Notification marked as read.", { notification }).send(res);
});

// @route  PATCH /api/v1/notifications/read-all
const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  new ApiResponse(200, "All notifications marked as read.").send(res);
});

// @route  POST /api/v1/notifications/device-token
const registerDeviceToken = catchAsync(async (req, res) => {
  const { fcmToken, platform } = req.body;
  if (!fcmToken) throw new ApiError(400, "fcmToken is required.");

  const token = await DeviceToken.findOneAndUpdate(
    { fcmToken },
    { user: req.user._id, platform: platform || "web" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  new ApiResponse(200, "Device token registered.", { token }).send(res);
});

// @route  DELETE /api/v1/notifications/device-token
const removeDeviceToken = catchAsync(async (req, res) => {
  const { fcmToken } = req.body;
  await DeviceToken.deleteOne({ fcmToken, user: req.user._id });
  new ApiResponse(200, "Device token removed.").send(res);
});

module.exports = { getNotifications, markAsRead, markAllAsRead, registerDeviceToken, removeDeviceToken };
