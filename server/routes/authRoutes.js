const express = require("express");
const {
  register,
  login,
  verifyTwoFactorLogin,
  setupTwoFactor,
  verifyTwoFactorSetup,
  disableTwoFactor,
  googleLoginStart,
  googleLoginCallback,
  refresh,
  logout,
  getMe
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiters");
const { registerValidator, loginValidator } = require("../middleware/validators/authValidators");
const validate = require("../middleware/validate");
const { verifyCaptcha } = require("../utils/captcha");

const router = express.Router();

router.post("/register", authLimiter, verifyCaptcha, registerValidator, validate, register);
router.post("/login", authLimiter, verifyCaptcha, loginValidator, validate, login);
router.post("/2fa/verify-login", authLimiter, verifyTwoFactorLogin);
router.post("/refresh", authLimiter, refresh);
router.post("/logout", logout);
router.get("/me", protect, getMe);

// Two-factor authentication management (self-service, requires a valid session).
router.post("/2fa/setup", protect, setupTwoFactor);
router.post("/2fa/verify", protect, verifyTwoFactorSetup);
router.post("/2fa/disable", protect, disableTwoFactor);

// Google OAuth ("Sign in with Google") — 404s unless GOOGLE_CLIENT_ID/SECRET are configured.
router.get("/google", googleLoginStart);
router.get("/google/callback", googleLoginCallback);

module.exports = router;
