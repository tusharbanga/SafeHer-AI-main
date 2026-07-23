const jwt = require("jsonwebtoken");
const TrackingSession = require("../models/TrackingSession");

/**
 * Registers all Socket.io event handlers for:
 *  - Live Location tracking (start/stop/update, room per user)
 *  - SOS broadcast to a user's own room so any connected device/dashboard
 *    can react instantly to a new emergency alert.
 *
 * Auth: client must connect with `auth: { token }` containing a valid JWT
 * access token (the same one used for REST requests).
 */
const registerSocketHandlers = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication token missing"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.role = decoded.role === "guardian" ? "guardian" : "user";
      next();
    } catch (err) {
      next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket) => {
    const userRoom = `user:${socket.userId}`;
    socket.join(userRoom);

    console.log(`Socket connected: user ${socket.userId} (${socket.id})`);

    // --- Live Location Tracking ---
    socket.on("tracking:start", async ({ sessionId }) => {
      socket.join(`tracking:${sessionId}`);
      socket.emit("tracking:started", { sessionId });
    });

    socket.on("tracking:location-update", async ({ sessionId, latitude, longitude, speedKmh, battery, internet }) => {
      try {
        const session = await TrackingSession.findOneAndUpdate(
          { _id: sessionId, user: socket.userId, isActive: true },
          {
            $set: {
              currentLocation: { latitude, longitude, speedKmh, updatedAt: new Date() },
              ...(battery !== undefined ? { "deviceStatus.battery": battery } : {}),
              ...(internet !== undefined ? { "deviceStatus.internet": internet } : {}),
            },
            $push: { path: { latitude, longitude, speedKmh, timestamp: new Date() } },
          },
          { new: true }
        );

        if (session) {
          io.to(`tracking:${sessionId}`).emit("tracking:location", {
            sessionId,
            latitude,
            longitude,
            speedKmh,
            battery: session.deviceStatus.battery,
            internet: session.deviceStatus.internet,
            timestamp: new Date(),
          });
        }
      } catch (err) {
        socket.emit("tracking:error", { message: "Failed to update location" });
      }
    });

    socket.on("tracking:stop", async ({ sessionId }) => {
      await TrackingSession.findOneAndUpdate(
        { _id: sessionId, user: socket.userId },
        { $set: { isActive: false, endedAt: new Date() } }
      );
      io.to(`tracking:${sessionId}`).emit("tracking:stopped", { sessionId });
      socket.leave(`tracking:${sessionId}`);
    });

    // Emergency contacts / watchers can join a session's room via a share link
    // to receive real-time location updates without needing a user account.
    socket.on("tracking:watch", ({ sessionId }) => {
      socket.join(`tracking:${sessionId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: user ${socket.userId} (${socket.id})`);
    });
  });
};
/**
 * Broadcasts a new SOS alert to the triggering user's room (any of their
 * connected devices) and to a general "sos-monitor" room for dashboards.
 */
const broadcastSOSAlert = (io, userId, alertPayload) => {
  io.to(`user:${userId}`).emit("sos:triggered", alertPayload);
  io.to("sos-monitor").emit("sos:new-alert", alertPayload);
  // Any guardian currently watching this user's live location (joined via
  // "guardian:watch" in socket/locationSocket.js) gets the emergency alert too.
  io.to(`guardian:${userId}`).emit("emergency:alert", alertPayload);
};

module.exports = { registerSocketHandlers, broadcastSOSAlert };
