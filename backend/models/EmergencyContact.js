const mongoose = require("mongoose");

const emergencyContactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Contact name is required"],
      trim: true,
    },
    relationship: {
      type: String,
      required: [true, "Relationship is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Contact phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    priority: {
      type: Number,
      default: 0, // lower number = higher priority (notified first)
    },
    sosMessage: {
      type: String,
      default:
        "I need help. This is an emergency alert sent by SafeHer AI. My live location is attached.",
    },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

emergencyContactSchema.index({ user: 1, priority: 1 });

module.exports = mongoose.model("EmergencyContact", emergencyContactSchema);
