const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    resumeSkills: { type: String, default: "" },
    yearsExperience: { type: String, default: "" },
    resumeFileName: { type: String, default: "" },
    resumeStoredFileName: { type: String, default: "" },
    videoFileName: { type: String, default: "" },
    audioFileName: { type: String, default: "" },
    videoCompleted: { type: Boolean, default: false },
    voiceCompleted: { type: Boolean, default: false },
    resumeScore: { type: Number, default: 0 },
    videoScore: { type: Number, default: 0 },
    voiceScore: { type: Number, default: 0 },
    finalScore: { type: Number, default: 0 },
    matchedSkills: { type: Number, default: 0 },
    totalRequiredSkills: { type: Number, default: 0 },
    scoringSource: { type: String, enum: ["real", "simulated"], default: "simulated" },
    extractedSkills: [{ type: String }],
    estimatedYearsExperience: { type: Number, default: null },
    transcript: { type: String, default: "" },
    videoMetrics: { type: mongoose.Schema.Types.Mixed, default: null },
    voiceMetrics: { type: mongoose.Schema.Types.Mixed, default: null },
    interview: {
      status: { type: String, enum: ["none", "scheduled", "completed", "cancelled"], default: "none" },
      scheduledAt: { type: Date, default: null },
      mode: { type: String, enum: ["video-call", "phone", "onsite"], default: "video-call" },
      location: { type: String, default: "" },
      notes: { type: String, default: "" }
    },
    status: {
      type: String,
      enum: ["Submitted", "Reviewing", "Shortlisted", "Rejected"],
      default: "Reviewing"
    }
  },
  { timestamps: true }
);

applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ job: 1, finalScore: -1 });

module.exports = mongoose.model("Application", applicationSchema);
