const mongoose = require("mongoose");

/**
 * Stores the AI Assistant chat history per user so the Groq chatbot
 * can be given prior conversation context on each new message.
 */
const chatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const chatConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "AI Assistant" },
    messages: [chatMessageSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

chatConversationSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
