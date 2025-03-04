const connectDB = require("../config/db");
const Report = require("../models/Report");
const consumeFromQueue = require("../config/queue").consumeFromQueue;

connectDB()

// Random data for report's content
function generateTabularData() {
  return {
    columns: ["Transaction ID", "User", "Amount", "Currency", "Date"],
    rows: [
      {
        transactionId: "TXN1001",
        user: "alice",
        amount: 120.50,
        currency: "USD",
        date: "2025-03-03",
      },
      {
        transactionId: "TXN1002",
        user: "bob",
        amount: 75.00,
        currency: "EUR",
        date: "2025-03-02",
      },
      {
        transactionId: "TXN1003",
        user: "charlie",
        amount: 200.00,
        currency: "GBP",
        date: "2025-03-01",
      }
    ]
  };
}

async function generateReport(data) {
  console.log(`Processing report ID: ${data._id}`);
  try {
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Simulated 5s processing delay

    const updatedReport = await Report.findOneAndUpdate(
      { _id: data._id, status: "QUEUED" }, // If report is already canceled, it won't get processed. Also avoid double processing on multi-instances
      { status: "COMPLETED", content: generateTabularData(), updatedAt: new Date() },
      { new: true }
    );

    if (updatedReport) {
      console.log("Report completed: ", updatedReport);
    }
  } catch (error) {
    console.error("Error generating report:", error);
    throw error
  }
}

(async () => {
  await consumeFromQueue("report_generation_queue", generateReport);
})();