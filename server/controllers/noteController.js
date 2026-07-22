const Application = require("../models/Application");
const Note = require("../models/Note");

async function loadApplicationForTeam(req) {
  const application = await Application.findById(req.params.id).populate("job").populate("candidate", "name email");
  if (!application) return { error: { status: 404, message: "Application not found." } };

  const job = application.job;
  const sameCompany = req.user.role === "recruiter" && job.company === req.user.companyName;
  if (!sameCompany && req.user.role !== "admin") {
    return { error: { status: 403, message: "Only your hiring team can view or add notes here." } };
  }
  return { application };
}

async function getNotes(req, res, next) {
  try {
    const { application, error } = await loadApplicationForTeam(req);
    if (error) return res.status(error.status).json({ message: error.message });

    const notes = await Note.find({ application: application._id }).populate("author", "name email").sort({ createdAt: -1 });
    res.json({ notes });
  } catch (err) {
    next(err);
  }
}

async function addNote(req, res, next) {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ message: "Note can't be empty." });

    const { application, error } = await loadApplicationForTeam(req);
    if (error) return res.status(error.status).json({ message: error.message });

    const note = await Note.create({ application: application._id, author: req.user._id, body: body.trim() });
    const populated = await note.populate("author", "name email");

    res.status(201).json({ note: populated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotes, addNote };
