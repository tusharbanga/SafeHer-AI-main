const jwt = require("jsonwebtoken");

/**
 * Generates a short-lived JWT access token used to authenticate API requests.
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Generates a long-lived JWT refresh token used to obtain new access tokens.
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
};

/**
 * Generates a JWT for an authenticated Guardian (an emergency contact who has
 * logged in with their email). Carries role: "guardian" so the guardianAuth
 * middleware and Socket.io auth can tell it apart from a normal user token.
 */
const generateGuardianToken = (guardianId) => {
  return jwt.sign({ id: guardianId, role: "guardian" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = { generateAccessToken, generateRefreshToken, generateGuardianToken };
