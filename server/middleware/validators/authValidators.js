const { body } = require("express-validator");

const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required.").isLength({ max: 100 }),
  body("email").trim().isEmail().withMessage("Enter a valid email address.").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  body("role").optional().isIn(["candidate", "recruiter"]).withMessage("Role must be candidate or recruiter."),
  body("companyName").optional().trim().isLength({ max: 150 })
];

const loginValidator = [
  body("email").trim().isEmail().withMessage("Enter a valid email address.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required.")
];

module.exports = { registerValidator, loginValidator };
