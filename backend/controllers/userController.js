const User = require("../models/User");
const EmergencyContact = require("../models/EmergencyContact");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../services/cloudinaryService");

// @route  PATCH /api/v1/users/profile
const updateProfile = catchAsync(async (req, res) => {
  const allowedFields = ["name", "bloodGroup", "allergies", "language"];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  new ApiResponse(200, "Profile updated successfully.", { user: user.toSafeObject() }).send(res);
});

// @route  PATCH /api/v1/users/home-location
const updateHomeLocation = catchAsync(async (req, res) => {
  const { latitude, longitude, address } = req.body;

  if (latitude === undefined || longitude === undefined) {
    throw new ApiError(400, "Latitude and longitude are required");
  }

  const homeLocation = {
    latitude,
    longitude,
    address: address || "",
    savedAt: new Date(),
  };

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { homeLocation },
    { new: true, runValidators: true }
  );

  new ApiResponse(200, "Home location saved successfully.", { homeLocation: user.homeLocation }).send(res);
});

// @route  PATCH /api/v1/users/preferences
const updatePreferences = catchAsync(async (req, res) => {
  const allowed = [
    "notifications",
    "privacyStrict",
    "guardianModeAuto",
    "darkMode",
    "biometricLock",
    "voiceCodeEnabled",
    "offlineMode",
    "cloudBackup",
    "batteryOptimization",
  ];

  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[`preferences.${key}`] = req.body[key];
  });

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });

  new ApiResponse(200, "Preferences updated.", { preferences: user.preferences }).send(res);
});

// @route  PATCH /api/v1/users/voice-guardian
const updateVoiceGuardianSettings = catchAsync(async (req, res) => {
  const { secretCodeWord, isListening, triggerWords } = req.body;
  const updates = {};
  if (secretCodeWord !== undefined) updates["voiceGuardian.secretCodeWord"] = secretCodeWord;
  if (isListening !== undefined) updates["voiceGuardian.isListening"] = isListening;
  if (triggerWords !== undefined) updates["voiceGuardian.triggerWords"] = triggerWords;

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });

  new ApiResponse(200, "Voice Guardian settings updated.", { voiceGuardian: user.voiceGuardian }).send(res);
});

// @route  POST /api/v1/users/profile-image
const uploadProfileImage = catchAsync(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No image file provided.");

  const user = await User.findById(req.user._id);

  if (user.profileImage?.publicId) {
    await deleteFromCloudinary(user.profileImage.publicId, "image");
  }

  const { url, publicId } = await uploadBufferToCloudinary(req.file.buffer, "profile-images", "image");

  user.profileImage = { url, publicId };
  await user.save({ validateBeforeSave: false });

  new ApiResponse(200, "Profile image updated.", { profileImage: user.profileImage }).send(res);
});

// @route  DELETE /api/v1/users/profile-image
const deleteProfileImage = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.profileImage?.publicId) {
    await deleteFromCloudinary(user.profileImage.publicId, "image");
  }

  user.profileImage = { url: "", publicId: "" };
  await user.save({ validateBeforeSave: false });

  new ApiResponse(200, "Profile image removed.").send(res);
});

// @route  GET /api/v1/users/dashboard-summary
// Powers the App Home screen: safety score, guardian status, trusted contacts count, etc.
const getDashboardSummary = catchAsync(async (req, res) => {
  const contactsCount = await EmergencyContact.countDocuments({ user: req.user._id });

  new ApiResponse(200, "Dashboard summary fetched.", {
    guardianModeActive: req.user.guardianModeActive,
    trustedContactsCount: contactsCount,
    profile: req.user.toSafeObject(),
  }).send(res);
});

module.exports = {
  updateProfile,
  updatePreferences,
  updateVoiceGuardianSettings,
  updateHomeLocation,
  uploadProfileImage,
  deleteProfileImage,
  getDashboardSummary,
};
