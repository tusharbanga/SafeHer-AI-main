const express = require("express");
const { protect } = require("../middleware/auth");
const { uploadAudio } = require("../middleware/upload");
const controller = require("../controllers/voiceController");

const router = express.Router();

router.use(protect);

router.get("/recordings", controller.getVoiceRecordings);
router.post("/recordings", uploadAudio.single("audio"), controller.uploadVoiceRecording);
router.delete("/recordings/:id", controller.deleteVoiceRecording);

module.exports = router;
