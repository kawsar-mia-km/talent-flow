const mongoose = require("mongoose");

const savedSearchSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, trim: true, default: "" }, // e.g. "Remote React roles"
    query: { type: String, trim: true, default: "" }, // free-text, matched against title/company
    skills: [{ type: String, trim: true }], // optional skill filter
    lastNotifiedAt: { type: Date, default: () => new Date() }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SavedSearch", savedSearchSchema);
