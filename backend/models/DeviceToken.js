const mongoose = require("mongoose");

/**
 * Firebase Cloud Messaging device tokens registered per user/device,
 * used to deliver Emergency / Community / Safety push notifications.
 */
const deviceTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fcmToken: { type: String, required: true, unique: true },
    platform: { type: String, enum: ["android", "ios", "web"], default: "web" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeviceToken", deviceTokenSchema);
