const Application = require("../models/Application");
const aiClient = require("../utils/aiClient");

/**
 * Parses a small CSV of {applicationId,groupLabel} uploaded by an admin.
 * No extra dependency needed for this simple, well-defined shape — a
 * general-purpose CSV parser would be overkill and another supply-chain
 * dependency for two columns.
 */
function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idIdx = header.indexOf("applicationid");
  const groupIdx = header.indexOf("grouplabel");
  if (idIdx === -1 || groupIdx === -1) {
    throw new Error("CSV must have 'applicationId' and 'groupLabel' columns.");
  }
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    return { applicationId: cols[idIdx]?.trim(), groupLabel: cols[groupIdx]?.trim() };
  }).filter((r) => r.applicationId && r.groupLabel);
}

async function runFairnessAudit(req, res, next) {
  try {
    if (!aiClient.isEnabled()) {
      return res.status(503).json({
        message: "The AI service isn't enabled. Set AI_SERVICE_ENABLED=true and start ai-service to run fairness audits."
      });
    }
    if (!req.file) return res.status(400).json({ message: "Upload a CSV file with applicationId and groupLabel columns." });

    const rows = parseCsv(req.file.buffer.toString("utf-8"));
    if (rows.length === 0) return res.status(400).json({ message: "No valid rows found in the CSV." });

    const applications = await Application.find({ _id: { $in: rows.map((r) => r.applicationId) } }).select("finalScore");
    const scoreById = new Map(applications.map((a) => [String(a._id), a.finalScore]));

    const records = rows
      .filter((r) => scoreById.has(r.applicationId))
      .map((r) => ({ applicationId: r.applicationId, finalScore: scoreById.get(r.applicationId), groupLabel: r.groupLabel }));

    if (records.length === 0) {
      return res.status(400).json({ message: "None of the applicationIds in the CSV matched an application in the database." });
    }

    const threshold = Number(req.body.threshold) || 70;
    const report = await aiClient.fairnessReport(records, threshold);
    if (!report) return res.status(503).json({ message: "Fairness service did not respond." });

    res.json({ report, matchedRecords: records.length, unmatchedRecords: rows.length - records.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { runFairnessAudit };
