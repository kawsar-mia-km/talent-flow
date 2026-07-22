const Job = require("../models/Job");
const Application = require("../models/Application");
const CandidateProfile = require("../models/CandidateProfile");
const Assessment = require("../models/Assessment");
const { recommendJobsForCandidate, rankApplicantsForJob, matchScore } = require("../utils/recommendations");
const { getSkillPrep } = require("../utils/skillResources");
const { computeCompleteness } = require("./candidateProfileController");
const cache = require("../utils/cache");

function getPagination(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 9));
  return { page, limit, skip: (page - 1) * limit };
}

async function createJob(req, res, next) {
  try {
    const { title, requiredSkills, experience, description } = req.body;
    if (!title || !requiredSkills) return res.status(400).json({ message: "Title and required skills are needed." });

    const skillsArray = Array.isArray(requiredSkills)
      ? requiredSkills
      : String(requiredSkills).split(",").map((s) => s.trim()).filter(Boolean);

    const job = await Job.create({
      title,
      company: req.user.companyName || "Independent",
      requiredSkills: skillsArray,
      experience,
      description,
      recruiter: req.user._id
    });
    await cache.invalidatePrefix("jobs:open:");
    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
}

async function updateJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });

    // Ownership OR same-company team access — any recruiter at the
    // company that owns this job can edit it, not just whoever originally
    // posted it, so a hiring team can actually collaborate.
    const isOwner = String(job.recruiter) === String(req.user._id);
    const isTeammate = req.user.companyName && job.company === req.user.companyName;
    if (!isOwner && !isTeammate) {
      return res.status(403).json({ message: "You can only edit job postings from your own company." });
    }

    const { title, requiredSkills, experience, description, status } = req.body;
    if (title !== undefined) job.title = title;
    if (requiredSkills !== undefined) {
      job.requiredSkills = Array.isArray(requiredSkills)
        ? requiredSkills
        : String(requiredSkills).split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (experience !== undefined) job.experience = experience;
    if (description !== undefined) job.description = description;
    if (status !== undefined) {
      if (!["open", "closed"].includes(status)) return res.status(400).json({ message: "Status must be 'open' or 'closed'." });
      job.status = status;
    }

    await job.save();
    await cache.invalidatePrefix("jobs:open:");
    res.json({ job });
  } catch (err) {
    next(err);
  }
}

async function getOpenJobs(req, res, next) {
  try {
    const { search } = req.query;
    const { page, limit, skip } = getPagination(req);
    const cacheKey = `jobs:open:${search || ""}:${page}:${limit}`;

    const cached = await cache.getCached(cacheKey);
    if (cached) return res.json(cached);

    const filter = { status: "open" };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { requiredSkills: { $regex: search, $options: "i" } }
      ];
    }
    const [jobs, totalCount] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(filter)
    ]);
    const payload = { jobs, page, totalPages: Math.max(1, Math.ceil(totalCount / limit)), totalCount };

    await cache.setCached(cacheKey, payload, 30); // short TTL — new/closed jobs show up within 30s
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

/** Jobs posted by anyone on the requesting recruiter's team (same companyName), not just themselves. */
async function getMyJobs(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req);
    const filter = req.user.companyName
      ? { company: req.user.companyName }
      : { recruiter: req.user._id };
    const [jobs, totalCount] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(filter)
    ]);
    const jobIds = jobs.map((j) => j._id);
    const counts = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: "$job", count: { $sum: 1 } } }
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    const jobsWithCounts = jobs.map((j) => ({ ...j.toObject(), applicantCount: countMap[String(j._id)] || 0 }));
    res.json({ jobs: jobsWithCounts, page, totalPages: Math.max(1, Math.ceil(totalCount / limit)), totalCount });
  } catch (err) {
    next(err);
  }
}

async function getJobById(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });
    res.json({ job });
  } catch (err) {
    next(err);
  }
}

async function getAllJobsAdmin(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req);
    const [jobs, totalCount] = await Promise.all([
      Job.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments()
    ]);
    const jobIds = jobs.map((j) => j._id);
    const counts = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: "$job", count: { $sum: 1 } } }
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    const jobsWithCounts = jobs.map((j) => ({ ...j.toObject(), applicantCount: countMap[String(j._id)] || 0 }));
    res.json({ jobs: jobsWithCounts, page, totalPages: Math.max(1, Math.ceil(totalCount / limit)), totalCount });
  } catch (err) {
    next(err);
  }
}

/** Ranks open jobs by overlap with the candidate's skill profile (falls back to their most recent application's extracted skills). */
async function getRecommendedJobs(req, res, next) {
  try {
    let candidateSkills = req.user.skills || [];
    if (candidateSkills.length === 0) {
      const recentApp = await Application.findOne({ candidate: req.user._id }).sort({ createdAt: -1 });
      if (recentApp) {
        candidateSkills = recentApp.extractedSkills?.length
          ? recentApp.extractedSkills
          : (recentApp.resumeSkills || "").split(",");
      }
    }

    const openJobs = await Job.find({ status: "open" }).sort({ createdAt: -1 }).limit(200);
    const recommendations = recommendJobsForCandidate(candidateSkills, openJobs, 10);

    res.json({ recommendations, usedSkillProfile: candidateSkills });
  } catch (err) {
    next(err);
  }
}

/** Ranks a job's applicants by a blend of their AI score and a fresh skill-overlap recheck. */
async function getRankedApplicants(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });
    const isOwner = String(job.recruiter) === String(req.user._id);
    const isTeammate = req.user.companyName && job.company === req.user.companyName;
    if (!isOwner && !isTeammate && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only rank applicants for your own company's jobs." });
    }

    const applications = await Application.find({ job: job._id }).populate("candidate", "name email");
    const ranked = rankApplicantsForJob(applications, job.requiredSkills);
    res.json({ ranked });
  } catch (err) {
    next(err);
  }
}

/**
 * Everything a candidate needs to prepare for one specific job: which
 * required skills they already have vs are missing, curated prep
 * resources for each missing skill, a CV-completeness nudge, and a
 * general interview-readiness checklist. All computed from data already
 * in the system — no external AI call involved.
 */
async function getJobPrepGuide(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });

    let candidateSkills = req.user.skills || [];
    if (candidateSkills.length === 0) {
      const recentApp = await Application.findOne({ candidate: req.user._id, job: job._id }).sort({ createdAt: -1 });
      if (recentApp) {
        candidateSkills = recentApp.extractedSkills?.length
          ? recentApp.extractedSkills
          : (recentApp.resumeSkills || "").split(",");
      }
    }

    const { matched, total } = matchScore(candidateSkills, job.requiredSkills);
    const normalizedMatched = new Set(matched);
    const missingSkills = job.requiredSkills.filter((s) => !normalizedMatched.has(s.trim().toLowerCase()));

    const skillGuides = job.requiredSkills.map((skill) => ({
      skill,
      have: normalizedMatched.has(skill.trim().toLowerCase()),
      ...getSkillPrep(skill)
    }));

    const profile = await CandidateProfile.findOne({ candidate: req.user._id });
    const cvCompleteness = profile ? computeCompleteness(profile, req.user.skills) : 0;

    const assessment = await Assessment.findOne({ job: job._id }).select("title questions");

    const checklist = [
      "Read the full job description and note every required skill, not just the headline ones.",
      cvCompleteness < 60
        ? "Your CV profile looks incomplete — fill in a summary, experience, and links before applying (My CV tab)."
        : "Your CV profile is in good shape — review it once more for typos and recent updates.",
      missingSkills.length > 0
        ? `Brush up on ${missingSkills.length} skill(s) you're missing: ${missingSkills.join(", ")}.`
        : "You already cover every listed required skill — focus your prep on depth, not breadth.",
      "Prepare 2-3 STAR-format stories (Situation, Task, Action, Result) from past work relevant to this role.",
      "Prepare 2-3 thoughtful questions to ask the interviewer about the team and role.",
      assessment
        ? `This job has a skills assessment ("${assessment.title}", ${assessment.questions.length} questions) — take it once you've applied.`
        : "Do a resume walkthrough out loud — be ready to explain any project or gap in under a minute."
    ];

    res.json({
      job: { id: job._id, title: job.title, company: job.company, experience: job.experience },
      skillGap: { matchedCount: matched.length, totalRequired: total, missingSkills },
      skillGuides,
      cvCompleteness,
      checklist,
      hasAssessment: !!assessment
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createJob,
  updateJob,
  getOpenJobs,
  getMyJobs,
  getJobById,
  getAllJobsAdmin,
  getRecommendedJobs,
  getRankedApplicants,
  getJobPrepGuide
};
