const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { getSafeRoutes } = require("../services/osrmService");

// @route  GET /api/v1/safe-route?fromLat=&fromLng=&toLat=&toLng=&profile=
const findSafeRoutes = catchAsync(async (req, res) => {
  const { fromLat, fromLng, toLat, toLng, profile } = req.query;

  if ([fromLat, fromLng, toLat, toLng].some((v) => v === undefined)) {
    throw new ApiError(400, "fromLat, fromLng, toLat and toLng are required.");
  }

  const routes = await getSafeRoutes({
    fromLat: Number(fromLat),
    fromLng: Number(fromLng),
    toLat: Number(toLat),
    toLng: Number(toLng),
    profile: profile === "driving" ? "driving" : "foot",
  });

  new ApiResponse(200, "Safe routes calculated.", { routes }).send(res);
});

module.exports = { findSafeRoutes };
