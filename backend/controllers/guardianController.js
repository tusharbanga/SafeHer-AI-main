const EmergencyContact = require("../models/EmergencyContact");
const Guardian = require("../models/Guardian");
const CurrentLocation = require("../models/CurrentLocation");
const SOSAlert = require("../models/SOSAlert");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { generateGuardianToken } = require("../utils/generateToken");

const mapLinkedUser = (contact) => ({
  userId: contact.user._id,
  name: contact.user.name,
  profileImage: contact.user.profileImage,
  relationship: contact.relationship,
  contactName: contact.name,
});

// @route  POST /api/v1/guardian/login
// Body: { email }
// If the email matches an EmergencyContact.email for one or more users,
// the person is recognized as a Guardian for those users.
const guardianLogin = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const contacts = await EmergencyContact.find({ email: normalizedEmail }).populate(
    "user",
    "name profileImage lastLoginAt"
  );

  if (contacts.length === 0) {
    throw new ApiError(
      404,
      "This email is not saved as an emergency contact for any SafeHer AI user."
    );
  }

  // Ensure a Guardian record exists for every user this email is linked to.
  const guardianDocs = await Promise.all(
    contacts.map((contact) =>
      Guardian.findOneAndUpdate(
        { email: normalizedEmail, linkedUserId: contact.user._id },
        {
          $set: { lastLoginAt: new Date() },
          $setOnInsert: { email: normalizedEmail, linkedUserId: contact.user._id, role: "guardian" },
        },
        { upsert: true, new: true }
      )
    )
  );

  // The token subject is the first Guardian record; the dashboard route
  // re-derives every linked user from the email so this works even when
  // one person guards multiple accounts.
  const token = generateGuardianToken(guardianDocs[0]._id);
  const linkedUsers = contacts.map(mapLinkedUser);

  new ApiResponse(200, "Guardian login successful.", {
    token,
    guardian: { email: normalizedEmail },
    linkedUser: linkedUsers[0],
    linkedUsers,
  }).send(res);
});

// @route  GET /api/v1/guardian/dashboard
// Query:  ?userId=<optional> — which linked user to show if the guardian
//         watches more than one account. Defaults to the first.
const getGuardianDashboard = catchAsync(async (req, res) => {
  const { userId } = req.query;

  const contactQuery = { email: req.guardian.email };
  if (userId) contactQuery.user = userId;

  const contacts = await EmergencyContact.find(contactQuery).populate(
    "user",
    "name profileImage lastLoginAt"
  );

  if (contacts.length === 0) {
    throw new ApiError(403, "You are not a registered guardian for this user.");
  }

  const targetUser = contacts[0].user;

  const [currentLocation, latestAlert, allLinkedContacts] = await Promise.all([
    CurrentLocation.findOne({ userId: targetUser._id }),
    SOSAlert.findOne({ user: targetUser._id }).sort({ createdAt: -1 }),
    EmergencyContact.find({ email: req.guardian.email }).populate("user", "name profileImage"),
  ]);

  const safetyStatus = latestAlert && latestAlert.status === "active" ? "sos" : "safe";

  new ApiResponse(200, "Guardian dashboard fetched.", {
    connectedUser: {
      id: targetUser._id,
      name: targetUser.name,
      profileImage: targetUser.profileImage,
    },
    safetyStatus,
    location: currentLocation
      ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          isSharing: currentLocation.isSharing,
          updatedAt: currentLocation.updatedAt,
        }
      : null,
    latestAlert,
    linkedUsers: allLinkedContacts.map(mapLinkedUser),
  }).send(res);
});

module.exports = { guardianLogin, getGuardianDashboard };
