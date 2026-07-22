const AuditLog = require("../models/AuditLog");

async function listAuditLog(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const [entries, totalCount] = await Promise.all([
      AuditLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      AuditLog.countDocuments()
    ]);
    res.json({ entries, page, totalPages: Math.max(1, Math.ceil(totalCount / limit)), totalCount });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAuditLog };
