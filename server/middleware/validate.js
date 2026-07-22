const { validationResult } = require("express-validator");

/**
 * Runs after a chain of express-validator checks. Collects every failed
 * rule into one readable 400 response instead of letting bad input reach
 * a controller (and, from there, the database).
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const messages = errors.array().map((e) => `${e.path}: ${e.msg}`);
  return res.status(400).json({ message: messages[0], errors: messages });
}

module.exports = validate;
