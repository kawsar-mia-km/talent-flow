const { body, param } = require("express-validator");

const applyValidator = [
  body("jobId").isMongoId().withMessage("Invalid job id."),
  body("resumeSkills").optional().trim().isLength({ max: 1000 }),
  body("yearsExperience").optional().trim().isLength({ max: 20 })
];

const statusValidator = [
  param("id").isMongoId().withMessage("Invalid application id."),
  body("status").isIn(["Submitted", "Reviewing", "Shortlisted", "Rejected"]).withMessage("Invalid status value.")
];

const scheduleInterviewValidator = [
  param("id").isMongoId().withMessage("Invalid application id."),
  body("scheduledAt").isISO8601().withMessage("Provide a valid date and time."),
  body("mode").optional().isIn(["video-call", "phone", "onsite"]),
  body("location").optional().trim().isLength({ max: 300 }),
  body("notes").optional().trim().isLength({ max: 1000 })
];

const idParamValidator = [param("id").isMongoId().withMessage("Invalid id.")];

module.exports = { applyValidator, statusValidator, scheduleInterviewValidator, idParamValidator };
