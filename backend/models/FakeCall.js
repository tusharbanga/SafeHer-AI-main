const mongoose = require("mongoose");

/**
 * Stores a user's saved Fake Call presets (caller name, number, trigger delay)
 * shown on the "Choose caller" grid of the Fake Call screen.
 */
const fakeCallSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    callerName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, default: "" },
    delaySeconds: { type: Number, default: 5, min: 0, max: 300 },
    callerAvatar: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FakeCall", fakeCallSchema);
