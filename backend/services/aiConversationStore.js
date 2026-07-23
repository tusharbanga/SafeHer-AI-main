const conversations = new Map();

function createConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getConversation(conversationId) {
  return conversations.get(conversationId) || [];
}

function saveConversation(conversationId, history) {
  conversations.set(conversationId, history);
  return history;
}

module.exports = {
  createConversationId,
  getConversation,
  saveConversation,
};
