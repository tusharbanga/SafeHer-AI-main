const mongoose = require("mongoose");

const sosAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    googleMapsLink: { type: String, required: true },
    address: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "resolved", "cancelled", "false_alarm"],
      default: "active",
      index: true,
    },
    triggerMethod: {
      type: String,
      enum: ["button", "voice", "shake", "double_tap", "auto_checkin"],
      default: "button",
    },
    voiceRecording: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VoiceRecording",
    },
    contactsNotified: [
      {
        contact: { type: mongoose.Schema.Types.ObjectId, ref: "#Contact" },
        notifiedAt: { type: Date, default: Date.now },
        channel: { type: String, enum: ["sms", "email", "push", "call"], default: "push" },
      },
    ],
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

sosAlertSchema.index({ user: 1, createdAt: -1 });
sosAlertSchema.index({ "location.latitude": 1, "location.longitude": 1 });

module.exports = mongoose.model("SOSAlert", sosAlertSchema);
