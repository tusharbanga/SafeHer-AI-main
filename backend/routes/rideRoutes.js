const express = require("express");
const { protect } = require("../middleware/auth");
const controller = require("../controllers/rideController");

const router = express.Router();

router.use(protect);

router.post("/start", controller.startRide);
router.get("/active", controller.getActiveRide);
router.patch("/:id/location", controller.updateRideLocation);
router.patch("/:id/share", controller.toggleShareRide);
router.patch("/:id/complete", controller.completeRide);

module.exports = router;
