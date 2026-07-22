const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    requiredSkills: [{ type: String, trim: true }],
    experience: { type: String, default: "Not specified" },
    description: { type: String, default: "" },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["open", "closed"], default: "open" }
  },
  { timestamps: true }
);

// Speeds up the two most common queries: "open jobs, newest first" (the
// public listing) and "all jobs at my company" (recruiter team view).
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ company: 1, createdAt: -1 });
jobSchema.index({ title: "text", description: "text", company: "text" });

module.exports = mongoose.model("Job", jobSchema);
