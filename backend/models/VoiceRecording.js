const mongoose = require("mongoose");

const voiceRecordingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    url: { type: String, required: true },
    cloudinaryId: { type: String, required: true },
    durationSeconds: { type: Number, default: 0 },
    context: {
      type: String,
      enum: ["sos", "voice_guardian", "manual"],
      default: "manual",
    },
    relatedSOSAlert: { type: mongoose.Schema.Types.ObjectId, ref: "SOSAlert" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VoiceRecording", voiceRecordingSchema);
