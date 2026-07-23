const CurrentLocation = require("../models/CurrentLocation");
const LocationHistory = require("../models/LocationHistory");
const EmergencyContact = require("../models/EmergencyContact");
const Guardian = require("../models/Guardian");

/**
 * Real-time Guardian live-location tracking.
 *
 * USER side emits:
 *   location:update  { userId, latitude, longitude, accuracy, timestamp }
 *   location:stop     { userId }
 *
 * GUARDIAN side emits:
 *   guardian:watch    { userId }   — joins the room that receives that user's updates
 *   guardian:unwatch  { userId }
 *
 * SERVER broadcasts to room `guardian:{userId}`:
 *   location:update   { userId, latitude, longitude, accuracy, updatedAt }
 *   location:stopped  { userId }
 *
 * Auth is handled by the shared io.use() middleware in socket/index.js,
 * which sets socket.userId and socket.role ("user" | "guardian").
 */
const registerLocationSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    // --- Guardian joins the room for the user they want to watch ---
    socket.on("guardian:watch", async ({ userId }) => {
      try {
        if (socket.role !== "guardian" || !userId) return;

        const guardian = await Guardian.findById(socket.userId);
        if (!guardian) return;

        const isLinked = await EmergencyContact.exists({ user: userId, email: guardian.email });
        if (!isLinked) {
          socket.emit("location:error", { message: "You are not an authorized guardian for this user." });
          return;
        }

        socket.join(`guardian:${userId}`);
        socket.emit("guardian:watching", { userId });

        // Send the latest known location immediately so the map isn't empty
        // while waiting for the next live ping.
        const current = await CurrentLocation.findOne({ userId });
        if (current) {
          socket.emit("location:update", {
            userId,
            latitude: current.latitude,
            longitude: current.longitude,
            accuracy: current.accuracy,
            updatedAt: current.updatedAt,
          });
        }
      } catch (err) {
        socket.emit("location:error", { message: "Failed to start watching this user." });
      }
    });

    socket.on("guardian:unwatch", ({ userId }) => {
      if (!userId) return;
      socket.leave(`guardian:${userId}`);
    });

    // --- User pushes a live location ping ---
    socket.on("location:update", async ({ userId, latitude, longitude, accuracy, timestamp }) => {
      try {
        if (socket.role !== "user" || String(socket.userId) !== String(userId)) return;
        if (latitude === undefined || longitude === undefined) return;

        const updatedAt = timestamp ? new Date(timestamp) : new Date();

        const current = await CurrentLocation.findOneAndUpdate(
          { userId },
          {
            $set: { latitude, longitude, accuracy: accuracy || 0, isSharing: true, updatedAt },
            $setOnInsert: { userId },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Fire-and-forget breadcrumb write; TTL index cleans it up after 5 minutes.
        LocationHistory.create({ userId, latitude, longitude, accuracy: accuracy || 0, timestamp: updatedAt }).catch(
          () => {}
        );

        io.to(`guardian:${userId}`).emit("location:update", {
          userId,
          latitude,
          longitude,
          accuracy: current.accuracy,
          updatedAt: current.updatedAt,
        });
      } catch (err) {
        socket.emit("location:error", { message: "Failed to broadcast location update." });
      }
    });

    // --- User stops sharing ---
    socket.on("location:stop", async ({ userId }) => {
      try {
        if (socket.role !== "user" || String(socket.userId) !== String(userId)) return;

        await CurrentLocation.deleteOne({ userId });
        io.to(`guardian:${userId}`).emit("location:stopped", { userId });
      } catch (err) {
        socket.emit("location:error", { message: "Failed to stop sharing location." });
      }
    });
  });
};

module.exports = { registerLocationSocketHandlers };
