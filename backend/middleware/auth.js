const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");
const { getFirebaseApp, admin } = require("../config/firebase");

/**
 * Protects a route by requiring a valid JWT access token in the
 * Authorization header (Bearer scheme). Attaches the authenticated
 * user document to req.user.
 */
const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "You are not logged in. Please log in to access this resource.");
  }

  let decoded;
  let firebaseDecoded = null;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const firebaseApp = getFirebaseApp();
    if (firebaseApp) {
      try {
        firebaseDecoded = await admin.auth().verifyIdToken(token);
      } catch {
        // ignore if token is not a Firebase ID token
      }
    }

    if (!firebaseDecoded) {
      throw new ApiError(401, "Invalid or expired token. Please log in again.");
    }
  }

  const currentUser = decoded
    ? await User.findById(decoded.id)
    : await User.findOne({ firebaseUid: firebaseDecoded.uid });
  if (!currentUser || !currentUser.isActive) {
    throw new ApiError(401, "The user belonging to this token no longer exists or is deactivated.");
  }

  if (decoded && currentUser.changedPasswordAfter(decoded.iat)) {
    throw new ApiError(401, "Password was recently changed. Please log in again.");
  }

  req.user = currentUser;
  next();
});

/**
 * Restricts a route to specific roles. Must be used after `protect`.
 * Usage: restrictTo("admin", "moderator")
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, "You do not have permission to perform this action.");
  }
  next();
};

/**
 * Optionally verifies a JWT token. If a valid token is present, attaches the user
 * to `req.user`. If no token is present, simply calls `next()`.
 */
const optionalProtect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next();
  }

  let decoded;
  let firebaseDecoded = null;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const firebaseApp = getFirebaseApp();
    if (firebaseApp) {
      try {
        firebaseDecoded = await admin.auth().verifyIdToken(token);
      } catch {
        // ignore invalid Firebase token
      }
    }

    if (!firebaseDecoded) {
      return next();
    }
  }

  const currentUser = decoded
    ? await User.findById(decoded.id)
    : await User.findOne({ firebaseUid: firebaseDecoded.uid });
  if (!currentUser || !currentUser.isActive) {
    return next();
  }

  if (decoded && currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
    return next();
  }

  req.user = currentUser;
  next();
});

module.exports = { protect, optionalProtect, restrictTo };
