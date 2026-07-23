const VoiceRecording = require("../models/VoiceRecording");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../services/cloudinaryService");

// @route  POST /api/v1/voice/recordings
const uploadVoiceRecording = catchAsync(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No audio file provided.");

  const { context, durationSeconds, relatedSOSAlert } = req.body;

  const { url, publicId, duration } = await uploadBufferToCloudinary(req.file.buffer, "voice-recordings", "video");
  // Cloudinary treats audio uploads under the "video" resource type.

  const recording = await VoiceRecording.create({
    user: req.user._id,
    url,
    cloudinaryId: publicId,
    durationSeconds: durationSeconds || duration || 0,
    context: context || "manual",
    relatedSOSAlert: relatedSOSAlert || undefined,
  });

  new ApiResponse(201, "Voice recording uploaded.", { recording }).send(res);
});

// @route  GET /api/v1/voice/recordings
const getVoiceRecordings = catchAsync(async (req, res) => {
  const recordings = await VoiceRecording.find({ user: req.user._id }).sort({ createdAt: -1 });
  new ApiResponse(200, "Voice recordings fetched.", { recordings }).send(res);
});

// @route  DELETE /api/v1/voice/recordings/:id
const deleteVoiceRecording = catchAsync(async (req, res) => {
  const recording = await VoiceRecording.findOne({ _id: req.params.id, user: req.user._id });
  if (!recording) throw new ApiError(404, "Voice recording not found.");

  await deleteFromCloudinary(recording.cloudinaryId, "video");
  await recording.deleteOne();

  new ApiResponse(200, "Voice recording deleted.").send(res);
});

module.exports = { uploadVoiceRecording, getVoiceRecordings, deleteVoiceRecording };
