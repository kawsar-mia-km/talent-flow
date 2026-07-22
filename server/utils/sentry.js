/**
 * Optional Sentry error tracking. Every function is a safe no-op unless
 * SENTRY_DSN is set in server/.env, so the app behaves identically to
 * before if you never configure it.
 */
const ENABLED = !!process.env.SENTRY_DSN;
let Sentry = null;

function init(app) {
  if (!ENABLED) return;
  Sentry = require("@sentry/node");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1
  });
  if (app) app.use(Sentry.Handlers.requestHandler());
}

function errorHandler(app) {
  if (!ENABLED || !Sentry || !app) return;
  app.use(Sentry.Handlers.errorHandler());
}

function captureException(err) {
  if (!ENABLED || !Sentry) return;
  Sentry.captureException(err);
}

function isEnabled() {
  return ENABLED;
}

module.exports = { init, errorHandler, captureException, isEnabled };
