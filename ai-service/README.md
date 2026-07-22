# TalentFlow AI Service

A Python/FastAPI microservice that provides the *real* ML components referenced in the original AI Recruiter proposal:

| Feature | Library | Endpoint |
|---|---|---|
| Resume parsing (skill extraction, experience estimate) | spaCy (NER + PhraseMatcher), pdfplumber | `POST /resume/parse` |
| Video analysis (face detection, head stability, expressiveness) | OpenCV, MediaPipe FaceMesh | `POST /video/analyze` |
| Voice analysis (transcription, tone/stress/clarity proxies) | OpenAI Whisper, librosa | `POST /voice/analyze` |
| Score explainability | SHAP | `POST /explain` |
| Fairness auditing | Fairlearn | `POST /fairness-report` |

## Read this first — what these models actually measure

Facial expression and vocal tone are **not** reliable, validated measurements of confidence, honesty, or competence — psychology research doesn't support that inference, and such systems have known accuracy gaps across accents, cultures, skin tones and disabilities. Every service module in `app/services/` has a docstring explaining exactly what it measures (e.g. "how much the head moved frame-to-frame", not "confidence"). Use these scores as *supporting signals for a human recruiter*, never as an automatic accept/reject decision, and pair them with the `/fairness-report` endpoint to audit for group disparities.

## 1. Setup

Requires **Python 3.10+**.

```bash
cd ai-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Notes on first run:
- `openai-whisper` downloads its model (~140MB for "base") the first time you call `/voice/analyze` — needs internet access once.
- `mediapipe` and `torch` (a Whisper dependency) are large packages; installation can take several minutes.
- If you don't have a GPU, everything still runs on CPU — video/voice analysis will just be slower (a few seconds per clip is typical for short interview answers).

## 2. Run it

```bash
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs` for interactive Swagger docs where you can try every endpoint directly (upload a test PDF/video/audio file from the browser).

## 3. Wire it into the Node.js server

In `server/.env`, set:

```
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_ENABLED=true
```

The Node backend (`server/utils/aiClient.js`) calls this service when `AI_SERVICE_ENABLED=true`, and automatically falls back to the simulated scoring in `server/utils/aiEvaluation.js` if the service is unreachable or disabled — so the app keeps working even before you've set this microservice up.

## 4. Example requests

```bash
curl -X POST http://localhost:8000/resume/parse -F "file=@resume.pdf"
curl -X POST http://localhost:8000/video/analyze -F "file=@interview.mp4"
curl -X POST http://localhost:8000/voice/analyze -F "file=@answer.wav"
curl -X POST http://localhost:8000/explain -H "Content-Type: application/json" \
  -d '{"resumeScore": 82, "videoScore": 76, "voiceScore": 75}'
```

## 5. Performance note

These endpoints run synchronously and can take a few seconds each (Whisper transcription is the slowest). For production traffic, put this behind a task queue (Celery + Redis, as in the original proposal's tools comparison chart) so uploads return immediately and results are delivered via polling or a webhook, instead of holding an HTTP connection open.
