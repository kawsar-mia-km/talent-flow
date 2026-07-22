/**
 * Extension checks alone trust the filename, which anyone can fake
 * (rename a .exe to resume.pdf). This module reads the first bytes of an
 * uploaded file — its "magic number" — and confirms the content actually
 * matches a known-safe file type before we treat it as a real resume,
 * video, or audio clip. No external dependency needed: these signatures
 * are stable and well documented.
 */

const fs = require("fs");

const SIGNATURES = {
  pdf: [{ bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 }], // %PDF
  docx: [{ bytes: [0x50, 0x4b, 0x03, 0x04], offset: 0 }], // ZIP container (docx/xlsx/pptx are all zip-based)
  mp4: [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }], // ....ftyp
  webm: [{ bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0 }],
  mov: [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }], // QuickTime also uses an ftyp box
  avi: [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }], // RIFF....AVI
  mp3: [
    { bytes: [0x49, 0x44, 0x33], offset: 0 }, // ID3 tag
    { bytes: [0xff, 0xfb], offset: 0 }, // MPEG frame sync (no ID3 tag)
    { bytes: [0xff, 0xf3], offset: 0 },
    { bytes: [0xff, 0xf2], offset: 0 }
  ],
  wav: [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }], // RIFF....WAVE
  m4a: [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }],
  ogg: [{ bytes: [0x4f, 0x67, 0x67, 0x53], offset: 0 }] // OggS
};

const CATEGORY_TYPES = {
  resume: ["pdf", "docx"],
  video: ["mp4", "webm", "mov", "avi"],
  audio: ["mp3", "wav", "m4a", "ogg"]
};

function matchesSignature(buffer, sig) {
  return sig.every(({ bytes, offset }) => bytes.every((b, i) => buffer[offset + i] === b));
}

function detectType(buffer) {
  for (const [type, sigList] of Object.entries(SIGNATURES)) {
    if (sigList.some((sig) => matchesSignature(buffer, sig))) return type;
  }
  return null;
}

/**
 * Reads the first 16 bytes of a saved file and checks it matches one of
 * the expected types for its category. Returns { valid, detectedType }.
 * Plain-text resumes (.txt) are allowed without a signature check since
 * there's no consistent magic number for arbitrary text.
 */
function validateUploadedFile(filePath, category, originalName) {
  if (category === "resume" && originalName.toLowerCase().endsWith(".txt")) {
    return { valid: true, detectedType: "txt" };
  }
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(16);
  fs.readSync(fd, buffer, 0, 16, 0);
  fs.closeSync(fd);

  const detectedType = detectType(buffer);
  const allowed = CATEGORY_TYPES[category] || [];
  return { valid: !!detectedType && allowed.includes(detectedType), detectedType };
}

module.exports = { validateUploadedFile, CATEGORY_TYPES };
