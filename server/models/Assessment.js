const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: (arr) => Array.isArray(arr) && arr.length >= 2 && arr.length <= 6
    },
    correctIndex: { type: Number, required: true, min: 0 }
  },
  { _id: true }
);

const assessmentSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    questions: { type: [questionSchema], validate: (arr) => arr.length > 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assessment", assessmentSchema);
