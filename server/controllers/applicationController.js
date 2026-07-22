const path = require("path");
const fs = require("fs");
const Application = require("../models/Application");
const Job = require("../models/Job");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { scoreResume, scoreVideo, scoreVoice } = require("../utils/aiEvaluation");
const aiClient = require("../utils/aiClient");
const mailer = require("../utils/mailer");
const { validateUploadedFile } = require("../utils/fileValidation");
const { emitToUser } = require("../utils/socket");

const WEIGHTS = { resume: 0.4, video: 0.35, voice: 0.25 };

function deleteFiles(...files) {
  for (const f of files) {
    if (f?.path && fs.existsSync(f.path)) {
      try { fs.unlinkSync(f.path); } catch (_) { /* best effort cleanup */ }
    }
  }
}

async function applyToJob(req, res, next) {
  try {
    const { jobId, resumeSkills, yearsExperience, videoCompleted, voiceCompleted } = req.body;
    const resumeFile = req.files?.resume?.[0];
    const videoFile = req.files?.video?.[0];
    const audioFile = req.files?.audio?.[0];

    const job = await Job.findById(jobId);
    if (!job) { deleteFiles(resumeFile, videoFile, audioFile); return res.status(404).json({ message: "Job not found." }); }

    const existing = await Application.findOne({ candidate: req.user._id, job: jobId });
    if (existing) { deleteFiles(resumeFile, videoFile, audioFile); return res.status(409).json({ message: "You've already applied to this job." }); }

    // Content-level validation: the extension filter in the route already
    // rejected obviously wrong file names, but a renamed .exe would pass
    // that check. This confirms the actual bytes on disk match a real
    // resume/video/audio file before we do anything else with them.
    for (const [file, category, label] of [
      [resumeFile, "resume", "resume"],
      [videoFile, "video", "video"],
      [audioFile, "audio", "audio"]
    ]) {
      if (!file) continue;
      const { valid } = validateUploadedFile(file.path, category, file.originalname);
      if (!valid) {
        deleteFiles(resumeFile, videoFile, audioFile);
        return res.status(400).json({ message: `Your ${label} file doesn't look like a valid file of that type. Please re-check and re-upload.` });
      }
    }

    const seed = String(req.user._id) + String(job._id);

    let usedRealAI = false;

    // --- Resume: real parsing if a file + AI service are available ---
    let extractedSkills = [];
    let estimatedYearsExperience = null;
    if (resumeFile) {
      const parsed = await aiClient.parseResume(resumeFile);
      if (parsed) {
        usedRealAI = true;
        extractedSkills = parsed.skills || [];
        estimatedYearsExperience = parsed.estimatedYearsExperience ?? null;
      }
    }
    const typedSkills = (resumeSkills || "").split(",").map((s) => s.trim()).filter(Boolean);
    const combinedSkills = Array.from(new Set([...extractedSkills, ...typedSkills]));
    const resumeEval = scoreResume(combinedSkills.join(","), job.requiredSkills);
    const resumeScore = resumeEval.resumeScore;

    // --- Video: real MediaPipe analysis if a file + AI service are available ---
    let videoMetrics = null;
    if (videoFile) {
      videoMetrics = await aiClient.analyzeVideo(videoFile);
    }
    let videoScore;
    if (videoMetrics) {
      usedRealAI = true;
      videoScore = videoMetrics.confidenceScore;
    } else {
      videoScore = scoreVideo(seed);
    }

    // --- Voice: real Whisper + librosa analysis if a file + AI service are available ---
    let voiceMetrics = null;
    let transcript = "";
    if (audioFile) {
      voiceMetrics = await aiClient.analyzeVoice(audioFile);
    }
    let voiceScore;
    if (voiceMetrics) {
      usedRealAI = true;
      voiceScore = voiceMetrics.voiceScore;
      transcript = voiceMetrics.transcript || "";
    } else {
      voiceScore = scoreVoice(seed);
    }

    const finalScore = Math.round(
      resumeScore * WEIGHTS.resume + videoScore * WEIGHTS.video + voiceScore * WEIGHTS.voice
    );

    const application = await Application.create({
      candidate: req.user._id,
      job: job._id,
      resumeSkills,
      yearsExperience,
      resumeFileName: resumeFile?.originalname || "",
      resumeStoredFileName: resumeFile?.filename || "",
      videoFileName: videoFile?.originalname || "",
      audioFileName: audioFile?.originalname || "",
      videoCompleted: !!videoCompleted || !!videoFile,
      voiceCompleted: !!voiceCompleted || !!audioFile,
      resumeScore,
      videoScore,
      voiceScore,
      finalScore,
      matchedSkills: resumeEval.matched,
      totalRequiredSkills: resumeEval.total,
      scoringSource: usedRealAI ? "real" : "simulated",
      extractedSkills,
      estimatedYearsExperience,
      transcript,
      videoMetrics,
      voiceMetrics,
      status: "Reviewing"
    });

    // Email notifications (fail-soft — never blocks the response)
    const recruiter = await User.findById(job.recruiter);
    mailer.sendApplicationConfirmation(req.user, job, application).catch(() => {});
    if (recruiter) {
      mailer.sendNewApplicantAlert(recruiter, job, req.user, application).catch(() => {});
      emitToUser(recruiter._id, "notification:new", { message: `${req.user.name} applied to ${job.title}.` });
    }

    res.status(201).json({ application });
  } catch (err) {
    next(err);
  }
}

async function getMyApplications(req, res, next) {
  try {
    const apps = await Application.find({ candidate: req.user._id })
      .populate("job", "title company requiredSkills")
      .sort({ createdAt: -1 });
    res.json({ applications: apps });
  } catch (err) {
    next(err);
  }
}

async function getApplicantsForRecruiter(req, res, next) {
  try {
    const myJobs = await Job.find({ recruiter: req.user._id }).select("_id");
    const jobIds = myJobs.map((j) => j._id);
    const filter = { job: { $in: jobIds } };
    if (req.query.jobId) filter.job = req.query.jobId;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 10));

    const [apps, totalCount] = await Promise.all([
      Application.find(filter)
        .populate("candidate", "name email")
        .populate("job", "title company")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Application.countDocuments(filter)
    ]);

    res.json({
      applications: apps,
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      totalCount
    });
  } catch (err) {
    next(err);
  }
}

async function updateApplicationStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!["Submitted", "Reviewing", "Shortlisted", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }
    const application = await Application.findById(req.params.id).populate("job").populate("candidate");
    if (!application) return res.status(404).json({ message: "Application not found." });
    if (String(application.job.recruiter) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only update applicants for your own jobs." });
    }
    application.status = status;
    await application.save();

    await Notification.create({
      user: application.candidate._id,
      message: `${application.job.title} — you were ${status.toLowerCase()}.`
    });
    emitToUser(application.candidate._id, "notification:new", { message: `Your application was ${status.toLowerCase()}.` });
    mailer.sendStatusUpdate(application.candidate, application.job, status).catch(() => {});

    res.json({ application });
  } catch (err) {
    next(err);
  }
}

async function scheduleInterview(req, res, next) {
  try {
    const { scheduledAt, mode, location, notes } = req.body;
    if (!scheduledAt) return res.status(400).json({ message: "A date and time are required." });

    const application = await Application.findById(req.params.id).populate("job").populate("candidate");
    if (!application) return res.status(404).json({ message: "Application not found." });
    if (String(application.job.recruiter) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only schedule interviews for your own jobs." });
    }

    application.interview = {
      status: "scheduled",
      scheduledAt: new Date(scheduledAt),
      mode: mode || "video-call",
      location: location || "",
      notes: notes || ""
    };
    await application.save();

    await Notification.create({
      user: application.candidate._id,
      message: `Interview scheduled for ${application.job.title} on ${new Date(scheduledAt).toLocaleString()}.`
    });
    emitToUser(application.candidate._id, "notification:new", { message: `Interview scheduled for ${application.job.title}.` });
    mailer.sendInterviewInvite(application.candidate, application.job, application.interview).catch(() => {});

    res.json({ application });
  } catch (err) {
    next(err);
  }
}

async function cancelInterview(req, res, next) {
  try {
    const application = await Application.findById(req.params.id).populate("job");
    if (!application) return res.status(404).json({ message: "Application not found." });
    if (String(application.job.recruiter) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only manage interviews for your own jobs." });
    }
    application.interview.status = "cancelled";
    await application.save();
    res.json({ application });
  } catch (err) {
    next(err);
  }
}

async function downloadResume(req, res, next) {
  try {
    const application = await Application.findById(req.params.id).populate("job");
    if (!application) return res.status(404).json({ message: "Application not found." });
    if (!application.resumeStoredFileName) return res.status(404).json({ message: "No resume file was uploaded with this application." });

    const isOwner = String(application.candidate) === String(req.user._id);
    const isJobOwner = application.job && String(application.job.recruiter) === String(req.user._id);
    if (!isOwner && !isJobOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "You don't have access to this file." });
    }

    const filePath = path.join(__dirname, "..", "uploads", application.resumeStoredFileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "This file is no longer available on the server." });

    res.download(filePath, application.resumeFileName || "resume");
  } catch (err) {
    next(err);
  }
}

async function explainApplication(req, res, next) {
  try {
    const application = await Application.findById(req.params.id).populate("job");
    if (!application) return res.status(404).json({ message: "Application not found." });

    const isOwner = String(application.candidate) === String(req.user._id);
    const isJobOwner = application.job && String(application.job.recruiter) === String(req.user._id);
    if (!isOwner && !isJobOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "You don't have access to this explanation." });
    }

    const explanation = await aiClient.explainScore(application.resumeScore, application.videoScore, application.voiceScore);
    if (!explanation) {
      return res.status(503).json({
        message: "The AI explainability service isn't available right now. Set AI_SERVICE_ENABLED=true and start ai-service to enable this."
      });
    }
    res.json({ explanation });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicantsForRecruiter,
  updateApplicationStatus,
  scheduleInterview,
  cancelInterview,
  downloadResume,
  explainApplication
};
