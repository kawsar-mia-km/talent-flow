/**
 * Lightweight, fully self-hosted recommendation logic based on skill-set
 * overlap (Jaccard-style match ratio). This intentionally avoids any
 * external ML/vector-search service — for a taxonomy this small it's a
 * transparent, explainable heuristic that's easy for a recruiter or
 * candidate to sanity-check ("matched 4 of 6 skills"), which matters more
 * here than marginal ranking accuracy from a black-box model.
 */

function normalizeSkills(skills) {
  return Array.from(new Set((skills || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean)));
}

/** How well a candidate's skill set covers a job's required skills, 0-100. */
function matchScore(candidateSkills, requiredSkills) {
  const cand = new Set(normalizeSkills(candidateSkills));
  const req = normalizeSkills(requiredSkills);
  if (req.length === 0) return { score: 0, matched: [], total: 0 };

  const matched = req.filter((s) => cand.has(s));
  const score = Math.round((matched.length / req.length) * 100);
  return { score, matched, total: req.length };
}

/** Ranks open jobs by how well they match a candidate's skill profile. */
function recommendJobsForCandidate(candidateSkills, openJobs, limit = 10) {
  return openJobs
    .map((job) => {
      const { score, matched, total } = matchScore(candidateSkills, job.requiredSkills);
      return { job, matchScore: score, matchedSkillCount: matched.length, totalRequiredSkills: total };
    })
    .filter((r) => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/** Ranks a job's applicants, blending their AI finalScore with a fresh skill-overlap check. */
function rankApplicantsForJob(applications, requiredSkills) {
  return applications
    .map((app) => {
      const candidateSkills = app.extractedSkills?.length ? app.extractedSkills : (app.resumeSkills || "").split(",");
      const { score } = matchScore(candidateSkills, requiredSkills);
      // Blend: mostly trust the full multimodal finalScore, nudge by a
      // fresh skill-overlap recompute so ranking stays consistent even if
      // requiredSkills changed after the candidate applied.
      const blended = Math.round((app.finalScore || 0) * 0.8 + score * 0.2);
      return { application: app, skillMatchScore: score, rankingScore: blended };
    })
    .sort((a, b) => b.rankingScore - a.rankingScore);
}

module.exports = { normalizeSkills, matchScore, recommendJobsForCandidate, rankApplicantsForJob };
