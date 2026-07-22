const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const { recordAudit } = require("../utils/auditLog");

async function getAllUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const [users, totalCount] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments()
    ]);
    res.json({
      users: users.map((u) => u.toSafeObject()),
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      totalCount
    });
  } catch (err) {
    next(err);
  }
}

async function toggleUserStatus(req, res, next) {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found." });
    if (String(target._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You can't deactivate your own account." });
    }
    target.status = target.status === "active" ? "inactive" : "active";
    await target.save();

    await recordAudit(req, {
      action: "user.toggle_status",
      targetType: "User",
      targetId: target._id,
      meta: { newStatus: target.status, targetEmail: target.email }
    });

    res.json({ user: target.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

async function getPlatformStats(req, res, next) {
  try {
    const [totalUsers, totalJobs, totalApplications, roleAgg] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])
    ]);
    const roleCounts = { candidate: 0, recruiter: 0, admin: 0 };
    roleAgg.forEach((r) => { roleCounts[r._id] = r.count; });

    const recentApplications = await Application.find()
      .populate("candidate", "name")
      .populate("job", "title")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ totalUsers, totalJobs, totalApplications, roleCounts, recentApplications });
  } catch (err) {
    next(err);
  }
}

/** GDPR-style self-service data export — everything this account owns, as one JSON download. */
async function exportMyData(req, res, next) {
  try {
    const user = req.user;
    const data = { profile: user.toSafeObject(), exportedAt: new Date().toISOString() };

    if (user.role === "candidate") {
      data.applications = await Application.find({ candidate: user._id }).populate("job", "title company");
      data.messages = await Message.find({ sender: user._id });
      data.notifications = await Notification.find({ user: user._id });
    } else if (user.role === "recruiter") {
      const jobs = await Job.find({ recruiter: user._id });
      data.jobs = jobs;
      data.applicants = await Application.find({ job: { $in: jobs.map((j) => j._id) } })
        .populate("candidate", "name email");
      data.messages = await Message.find({ sender: user._id });
    }

    res.setHeader("Content-Disposition", "attachment; filename=talentflow-data-export.json");
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    next(err);
  }
}

/** GDPR-style self-service account deletion. Recruiters must close/delete their open jobs first, so applicants aren't left pointing at a vanished recruiter. */
async function deleteMyAccount(req, res, next) {
  try {
    const user = req.user;

    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin accounts can't self-delete. Ask another admin to remove your account." });
    }

    if (user.role === "recruiter") {
      const openJobs = await Job.countDocuments({ recruiter: user._id, status: "open" });
      if (openJobs > 0) {
        return res.status(409).json({ message: `Close your ${openJobs} open job posting(s) before deleting your account.` });
      }
      await Job.deleteMany({ recruiter: user._id });
    }

    if (user.role === "candidate") {
      await Application.deleteMany({ candidate: user._id });
    }

    await Message.deleteMany({ sender: user._id });
    await Notification.deleteMany({ user: user._id });
    await user.deleteOne();

    res.clearCookie("tf_refresh", { path: "/api/auth" });
    res.json({ message: "Your account and associated data have been deleted." });
  } catch (err) {
    next(err);
  }
}

/** Candidates can maintain a skills profile used for job recommendations. */
async function updateMySkills(req, res, next) {
  try {
    if (req.user.role !== "candidate") {
      return res.status(403).json({ message: "Only candidates have a skills profile." });
    }
    const { skills } = req.body;
    if (!Array.isArray(skills)) return res.status(400).json({ message: "skills must be an array of strings." });

    req.user.skills = skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 50);
    await req.user.save();
    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllUsers, toggleUserStatus, getPlatformStats, exportMyData, deleteMyAccount, updateMySkills };
