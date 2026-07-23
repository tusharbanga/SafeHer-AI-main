const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { searchNearby } = require("../services/overpassService");

// @route  GET /api/v1/nearby?lat=&lng=&category=police|hospital|pharmacy|metro&radius=
const getNearbyPlaces = catchAsync(async (req, res) => {
  const { lat, lng, category, radius } = req.query;

  if (lat === undefined || lng === undefined) {
    throw new ApiError(400, "lat and lng are required.");
  }

  const places = await searchNearby(Number(lat), Number(lng), category || "police", Number(radius) || 3000);

  new ApiResponse(200, "Nearby places fetched.", { places }).send(res);
});

// @route  GET /api/v1/nearby/all?lat=&lng=&radius=
// Returns police, hospitals, pharmacies and metro stations in one call —
// backs the Crime Heatmap screen's "Nearby safe spots" list.
const getAllNearbyPlaces = catchAsync(async (req, res) => {
  const { lat, lng, radius } = req.query;
  if (lat === undefined || lng === undefined) {
    throw new ApiError(400, "lat and lng are required.");
  }

  const categories = ["police", "hospital", "pharmacy", "metro"];
  const results = await Promise.all(
    categories.map((c) => searchNearby(Number(lat), Number(lng), c, Number(radius) || 3000))
  );

  const combined = categories.reduce((acc, cat, i) => {
    acc[cat] = results[i];
    return acc;
  }, {});

  new ApiResponse(200, "Nearby places fetched.", { places: combined }).send(res);
});

module.exports = { getNearbyPlaces, getAllNearbyPlaces };
