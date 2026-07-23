const ApiError = require("../utils/ApiError");

const SYSTEM_PROMPT = `You are SafeHer AI, a calm and supportive women's safety assistant inside the Future Safe Her app.

Your purpose is to help with:
- personal safety and emergency response
- self-defense guidance
- harassment, bullying, stalking, and cyber safety
- women’s legal rights and helpline awareness
- safe travel and route planning
- mental support during fear or danger

You must detect urgent danger from the user's message.
If the user seems in immediate danger, respond with an emergency JSON object.

Always answer in valid JSON with exactly this structure:
{
  "type": "normal" | "emergency",
  "severity": "low" | "medium" | "high" | "critical",
  "message": "short supportive response",
  "actions": ["action 1", "action 2"],
  "language": "en" | "hi" | "hinglish"
}

Rules:
- If the user mentions threats, stalking, assault, violence, kidnapping, fear for life, or immediate danger, return type "emergency" with severity "critical".
- For non-emergency safety conversation, return type "normal" and a helpful answer.
- Keep replies calm, short, and actionable.
- If the user writes in Hindi, reply in Hindi or Hinglish.
- If the user writes in Hinglish, reply in Hinglish.
- Never mention that you are an AI in a robotic way. Speak as a supportive companion.
- Avoid giving dangerous instructions beyond general safety guidance.
- If the user asks for unrelated topics, gently redirect to safety.
`;

const getChatbotReply = async (conversationHistory = [], userMessage, location = {}, language = "") => {
  const apiKey = process.env.GROQ_API_KEY;
  const normalizedLanguage = language?.trim().toLowerCase();
  const inferredLanguage = normalizedLanguage === "hi" || normalizedLanguage === "hindi"
    ? "hi"
    : normalizedLanguage === "hinglish"
      ? "hinglish"
      : normalizedLanguage === "en" || normalizedLanguage === "english"
        ? "en"
        : detectLanguage(userMessage);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
    {
      role: "user",
      content: JSON.stringify({
        message: userMessage,
        location: location || {},
        language: inferredLanguage,
      }),
    },
  ];

  const primaryModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const fallbackModel = process.env.GROQ_FALLBACK_MODEL || "llama-3.1-8b-instant";

  if (!apiKey) {
    return buildLocalFallbackResponse(userMessage, inferredLanguage);
  }

  try {
    const response = await callGroq(messages, primaryModel, apiKey);
    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new ApiError(502, "Groq API returned an empty response.");
    }

    const parsed = JSON.parse(rawContent);
    return normalizeResponse(parsed, inferredLanguage);
  } catch (error) {
    try {
      const fallbackResponse = await callGroq(messages, fallbackModel, apiKey);
      const fallbackData = await fallbackResponse.json();
      const fallbackContent = fallbackData?.choices?.[0]?.message?.content;

      if (!fallbackContent) {
        throw new ApiError(502, "Groq fallback returned an empty response.");
      }

      const parsed = JSON.parse(fallbackContent);
      return normalizeResponse(parsed, inferredLanguage);
    } catch (fallbackError) {
      return buildLocalFallbackResponse(userMessage, inferredLanguage);
    }
  }
};

async function callGroq(messages, model, apiKey) {
  const response = await fetch(process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      max_tokens: 900,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new ApiError(502, `Groq API request failed: ${errBody}`);
  }

  return response;
}

function buildLocalFallbackResponse(userMessage, inferredLanguage) {
  const lowerMessage = userMessage.toLowerCase();
  const isEmergency = /danger|scared|following|stalking|threat|hurt|attack|kidnap|unsafe|help|police|911|call/i.test(lowerMessage);

  if (isEmergency) {
    return normalizeResponse({
      type: "emergency",
      severity: "critical",
      message: inferredLanguage === "hi"
        ? "धैर्य रखें। मैं आपके साथ हूँ। तुरंत सुरक्षित जगह पर जाएँ और यदि आप खतरे में हैं तो स्थानीय आपातकालीन सेवाओं को कॉल करें।"
        : inferredLanguage === "hinglish"
          ? "Dhairya rakho. Main tumhare saath hoon. Abhi safe jagah jao aur agar danger ho to local emergency services ko call karo."
          : "Stay calm. I’m with you. Move to a safe place right away and call local emergency services if you’re in immediate danger.",
      actions: ["Share Live Location", "Activate SOS", "Call Police", "Nearest Police Station", "Notify Trusted Contact", "Start Silent Recording"],
      language: inferredLanguage,
    }, inferredLanguage);
  }

  const message = inferredLanguage === "hi"
    ? "मैं आपके साथ हूँ। आप सुरक्षित रहना चाहेंगे तो मैं आपको तुरंत कदम सुझा सकती हूँ।"
    : inferredLanguage === "hinglish"
      ? "Main tumhare saath hoon. Agar tum safe rehna chahte ho, toh main turant steps suggest kar sakti hoon."
      : "I’m here with you. Tell me what’s happening and I’ll guide you step by step.";

  return normalizeResponse({
    type: "normal",
    severity: "low",
    message,
    actions: ["Share Live Location", "SOS", "Find Safe Place"],
    language: inferredLanguage,
  }, inferredLanguage);
}

function detectLanguage(text = "") {
  const lower = text.toLowerCase();
  if (/[\u0900-\u097F]/.test(lower)) {
    return "hi";
  }
  if (/(haan|hai|kya|bata|help|danger|follow|watching|chala|wahan|main|mere|aap|ho)/i.test(lower)) {
    return "hinglish";
  }
  return "en";
}

function normalizeResponse(payload, inferredLanguage) {
  const type = payload?.type === "emergency" ? "emergency" : "normal";
  const severity = ["low", "medium", "high", "critical"].includes(payload?.severity) ? payload.severity : type === "emergency" ? "critical" : "low";
  const message = typeof payload?.message === "string" && payload.message.trim() ? payload.message : type === "emergency"
    ? "Stay calm. I’m with you."
    : "I’m here with you. Tell me what’s happening.";

  const actions = Array.isArray(payload?.actions) ? payload.actions.filter(Boolean) : [];
  const language = payload?.language || inferredLanguage || "en";

  return {
    type,
    severity,
    message,
    actions,
    language,
  };
}

module.exports = { getChatbotReply, SYSTEM_PROMPT };
