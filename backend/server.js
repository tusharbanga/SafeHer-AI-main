const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const { registerSocketHandlers } = require("./socket/index");
const { registerLocationSocketHandlers } = require("./socket/locationSocket");

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || process.env.CLIENT_URL || "*",
    credentials: true,
  },
});

registerSocketHandlers(io);
registerLocationSocketHandlers(io);

// Make io accessible inside controllers via req.app.get("io")
app.set("io", io);

const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`Future Safe Her API listening on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
};

startServer();

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message);
  httpServer.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  httpServer.close(() => console.log("Process terminated."));
});

module.exports = { httpServer, io };
