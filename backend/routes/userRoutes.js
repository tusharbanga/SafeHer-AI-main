const express = require("express");
const { protect } = require("../middleware/auth");
const { uploadImage } = require("../middleware/upload");
const controller = require("../controllers/userController");

const router = express.Router();

router.use(protect);

router.patch("/profile", controller.updateProfile);
router.patch("/preferences", controller.updatePreferences);
router.patch("/home-location", controller.updateHomeLocation);
router.patch("/voice-guardian", controller.updateVoiceGuardianSettings);
router.post("/profile-image", uploadImage.single("image"), controller.uploadProfileImage);
router.delete("/profile-image", controller.deleteProfileImage);
router.get("/dashboard-summary", controller.getDashboardSummary);

module.exports = router;
