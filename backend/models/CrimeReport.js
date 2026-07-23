const mongoose = require("mongoose");

/**
 * Backs the Crime Heatmap screen — user-submitted or ingested reports
 * used to compute unsafe-zone density and safe-route scoring.
 */
const crimeReportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isAnonymous: { type: Boolean, default: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    address: { type: String, default: "" },
    category: {
      type: String,
      enum: [
        "harassment",
        "stalking",
        "theft",
        "assault",
        "poor_lighting",
        "unsafe_area",
        "other",
      ],
      default: "other",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    description: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

crimeReportSchema.index({ "location.latitude": 1, "location.longitude": 1 });
crimeReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model("CrimeReport", crimeReportSchema);
