const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

const { notFound, errorHandler } = require("./middleware/errorHandler");
const httpsEnforce = require("./middleware/httpsEnforce");
const { apiLimiter } = require("./middleware/rateLimiters");
const logger = require("./utils/logger");
const sentry = require("./utils/sentry");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./docs/openapi.json");

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const fairnessRoutes = require("./routes/fairnessRoutes");
const reportRoutes = require("./routes/reportRoutes");
const savedSearchRoutes = require("./routes/savedSearchRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const { router: billingRoutes, handleWebhook } = require("./routes/billingRoutes");

function createApp() {
  const app = express();
  sentry.init(app); // no-op unless SENTRY_DSN is set

  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

  // Trust the first hop reverse proxy (Nginx, Render, Heroku, etc.) so
  // req.secure / X-Forwarded-* headers and rate-limit IP keys are accurate.
  app.set("trust proxy", 1);

  app.use(httpsEnforce);

  // CSP is opt-in via CSP_ENABLED (defaults on in production, off in dev
  // since Vite's dev server / HMR needs relaxed script-src that we don't
  // want to also ship in production). Everything else in helmet's default
  // set (HSTS, X-Frame-Options, etc.) stays on regardless.
  const cspEnabled = process.env.CSP_ENABLED
    ? process.env.CSP_ENABLED === "true"
    : process.env.NODE_ENV === "production";
  app.use(
    helmet({
      contentSecurityPolicy: cspEnabled
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind's runtime + inline critical CSS
              imgSrc: ["'self'", "data:", "blob:"],
              connectSrc: ["'self'", process.env.CLIENT_URL || "http://localhost:5173"],
              fontSrc: ["'self'", "data:"],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"]
            }
          }
        : false
    })
  );
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true // required so the refresh-token cookie can be sent/received
    })
  );
  app.use(cookieParser());

  // Stripe webhook needs the raw, untouched request body to verify its
  // signature, so it's mounted BEFORE the JSON body parser below.
  app.post("/api/billing/webhook", express.raw({ type: "application/json" }), handleWebhook);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(mongoSanitize()); // strips any request keys starting with "$" or containing "." to block NoSQL injection

  // HTTP access logging piped through Winston. Skipped in tests to keep
  // test output clean.
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("combined", { stream: logger.stream }));
  }

  // NOTE: uploaded files (resumes, videos, audio) are intentionally NOT
  // served from a public static route. They're only reachable through
  // GET /api/applications/:id/resume, which checks the requester is the
  // candidate who owns it, the recruiter of that job, or an admin.

  app.get("/api/health", (req, res) => res.json({ status: "ok", service: "TalentFlow API" }));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: "TalentFlow API Docs" }));

  app.use("/api", apiLimiter);
  app.use("/api/auth", authRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/applications", applicationRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/fairness", fairnessRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/saved-searches", savedSearchRoutes);
  app.use("/api/assessments", assessmentRoutes);
  app.use("/api/billing", billingRoutes);
  // Messaging/notes live under /api/applications/:id/messages|notes — see applicationRoutes.js

  // Serve the built React app in production (single deploy for computer + mobile)
  const clientBuildPath = path.join(__dirname, "..", "client", "dist");
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(clientBuildPath, "index.html"));
    });
  }

  app.use(notFound);
  sentry.errorHandler(app); // no-op unless SENTRY_DSN is set
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
