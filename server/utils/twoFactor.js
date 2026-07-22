const { authenticator } = require("otplib");
const QRCode = require("qrcode");

authenticator.options = { window: 1 }; // allow 1 step of clock drift (~30s) either side

function generateSecret() {
  return authenticator.generateSecret();
}

function keyUri(email, secret) {
  return authenticator.keyuri(email, "TalentFlow", secret);
}

async function qrCodeDataUrl(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl);
}

function verifyToken(token, secret) {
  if (!token || !secret) return false;
  try {
    return authenticator.verify({ token: String(token).trim(), secret });
  } catch {
    return false;
  }
}

module.exports = { generateSecret, keyUri, qrCodeDataUrl, verifyToken };
