const Application = require("../models/Application");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const { emitToUser } = require("../utils/socket");

async function loadApplicationForParticipant(req) {
  const application = await Application.findById(req.params.id).populate("job").populate("candidate");
  if (!application) return { error: { status: 404, message: "Application not found." } };

  const isCandidate = String(application.candidate._id) === String(req.user._id);
  const isRecruiter = String(application.job.recruiter) === String(req.user._id);
  if (!isCandidate && !isRecruiter && req.user.role !== "admin") {
    return { error: { status: 403, message: "You don't have access to this conversation." } };
  }
  return { application, isCandidate, isRecruiter };
}

async function getMessages(req, res, next) {
  try {
    const { application, error } = await loadApplicationForParticipant(req);
    if (error) return res.status(error.status).json({ message: error.message });

    const messages = await Message.find({ application: application._id }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ message: "Message can't be empty." });

    const { application, isCandidate, isRecruiter, error } = await loadApplicationForParticipant(req);
    if (error) return res.status(error.status).json({ message: error.message });
    if (!isCandidate && !isRecruiter) {
      return res.status(403).json({ message: "Only the candidate or the hiring recruiter can send messages here." });
    }

    const message = await Message.create({
      application: application._id,
      sender: req.user._id,
      senderRole: isCandidate ? "candidate" : "recruiter",
      body: body.trim()
    });

    const recipientId = isCandidate ? application.job.recruiter : application.candidate._id;
    await Notification.create({
      user: recipientId,
      message: `New message on "${application.job.title}" from ${req.user.name}.`
    });
    emitToUser(recipientId, "message:new", { applicationId: String(application._id), message });
    emitToUser(recipientId, "notification:new", { message: `New message from ${req.user.name}` });

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMessages, sendMessage };
