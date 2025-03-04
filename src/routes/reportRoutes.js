const express = require("express");
const { createReport, getReport, cancelReport } = require("../controllers/reportController");

const router = express.Router();

router.post("/", createReport);
router.get("/:id", getReport);
router.delete("/:id", cancelReport);

module.exports = router;