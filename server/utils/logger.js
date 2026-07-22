const winston = require("winston");

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const isProd = process.env.NODE_ENV === "production";

// Human-readable console output for local dev; single-line JSON in
// production so logs are easy to ship to CloudWatch/Datadog/ELK etc.
const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${ts} ${level}: ${stack || message}${rest}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  format: isProd ? prodFormat : devFormat,
  defaultMeta: { service: "talentflow-api" },
  transports: [new winston.transports.Console()],
  exitOnError: false
});

// Stream adapter so `morgan` (HTTP access logging) writes through Winston
// instead of straight to stdout, keeping log formatting consistent.
logger.stream = {
  write: (message) => logger.http(message.trim())
};

module.exports = logger;
