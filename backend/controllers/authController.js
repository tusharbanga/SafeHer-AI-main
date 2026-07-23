const crypto = require("crypto");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const { sendEmail } = require("../services/emailService");
const { getFirebaseApp, admin } = require("../config/firebase");

const issueTokensResponse = (user, statusCode, message, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  return new ApiResponse(statusCode, message, {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  }).send(res);
};

// @route  POST /api/v1/auth/register
const register = catchAsync(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    throw new ApiError(409, "An account with this email or phone number already exists.");
  }

  const user = await User.create({ name, email, phone, password });

  issueTokensResponse(user, 201, "Account created successfully.", res);
});

// @route  POST /api/v1/auth/login
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Incorrect email or password.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated.");
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  issueTokensResponse(user, 200, "Logged in successfully.", res);
});

// @route  POST /api/v1/auth/firebase
const firebaseAuth = catchAsync(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new ApiError(400, "Firebase ID token is required.");
  }

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    throw new ApiError(500, "Firebase Admin SDK is not configured.");
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    throw new ApiError(401, "Invalid Firebase ID token.");
  }

  const { uid, email, name, picture } = decodedToken;
  if (!email) {
    throw new ApiError(400, "Firebase account must have a verified email.");
  }

  let user = await User.findOne({ firebaseUid: uid });
  if (!user) {
    user = await User.findOne({ email });
  }

  if (user && !user.isActive) {
    throw new ApiError(403, "This account has been deactivated.");
  }

  if (!user) {
    const randomPassword = crypto.randomBytes(16).toString("hex");
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      password: randomPassword,
      firebaseUid: uid,
      profileImage: { url: picture || "", publicId: "" },
      isVerified: true,
    });
  }

  if (!user.firebaseUid) {
    user.firebaseUid = uid;
    await user.save({ validateBeforeSave: false });
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  issueTokensResponse(user, 200, "Authenticated with Firebase.", res);
});

// @route  POST /api/v1/auth/logout
const logout = catchAsync(async (req, res) => {
  // Stateless JWT — logout is handled client-side by discarding tokens.
  // Endpoint kept for symmetry / future token-blacklisting support.
  new ApiResponse(200, "Logged out successfully.").send(res);
});

// @route  POST /api/v1/auth/refresh-token
const refreshAccessToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, "Refresh token is required.");

  const jwt = require("jsonwebtoken");
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token. Please log in again.");
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new ApiError(401, "User no longer exists or is deactivated.");

  const accessToken = generateAccessToken(user._id);
  new ApiResponse(200, "Token refreshed.", { accessToken }).send(res);
});

// @route  POST /api/v1/auth/forgot-password
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Do not reveal whether the email exists
    return new ApiResponse(200, "If an account exists for this email, a reset link has been sent.").send(res);
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your Future Safe Her password",
      html: `<p>Hi ${user.name},</p><p>You requested a password reset. Click the link below to set a new password. This link expires in 15 minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
      text: `Reset your password: ${resetUrl} (expires in 15 minutes)`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "Failed to send the reset email. Please try again later.");
  }

  new ApiResponse(200, "If an account exists for this email, a reset link has been sent.").send(res);
});

// @route  POST /api/v1/auth/reset-password/:token
const resetPassword = catchAsync(async (req, res) => {
  const { password } = req.body;
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    throw new ApiError(400, "Reset link is invalid or has expired.");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  issueTokensResponse(user, 200, "Password reset successfully.", res);
});

// @route  PATCH /api/v1/auth/update-password
const updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect.");
  }

  user.password = newPassword;
  await user.save();

  issueTokensResponse(user, 200, "Password updated successfully.", res);
});

// @route  DELETE /api/v1/auth/delete-account
const deleteAccount = catchAsync(async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(password))) {
    throw new ApiError(401, "Incorrect password. Account was not deleted.");
  }

  user.isActive = false;
  await user.save({ validateBeforeSave: false });

  new ApiResponse(200, "Account deleted successfully.").send(res);
});

// @route  GET /api/v1/auth/me
const getMe = catchAsync(async (req, res) => {
  new ApiResponse(200, "Current user fetched.", { user: req.user.toSafeObject() }).send(res);
});

module.exports = {
  register,
  login,
  logout,
  firebaseAuth,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  updatePassword,
  deleteAccount,
  getMe,
};
