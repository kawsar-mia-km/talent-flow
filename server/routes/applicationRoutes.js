const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  applyToJob,
  getMyApplications,
  getApplicantsForRecruiter,
  updateApplicationStatus,
  scheduleInterview,
  cancelInterview,
  downloadResume,
  explainApplication
} = require("../controllers/applicationController");
const { getMessages, sendMessage } = require("../controllers/messageController");
const { getNotes, addNote } = require("../controllers/noteController");
const { protect, authorize } = require("../middleware/auth");
const { applyValidator, statusValidator, scheduleInterviewValidator, idParamValidator } = require("../middleware/validators/applicationValidators");
const validate = require("../middleware/validate");

const router = express.Router();

const ALLOWED_EXTENSIONS = {
  resume: [".pdf", ".docx", ".txt"],
  video: [".mp4", ".mov", ".webm", ".avi"],
  audio: [".mp3", ".wav", ".m4a", ".ogg", ".webm"]
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.fieldname}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`)
});

// First line of defense: reject obviously-wrong extensions immediately.
// The real check — verifying file *content*, not just the name — happens
// after upload in applicationController.applyToJob via fileValidation.js,
// since a filename can always be faked.
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ALLOWED_EXTENSIONS[file.fieldname] || [];
  if (!allowed.includes(ext)) {
    return cb(new Error(`"${file.fieldname}" must be one of: ${allowed.join(", ")}`));
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 25 * 1024 * 1024 } });

const applicationUpload = upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "audio", maxCount: 1 }
]);

function handleUploadErrors(req, res, next) {
  applicationUpload(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "There was a problem with your uploaded file." });
    next();
  });
}

router.post("/", protect, authorize("candidate"), handleUploadErrors, applyValidator, validate, applyToJob);
router.get("/mine", protect, authorize("candidate"), getMyApplications);
router.get("/recruiter", protect, authorize("recruiter"), getApplicantsForRecruiter);
router.patch("/:id/status", protect, authorize("recruiter"), statusValidator, validate, updateApplicationStatus);
router.patch("/:id/interview", protect, authorize("recruiter"), scheduleInterviewValidator, validate, scheduleInterview);
router.delete("/:id/interview", protect, authorize("recruiter"), idParamValidator, validate, cancelInterview);
router.get("/:id/resume", protect, idParamValidator, validate, downloadResume);
router.get("/:id/explain", protect, idParamValidator, validate, explainApplication);

// In-app messaging between the candidate and the hiring recruiter.
router.get("/:id/messages", protect, idParamValidator, validate, getMessages);
router.post("/:id/messages", protect, idParamValidator, validate, sendMessage);

// Internal recruiter notes — visible to the whole hiring team (same company), never to the candidate.
router.get("/:id/notes", protect, authorize("recruiter", "admin"), idParamValidator, validate, getNotes);
router.post("/:id/notes", protect, authorize("recruiter", "admin"), idParamValidator, validate, addNote);

module.exports = router;
