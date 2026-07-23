const Evidence = require("../models/Evidence");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../services/cloudinaryService");

const RESOURCE_TYPE_MAP = { photo: "image", audio: "video", video: "video" };

// @route  POST /api/v1/evidence
const uploadEvidence = catchAsync(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file provided.");

  const { type, durationSeconds, relatedSOSAlert } = req.body;
  if (!["audio", "video", "photo"].includes(type)) {
    throw new ApiError(400, "type must be one of: audio, video, photo.");
  }

  const resourceType = RESOURCE_TYPE_MAP[type];
  const { url, publicId, duration } = await uploadBufferToCloudinary(req.file.buffer, "evidence-vault", resourceType);

  const evidence = await Evidence.create({
    user: req.user._id,
    type,
    url,
    cloudinaryId: publicId,
    durationSeconds: durationSeconds || duration || 0,
    relatedSOSAlert: relatedSOSAlert || undefined,
  });

  new ApiResponse(201, "Evidence securely uploaded.", { evidence }).send(res);
});

// @route  GET /api/v1/evidence
const getEvidenceList = catchAsync(async (req, res) => {
  const evidenceList = await Evidence.find({ user: req.user._id }).sort({ createdAt: -1 });
  new ApiResponse(200, "Evidence vault fetched.", { evidenceList }).send(res);
});

// @route  DELETE /api/v1/evidence/:id
const deleteEvidence = catchAsync(async (req, res) => {
  const evidence = await Evidence.findOne({ _id: req.params.id, user: req.user._id });
  if (!evidence) throw new ApiError(404, "Evidence not found.");

  await deleteFromCloudinary(evidence.cloudinaryId, RESOURCE_TYPE_MAP[evidence.type]);
  await evidence.deleteOne();

  new ApiResponse(200, "Evidence deleted.").send(res);
});

// @route  GET /api/v1/evidence/report
// Generates the data behind "Download Emergency Report" — the frontend
// renders/exports this JSON as a PDF/document on the client side.
const getEmergencyReport = catchAsync(async (req, res) => {
  const evidenceList = await Evidence.find({ user: req.user._id }).sort({ createdAt: -1 });

  new ApiResponse(200, "Emergency report data fetched.", {
    user: req.user.toSafeObject(),
    generatedAt: new Date(),
    evidenceCount: evidenceList.length,
    evidenceList,
  }).send(res);
});

module.exports = { uploadEvidence, getEvidenceList, deleteEvidence, getEmergencyReport };
