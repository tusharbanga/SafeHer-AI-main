const express = require("express");
const { protect } = require("../middleware/auth");
const controller = require("../controllers/heatmapController");

const router = express.Router();

router.get("/zones", protect, controller.getUnsafeZones);
router.get("/reports", protect, controller.getCrimeReports);
router.post("/reports", protect, controller.submitCrimeReport);

module.exports = router;
