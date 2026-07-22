const express = require("express");
const { exportApplicantsExcel, exportJobReportPdf } = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/applicants.xlsx", protect, authorize("recruiter"), exportApplicantsExcel);
router.get("/jobs/:id/report.pdf", protect, authorize("recruiter"), exportJobReportPdf);

module.exports = router;
