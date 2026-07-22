const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["candidate", "recruiter"], required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

messageSchema.index({ application: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
