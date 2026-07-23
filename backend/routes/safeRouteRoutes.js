const express = require("express");
const { protect } = require("../middleware/auth");
const controller = require("../controllers/safeRouteController");

const router = express.Router();

router.get("/", protect, controller.findSafeRoutes);

module.exports = router;
