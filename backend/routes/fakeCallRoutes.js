const express = require("express");
const { protect } = require("../middleware/auth");
const controller = require("../controllers/fakeCallController");

const router = express.Router();

router.use(protect);

router.get("/", controller.getFakeCallPresets);
router.post("/", controller.createFakeCallPreset);
router.patch("/:id", controller.updateFakeCallPreset);
router.delete("/:id", controller.deleteFakeCallPreset);
router.post("/:id/trigger", controller.triggerFakeCall);

module.exports = router;
