const express = require("express");

const connectDB = require("./config/db");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

connectDB()

app.use(express.json());
app.use("/reports", reportRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
