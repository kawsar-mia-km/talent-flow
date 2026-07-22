const logger = require("../utils/logger");
const sentry = require("../utils/sentry");

function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  logger.error(err.message, {
    stack: err.stack,
    method: req.method,
    path: req.originalUrl,
    status
  });
  if (status >= 500) sentry.captureException(err);
  let message = err.message || "Something went wrong on the server.";

  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map((e) => e.message).join(", ");
    return res.status(400).json({ message });
  }
  if (err.code === 11000) {
    message = "A record with that value already exists.";
    return res.status(409).json({ message });
  }

  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
