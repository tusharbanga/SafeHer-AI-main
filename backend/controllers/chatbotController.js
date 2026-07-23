const ChatConversation = require("../models/ChatConversation");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { getChatbotReply } = require("../services/groqService");
const { createConversationId, getConversation, saveConversation } = require("../services/aiConversationStore");

const MAX_HISTORY_MESSAGES = 20;

const sendMessage = catchAsync(async (req, res) => {
  const { message, location = {}, language = "" } = req.body;
  let { conversationId } = req.body || {};
  if (!message || !message.trim()) throw new ApiError(400, "Message is required.");

  let conversation = null;
  let history = [];

  if (conversationId) {
    history = getConversation(conversationId) || [];
  } else if (req.user?._id) {
    conversation = await ChatConversation.findOne({ user: req.user._id, isActive: true }).sort({ createdAt: -1 });
    if (conversation) {
      history = conversation.messages.slice(-MAX_HISTORY_MESSAGES);
    }
  }

  if (!conversationId && !conversation) {
    conversationId = createConversationId();
  }

  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);
  const aiResult = await getChatbotReply(recentHistory, message, location, language);

  const nextHistory = [
    ...recentHistory,
    { role: "user", content: message },
    { role: "assistant", content: aiResult.message },
  ];

  if (conversationId) {
    saveConversation(conversationId, nextHistory);
  }

  if (conversation) {
    conversation.messages.push({ role: "user", content: message });
    conversation.messages.push({ role: "assistant", content: aiResult.message });
    await conversation.save();
  } else if (req.user?._id) {
    await ChatConversation.create({ user: req.user._id, messages: [{ role: "user", content: message }, { role: "assistant", content: aiResult.message }], isActive: true });
  }

  new ApiResponse(200, "Assistant replied.", {
    conversationId,
    reply: aiResult.message,
    type: aiResult.type,
    severity: aiResult.severity,
    actions: aiResult.actions || [],
    language: aiResult.language,
    isEmergencyDetected: aiResult.type === "emergency",
  }).send(res);
});

const getActiveConversation = catchAsync(async (req, res) => {
  const conversation = await ChatConversation.findOne({ user: req.user._id, isActive: true }).sort({ createdAt: -1 });

  new ApiResponse(200, "Conversation fetched.", { conversation: conversation || { messages: [] } }).send(res);
});

const clearConversation = catchAsync(async (req, res) => {
  await ChatConversation.updateMany({ user: req.user._id, isActive: true }, { isActive: false });
  new ApiResponse(200, "Conversation cleared.").send(res);
});

module.exports = { sendMessage, getActiveConversation, clearConversation };
