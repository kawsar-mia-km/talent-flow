const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    startDate: { type: String, default: "" }, // free-text ("Jan 2023") — candidates rarely need day precision here
    endDate: { type: String, default: "" },
    current: { type: Boolean, default: false },
    description: { type: String, default: "", maxlength: 1000 }
  },
  { _id: true }
);

const educationSchema = new mongoose.Schema(
  {
    school: { type: String, required: true, trim: true },
    degree: { type: String, default: "", trim: true },
    field: { type: String, default: "", trim: true },
    startYear: { type: String, default: "" },
    endYear: { type: String, default: "" }
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", maxlength: 500 },
    link: { type: String, default: "", trim: true }
  },
  { _id: true }
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    issuer: { type: String, default: "", trim: true },
    year: { type: String, default: "" }
  },
  { _id: true }
);

const candidateProfileSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    headline: { type: String, default: "", trim: true, maxlength: 150 }, // e.g. "Backend Engineer | Node.js · MongoDB · Docker"
    summary: { type: String, default: "", maxlength: 800 },
    phone: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    links: {
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      portfolio: { type: String, default: "" }
    },
    experience: [experienceSchema],
    education: [educationSchema],
    projects: [projectSchema],
    certifications: [certificationSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("CandidateProfile", candidateProfileSchema);
