const cron = require("node-cron");
const Report = require("../models/Report");
const connectDB = require("../config/db");
const publishToQueue = require("../config/queue").publishToQueue

connectDB()

// Run every minute
cron.schedule("* * * * *", async () => {
  console.log("Checking for scheduled reports...");

  try {
    const reports = await Report.find({
      status: "SCHEDULED",
      scheduledTime: { $lte: new Date() },
    }).lean();

    for (let report of reports) {
      console.log(`Processing report ID: ${report._id}`);
      const updatedReport = await Report.findOneAndUpdate(
        { _id: report._id, status: "SCHEDULED" }, // Ensure atomicity in multi-instances environment
        { status: "QUEUED", updatedAt: new Date() },
        { new: true }
      );

      if (updatedReport) {
        publishToQueue("report_generation_queue", JSON.stringify(updatedReport))
        console.log(`Report ${updatedReport._id} queued for processing.`);
      } else {
        console.log(`Report ${report._id} is already processed`);
      }
    }
  } catch (error) {
    console.log("Error processing scheduled reports : ", error)
  }
});