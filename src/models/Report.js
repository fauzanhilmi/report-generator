const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null, },
  status: { type: String, enum: ["REQUESTED", "SCHEDULED", "QUEUED", "COMPLETED", "CANCELED"], },
  scheduledTime: { type: Date, default: null },
  content: { type: Object, default: null},
});

module.exports = mongoose.model("Report", reportSchema);