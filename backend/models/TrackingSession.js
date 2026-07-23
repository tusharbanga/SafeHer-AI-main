const mongoose = require("mongoose");

/**
 * Represents a single live-tracking journey (e.g. "Guardian is watching" screen).
 * Individual location pings are pushed via Socket.io and appended to `path`,
 * while `timeline` stores human-readable milestone events shown in the UI.
 */
const trackingSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    startLocation: {
      latitude: Number,
      longitude: Number,
      label: String,
    },
    destination: {
      latitude: Number,
      longitude: Number,
      label: String,
    },
    currentLocation: {
      latitude: Number,
      longitude: Number,
      speedKmh: { type: Number, default: 0 },
      updatedAt: { type: Date, default: Date.now },
    },
    path: [
      {
        latitude: Number,
        longitude: Number,
        speedKmh: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: "EmergencyContact" }],
    timeline: [
      {
        label: String,
        description: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    deviceStatus: {
      battery: { type: Number, default: 100 },
      internet: { type: String, enum: ["strong", "weak", "offline"], default: "strong" },
    },
    expectedArrivalAt: { type: Date },
    checkInDeadline: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

trackingSessionSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model("TrackingSession", trackingSessionSchema);
