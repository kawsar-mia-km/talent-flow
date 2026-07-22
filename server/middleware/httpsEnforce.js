/**
 * Redirects plain HTTP to HTTPS when FORCE_HTTPS=true. Works whether
 * Node terminates TLS itself or sits behind a reverse proxy/load
 * balancer (Nginx, Render, Heroku, etc.) that sets the standard
 * X-Forwarded-Proto header — `app.set("trust proxy", 1)` in server.js
 * makes Express trust that header. Left off by default so local
 * development over plain http://localhost keeps working.
 */
function httpsEnforce(req, res, next) {
  if (process.env.FORCE_HTTPS !== "true") return next();

  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
  if (isSecure) return next();

  return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
}

module.exports = httpsEnforce;
