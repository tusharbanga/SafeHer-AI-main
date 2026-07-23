const mongoose = require("mongoose");

/**
 * Backs the Ride Guardian screen — tracks a cab/ride journey, driver
 * details, expected route and live deviation status.
 */
const rideGuardianSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: { type: String, default: "Uber" },
    vehicleNumber: { type: String, default: "" },
    vehicleModel: { type: String, default: "" },
    driver: {
      name: { type: String, default: "" },
      rating: { type: Number, default: 0 },
      totalRides: { type: Number, default: 0 },
      phone: { type: String, default: "" },
    },
    pickup: {
      label: String,
      latitude: Number,
      longitude: Number,
    },
    destination: {
      label: String,
      latitude: Number,
      longitude: Number,
    },
    expectedRoutePolyline: { type: String, default: "" },
    status: {
      type: String,
      enum: ["started", "in_progress", "deviated", "completed", "cancelled"],
      default: "started",
    },
    safetyScore: { type: Number, default: 100 },
    deviationPercent: { type: Number, default: 0 },
    etaMinutes: { type: Number, default: 0 },
    currentLocation: {
      latitude: Number,
      longitude: Number,
      updatedAt: Date,
    },
    locationHistory: [
      {
        latitude: Number,
        longitude: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    deviationDistance: { type: Number, default: 0 },
    lastLocationUpdate: { type: Date, default: null },
    routeStartedAt: { type: Date, default: null },
    destinationReached: { type: Boolean, default: false },
    lastDeviationAlertAt: { type: Date, default: null },
    deviationStatus: {
      type: String,
      enum: ["safe", "warning", "critical"],
      default: "safe",
    },
    routeProgress: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
    aiMonitoringEnabled: { type: Boolean, default: true },
    isShared: { type: Boolean, default: false },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "EmergencyContact" }],
  },
  { timestamps: true }
);

rideGuardianSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("RideGuardian", rideGuardianSchema);
