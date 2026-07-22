const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
