const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },
phone: {
  type: String,
  unique: true,
  sparse: true,
  trim: true,
},
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    profileImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    // Profile / safety-card fields shown on the Profile screen
    bloodGroup: { type: String, default: "" },
    allergies: { type: String, default: "" },
    language: { type: String, default: "English" },

    // Preferences shown on Profile / Settings screens
    preferences: {
      notifications: { type: Boolean, default: true },
      privacyStrict: { type: Boolean, default: true },
      guardianModeAuto: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: false },
      biometricLock: { type: Boolean, default: true },
      voiceCodeEnabled: { type: Boolean, default: true },
      offlineMode: { type: Boolean, default: false },
      cloudBackup: { type: Boolean, default: true },
      batteryOptimization: { type: Boolean, default: false },
    },

    // Voice Guardian settings
    voiceGuardian: {
      secretCodeWord: { type: String, default: "Sunshine" },
      isListening: { type: Boolean, default: false },
      triggerWords: {
        type: [String],
        default: ["Help", "Stop", "Don't Touch Me", "Bachao", "Leave Me", "Screaming"],
      },
    },

    // Home location for safe routes
    homeLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      address: { type: String, default: "" },
      savedAt: { type: Date, default: null },
    },

    guardianModeActive: { type: Boolean, default: true },

    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    lastLoginAt: { type: Date },

    passwordChangedAt: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

// Hash password before saving whenever it changes
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);

  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }

  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtTimestamp) {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return jwtTimestamp < changedTimestamp;
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

  return resetToken;
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
