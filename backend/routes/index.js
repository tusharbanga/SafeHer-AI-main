const express = require("express");

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const contactRoutes = require("./contactRoutes");
const sosRoutes = require("./sosRoutes");
const trackingRoutes = require("./trackingRoutes");
const voiceRoutes = require("./voiceRoutes");
const evidenceRoutes = require("./evidenceRoutes");
const fakeCallRoutes = require("./fakeCallRoutes");
const communityRoutes = require("./communityRoutes");
const chatbotRoutes = require("./chatbotRoutes");
const safeRouteRoutes = require("./safeRouteRoutes");
const nearbyRoutes = require("./nearbyRoutes");
const heatmapRoutes = require("./heatmapRoutes");
const notificationRoutes = require("./notificationRoutes");
const rideRoutes = require("./rideRoutes");
const guardianRoutes = require("./guardianRoutes");
const locationRoutes = require("./locationRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/contacts", contactRoutes);
router.use("/sos", sosRoutes);
router.use("/tracking", trackingRoutes);
router.use("/voice", voiceRoutes);
router.use("/evidence", evidenceRoutes);
router.use("/fake-calls", fakeCallRoutes);
router.use("/community", communityRoutes);
router.use("/assistant", chatbotRoutes);
router.use("/safe-route", safeRouteRoutes);
router.use("/nearby", nearbyRoutes);
router.use("/heatmap", heatmapRoutes);
router.use("/notifications", notificationRoutes);
router.use("/ride", rideRoutes);
router.use("/guardian", guardianRoutes);
router.use("/location", locationRoutes);

module.exports = router;
