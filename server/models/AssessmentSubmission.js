const mongoose = require("mongoose");

const assessmentSubmissionSchema = new mongoose.Schema(
  {
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true, index: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [{ type: Number }], // index into each question's options, by position
    score: { type: Number, default: 0 }, // percentage 0-100
    correctCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

assessmentSubmissionSchema.index({ assessment: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model("AssessmentSubmission", assessmentSubmissionSchema);
