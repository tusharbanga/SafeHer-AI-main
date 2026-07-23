const FakeCall = require("../models/FakeCall");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @route  GET /api/v1/fake-calls
const getFakeCallPresets = catchAsync(async (req, res) => {
  const presets = await FakeCall.find({ user: req.user._id }).sort({ createdAt: 1 });
  new ApiResponse(200, "Fake call presets fetched.", { presets }).send(res);
});

// @route  POST /api/v1/fake-calls
const createFakeCallPreset = catchAsync(async (req, res) => {
  const { callerName, phoneNumber, delaySeconds, callerAvatar, isDefault } = req.body;

  const preset = await FakeCall.create({
    user: req.user._id,
    callerName,
    phoneNumber,
    delaySeconds,
    callerAvatar,
    isDefault,
  });

  new ApiResponse(201, "Fake call preset created.", { preset }).send(res);
});

// @route  PATCH /api/v1/fake-calls/:id
const updateFakeCallPreset = catchAsync(async (req, res) => {
  const allowed = ["callerName", "phoneNumber", "delaySeconds", "callerAvatar", "isDefault"];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const preset = await FakeCall.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, updates, {
    new: true,
    runValidators: true,
  });

  if (!preset) throw new ApiError(404, "Fake call preset not found.");

  new ApiResponse(200, "Fake call preset updated.", { preset }).send(res);
});

// @route  DELETE /api/v1/fake-calls/:id
const deleteFakeCallPreset = catchAsync(async (req, res) => {
  const preset = await FakeCall.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!preset) throw new ApiError(404, "Fake call preset not found.");
  new ApiResponse(200, "Fake call preset removed.").send(res);
});

// @route  POST /api/v1/fake-calls/:id/trigger
// Logs that a fake call was triggered (the actual ringing UI is client-side).
const triggerFakeCall = catchAsync(async (req, res) => {
  const preset = await FakeCall.findOne({ _id: req.params.id, user: req.user._id });
  if (!preset) throw new ApiError(404, "Fake call preset not found.");

  new ApiResponse(200, "Fake call triggered.", {
    callerName: preset.callerName,
    phoneNumber: preset.phoneNumber,
    delaySeconds: preset.delaySeconds,
    triggeredAt: new Date(),
  }).send(res);
});

module.exports = {
  getFakeCallPresets,
  createFakeCallPreset,
  updateFakeCallPreset,
  deleteFakeCallPreset,
  triggerFakeCall,
};
