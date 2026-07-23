const mongoose = require("mongoose");

/**
 * Evidence Vault entries — encrypted audio / video / photo proof
 * captured during an emergency, shown on the Evidence Vault screen.
 */
const evidenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["audio", "video", "photo"],
      required: true,
    },
    url: { type: String, required: true },
    cloudinaryId: { type: String, required: true },
    durationSeconds: { type: Number, default: 0 },
    encryption: {
      algorithm: { type: String, default: "AES-256" },
      encrypted: { type: Boolean, default: true },
    },
    relatedSOSAlert: { type: mongoose.Schema.Types.ObjectId, ref: "SOSAlert" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Evidence", evidenceSchema);
