const rateLimit = require("express-rate-limit");

/**
 * Strict limiter for login/register/refresh — the endpoints an attacker
 * would brute-force. Keyed by IP; each hit against the limit returns 429
 * with a plain-language message instead of Express's default text.
 */
const authLimiter = rateLimit({
  windowMs: (Number(process.env.AUTH_RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts from this device. Wait a few minutes and try again." }
});

/** A looser limiter applied to the whole API to blunt scraping/abuse. */
const apiLimiter = rateLimit({
  windowMs: (Number(process.env.API_RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down and try again shortly." }
});

module.exports = { authLimiter, apiLimiter };
