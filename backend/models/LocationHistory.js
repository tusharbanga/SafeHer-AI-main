const mongoose = require("mongoose");

/**
 * Short-lived breadcrumb trail used to draw the last few minutes of
 * movement on the guardian's live map. MongoDB's TTL monitor automatically
 * deletes each document 300 seconds (5 minutes) after its `timestamp`,
 * so this collection never grows unbounded.
 */
const locationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

// TTL index — MongoDB deletes documents automatically 300s after `timestamp`.
locationHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 300 });
locationHistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model("LocationHistory", locationHistorySchema);
