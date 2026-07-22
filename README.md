# TalentFlow — AI Recruiter (MERN stack)

A full-stack hiring platform: candidates apply with a resume, video and voice interview; recruiters review AI-generated scores (with real spaCy/MediaPipe/Whisper models when the optional AI service is running, or simulated scoring by default) and shortlist or reject; admins manage the platform and audit scoring fairness. Built with **MongoDB, Express, React (Vite), Node.js**, plus an optional **Python/FastAPI** AI microservice. Fully responsive — works on desktop and mobile browsers.

## Project structure

```
talent-flow-mern/
  server/        Express + MongoDB API
  client/        React (Vite) frontend
  ai-service/    Python FastAPI microservice — real resume/video/voice AI, SHAP explainability, Fairlearn audits
```

## 1. Prerequisites

Install these once on your computer:

- **Node.js** 18+ and npm — [nodejs.org](https://nodejs.org)
- **MongoDB** — either:
  - Install MongoDB Community Server locally ([mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)), or
  - Use a free cloud database at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and copy its connection string
- **PyCharm** (Professional edition has full Node.js/JS support; Community edition works too with the free "Node.js" plugin from Settings → Plugins)

## 2. Open the project in PyCharm

1. `File → Open` and select the `talent-flow-mern` folder (the one containing `server/` and `client/`).
2. PyCharm will index both folders as one project. You can right-click `server` or `client` and "Mark Directory as → Sources Root" if you want cleaner navigation, but it's optional.
3. Open PyCharm's built-in **Terminal** tab (bottom of the window) — you'll use it to run both servers.

## 3. Set up and run the backend (server)

In the PyCharm terminal:

```bash
cd server
npm install
cp .env.example .env
```

Open the new `.env` file and set:
- `MONGO_URI` — `mongodb://127.0.0.1:27017/talentflow` for a local MongoDB, or your Atlas connection string
- `JWT_SECRET` — any long random string (this signs login tokens — keep it secret)

Seed demo data (creates sample users and jobs):

```bash
npm run seed
```

Start the API server:

```bash
npm run dev
```

You should see `TalentFlow API running on port 5000` and `MongoDB connected`.

**Demo logins** (created by the seed script):
| Role | Email | Password |
|---|---|---|
| Candidate | candidate@talentflow.com | candidate123 |
| Recruiter | recruiter@talentflow.com | recruit123 |
| Admin | admin@talentflow.com | admin123 |

## 4. Set up and run the frontend (client)

Open a **second terminal tab** in PyCharm (keep the server running in the first one):

```bash
cd client
npm install
npm run dev
```

Vite will print a local URL, typically `http://localhost:5173`. Open it in your browser — that's the app.

## 5. Optional: turn on real AI (resume parsing, video/voice analysis, explainability, fairness)

By default the app runs with simulated scoring (see section 8) so it works with zero extra setup. To turn on the real models described in the original proposal:

```bash
cd ai-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --port 8000
```

Then in `server/.env`, set:
```
AI_SERVICE_ENABLED=true
AI_SERVICE_URL=http://localhost:8000
```
and restart the server (`npm run dev` in `server/`). Full details, including what each score actually measures and its known limitations, are in `ai-service/README.md` — read it before showing these scores to real recruiters.

With this running you now have **four terminal tabs** in PyCharm: MongoDB (if running locally, usually a background service), `server` (`npm run dev`), `ai-service` (`uvicorn ...`), and `client` (`npm run dev`).

## 6. Using it on your phone (same Wi-Fi)

The dev server is already configured to listen on your network (`host: true` in `vite.config.js`). With both `server` and `client` running:

1. Find your computer's local IP address (e.g. `192.168.1.20`) — on Windows run `ipconfig`, on Mac/Linux run `ifconfig` or `ip addr`.
2. On your phone, connect to the **same Wi-Fi network** as your computer.
3. Open `http://<your-computer-ip>:5173` in your phone's browser.

The UI is fully responsive (built with Tailwind CSS) — sidebar becomes a scrollable tab bar, forms and cards stack for narrow screens.

## 7. Running Node/npm scripts from PyCharm's UI (instead of terminal)

If you prefer clicking over typing:
1. Open `server/package.json` or `client/package.json`.
2. PyCharm shows a small ▶ (run) icon next to each entry under `"scripts"` — click it to run `dev`, `seed`, etc.
3. You can also go to `Run → Edit Configurations → + → npm` and point it at the script for a reusable Run/Debug button.

## 8. Building for production (single deploy, serves both computer and mobile)

```bash
cd client
npm run build
```

This creates `client/dist`. The Express server (`server/server.js`) is already set up to serve that build automatically when it exists, so in production you only need to run the server:

```bash
cd server
npm start
```

Visit `http://<server-address>:5000` — same site works for desktop and mobile browsers, no separate deployment needed.

## 8b. Running everything with Docker

A `docker-compose.yml` at the repo root runs MongoDB, Redis, the AI service, the API, and the client (built and served via Nginx) together:

```bash
docker compose up --build
```

- Client: http://localhost:5173
- API: http://localhost:5000/api/health
- AI service: http://localhost:8000/health

Set a real `JWT_SECRET` via an `.env` file at the repo root (`JWT_SECRET=...`) before using this outside local dev — `docker-compose.yml` reads it from the environment. Uploaded files persist in a named volume (`server-uploads`) and Mongo data in `mongo-data`, so `docker compose down` (without `-v`) keeps your data between runs.

Each service also has its own standalone `Dockerfile` (`server/Dockerfile`, `client/Dockerfile`, `ai-service/Dockerfile`) if you want to build/deploy them independently instead.

## 8c. Testing

```bash
# Server — Jest + Supertest against an in-memory MongoDB (no real DB needed)
cd server && npm test

# Client — Vitest + React Testing Library
cd client && npm test

# AI service — Pytest
cd ai-service && pytest
```

`npm run lint` is available in both `server/` and `client/` (ESLint, with `jsx-a11y` enabled on the client to catch accessibility regressions). A GitHub Actions workflow at `.github/workflows/ci.yml` runs lint + tests (+ the client build) on every push/PR.

## 8d. Logging

The server logs through Winston (`server/utils/logger.js`) instead of raw `console.*` calls — colorized human-readable output in development, single-line JSON in production (`NODE_ENV=production`) so logs are easy to ship to a log aggregator. HTTP access logs are written via `morgan`, piped through the same Winston stream. Control verbosity with `LOG_LEVEL` (`error` | `warn` | `info` | `http` | `debug`).

## 9. What's real vs. simulated

This is a genuinely working full-stack app — real database, real password hashing (bcrypt), real JWT authentication, real REST API, real file uploads.

**AI scoring now has two modes**, controlled by `AI_SERVICE_ENABLED` in `server/.env`:

| Signal | `AI_SERVICE_ENABLED=false` (default) | `AI_SERVICE_ENABLED=true` (ai-service running) |
|---|---|---|
| Resume | Compares the skills you type in against the job's required skills | **Real**: spaCy NER + phrase matching extracts skills from the uploaded PDF/DOCX itself, merged with anything you typed |
| Video | Deterministic placeholder number | **Real**: MediaPipe FaceMesh measures face-detection rate, head stability, eye/mouth movement from actual uploaded video frames |
| Voice | Deterministic placeholder number | **Real**: Whisper transcribes the audio, librosa extracts pitch/energy/pause features for tone, clarity and stress proxies |
| Explainability | Not available | **Real**: SHAP breaks down exactly how much each signal moved the final score |
| Fairness audit | Not available | **Real**: Fairlearn computes selection-rate disparities across admin-supplied group labels |

Every application stores which mode produced its score (`scoringSource: "real" | "simulated"`), shown as a badge on the recruiter's applicant cards, so nothing is presented as more certain than it is.

**Read `ai-service/README.md` before treating any of these scores as ground truth** — it explains exactly what each number does and doesn't measure (e.g. "confidence score" is a literal proxy for face visibility + head stillness + eye openness, not a validated measurement of a candidate's actual confidence), and why they should support a human recruiter's judgment rather than replace it.

## 10. API overview

**Node.js server** (`server/`):

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/register` | Public (rate-limited) |
| POST | `/api/auth/login` | Public (rate-limited) |
| POST | `/api/auth/refresh` | Public — reads the httpOnly refresh cookie, issues a new access token (rate-limited) |
| POST | `/api/auth/logout` | Logged in — revokes the refresh token and clears its cookie |
| GET | `/api/auth/me` | Logged in |
| GET | `/api/jobs` | Public (open jobs) |
| POST | `/api/jobs` | Recruiter |
| PATCH | `/api/jobs/:id` | Recruiter (own job) — edit fields or open/close |
| GET | `/api/jobs/mine` | Recruiter |
| GET | `/api/jobs/admin/all` | Admin |
| POST | `/api/applications` | Candidate (multipart form: `resume`, `video`, `audio` files) |
| GET | `/api/applications/mine` | Candidate |
| GET | `/api/applications/recruiter` | Recruiter |
| PATCH | `/api/applications/:id/status` | Recruiter |
| PATCH | `/api/applications/:id/interview` | Recruiter — schedule an interview |
| DELETE | `/api/applications/:id/interview` | Recruiter — cancel a scheduled interview |
| GET | `/api/applications/:id/resume` | Candidate (own), recruiter (own job), admin — downloads the resume file |
| GET | `/api/applications/:id/explain` | Candidate (own), recruiter (own job), admin |
| GET | `/api/users` | Admin |
| GET | `/api/users/stats` | Admin |
| PATCH | `/api/users/:id/toggle-status` | Admin |
| GET | `/api/notifications/mine` | Logged in |
| POST | `/api/fairness/audit` | Admin (multipart CSV upload) |
| GET | `/api/reports/applicants.xlsx` | Recruiter — Excel export, optional `?jobId=` filter |
| GET | `/api/reports/jobs/:id/report.pdf` | Recruiter (own job) — PDF hiring summary |

**Python AI service** (`ai-service/`, called internally by the Node server — see `ai-service/README.md` for full docs and `/docs` for interactive Swagger UI):

| Method | Route | Purpose |
|---|---|---|
| POST | `/resume/parse` | spaCy skill/experience extraction from a resume file |
| POST | `/video/analyze` | MediaPipe face/engagement metrics from a video file |
| POST | `/voice/analyze` | Whisper transcription + librosa acoustic features from an audio file |
| POST | `/explain` | SHAP breakdown of a final score |
| POST | `/fairness-report` | Fairlearn selection-rate audit across group labels |

## 11. Feature notes (email, interviews, downloads, reports, job editing, pagination)

- **Email notifications** — set `EMAIL_ENABLED=true` and the `SMTP_*` vars in `server/.env` (works with Gmail app passwords, SendGrid, Mailtrap for testing, etc. — see `server/utils/mailer.js`). Candidates get an email when they apply and when their status changes; recruiters get an email when someone new applies. If email isn't configured, everything still works — emails are just skipped and logged to the console, and in-app notifications (the bell icon) always fire regardless.
- **Interview scheduling** — from a recruiter's Applicants tab, click "Schedule interview" on any candidate to set a date/time, mode (video call/phone/onsite), location or link, and notes. The candidate sees it on their "My applications" page and gets an email + in-app notification. Recruiters can cancel a scheduled interview from the same card.
- **Resume download** — candidates, the hiring recruiter, and admins can download the original uploaded resume file from the "Download resume" / "Resume" buttons on the applications/applicants views. Access is checked server-side (`GET /api/applications/:id/resume`) — no one else can fetch someone else's file even if they guess the URL.
- **Downloadable reports** — on a recruiter's "My jobs" page, "PDF report" generates a per-job hiring summary (candidate list, scores, shortlist/reject counts) with `pdfkit`. On the Applicants page, "Export Excel" downloads a spreadsheet of all applicants (optionally filtered to one job) with `exceljs`, ready to open in Excel/Sheets.
- **Job editing/closing** — recruiters can edit a job's title, skills, experience, and description at any time from "My jobs", and toggle it between "open" (visible to candidates, accepting applications) and "closed" (hidden from the public job list, existing applications untouched) without deleting it.
- **Pagination** — the candidate job browser, recruiter's job list, recruiter's applicant list, and admin's user/job lists are all paginated server-side (jobs, users) or with capped result sets plus client-side paging (applicants), so the UI stays fast as the data grows.

## 12. Security

TalentFlow now has several layers of hardening beyond the basics (bcrypt password hashing, JWT auth, server-side authorization checks on every route):

- **Access + refresh tokens** — the access token you see in `localStorage`/`Authorization` headers now expires in 15 minutes (`JWT_ACCESS_EXPIRES_IN`). A separate refresh token lives in an **httpOnly cookie** (JavaScript can't read it, limiting XSS token theft) and is rotated on every use — each refresh invalidates the previous token and issues a new one, and if an already-used (revoked) token is ever replayed, every other active session for that user is revoked too, since that's a strong signal of theft. Only its SHA-256 hash is stored in MongoDB (`server/models/RefreshToken.js`), so a database leak alone can't be replayed. The frontend (`client/src/api/axios.js`) handles all of this silently — a 401 triggers one background refresh + retry, so you generally won't notice the 15-minute expiry as a user. Logging out revokes the refresh token server-side, not just client-side.
- **Rate limiting** (`server/middleware/rateLimiters.js`, `express-rate-limit`) — login/register/refresh are limited to `AUTH_RATE_LIMIT_MAX` attempts per `AUTH_RATE_LIMIT_WINDOW_MIN` minutes per IP (defaults: 10 / 15 min) to blunt brute-force and credential-stuffing. The whole API also has a looser general limit (`API_RATE_LIMIT_MAX`, default 300 / 15 min).
- **Input validation** (`server/middleware/validators/`, `express-validator`) — every request body/param that reaches a controller is validated first (types, required fields, enum values, Mongo ObjectId shape, length caps). Bad input gets a clear 400 with the specific field and reason instead of reaching Mongoose or, worse, silently corrupting data.
- **NoSQL injection protection** — `express-mongo-sanitize` strips any request key starting with `$` or containing `.` globally, so a crafted body like `{"email": {"$gt": ""}}` can't be used to bypass a query.
- **Helmet** — standard security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` when served over HTTPS, etc.) are applied to every response. Content-Security-Policy is on by default in production (off in dev, since Vite's dev server needs a looser policy) — override explicitly with `CSP_ENABLED=true|false`. The directives (`server/app.js`) assume the SPA and API are same-origin; adjust `connectSrc`/`scriptSrc` if you split them across domains or add a CDN.
- **Account lockout** — 5 consecutive failed logins locks the account for 15 minutes (`server/controllers/authController.js`), blunting slow/distributed brute-force attempts that stay under the rate limiter's per-IP threshold.
- **Two-factor authentication (TOTP)** — optional, self-service, works with any authenticator app (Google Authenticator, Authy, 1Password, etc.) via `otplib` — no third-party SMS/push service involved. `POST /auth/2fa/setup` → scan QR → `POST /auth/2fa/verify` to turn it on; once enabled, login returns `twoFactorRequired: true` and a short-lived challenge token instead of a session, which only becomes a session after `POST /auth/2fa/verify-login` with a valid code.
- **Optional CAPTCHA** — set `HCAPTCHA_SECRET` to require a valid hCaptcha token on register/login (`server/utils/captcha.js`); a no-op if unset.
- **Dependency scanning** — Dependabot (`.github/dependabot.yml`) checks npm (server + client), pip (ai-service), Docker base images, and GitHub Actions weekly and opens PRs for vulnerable/outdated dependencies.
- **File upload validation** — uploads are checked twice: the route rejects the wrong file *extension* immediately (`server/routes/applicationRoutes.js`), and then, after the file lands on disk, `server/utils/fileValidation.js` reads its first bytes and confirms the *actual content* matches a real PDF/DOCX/MP4/MP3/etc. signature — so a renamed executable is caught even though its filename looked fine. Invalid files are deleted immediately and the application is rejected with a clear message.
- **No public file serving** — uploaded resumes/videos/audio are **not** served from a static `/uploads` route anymore. The only way to fetch a resume is `GET /api/applications/:id/resume`, which checks you're the candidate who owns it, the recruiter of that job, or an admin — so guessing or sharing a file URL doesn't work.
- **HTTPS enforcement** — set `FORCE_HTTPS=true` in production and any plain HTTP request gets redirected to HTTPS (`server/middleware/httpsEnforce.js`), whether Node terminates TLS itself or sits behind a reverse proxy that sets `X-Forwarded-Proto` (the common setup — Nginx, Render, Heroku, etc.; `app.set("trust proxy", 1)` makes Express trust that header). If you don't have a reverse proxy, set `SSL_KEY_PATH`/`SSL_CERT_PATH` and the server starts its own HTTPS listener directly.
- **CORS is locked to `CLIENT_URL`**, not `*` — required for the httpOnly refresh cookie to work at all (browsers won't send credentialed cookies to a wildcard-origin CORS response), and it also means only your actual frontend can call the API with cookies.

None of this is exotic — it's the standard hardening checklist for a Node/Express API — but every item is wired in and testable today, not left as a TODO.

## 13. UX polish

- **Dark mode** — toggle it from the sun/moon icon in the sidebar (or the header on the landing/login/signup pages). The choice is saved to `localStorage` and respects your OS preference the first time. Implemented with Tailwind's `class` dark-mode strategy (`client/tailwind.config.js`), so it's just CSS — no layout differences between modes.
- **Loading skeletons** — dashboards, tables, and job listings show shaped placeholder blocks (`client/src/components/Skeleton.jsx`) while data loads, instead of a plain "Loading…" line, so the layout doesn't jump once data arrives.
- **Inline form validation** — Login, Signup, job create/edit, the apply wizard, and interview scheduling all show errors under the specific field that's wrong (`client/src/components/FieldError.jsx`), both from client-side checks and from the server's `express-validator` responses (parsed by `client/src/utils/errors.js`), instead of one generic banner at the top.
- **Toast queue** — multiple notifications (e.g. shortlisting several candidates quickly) now stack instead of replacing each other, and each one dismisses independently after a few seconds or on click (`client/src/context/ToastContext.jsx`).
- **Accessibility** — a "Skip to main content" link (visible on keyboard focus) precedes the sidebar on every dashboard; nav items expose `aria-current="page"`; toasts announce through `role="status"`/`role="alert"` live regions so screen readers pick them up without stealing focus; form fields carry real `<label>`s (visually hidden where the placeholder already communicates purpose) wired to their error text via `aria-describedby`; decorative icons are `aria-hidden`; interactive elements get a visible `focus-visible` ring for keyboard navigation. `eslint-plugin-jsx-a11y` runs in CI to catch regressions.
- **Performance** — each top-level route (`Landing`, `Login`, `Signup`, and the three dashboards) is code-split with `React.lazy`/`Suspense`, so a candidate's browser never downloads the recruiter/admin dashboard bundle and vice versa. A top-level `ErrorBoundary` (`client/src/components/ErrorBoundary.jsx`) catches render-time crashes and shows a recoverable "Something went wrong" screen instead of a blank white page.

## 14. What's new: collaboration, matching, and optional integrations

Everything below is self-contained (no external account needed) unless marked **optional/disabled by default**.

**Real-time & collaboration**
- **In-app messaging** — candidates and the hiring recruiter can message each other right on an application (`server/controllers/messageController.js`, `client/src/components/MessageThread.jsx`), scoped so only that application's two participants (or an admin) can read the thread.
- **Live notifications over WebSocket** (`server/utils/socket.js`, Socket.IO) — status changes, interview invites, and new messages push to the browser immediately instead of waiting for a manual refresh. Falls back gracefully (no crash, no infinite retry spam) if the socket can't connect.
- **Team access** — recruiters at the same company (matched on `companyName`) now share edit access to each other's job postings and see one shared "My jobs" list, instead of every posting being locked to whoever originally created it.
- **Internal notes** — recruiters can leave private notes on a candidate's application (`server/models/Note.js`) that are visible to their whole hiring team but **never** to the candidate.
- **Kanban pipeline board** — the Applicants page has a List/Pipeline toggle; Pipeline view is a drag-and-drop board across Submitted → Reviewing → Shortlisted → Rejected that calls the same status-update endpoint as the list view.

**Matching & discovery**
- **Job recommendations** — candidates get a "Recommended for you" panel on their dashboard, ranked by skill overlap with their profile (`server/utils/recommendations.js`, `GET /api/jobs/recommended`). Falls back to skills extracted from their most recent application if they haven't set a profile.
- **Candidate ranking** — `GET /api/jobs/:id/ranked-applicants` blends each applicant's AI `finalScore` with a fresh skill-overlap recheck, so ranking stays sane even if a job's required skills changed after someone applied.
- **Full-text-ish job search** — `GET /api/jobs?search=` now also matches against `requiredSkills`, not just title/company, plus MongoDB indexes (`status+createdAt`, `company+createdAt`, and a text index) for faster queries at scale.
- **Saved searches + email alerts** — candidates can save a search (`POST /api/saved-searches`); running `npm run send-alerts` in `server/` (intended for an external cron / scheduled job) emails a digest of new matching jobs and never repeats a listing already sent.

**CV builder & job-specific prep**
- **CV / resume builder** ("My CV" tab) — a structured profile (headline, summary, experience, education, projects, certifications, links, skills — `server/models/CandidateProfile.js`) that renders into a clean, downloadable PDF (`GET /api/users/me/resume.pdf`, built with `pdfkit`) — separate from the file you upload when applying, so you can maintain one canonical CV without re-typing it into every application.
- **Job-specific prep guide** (the graduation-cap button on any job card) — for that one job, shows exactly which required skills you already have vs are missing, a curated topic list + official-documentation link for each missing skill (`server/utils/skillResources.js` — a hand-curated knowledge base, not an LLM call, so the guidance is consistent and the links are real), your CV-completeness score, and a general interview-readiness checklist (STAR stories, questions to ask, whether the job has a skills assessment to take). Computed entirely from data already in the system — no external AI call.

**Interview experience**
- **Calendar invites** — scheduling an interview now emails a standards-compliant `.ics` attachment (`server/utils/ics.js`) that opens directly in Google Calendar, Outlook, or Apple Calendar. No OAuth or calendar-provider account needed on the server's end.
- **MCQ skills assessments** — recruiters can attach a multiple-choice assessment to a job (`server/models/Assessment.js`); candidates who've applied can take it once and get auto-scored (`server/controllers/assessmentController.js`). Deliberately MCQ-only, not arbitrary code execution — no sandboxing/security surface to manage.

**Compliance & ops**
- **GDPR-style self-service** — `GET /api/users/me/export` downloads everything an account owns as JSON; `DELETE /api/users/me` deletes the account (recruiters must close open jobs first, so no applicant is left pointing at a vanished company).
- **Admin audit log** — every admin action that changes another user's account is recorded (`server/models/AuditLog.js`, `GET /api/users/audit-log`) with actor, action, target, and IP.
- **API docs** — an interactive OpenAPI/Swagger UI is served at `/api/docs` (`server/docs/openapi.json`) covering the whole REST surface.
- **Optional Redis cache** — set `REDIS_URL` and the public job-listing endpoint gets a short-TTL cache with automatic invalidation on create/update; unset, it's a transparent no-op straight to MongoDB. `docker-compose.yml` includes a `redis` service already wired up.
- **PWA** — the client ships a web app manifest + a minimal offline-shell service worker (`client/public/`), so it's installable on mobile/desktop and the UI shell still loads with no network. *(Replace the placeholder icon paths in `manifest.json` with real 192×192/512×512 PNGs before shipping.)*

**Optional integrations — disabled unless you configure them (see `server/.env.example`)**
- **Google "Sign in with Google"** — `GET /api/auth/google` 404s until `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set.
- **Stripe billing** (recruiter "Pro" plan) — `POST /api/billing/checkout` returns 503 until `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID_PRO` are set; the webhook handler at `POST /api/billing/webhook` verifies Stripe's signature and updates `billingPlan` on `checkout.session.completed`/`customer.subscription.deleted`.
- **Sentry error tracking** — no-op until `SENTRY_DSN` is set; once configured, unhandled 5xx errors are reported automatically alongside the existing Winston logs.

**Deliberately out of scope for now** (each is a substantial standalone project): a full JS→TypeScript migration, real WebRTC live-video interviews (needs signaling + TURN infrastructure), Elasticsearch (the Mongo text index above is the pragmatic middle ground), and LinkedIn resume import (requires LinkedIn Partner API access this project doesn't have).

## 15. Troubleshooting

- **"MongoDB connection failed"** — make sure MongoDB is actually running (`mongod` locally) or your Atlas string/IP allowlist is correct.
- **Frontend can't reach the API** — make sure the server is running on port 5000 before starting the client; Vite proxies `/api` to it in dev.
- **Port already in use** — change `PORT` in `server/.env`, the `server.port` in `client/vite.config.js`, or run `uvicorn` on a different `--port` and update `AI_SERVICE_URL` to match.
- **"spaCy model not installed"** — run `python -m spacy download en_core_web_sm` inside the `ai-service` virtual environment.
- **AI calls time out or applications show `scoringSource: "simulated"` even with the service running** — check the `ai-service` terminal for errors, confirm `AI_SERVICE_ENABLED=true` in `server/.env`, and confirm `AI_SERVICE_URL` matches the port `uvicorn` printed.
- **Getting logged out unexpectedly / stuck in a login loop** — this usually means the refresh cookie isn't reaching the server. Confirm `CLIENT_URL` in `server/.env` exactly matches the URL you're opening the app from (including port), and that you haven't blocked third-party or all cookies in your browser for localhost.
- **"Too many attempts from this device"** — you've hit the login/register rate limit (10 per 15 minutes by default). Wait, or raise `AUTH_RATE_LIMIT_MAX` in `server/.env` for local testing.
- **A request gets a 400 with a field name in the message** — that's `express-validator` catching bad input before it reaches the database (e.g. `email: Enter a valid email address.`). Fix the field named in the response.
