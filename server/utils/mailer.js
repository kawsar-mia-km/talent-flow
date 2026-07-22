/**
 * Thin wrapper around nodemailer. Fails soft: if EMAIL_ENABLED isn't
 * "true" or sending errors out (bad credentials, SMTP down), we log a
 * warning and resolve normally instead of throwing — a flaky mail
 * provider should never block a candidate's application or a
 * recruiter's shortlist action. In-app notifications (the Notification
 * model) always work regardless of email config.
 */

const nodemailer = require("nodemailer");
const logger = require("./logger");

const ENABLED = String(process.env.EMAIL_ENABLED).toLowerCase() === "true";

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transporter;
}

function baseTemplate(title, bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <div style="background:#0d9488; padding: 16px 24px; border-radius: 10px 10px 0 0;">
        <span style="color:#fff; font-weight:700; font-size:18px;">TalentFlow</span>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; padding: 24px;">
        <h2 style="margin-top:0; font-size:17px;">${title}</h2>
        ${bodyHtml}
        <p style="color:#94a3b8; font-size:12px; margin-top:24px;">This is an automated message from TalentFlow.</p>
      </div>
    </div>
  `;
}

async function sendEmail({ to, subject, html, attachments }) {
  if (!ENABLED) {
    logger.debug(`[email disabled] would have sent "${subject}" to ${to}`);
    return { sent: false, reason: "disabled" };
  }
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      attachments
    });
    return { sent: true };
  } catch (err) {
    logger.warn("Email send failed", { error: err.message });
    return { sent: false, reason: err.message };
  }
}

async function sendApplicationConfirmation(candidate, job, application) {
  return sendEmail({
    to: candidate.email,
    subject: `Application received — ${job.title}`,
    html: baseTemplate(
      `You applied to ${job.title}`,
      `<p>Hi ${candidate.name.split(" ")[0]},</p>
       <p>Your application to <strong>${job.title}</strong> at ${job.company} has been received.
       Your AI evaluation score is <strong>${application.finalScore}/100</strong>.</p>
       <p>You can track its status any time from your TalentFlow dashboard.</p>`
    )
  });
}

async function sendNewApplicantAlert(recruiter, job, candidate, application) {
  return sendEmail({
    to: recruiter.email,
    subject: `New applicant for ${job.title}`,
    html: baseTemplate(
      `${candidate.name} applied to ${job.title}`,
      `<p>Final AI score: <strong>${application.finalScore}/100</strong></p>
       <p>Review this candidate from your Applicants dashboard.</p>`
    )
  });
}

async function sendStatusUpdate(candidate, job, status) {
  return sendEmail({
    to: candidate.email,
    subject: `Update on your application — ${job.title}`,
    html: baseTemplate(
      `Your application was ${status.toLowerCase()}`,
      `<p>Hi ${candidate.name.split(" ")[0]},</p>
       <p>Your application to <strong>${job.title}</strong> at ${job.company} has been
       <strong>${status.toLowerCase()}</strong>.</p>`
    )
  });
}

async function sendInterviewInvite(candidate, job, interview) {
  const when = new Date(interview.scheduledAt).toLocaleString();
  const { buildInterviewICS } = require("./ics");
  const ics = buildInterviewICS({
    title: `Interview: ${job.title} at ${job.company}`,
    description: interview.notes || `Interview for ${job.title}.`,
    location: interview.location || interview.mode,
    startAt: interview.scheduledAt,
    organizerEmail: process.env.SMTP_FROM || process.env.SMTP_USER,
    attendeeEmail: candidate.email
  });

  return sendEmail({
    to: candidate.email,
    subject: `Interview scheduled — ${job.title}`,
    html: baseTemplate(
      `You're invited to interview for ${job.title}`,
      `<p>Hi ${candidate.name.split(" ")[0]},</p>
       <p><strong>When:</strong> ${when}<br/>
       <strong>Mode:</strong> ${interview.mode}<br/>
       ${interview.location ? `<strong>Location/link:</strong> ${interview.location}<br/>` : ""}
       </p>
       ${interview.notes ? `<p><strong>Notes from the recruiter:</strong> ${interview.notes}</p>` : ""}
       <p style="color:#94a3b8; font-size:12px;">A calendar invite (.ics) is attached — add it to Google Calendar, Outlook, or Apple Calendar.</p>`
    ),
    attachments: [{ filename: "interview.ics", content: ics, contentType: "text/calendar" }]
  });
}

async function sendJobAlertDigest(candidate, jobs, searchLabel) {
  const rows = jobs
    .map(
      (j) =>
        `<li style="margin-bottom:8px;"><strong>${j.title}</strong> — ${j.company}<br/>
         <span style="color:#64748b; font-size:13px;">${(j.requiredSkills || []).join(", ")}</span></li>`
    )
    .join("");

  return sendEmail({
    to: candidate.email,
    subject: `${jobs.length} new job${jobs.length === 1 ? "" : "s"} matching "${searchLabel}"`,
    html: baseTemplate(
      `New matches for "${searchLabel}"`,
      `<p>Hi ${candidate.name.split(" ")[0]},</p>
       <p>New open roles matching your saved search:</p>
       <ul style="padding-left:18px;">${rows}</ul>
       <p>Log in to TalentFlow to view and apply.</p>`
    )
  });
}

module.exports = {
  sendEmail,
  sendApplicationConfirmation,
  sendNewApplicantAlert,
  sendStatusUpdate,
  sendInterviewInvite,
  sendJobAlertDigest
};
