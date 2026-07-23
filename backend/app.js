const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const apiRoutes = require("./routes/index");
const { apiLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

// ---------- Security & parsing middleware ----------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize());
app.use(xss());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use("/api/v1", apiLimiter);

// ---------- Health check ----------
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Future Safe Her API is running.",
    timestamp: new Date().toISOString(),
  });
});

// ---------- API routes ----------
app.use("/api/v1", apiRoutes);

// ---------- 404 + error handling ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
