const mongoose = require("mongoose");

/**
 * We never store the raw refresh token — only a SHA-256 hash of it — so a
 * database read alone can't be replayed as a working token (same principle
 * as password hashing). Rotation: every /auth/refresh call issues a brand
 * new token and marks the old one used+revoked, pointing at its
 * replacement. If a revoked token is ever presented again, that's a strong
 * signal of theft/replay, so we revoke the entire chain for that user.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
    replacedByHash: { type: String, default: null },
    createdByIp: { type: String, default: "" }
  },
  { timestamps: true }
);

// MongoDB TTL index — expired tokens are automatically cleaned up.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
