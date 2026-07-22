/**
 * Run this on a schedule (cron, a scheduled GitHub Action, Render Cron
 * Job, etc.) to email candidates a digest of new jobs matching their
 * saved searches:
 *
 *   node server/scripts/sendJobAlerts.js
 *
 * Only jobs created after a search's lastNotifiedAt are included, so
 * candidates never get the same listing twice. No jobs matched -> no
 * email is sent for that search.
 */
require("dotenv").config();
const connectDB = require("../config/db");
const SavedSearch = require("../models/SavedSearch");
const Job = require("../models/Job");
const mailer = require("../utils/mailer");
const logger = require("../utils/logger");
const { matchScore } = require("../utils/recommendations");

async function run() {
  await connectDB();

  const searches = await SavedSearch.find().populate("candidate");
  let emailsSent = 0;

  for (const search of searches) {
    if (!search.candidate) continue; // candidate account was deleted

    const filter = { status: "open", createdAt: { $gt: search.lastNotifiedAt } };
    if (search.query) {
      filter.$or = [
        { title: { $regex: search.query, $options: "i" } },
        { company: { $regex: search.query, $options: "i" } }
      ];
    }

    const candidateJobs = await Job.find(filter).sort({ createdAt: -1 }).limit(20);
    const matched = search.skills.length
      ? candidateJobs.filter((j) => matchScore(search.skills, j.requiredSkills).score > 0)
      : candidateJobs;

    if (matched.length > 0) {
      const result = await mailer.sendJobAlertDigest(search.candidate, matched, search.label);
      if (result.sent) emailsSent += 1;
    }

    search.lastNotifiedAt = new Date();
    await search.save();
  }

  logger.info(`Job alert digest complete: ${emailsSent} email(s) sent across ${searches.length} saved search(es).`);
  process.exit(0);
}

run().catch((err) => {
  logger.error("Job alert digest failed", { error: err.message });
  process.exit(1);
});
