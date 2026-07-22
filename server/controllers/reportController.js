const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const Application = require("../models/Application");
const Job = require("../models/Job");

async function exportApplicantsExcel(req, res, next) {
  try {
    const myJobs = await Job.find({ recruiter: req.user._id }).select("_id title");
    const jobIds = myJobs.map((j) => j._id);
    const filter = { job: { $in: jobIds } };
    if (req.query.jobId) filter.job = req.query.jobId;

    const applications = await Application.find(filter)
      .populate("candidate", "name email")
      .populate("job", "title company")
      .sort({ finalScore: -1 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TalentFlow";
    const sheet = workbook.addWorksheet("Applicants");

    sheet.columns = [
      { header: "Candidate", key: "candidate", width: 24 },
      { header: "Email", key: "email", width: 28 },
      { header: "Job", key: "job", width: 24 },
      { header: "Company", key: "company", width: 20 },
      { header: "Resume score", key: "resumeScore", width: 14 },
      { header: "Video score", key: "videoScore", width: 14 },
      { header: "Voice score", key: "voiceScore", width: 14 },
      { header: "Final score", key: "finalScore", width: 14 },
      { header: "Status", key: "status", width: 14 },
      { header: "Scoring source", key: "scoringSource", width: 16 },
      { header: "Applied at", key: "appliedAt", width: 20 }
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE1F5EE" } };

    applications.forEach((a) => {
      sheet.addRow({
        candidate: a.candidate?.name || "—",
        email: a.candidate?.email || "—",
        job: a.job?.title || "—",
        company: a.job?.company || "—",
        resumeScore: a.resumeScore,
        videoScore: a.videoScore,
        voiceScore: a.voiceScore,
        finalScore: a.finalScore,
        status: a.status,
        scoringSource: a.scoringSource,
        appliedAt: new Date(a.createdAt).toLocaleString()
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=talentflow-applicants.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

async function exportJobReportPdf(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });
    if (String(job.recruiter) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only export reports for your own jobs." });
    }

    const applications = await Application.find({ job: job._id })
      .populate("candidate", "name email")
      .sort({ finalScore: -1 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${job.title.replace(/\s+/g, "-").toLowerCase()}-report.pdf`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(20).fillColor("#0f172a").text("TalentFlow hiring report", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(13).fillColor("#0d9488").text(`${job.title} · ${job.company}`);
    doc.fontSize(10).fillColor("#64748b").text(`Generated ${new Date().toLocaleString()} · ${applications.length} applicant(s)`);
    doc.moveDown(1);

    doc.fontSize(11).fillColor("#334155").text(`Required skills: ${job.requiredSkills.join(", ")}`);
    doc.text(`Experience level: ${job.experience}`);
    doc.moveDown(1);

    const shortlisted = applications.filter((a) => a.status === "Shortlisted").length;
    const rejected = applications.filter((a) => a.status === "Rejected").length;
    const avgScore = applications.length
      ? Math.round(applications.reduce((s, a) => s + a.finalScore, 0) / applications.length)
      : 0;
    doc.fontSize(11).fillColor("#0f172a").text(`Shortlisted: ${shortlisted}   Rejected: ${rejected}   Average score: ${avgScore}`);
    doc.moveDown(1);

    doc.fontSize(13).fillColor("#0f172a").text("Candidates", { underline: true });
    doc.moveDown(0.5);

    applications.forEach((a, i) => {
      doc.fontSize(11).fillColor("#0f172a").text(`${i + 1}. ${a.candidate?.name || "Unknown"}  —  ${a.finalScore}/100  (${a.status})`);
      doc.fontSize(9).fillColor("#64748b").text(
        `   Resume ${a.resumeScore} · Video ${a.videoScore} · Voice ${a.voiceScore} · ${a.candidate?.email || ""}`
      );
      doc.moveDown(0.4);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { exportApplicantsExcel, exportJobReportPdf };
