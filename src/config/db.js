const mongoose = require("mongoose");
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://user:password@mongodb:27017/reportsdb?authSource=admin";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed: ", error);
    process.exit(1);
  }
};

module.exports = connectDB;