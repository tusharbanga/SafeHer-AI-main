const mongoose = require("mongoose");

/**
 * A Guardian is created the first time someone logs in using an email
 * address that already exists as an EmergencyContact.email for some user.
 * One Guardian document exists per (email, linkedUserId) pair — this lets
 * the same person be a guardian for more than one SafeHer AI user
 * (e.g. a parent who is the emergency contact for two daughters).
 */
const guardianSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Guardian email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    linkedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["guardian"],
      default: "guardian",
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

guardianSchema.index({ email: 1, linkedUserId: 1 }, { unique: true });

module.exports = mongoose.model("Guardian", guardianSchema);
