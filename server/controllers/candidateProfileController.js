const PDFDocument = require("pdfkit");
const CandidateProfile = require("../models/CandidateProfile");

async function getMyProfile(req, res, next) {
  try {
    let profile = await CandidateProfile.findOne({ candidate: req.user._id });
    if (!profile) profile = await CandidateProfile.create({ candidate: req.user._id });
    res.json({ profile, skills: req.user.skills || [] });
  } catch (err) {
    next(err);
  }
}

const ALLOWED_FIELDS = ["headline", "summary", "phone", "location", "links", "experience", "education", "projects", "certifications"];

async function updateMyProfile(req, res, next) {
  try {
    const update = {};
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }

    const profile = await CandidateProfile.findOneAndUpdate(
      { candidate: req.user._id },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

/** How complete the profile is (0-100) — used to nudge candidates toward a stronger CV before applying. */
function computeCompleteness(profile, skills) {
  const checks = [
    !!profile.headline,
    !!profile.summary,
    (skills || []).length > 0,
    (profile.experience || []).length > 0,
    (profile.education || []).length > 0,
    !!(profile.links?.linkedin || profile.links?.github || profile.links?.portfolio)
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

async function generateResumePdf(req, res, next) {
  try {
    const profile = await CandidateProfile.findOne({ candidate: req.user._id });
    if (!profile || computeCompleteness(profile, req.user.skills) < 20) {
      return res.status(400).json({ message: "Add at least a headline, summary, or one experience entry before downloading your CV." });
    }

    const user = req.user;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${user.name.replace(/\s+/g, "-").toLowerCase()}-resume.pdf`);

    const doc = new PDFDocument({ margin: 45 });
    doc.pipe(res);

    doc.fontSize(22).fillColor("#0f172a").text(user.name);
    if (profile.headline) doc.fontSize(12).fillColor("#0d9488").text(profile.headline);

    const contactLine = [user.email, profile.phone, profile.location].filter(Boolean).join("  ·  ");
    if (contactLine) doc.fontSize(9).fillColor("#64748b").text(contactLine);

    const linkLine = [profile.links?.linkedin, profile.links?.github, profile.links?.portfolio].filter(Boolean).join("  ·  ");
    if (linkLine) doc.fontSize(9).fillColor("#64748b").text(linkLine);

    doc.moveDown(1);

    function sectionHeader(title) {
      doc.moveDown(0.6);
      doc.fontSize(13).fillColor("#0f172a").text(title, { underline: true });
      doc.moveDown(0.3);
    }

    if (profile.summary) {
      sectionHeader("Summary");
      doc.fontSize(10).fillColor("#334155").text(profile.summary);
    }

    if ((user.skills || []).length > 0) {
      sectionHeader("Skills");
      doc.fontSize(10).fillColor("#334155").text(user.skills.join("  ·  "));
    }

    if ((profile.experience || []).length > 0) {
      sectionHeader("Experience");
      profile.experience.forEach((exp) => {
        const dates = `${exp.startDate || ""} – ${exp.current ? "Present" : exp.endDate || ""}`;
        doc.fontSize(11).fillColor("#0f172a").text(`${exp.title} · ${exp.company}`, { continued: false });
        doc.fontSize(9).fillColor("#64748b").text(dates);
        if (exp.description) doc.fontSize(10).fillColor("#334155").text(exp.description);
        doc.moveDown(0.5);
      });
    }

    if ((profile.education || []).length > 0) {
      sectionHeader("Education");
      profile.education.forEach((edu) => {
        const years = [edu.startYear, edu.endYear].filter(Boolean).join(" – ");
        doc.fontSize(11).fillColor("#0f172a").text(`${edu.degree ? edu.degree + ", " : ""}${edu.school}`);
        doc.fontSize(9).fillColor("#64748b").text([edu.field, years].filter(Boolean).join("  ·  "));
        doc.moveDown(0.4);
      });
    }

    if ((profile.projects || []).length > 0) {
      sectionHeader("Projects");
      profile.projects.forEach((proj) => {
        doc.fontSize(11).fillColor("#0f172a").text(proj.name);
        if (proj.description) doc.fontSize(10).fillColor("#334155").text(proj.description);
        if (proj.link) doc.fontSize(9).fillColor("#0d9488").text(proj.link);
        doc.moveDown(0.4);
      });
    }

    if ((profile.certifications || []).length > 0) {
      sectionHeader("Certifications");
      profile.certifications.forEach((cert) => {
        doc.fontSize(10).fillColor("#334155").text(`${cert.name}${cert.issuer ? " — " + cert.issuer : ""}${cert.year ? " (" + cert.year + ")" : ""}`);
      });
    }

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyProfile, updateMyProfile, generateResumePdf, computeCompleteness };
