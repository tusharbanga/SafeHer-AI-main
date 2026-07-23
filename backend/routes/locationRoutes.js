const express = require("express");
const { protect } = require("../middleware/auth");
const { eitherProtect } = require("../middleware/guardianAuth");
const controller = require("../controllers/locationController");

const router = express.Router();

// Only the user themself can start/update/stop sharing their own location.
router.post("/start", protect, controller.startSharing);
router.post("/update", protect, controller.updateLocation);
router.post("/stop", protect, controller.stopSharing);

// Read endpoints: the user (own data) OR a linked guardian may call these.
router.get("/current/:userId", eitherProtect, controller.getCurrentLocation);
router.get("/history/:userId", eitherProtect, controller.getLocationHistory);

module.exports = router;
