/**
 * hCaptcha verification for the register/login forms. Disabled by
 * default (the middleware just calls next()) — set HCAPTCHA_SECRET in
 * server/.env to require a valid captchaToken in the request body.
 * hCaptcha (not Google reCAPTCHA) was picked because it has a free tier
 * with no per-request billing surprises; swapping providers only means
 * changing this one file.
 */
const axios = require("axios");
const logger = require("./logger");

const ENABLED = !!process.env.HCAPTCHA_SECRET;

function isEnabled() {
  return ENABLED;
}

async function verifyCaptcha(req, res, next) {
  if (!ENABLED) return next();

  const token = req.body?.captchaToken;
  if (!token) return res.status(400).json({ message: "Captcha verification is required." });

  try {
    const { data } = await axios.post(
      "https://hcaptcha.com/siteverify",
      new URLSearchParams({ secret: process.env.HCAPTCHA_SECRET, response: token }),
      { timeout: 5000 }
    );
    if (!data.success) return res.status(400).json({ message: "Captcha verification failed. Please try again." });
    next();
  } catch (err) {
    logger.warn("Captcha verification request failed", { error: err.message });
    // Fail closed on auth endpoints — a captcha provider outage shouldn't
    // silently let a bot through the door it's there to guard.
    return res.status(503).json({ message: "Captcha service is temporarily unavailable. Please try again shortly." });
  }
}

module.exports = { isEnabled, verifyCaptcha };
