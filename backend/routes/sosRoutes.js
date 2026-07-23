const express = require("express");
const { body } = require("express-validator");
const { protect } = require("../middleware/auth");
const { sosLimiter } = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");
const controller = require("../controllers/sosController");

const router = express.Router();

router.use(protect);

router.post(
  "/trigger",
  sosLimiter,
  [body("latitude").isFloat(), body("longitude").isFloat()],
  validate,
  controller.triggerSOS
);
router.patch("/:id/resolve", controller.resolveSOS);
router.get("/history", controller.getSOSHistory);
router.get("/:id", controller.getSOSAlert);

module.exports = router;
