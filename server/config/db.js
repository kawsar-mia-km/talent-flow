const mongoose = require("mongoose");
const logger = require("../utils/logger");

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/talentflow";
  try {
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    logger.error("MongoDB connection failed", { error: err.message });
    // Let the caller decide whether to exit (server.js exits; tests don't).
    throw err;
  }
}

module.exports = connectDB;
