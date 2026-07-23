const express = require("express");
const { protect } = require("../middleware/auth");
const { uploadEvidence } = require("../middleware/upload");
const controller = require("../controllers/evidenceController");

const router = express.Router();

router.use(protect);

router.get("/", controller.getEvidenceList);
router.post("/", uploadEvidence.single("file"), controller.uploadEvidence);
router.get("/report", controller.getEmergencyReport);
router.delete("/:id", controller.deleteEvidence);

module.exports = router;
