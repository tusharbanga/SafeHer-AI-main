const { getFirebaseApp, admin } = require("../config/firebase");
const DeviceToken = require("../models/DeviceToken");

/**
 * Sends a push notification to every device token registered to a user.
 * Silently no-ops (with a console warning) if Firebase isn't configured,
 * so the rest of the app keeps working without FCM credentials.
 */
const sendPushToUser = async (userId, { title, body, data = {} }) => {
  const app = getFirebaseApp();
  if (!app) return { sent: 0, skipped: true };

  const tokens = await DeviceToken.find({ user: userId }).select("fcmToken");
  if (tokens.length === 0) return { sent: 0, skipped: false };

  const message = {
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    tokens: tokens.map((t) => t.fcmToken),
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  return { sent: response.successCount, failed: response.failureCount, skipped: false };
};

module.exports = { sendPushToUser };
