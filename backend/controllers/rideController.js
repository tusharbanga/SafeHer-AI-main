const RideGuardian = require("../models/RideGuardian");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { haversineDistanceKm } = require("../utils/geo");

// @route  POST /api/v1/ride/start
const startRide = catchAsync(async (req, res) => {
  const existing = await RideGuardian.findOne({ user: req.user._id, status: { $in: ["started", "in_progress"] } });
  if (existing) throw new ApiError(409, "A ride is already being monitored.", { rideId: existing._id });

  const ride = await RideGuardian.create({ user: req.user._id, ...req.body, status: "started" });

  new ApiResponse(201, "Ride Guardian activated.", { ride }).send(res);
});

// @route  PATCH /api/v1/ride/:id/location
// Recomputes ETA/deviation whenever the client reports the vehicle's current location.
const updateRideLocation = catchAsync(async (req, res) => {
  const { latitude, longitude } = req.body;

  const ride = await RideGuardian.findOne({ _id: req.params.id, user: req.user._id });
  if (!ride) throw new ApiError(404, "Ride not found.");

  const distanceToDestination = haversineDistanceKm(
    latitude,
    longitude,
    ride.destination.latitude,
    ride.destination.longitude
  );

  const avgSpeedKmh = 30;
  ride.etaMinutes = Math.max(1, Math.round((distanceToDestination / avgSpeedKmh) * 60));
  ride.status = "in_progress";
  await ride.save();

  new ApiResponse(200, "Ride location updated.", { ride }).send(res);
});

// @route  PATCH /api/v1/ride/:id/share
const toggleShareRide = catchAsync(async (req, res) => {
  const { isShared, sharedWith } = req.body;

  const ride = await RideGuardian.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isShared, ...(sharedWith ? { sharedWith } : {}) },
    { new: true }
  );

  if (!ride) throw new ApiError(404, "Ride not found.");

  new ApiResponse(200, "Ride sharing updated.", { ride }).send(res);
});

// @route  PATCH /api/v1/ride/:id/complete
const completeRide = catchAsync(async (req, res) => {
  const ride = await RideGuardian.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { status: "completed" },
    { new: true }
  );
  if (!ride) throw new ApiError(404, "Ride not found.");
  new ApiResponse(200, "Ride completed.", { ride }).send(res);
});

// @route  GET /api/v1/ride/active
const getActiveRide = catchAsync(async (req, res) => {
  const ride = await RideGuardian.findOne({ user: req.user._id, status: { $in: ["started", "in_progress"] } });
  new ApiResponse(200, "Active ride fetched.", { ride }).send(res);
});

module.exports = { startRide, updateRideLocation, toggleShareRide, completeRide, getActiveRide };
