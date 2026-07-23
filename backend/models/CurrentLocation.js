const mongoose = require("mongoose");

/**
 * Stores ONLY the latest known location for a user who has live sharing
 * active. This document is updated in place on every ping — it is never
 * recreated — so the collection stays exactly one document per user
 * regardless of how many location updates are sent.
 */
const currentLocationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number, default: 0 },
    isSharing: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("CurrentLocation", currentLocationSchema);
