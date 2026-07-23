const SOSAlert = require("../models/SOSAlert");
const EmergencyContact = require("../models/EmergencyContact");
const VoiceRecording = require("../models/VoiceRecording");
const Notification = require("../models/Notification");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { buildGoogleMapsLink } = require("../utils/mapLink");
const { sendPushToUser } = require("../services/fcmService");
const { broadcastSOSAlert } = require("../socket/index");

// @route  POST /api/v1/sos/trigger
const triggerSOS = catchAsync(async (req, res) => {
  const { latitude, longitude, address, triggerMethod, voiceRecordingId } = req.body;

  if (latitude === undefined || longitude === undefined) {
    throw new ApiError(400, "Latitude and longitude are required to trigger SOS.");
  }

  const googleMapsLink = buildGoogleMapsLink(latitude, longitude);

  const contacts = await EmergencyContact.find({ user: req.user._id }).sort({ priority: 1 });
  if (contacts.length === 0) {
    throw new ApiError(400, "Add at least one emergency contact before triggering SOS.");
  }

  const alert = await SOSAlert.create({
    user: req.user._id,
    location: { latitude, longitude },
    googleMapsLink,
    address: address || "",
    triggerMethod: triggerMethod || "button",
    voiceRecording: voiceRecordingId || undefined,
    contactsNotified: contacts.map((c) => ({ contact: c._id, channel: "push" })),
  });

  // Notify the user's other devices / dashboards in real time
  const io = req.app.get("io");
  if (io) {
    broadcastSOSAlert(io, req.user._id.toString(), {
      alertId: alert._id,
      location: alert.location,
      googleMapsLink,
      triggeredAt: alert.createdAt,
    });
  }

  await Notification.create({
    user: req.user._id,
    title: "Guardian activated",
    body: "Your SOS alert has been sent to your emergency contacts.",
    type: "emergency",
    meta: { alertId: alert._id },
  });

  await sendPushToUser(req.user._id, {
    title: "SOS Alert Sent",
    body: `Your location has been shared with ${contacts.length} emergency contact(s).`,
    data: { type: "sos", alertId: alert._id.toString() },
  });

  new ApiResponse(201, "SOS alert triggered and emergency contacts notified.", {
    alert,
    notifiedContacts: contacts.map((c) => ({ id: c._id, name: c.name, phone: c.phone })),
  }).send(res);
});

// @route  PATCH /api/v1/sos/:id/resolve
const resolveSOS = catchAsync(async (req, res) => {
  const { status } = req.body; // "resolved" | "cancelled" | "false_alarm"
  const allowed = ["resolved", "cancelled", "false_alarm"];
  if (!allowed.includes(status)) throw new ApiError(400, `Status must be one of: ${allowed.join(", ")}`);

  const alert = await SOSAlert.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { status, resolvedAt: new Date() },
    { new: true }
  );

  if (!alert) throw new ApiError(404, "SOS alert not found.");

  new ApiResponse(200, "SOS alert updated.", { alert }).send(res);
});

// @route  GET /api/v1/sos/history
const getSOSHistory = catchAsync(async (req, res) => {
  const alerts = await SOSAlert.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("voiceRecording")
    .populate("contactsNotified.contact", "name phone relationship");

  new ApiResponse(200, "SOS history fetched.", { alerts }).send(res);
});

// @route  GET /api/v1/sos/:id
const getSOSAlert = catchAsync(async (req, res) => {
  const alert = await SOSAlert.findOne({ _id: req.params.id, user: req.user._id })
    .populate("voiceRecording")
    .populate("contactsNotified.contact", "name phone relationship");

  if (!alert) throw new ApiError(404, "SOS alert not found.");

  new ApiResponse(200, "SOS alert fetched.", { alert }).send(res);
});

module.exports = { triggerSOS, resolveSOS, getSOSHistory, getSOSAlert };
