const ApiError = require("../utils/ApiError");
const CrimeReport = require("../models/CrimeReport");
const { haversineDistanceKm } = require("../utils/geo");

/**
 * Fetches up to 3 alternative driving/walking routes between two points from
 * the free, keyless OSRM routing service, then ranks them with an AI-style
 * safety score derived from nearby crime-report density, so the frontend's
 * "AI Recommended / Fastest / Scenic" Safe Route screen has real data behind it.
 */
const getSafeRoutes = async ({ fromLat, fromLng, toLat, toLng, profile = "foot" }) => {
  const base = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";
  const url = `${base}/route/v1/${profile}/${fromLng},${fromLat};${toLng},${toLat}?alternatives=true&overview=full&geometries=geojson`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(502, "Failed to fetch routes from the routing service.");
  }

  const data = await response.json();
  if (!data.routes || data.routes.length === 0) {
    throw new ApiError(404, "No route found between the given locations.");
  }

  const recentReports = await CrimeReport.find({
    createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  }).select("location severity");

  const scoredRoutes = data.routes.map((route, index) => {
    const coords = route.geometry.coordinates; // [lng, lat] pairs
    const sampleCount = Math.min(coords.length, 12);
    const step = Math.max(1, Math.floor(coords.length / sampleCount));
    const sampledPoints = coords.filter((_, i) => i % step === 0);

    let riskPoints = 0;
    for (const [lng, lat] of sampledPoints) {
      for (const report of recentReports) {
        const dist = haversineDistanceKm(lat, lng, report.location.latitude, report.location.longitude);
        if (dist <= 0.3) {
          riskPoints += report.severity === "high" ? 3 : report.severity === "medium" ? 2 : 1;
        }
      }
    }

    const rawScore = 100 - Math.min(riskPoints * 4, 70);
    const safetyScore = Math.max(30, Math.round(rawScore));

    return {
      routeIndex: index,
      distanceMeters: Math.round(route.distance),
      durationMinutes: Math.round(route.duration / 60),
      safetyScore,
      geometry: route.geometry,
    };
  });

  scoredRoutes.sort((a, b) => b.safetyScore - a.safetyScore);

  return scoredRoutes.map((r, i) => ({
    ...r,
    label: i === 0 ? "AI Recommended" : r.durationMinutes === Math.min(...scoredRoutes.map((s) => s.durationMinutes)) ? "Fastest" : "Alternative",
  }));
};

module.exports = { getSafeRoutes };
