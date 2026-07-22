const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken");

function generateAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m"
  });
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function refreshExpiryDate() {
  const days = Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) || 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/** Creates a new opaque refresh token, stores only its hash, returns the raw token to set as a cookie. */
async function issueRefreshToken(userId, ip) {
  const rawToken = crypto.randomBytes(48).toString("hex");
  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(rawToken),
    expiresAt: refreshExpiryDate(),
    createdByIp: ip || ""
  });
  return rawToken;
}

/**
 * Validates a presented refresh token and rotates it: the old record is
 * marked revoked + linked to its replacement, and a fresh token is issued.
 * Returns null if the token is missing, expired, or already revoked
 * (revoked-but-presented is treated as a possible theft signal, so we
 * revoke every other active token for that user too).
 */
async function rotateRefreshToken(rawToken, ip) {
  if (!rawToken) return null;
  const tokenHash = hashToken(rawToken);
  const record = await RefreshToken.findOne({ tokenHash });
  if (!record) return null;

  if (record.revoked || record.expiresAt < new Date()) {
    if (record.revoked) {
      // Possible replay of an already-rotated token — revoke the whole chain.
      await RefreshToken.updateMany({ user: record.user, revoked: false }, { revoked: true });
    }
    return null;
  }

  const newRawToken = crypto.randomBytes(48).toString("hex");
  const newRecord = await RefreshToken.create({
    user: record.user,
    tokenHash: hashToken(newRawToken),
    expiresAt: refreshExpiryDate(),
    createdByIp: ip || ""
  });

  record.revoked = true;
  record.replacedByHash = newRecord.tokenHash;
  await record.save();

  return { userId: record.user, rawToken: newRawToken };
}

async function revokeRefreshToken(rawToken) {
  if (!rawToken) return;
  await RefreshToken.updateOne({ tokenHash: hashToken(rawToken) }, { revoked: true });
}

const REFRESH_COOKIE_NAME = "tf_refresh";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
  maxAge: (Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) || 30) * 24 * 60 * 60 * 1000
};

module.exports = {
  generateAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS
};
