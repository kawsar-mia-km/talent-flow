const express = require("express");
const {
  createAssessment,
  listAssessmentsForJob,
  getAssessment,
  submitAssessment,
  getSubmissionsForAssessment
} = require("../controllers/assessmentController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, authorize("recruiter"), createAssessment);
router.get("/job/:jobId", protect, listAssessmentsForJob);
router.get("/:id", protect, getAssessment);
router.post("/:id/submit", protect, authorize("candidate"), submitAssessment);
router.get("/:id/submissions", protect, authorize("recruiter"), getSubmissionsForAssessment);

module.exports = router;
