const mongoose = require("mongoose");

let memoryServer;

/**
 * Establishes a connection to MongoDB using Mongoose.
 * In development, if no MONGODB_URI is provided, it uses an in-memory MongoDB server
 * so the app can still start locally for testing.
 */
const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);

    let uri = process.env.MONGODB_URI;

    if (!uri) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("MONGODB_URI is required in production.");
      }

      const { MongoMemoryServer } = require("mongodb-memory-server");
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      console.log("Using in-memory MongoDB for local development.");
    }

    const conn = await mongoose.connect(uri);

    console.log(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    return conn;
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
