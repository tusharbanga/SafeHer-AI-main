const express = require("express");
const { protect } = require("../middleware/auth");
const controller = require("../controllers/trackingController");

const router = express.Router();

router.use(protect);

router.post("/start", controller.startTracking);
router.get("/active", controller.getActiveSession);
router.patch("/:id/location", controller.updateLocation);
router.post("/:id/timeline", controller.addTimelineEvent);
router.patch("/:id/stop", controller.stopTracking);
router.get("/:id", controller.getSession);

module.exports = router;
