const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const Guardian = require("../models/Guardian");

/**
 * Protects Guardian-only routes. Expects a Bearer token issued by
 * POST /api/v1/guardian/login (role: "guardian"). Attaches the Guardian
 * document to req.guardian.
 */
const guardianProtect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "You are not logged in as a guardian. Please log in.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired guardian session. Please log in again.");
  }

  if (decoded.role !== "guardian") {
    throw new ApiError(403, "This endpoint is only accessible to guardians.");
  }

  const guardian = await Guardian.findById(decoded.id);
  if (!guardian) {
    throw new ApiError(401, "Guardian account no longer exists.");
  }

  req.guardian = guardian;
  next();
});

/**
 * Accepts a Bearer token issued to EITHER a normal user (protect) OR a
 * Guardian (guardianProtect). Used by read-only location endpoints that
 * both a user (viewing their own data) and a linked guardian may call.
 * Sets req.user for a user token, or req.guardian for a guardian token.
 */
const User = require("../models/User");
const eitherProtect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "You are not logged in. Please log in to access this resource.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token. Please log in again.");
  }

  if (decoded.role === "guardian") {
    const guardian = await Guardian.findById(decoded.id);
    if (!guardian) throw new ApiError(401, "Guardian account no longer exists.");
    req.guardian = guardian;
    return next();
  }

  const currentUser = await User.findById(decoded.id);
  if (!currentUser || !currentUser.isActive) {
    throw new ApiError(401, "The user belonging to this token no longer exists or is deactivated.");
  }
  req.user = currentUser;
  next();
});

module.exports = { guardianProtect, eitherProtect };
