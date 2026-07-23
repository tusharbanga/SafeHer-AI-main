const express = require("express");
const { protect } = require("../middleware/auth");
const controller = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);

router.get("/", controller.getNotifications);
router.patch("/read-all", controller.markAllAsRead);
router.patch("/:id/read", controller.markAsRead);
router.post("/device-token", controller.registerDeviceToken);
router.delete("/device-token", controller.removeDeviceToken);

module.exports = router;
