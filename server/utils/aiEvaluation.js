/**
 * Simulated multimodal AI scoring engine.
 *
 * NOTE: Real facial-expression / voice-stress analysis requires actual
 * computer-vision and audio ML models (as described in the project
 * proposal: OpenCV/MediaPipe, librosa + Whisper, PyTorch fusion layer).
 * Those models need real video/audio files, GPU inference, and training
 * data, which is outside the scope of this scaffold. This module gives
 * you a deterministic, swappable scoring function so the rest of the
 * application (routes, UI, dashboards, status flow) works end-to-end
 * today. Replace `scoreVideo` / `scoreVoice` with real model calls
 * (e.g. a Python microservice) when you're ready to plug in real AI.
 */

function hashScore(str, min, max) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return min + (h % (max - min + 1));
}

function scoreResume(resumeSkillsStr, requiredSkills) {
  const candSkills = (resumeSkillsStr || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const reqSkills = (requiredSkills || []).map((s) => s.toLowerCase());
  const matched = reqSkills.filter((s) => candSkills.includes(s)).length;
  const matchRatio = reqSkills.length ? matched / reqSkills.length : 0;
  const resumeScore = Math.round(48 + matchRatio * 47);
  return { resumeScore, matched, total: reqSkills.length };
}

function scoreVideo(seed) {
  // Placeholder for facial expression / posture / confidence model.
  return hashScore(seed + "video", 60, 95);
}

function scoreVoice(seed) {
  // Placeholder for tone / pitch / stress model.
  return hashScore(seed + "voice", 55, 92);
}

function evaluateApplication({ candidateId, jobId, resumeSkills, requiredSkills }) {
  const seed = String(candidateId) + String(jobId);
  const { resumeScore, matched, total } = scoreResume(resumeSkills, requiredSkills);
  const videoScore = scoreVideo(seed);
  const voiceScore = scoreVoice(seed);
  const finalScore = Math.round(resumeScore * 0.4 + videoScore * 0.35 + voiceScore * 0.25);
  return { resumeScore, videoScore, voiceScore, finalScore, matched, total };
}

module.exports = { evaluateApplication, scoreResume, scoreVideo, scoreVoice };
