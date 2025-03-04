const Report = require("../models/Report");
const publishToQueue = require("../config/queue").publishToQueue

exports.createReport = async (req, res) => {
  try {
    const { scheduledTime } = req.body;
    
    // Validate scheduledTime (if provided)
    if (scheduledTime) {
      const date = new Date(scheduledTime);

      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: "Invalid scheduledTime format. Use ISO 8601 format." });
      }

      if (date < new Date()) {
        return res.status(400).json({ error: "Scheduled time must be in the future." });
      }
    }
  
    const report = new Report({
      status: scheduledTime ? "SCHEDULED" : "REQUESTED", 
      scheduledTime 
    });

    await report.save();

    if (report.status == "REQUESTED") {
      report.status = "QUEUED";
      report.updatedAt = new Date();
      publishToQueue("report_generation_queue", JSON.stringify(report))
      await report.save();
    }
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) 
      return res.status(404).json({ message: "Report not found" });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelReport = async (req, res) => {
  try {
    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, status: { $nin: ["COMPLETED", "CANCELED"] } }, // Ensure only pending reports are canceled
      { status: "CANCELED", updatedAt: new Date() },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Cannot find pending report with given id" });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};