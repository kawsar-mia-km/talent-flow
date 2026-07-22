const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["candidate", "recruiter", "admin"], default: "candidate" },
    companyName: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // Candidate skill profile — used for job recommendations. Falls back to
    // skills extracted from their most recent application if empty.
    skills: [{ type: String, trim: true }],

    // --- Account lockout (brute-force mitigation) ---
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },

    // --- Two-factor authentication (TOTP) ---
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null, select: false },

    // --- Optional Google OAuth linkage (only used if GOOGLE_CLIENT_ID is configured) ---
    googleId: { type: String, default: null, select: false },

    // --- Optional Stripe linkage (only used if STRIPE_SECRET_KEY is configured) ---
    stripeCustomerId: { type: String, default: null, select: false },
    billingPlan: { type: String, enum: ["free", "pro"], default: "free" }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    companyName: this.companyName,
    status: this.status,
    skills: this.skills,
    twoFactorEnabled: this.twoFactorEnabled,
    billingPlan: this.billingPlan,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model("User", userSchema);
