const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  generateAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS
} = require("../utils/tokens");
const twoFactor = require("../utils/twoFactor");
const googleOAuth = require("../utils/googleOAuth");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const TWO_FACTOR_TOKEN_EXPIRES_IN = "5m";

async function issueSession(res, user, ip) {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = await issueRefreshToken(user._id, ip);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
  return accessToken;
}

function issueTwoFactorChallenge(user) {
  // Short-lived, single-purpose token: it can ONLY be used against the
  // /2fa/verify-login endpoint, never to access a real session, so a
  // leaked "pending" token can't skip the second factor.
  return jwt.sign({ id: user._id, purpose: "2fa-challenge" }, process.env.JWT_SECRET, {
    expiresIn: TWO_FACTOR_TOKEN_EXPIRES_IN
  });
}

async function register(req, res, next) {
  try {
    const { name, email, password, role, companyName } = req.body;
    const allowedRole = ["candidate", "recruiter"].includes(role) ? role : "candidate";

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: allowedRole,
      companyName: allowedRole === "recruiter" ? companyName || "Independent" : undefined
    });

    const accessToken = await issueSession(res, user, req.ip);
    res.status(201).json({ token: accessToken, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password +failedLoginAttempts +lockUntil +twoFactorSecret");
    if (!user) return res.status(401).json({ message: "Email or password doesn't match." });

    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ message: `Too many failed attempts. Try again in ${minutesLeft} minute(s).` });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ message: "Email or password doesn't match." });
    }

    if (user.status === "inactive") return res.status(403).json({ message: "This account has been deactivated." });

    // Password correct — reset the failure counter regardless of what happens next.
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    if (user.twoFactorEnabled) {
      return res.json({ twoFactorRequired: true, twoFactorToken: issueTwoFactorChallenge(user) });
    }

    const accessToken = await issueSession(res, user, req.ip);
    res.json({ token: accessToken, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

/** Second step of login when 2FA is enabled: exchanges a 2fa-challenge token + TOTP code for a real session. */
async function verifyTwoFactorLogin(req, res, next) {
  try {
    const { twoFactorToken, code } = req.body;
    if (!twoFactorToken || !code) return res.status(400).json({ message: "twoFactorToken and code are required." });

    let decoded;
    try {
      decoded = jwt.verify(twoFactorToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "This login attempt has expired. Please log in again." });
    }
    if (decoded.purpose !== "2fa-challenge") return res.status(401).json({ message: "Invalid verification token." });

    const user = await User.findById(decoded.id).select("+twoFactorSecret");
    if (!user || !user.twoFactorEnabled) return res.status(401).json({ message: "Invalid verification token." });

    if (!twoFactor.verifyToken(code, user.twoFactorSecret)) {
      return res.status(401).json({ message: "Incorrect verification code." });
    }

    const accessToken = await issueSession(res, user, req.ip);
    res.json({ token: accessToken, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

/** Starts 2FA enrollment: generates a secret + QR code, but doesn't turn 2FA on yet (that happens on /2fa/verify). */
async function setupTwoFactor(req, res, next) {
  try {
    const secret = twoFactor.generateSecret();
    const otpauthUrl = twoFactor.keyUri(req.user.email, secret);
    const qrCodeDataUrl = await twoFactor.qrCodeDataUrl(otpauthUrl);

    // Stash the pending secret on the user record; it only becomes "the"
    // secret once they prove they can generate a valid code from it.
    req.user.twoFactorSecret = secret;
    await req.user.save();

    res.json({ secret, otpauthUrl, qrCodeDataUrl });
  } catch (err) {
    next(err);
  }
}

async function verifyTwoFactorSetup(req, res, next) {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select("+twoFactorSecret");
    if (!user.twoFactorSecret) return res.status(400).json({ message: "Start setup first via /auth/2fa/setup." });

    if (!twoFactor.verifyToken(code, user.twoFactorSecret)) {
      return res.status(400).json({ message: "Incorrect code. Check your authenticator app and try again." });
    }

    user.twoFactorEnabled = true;
    await user.save();
    res.json({ message: "Two-factor authentication is now enabled.", user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

async function disableTwoFactor(req, res, next) {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    const match = await user.comparePassword(password || "");
    if (!match) return res.status(401).json({ message: "Incorrect password." });

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();
    res.json({ message: "Two-factor authentication has been disabled.", user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

/** Redirects the browser to Google's consent screen. 404s if Google login isn't configured. */
async function googleLoginStart(req, res) {
  if (!googleOAuth.isEnabled()) return res.status(404).json({ message: "Google login isn't configured on this server." });
  res.redirect(googleOAuth.getAuthUrl());
}

/** Google redirects back here with a `code`; we exchange it, find-or-create the user, and log them in. */
async function googleLoginCallback(req, res, next) {
  try {
    if (!googleOAuth.isEnabled()) return res.status(404).json({ message: "Google login isn't configured on this server." });
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: "Missing authorization code." });

    const profile = await googleOAuth.verifyCodeAndGetProfile(code);
    let user = await User.findOne({ email: profile.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: profile.name || profile.email,
        email: profile.email.toLowerCase(),
        password: require("crypto").randomBytes(24).toString("hex"), // unused — login is Google-only for this account
        role: "candidate",
        googleId: profile.googleId
      });
    } else if (!user.googleId) {
      user.googleId = profile.googleId;
      await user.save();
    }

    const accessToken = await issueSession(res, user, req.ip);
    // Redirect back into the SPA with the access token in a query param so
    // the client can pick it up and store it (same trade-off apps like
    // this make in the absence of a server-rendered frontend).
    res.redirect(`${process.env.CLIENT_URL}/login?googleToken=${accessToken}`);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const rotated = await rotateRefreshToken(rawToken, req.ip);
    if (!rotated) {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
      return res.status(401).json({ message: "Your session has expired. Please log in again." });
    }

    const user = await User.findById(rotated.userId);
    if (!user || user.status === "inactive") {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
      return res.status(401).json({ message: "Your session is no longer valid. Please log in again." });
    }

    res.cookie(REFRESH_COOKIE_NAME, rotated.rawToken, REFRESH_COOKIE_OPTIONS);
    const accessToken = generateAccessToken(user._id);
    res.json({ token: accessToken, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await revokeRefreshToken(rawToken);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
    res.json({ message: "Logged out." });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  res.json({ user: req.user.toSafeObject() });
}

module.exports = {
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
};
