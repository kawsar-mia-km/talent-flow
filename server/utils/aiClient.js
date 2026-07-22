/**
 * Thin HTTP client for the Python AI microservice (see /ai-service).
 * Every function fails soft: if AI_SERVICE_ENABLED is not "true", or the
 * request errors out (service down, timeout, bad file), the caller gets
 * `null` back instead of a thrown error, so the rest of the application
 * can fall back to the simulated scoring in utils/aiEvaluation.js and the
 * candidate's application still goes through.
 */

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const logger = require("./logger");

const ENABLED = String(process.env.AI_SERVICE_ENABLED).toLowerCase() === "true";
const BASE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const TIMEOUT_MS = 60000;

function isEnabled() {
  return ENABLED;
}

async function callWithFile(endpoint, file) {
  if (!ENABLED || !file) return null;
  try {
    const form = new FormData();
    const fileStream = file.buffer ? file.buffer : fs.createReadStream(file.path);
    form.append("file", fileStream, { filename: file.originalname });
    const res = await axios.post(`${BASE_URL}${endpoint}`, form, {
      headers: form.getHeaders(),
      timeout: TIMEOUT_MS,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    return res.data;
  } catch (err) {
    logger.warn(`AI service call to ${endpoint} failed, falling back to simulated scoring`, { error: err.message });
    return null;
  }
}

async function parseResume(file) {
  return callWithFile("/resume/parse", file);
}

async function analyzeVideo(file) {
  return callWithFile("/video/analyze", file);
}

async function analyzeVoice(file) {
  return callWithFile("/voice/analyze", file);
}

async function explainScore(resumeScore, videoScore, voiceScore) {
  if (!ENABLED) return null;
  try {
    const res = await axios.post(`${BASE_URL}/explain`, { resumeScore, videoScore, voiceScore }, { timeout: TIMEOUT_MS });
    return res.data;
  } catch (err) {
    logger.warn("AI service /explain failed", { error: err.message });
    return null;
  }
}

async function fairnessReport(records, threshold) {
  if (!ENABLED) return null;
  try {
    const res = await axios.post(`${BASE_URL}/fairness-report`, { records, threshold }, { timeout: TIMEOUT_MS });
    return res.data;
  } catch (err) {
    logger.warn("AI service /fairness-report failed", { error: err.message });
    return { error: err.response?.data?.detail || err.message };
  }
}

module.exports = { isEnabled, parseResume, analyzeVideo, analyzeVoice, explainScore, fairnessReport };
