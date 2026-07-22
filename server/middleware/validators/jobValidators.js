const { body, param } = require("express-validator");

const createJobValidator = [
  body("title").trim().notEmpty().withMessage("Title is required.").isLength({ max: 150 }),
  body("requiredSkills").notEmpty().withMessage("List at least one required skill."),
  body("experience").optional().trim().isLength({ max: 100 }),
  body("description").optional().trim().isLength({ max: 3000 })
];

const updateJobValidator = [
  param("id").isMongoId().withMessage("Invalid job id."),
  body("title").optional().trim().isLength({ min: 1, max: 150 }),
  body("requiredSkills").optional(),
  body("experience").optional().trim().isLength({ max: 100 }),
  body("description").optional().trim().isLength({ max: 3000 }),
  body("status").optional().isIn(["open", "closed"]).withMessage("Status must be 'open' or 'closed'.")
];

module.exports = { createJobValidator, updateJobValidator };
