const CurrentLocation = require("../models/CurrentLocation");
const LocationHistory = require("../models/LocationHistory");
const EmergencyContact = require("../models/EmergencyContact");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

/**
 * A guardian may only read a user's location if their (verified guardian)
 * email is present in that user's emergency contacts.
 */
const assertGuardianCanView = async (guardian, userId) => {
  if (!guardian) return; // called from a user-authenticated route — always allowed for self
  const linked = await EmergencyContact.findOne({ user: userId, email: guardian.email });
  if (!linked) {
    throw new ApiError(403, "You are not an authorized guardian for this user's location.");
  }
};

// @route  POST /api/v1/location/start
// Marks live sharing as active and seeds the first location point.
const startSharing = catchAsync(async (req, res) => {
  const { latitude, longitude, accuracy } = req.body;

  const update = {
    isSharing: true,
    updatedAt: new Date(),
  };
  if (latitude !== undefined && longitude !== undefined) {
    update.latitude = latitude;
    update.longitude = longitude;
    update.accuracy = accuracy || 0;
  }

  const location = await CurrentLocation.findOneAndUpdate(
    { userId: req.user._id },
    { $set: update, $setOnInsert: { userId: req.user._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  new ApiResponse(200, "Live location sharing started.", { location }).send(res);
});

// @route  POST /api/v1/location/update
// REST fallback for clients not using Socket.io.
const updateLocation = catchAsync(async (req, res) => {
  const { latitude, longitude, accuracy } = req.body;

  if (latitude === undefined || longitude === undefined) {
    throw new ApiError(400, "latitude and longitude are required.");
  }

  const location = await CurrentLocation.findOneAndUpdate(
    { userId: req.user._id },
    {
      $set: { latitude, longitude, accuracy: accuracy || 0, isSharing: true, updatedAt: new Date() },
      $setOnInsert: { userId: req.user._id },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await LocationHistory.create({ userId: req.user._id, latitude, longitude, accuracy: accuracy || 0 });

  const io = req.app.get("io");
  if (io) {
    io.to(`guardian:${req.user._id}`).emit("location:update", {
      userId: req.user._id,
      latitude,
      longitude,
      accuracy: accuracy || 0,
      updatedAt: location.updatedAt,
    });
  }

  new ApiResponse(200, "Location updated.", { location }).send(res);
});

// @route  POST /api/v1/location/stop
const stopSharing = catchAsync(async (req, res) => {
  await CurrentLocation.deleteOne({ userId: req.user._id });

  const io = req.app.get("io");
  if (io) {
    io.to(`guardian:${req.user._id}`).emit("location:stopped", { userId: req.user._id });
  }

  new ApiResponse(200, "Live location sharing stopped.").send(res);
});

// @route  GET /api/v1/location/current/:userId
// Accessible by the user themself (via `protect`) or by a linked guardian
// (via `guardianProtect`) — see routes/locationRoutes.js for the auth wiring.
const getCurrentLocation = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (req.guardian) {
    await assertGuardianCanView(req.guardian, userId);
  } else if (String(req.user._id) !== String(userId)) {
    throw new ApiError(403, "You can only view your own location through this endpoint.");
  }

  const location = await CurrentLocation.findOne({ userId });

  new ApiResponse(200, "Current location fetched.", { location: location || null }).send(res);
});

// @route  GET /api/v1/location/history/:userId
// Returns the last 5 minutes of breadcrumb points (older points are removed
// automatically by MongoDB's TTL index on LocationHistory.timestamp).
const getLocationHistory = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (req.guardian) {
    await assertGuardianCanView(req.guardian, userId);
  } else if (String(req.user._id) !== String(userId)) {
    throw new ApiError(403, "You can only view your own location history through this endpoint.");
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const history = await LocationHistory.find({
    userId,
    timestamp: { $gte: fiveMinutesAgo },
  }).sort({ timestamp: 1 });

  new ApiResponse(200, "Location history fetched.", { history }).send(res);
});

module.exports = {
  startSharing,
  updateLocation,
  stopSharing,
  getCurrentLocation,
  getLocationHistory,
};
