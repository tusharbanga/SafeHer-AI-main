const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const controller = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone")
  .optional({ checkFalsy: true })
  .trim()
  .isLength({ min: 7 })
  .withMessage("Valid phone number is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  ],
  validate,
  controller.register
);

router.post(
  "/login",
  authLimiter,
  [body("email").isEmail(), body("password").notEmpty()],
  validate,
  controller.login
);

router.post("/logout", protect, controller.logout);
router.post("/firebase", controller.firebaseAuth);
router.post("/refresh-token", controller.refreshAccessToken);

router.post(
  "/forgot-password",
  authLimiter,
  [body("email").isEmail()],
  validate,
  controller.forgotPassword
);

router.post(
  "/reset-password/:token",
  authLimiter,
  [body("password").isLength({ min: 8 })],
  validate,
  controller.resetPassword
);

router.patch(
  "/update-password",
  protect,
  [body("currentPassword").notEmpty(), body("newPassword").isLength({ min: 8 })],
  validate,
  controller.updatePassword
);

router.delete(
  "/delete-account",
  protect,
  [body("password").notEmpty()],
  validate,
  controller.deleteAccount
);

router.get("/me", protect, controller.getMe);

module.exports = router;
