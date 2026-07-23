const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimiter");
const { guardianProtect } = require("../middleware/guardianAuth");
const controller = require("../controllers/guardianController");

const router = express.Router();

router.post(
  "/login",
  authLimiter,
  [body("email").trim().isEmail().withMessage("A valid email is required.")],
  validate,
  controller.guardianLogin
);

router.get("/dashboard", guardianProtect, controller.getGuardianDashboard);

module.exports = router;
