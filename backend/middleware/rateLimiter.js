const rateLimit = require("express-rate-limit");

/**
 * General-purpose API rate limiter applied globally.
 */
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
  },
});

/**
 * Stricter limiter for authentication endpoints to slow down brute-force attempts.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

/**
 * Dedicated limiter for the SOS trigger endpoint — generous enough that a
 * genuine emergency is never blocked, but tight enough to prevent abuse/spam.
 */
const sosLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: Number(process.env.SOS_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many SOS triggers in a short period. If this is a real emergency, call 100 directly.",
  },
});

/**
 * Limiter for the AI chatbot endpoint to control Groq API usage.
 */
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "You're sending messages too quickly. Please slow down.",
  },
});

module.exports = { apiLimiter, authLimiter, sosLimiter, chatbotLimiter };
