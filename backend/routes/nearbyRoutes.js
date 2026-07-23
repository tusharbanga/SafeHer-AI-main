const express = require("express");
const { protect } = require("../middleware/auth");
const controller = require("../controllers/nearbyController");

const router = express.Router();

router.get("/", protect, controller.getNearbyPlaces);
router.get("/all", protect, controller.getAllNearbyPlaces);

module.exports = router;
