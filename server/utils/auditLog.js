const AuditLog = require("../models/AuditLog");
const logger = require("./logger");

async function recordAudit(req, { action, targetType = "", targetId = null, meta = {} }) {
  try {
    await AuditLog.create({
      actor: req.user._id,
      actorEmail: req.user.email,
      action,
      targetType,
      targetId,
      meta,
      ip: req.ip
    });
  } catch (err) {
    // Never let audit-log failures block the underlying admin action.
    logger.warn("Failed to record audit log entry", { action, error: err.message });
  }
}

module.exports = { recordAudit };
