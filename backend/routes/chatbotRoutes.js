const express = require("express");
const { protect, optionalProtect } = require("../middleware/auth");
const { chatbotLimiter } = require("../middleware/rateLimiter");
const controller = require("../controllers/chatbotController");

const router = express.Router();

router.post("/message", chatbotLimiter, optionalProtect, controller.sendMessage);
router.post("/chat", chatbotLimiter, optionalProtect, controller.sendMessage);
router.get("/conversation", protect, controller.getActiveConversation);
router.delete("/conversation", protect, controller.clearConversation);

module.exports = router;
