/**
 * Google "Sign in with Google" support. Disabled by default — enable by
 * setting GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_CALLBACK_URL
 * in server/.env (see .env.example). Uses Google's OAuth2 code flow
 * directly via the `google-auth-library` package rather than pulling in
 * all of Passport, since we only need this one provider.
 */
const { OAuth2Client } = require("google-auth-library");

const ENABLED = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

function isEnabled() {
  return ENABLED;
}

function getClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );
}

function getAuthUrl(state) {
  if (!ENABLED) return null;
  const client = getClient();
  return client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    state
  });
}

/** Exchanges an OAuth `code` for the caller's verified Google profile. */
async function verifyCodeAndGetProfile(code) {
  if (!ENABLED) throw new Error("Google login is not configured on this server.");
  const client = getClient();
  const { tokens } = await client.getToken(code);
  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  return { googleId: payload.sub, email: payload.email, name: payload.name };
}

module.exports = { isEnabled, getAuthUrl, verifyCodeAndGetProfile };
