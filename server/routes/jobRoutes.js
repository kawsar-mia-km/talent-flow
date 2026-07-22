const express = require("express");
const {
  createJob,
  updateJob,
  getOpenJobs,
  getMyJobs,
  getJobById,
  getAllJobsAdmin,
  getRecommendedJobs,
  getRankedApplicants,
  getJobPrepGuide
} = require("../controllers/jobController");
const { protect, authorize } = require("../middleware/auth");
const { createJobValidator, updateJobValidator } = require("../middleware/validators/jobValidators");
const validate = require("../middleware/validate");

const router = express.Router();

router.get("/", getOpenJobs);
router.get("/mine", protect, authorize("recruiter"), getMyJobs);
router.get("/recommended", protect, authorize("candidate"), getRecommendedJobs);
router.get("/admin/all", protect, authorize("admin"), getAllJobsAdmin);
router.get("/:id", getJobById);
router.get("/:id/ranked-applicants", protect, authorize("recruiter", "admin"), getRankedApplicants);
router.get("/:id/prep-guide", protect, authorize("candidate"), getJobPrepGuide);
router.post("/", protect, authorize("recruiter"), createJobValidator, validate, createJob);
router.patch("/:id", protect, authorize("recruiter"), updateJobValidator, validate, updateJob);

module.exports = router;
