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
    });

    for (let report of reports) {
      console.log(`Processing report ID: ${report._id}`);

      report.status = "QUEUED";
      report.updatedAt = new Date();
      publishToQueue("report_generation_queue", JSON.stringify(report))
      await report.save();

      console.log(`Report ${report._id} queued for processing.`);
    }
  } catch (error) {
    console.log("Error processing scheduled reports : ", error)
  }
});