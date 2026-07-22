const Assessment = require("../models/Assessment");
const AssessmentSubmission = require("../models/AssessmentSubmission");
const Application = require("../models/Application");
const Job = require("../models/Job");
const Notification = require("../models/Notification");

/** Strips correctIndex before sending a question set to a candidate. */
function sanitizeForCandidate(assessment) {
  const obj = assessment.toObject ? assessment.toObject() : assessment;
  return {
    ...obj,
    questions: obj.questions.map(({ _id, question, options }) => ({ _id, question, options }))
  };
}

async function createAssessment(req, res, next) {
  try {
    const { jobId, title, questions } = req.body;
    if (!jobId || !title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "jobId, title and at least one question are required." });
    }
    for (const q of questions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ message: "Every question needs text and at least 2 options." });
      }
      if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        return res.status(400).json({ message: "Every question needs a valid correctIndex." });
      }
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found." });
    if (String(job.recruiter) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only create assessments for your own job postings." });
    }

    const assessment = await Assessment.create({ job: jobId, recruiter: req.user._id, title, questions });
    res.status(201).json({ assessment });
  } catch (err) {
    next(err);
  }
}

async function listAssessmentsForJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found." });

    const isOwner = req.user.role === "recruiter" && String(job.recruiter) === String(req.user._id);
    const assessments = await Assessment.find({ job: job._id }).sort({ createdAt: -1 });

    res.json({ assessments: isOwner ? assessments : assessments.map(sanitizeForCandidate) });
  } catch (err) {
    next(err);
  }
}

async function getAssessment(req, res, next) {
  try {
    const assessment = await Assessment.findById(req.params.id).populate("job");
    if (!assessment) return res.status(404).json({ message: "Assessment not found." });

    const isOwner = req.user.role === "recruiter" && String(assessment.recruiter) === String(req.user._id);
    res.json({ assessment: isOwner ? assessment : sanitizeForCandidate(assessment) });
  } catch (err) {
    next(err);
  }
}

async function submitAssessment(req, res, next) {
  try {
    const { answers } = req.body;
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ message: "Assessment not found." });
    if (!Array.isArray(answers) || answers.length !== assessment.questions.length) {
      return res.status(400).json({ message: `Expected ${assessment.questions.length} answers.` });
    }

    const application = await Application.findOne({ candidate: req.user._id, job: assessment.job });
    if (!application) {
      return res.status(403).json({ message: "You need to have applied to this job before taking its assessment." });
    }

    const existing = await AssessmentSubmission.findOne({ assessment: assessment._id, candidate: req.user._id });
    if (existing) return res.status(409).json({ message: "You've already submitted this assessment." });

    let correctCount = 0;
    assessment.questions.forEach((q, i) => {
      if (Number(answers[i]) === q.correctIndex) correctCount += 1;
    });
    const score = Math.round((correctCount / assessment.questions.length) * 100);

    const submission = await AssessmentSubmission.create({
      assessment: assessment._id,
      application: application._id,
      candidate: req.user._id,
      answers,
      score,
      correctCount,
      totalCount: assessment.questions.length
    });

    await Notification.create({
      user: assessment.recruiter,
      message: `${req.user.name} scored ${score}% on "${assessment.title}".`
    });

    res.status(201).json({ submission });
  } catch (err) {
    next(err);
  }
}

async function getSubmissionsForAssessment(req, res, next) {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ message: "Assessment not found." });
    if (String(assessment.recruiter) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only view results for your own assessments." });
    }
    const submissions = await AssessmentSubmission.find({ assessment: assessment._id })
      .populate("candidate", "name email")
      .sort({ score: -1 });
    res.json({ submissions });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAssessment,
  listAssessmentsForJob,
  getAssessment,
  submitAssessment,
  getSubmissionsForAssessment
};
