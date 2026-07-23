const CrimeReport = require("../models/CrimeReport");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { haversineDistanceKm } = require("../utils/geo");

// @route  GET /api/v1/heatmap/zones?lat=&lng=&radiusKm=
// Buckets nearby crime reports into a lightweight zone list the frontend
// heatmap can render as colored blobs (safe / caution / avoid).
const getUnsafeZones = catchAsync(async (req, res) => {
  const { lat, lng, radiusKm } = req.query;
  if (lat === undefined || lng === undefined) throw new ApiError(400, "lat and lng are required.");

  const radius = Number(radiusKm) || 5;
  const reports = await CrimeReport.find({ status: { $ne: "rejected" } });

  const nearbyReports = reports.filter(
    (r) => haversineDistanceKm(Number(lat), Number(lng), r.location.latitude, r.location.longitude) <= radius
  );

  const zones = nearbyReports.map((r) => ({
    id: r._id,
    latitude: r.location.latitude,
    longitude: r.location.longitude,
    severity: r.severity,
    category: r.category,
    level: r.severity === "high" ? "avoid" : r.severity === "medium" ? "caution" : "safe",
  }));

  new ApiResponse(200, "Unsafe zones fetched.", { zones }).send(res);
});

// @route  POST /api/v1/heatmap/reports
const submitCrimeReport = catchAsync(async (req, res) => {
  const { latitude, longitude, address, category, severity, description, isAnonymous } = req.body;

  const report = await CrimeReport.create({
    reportedBy: isAnonymous ? undefined : req.user._id,
    isAnonymous: isAnonymous !== false,
    location: { latitude, longitude },
    address,
    category,
    severity,
    description,
  });

  new ApiResponse(201, "Report submitted.", { report }).send(res);
});

// @route  GET /api/v1/heatmap/reports
const getCrimeReports = catchAsync(async (req, res) => {
  const reports = await CrimeReport.find({ status: { $ne: "rejected" } }).sort({ createdAt: -1 }).limit(200);
  new ApiResponse(200, "Crime reports fetched.", { reports }).send(res);
});

module.exports = { getUnsafeZones, submitCrimeReport, getCrimeReports };
