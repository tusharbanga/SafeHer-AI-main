const TrackingSession = require("../models/TrackingSession");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @route  POST /api/v1/tracking/start
const startTracking = catchAsync(async (req, res) => {
  const { startLocation, destination, watchers, checkInDeadline } = req.body;

  const existingActive = await TrackingSession.findOne({ user: req.user._id, isActive: true });
  if (existingActive) {
    throw new ApiError(409, "A tracking session is already active.", { sessionId: existingActive._id });
  }

  const session = await TrackingSession.create({
    user: req.user._id,
    startLocation,
    destination,
    watchers: watchers || [],
    checkInDeadline,
    currentLocation: startLocation
      ? { latitude: startLocation.latitude, longitude: startLocation.longitude, speedKmh: 0 }
      : undefined,
    timeline: [
      {
        label: "Journey started",
        description: startLocation?.label ? `Started from ${startLocation.label}` : "Journey started",
      },
    ],
  });

  new ApiResponse(201, "Live tracking started.", { session }).send(res);
});

// @route  PATCH /api/v1/tracking/:id/location
// REST fallback for clients not using Socket.io
const updateLocation = catchAsync(async (req, res) => {
  const { latitude, longitude, speedKmh, battery, internet } = req.body;

  const session = await TrackingSession.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, isActive: true },
    {
      $set: {
        currentLocation: { latitude, longitude, speedKmh: speedKmh || 0, updatedAt: new Date() },
        ...(battery !== undefined ? { "deviceStatus.battery": battery } : {}),
        ...(internet !== undefined ? { "deviceStatus.internet": internet } : {}),
      },
      $push: { path: { latitude, longitude, speedKmh, timestamp: new Date() } },
    },
    { new: true }
  );

  if (!session) throw new ApiError(404, "Active tracking session not found.");

  new ApiResponse(200, "Location updated.", { session }).send(res);
});

// @route  POST /api/v1/tracking/:id/timeline
const addTimelineEvent = catchAsync(async (req, res) => {
  const { label, description } = req.body;

  const session = await TrackingSession.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $push: { timeline: { label, description } } },
    { new: true }
  );

  if (!session) throw new ApiError(404, "Tracking session not found.");

  new ApiResponse(200, "Timeline event added.", { session }).send(res);
});

// @route  PATCH /api/v1/tracking/:id/stop
const stopTracking = catchAsync(async (req, res) => {
  const session = await TrackingSession.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isActive: false, endedAt: new Date(), $push: { timeline: { label: "Journey completed safely" } } },
    { new: true }
  );

  if (!session) throw new ApiError(404, "Tracking session not found.");

  new ApiResponse(200, "Live tracking stopped.", { session }).send(res);
});

// @route  GET /api/v1/tracking/active
const getActiveSession = catchAsync(async (req, res) => {
  const session = await TrackingSession.findOne({ user: req.user._id, isActive: true }).populate(
    "watchers",
    "name relationship phone"
  );

  new ApiResponse(200, "Active tracking session fetched.", { session }).send(res);
});

// @route  GET /api/v1/tracking/:id
const getSession = catchAsync(async (req, res) => {
  const session = await TrackingSession.findOne({ _id: req.params.id, user: req.user._id }).populate(
    "watchers",
    "name relationship phone"
  );

  if (!session) throw new ApiError(404, "Tracking session not found.");

  new ApiResponse(200, "Tracking session fetched.", { session }).send(res);
});

module.exports = {
  startTracking,
  updateLocation,
  addTimelineEvent,
  stopTracking,
  getActiveSession,
  getSession,
};
