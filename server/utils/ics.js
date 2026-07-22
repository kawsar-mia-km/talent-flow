const crypto = require("crypto");

function toICSDate(date) {
  return new Date(date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICS(text = "") {
  return String(text).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/**
 * Builds a minimal VCALENDAR/VEVENT text body for an interview.
 * durationMinutes defaults to 45 — long enough for most first-round
 * interviews without guessing too far past what was actually scheduled.
 */
function buildInterviewICS({ uid, title, description, location, startAt, durationMinutes = 45, organizerEmail, attendeeEmail }) {
  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const stamp = toICSDate(new Date());
  const eventUid = uid || `${crypto.randomUUID()}@talentflow`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TalentFlow//Interview Scheduling//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${eventUid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description || "")}`,
    `LOCATION:${escapeICS(location || "")}`
  ];
  if (organizerEmail) lines.push(`ORGANIZER:mailto:${organizerEmail}`);
  if (attendeeEmail) lines.push(`ATTENDEE;RSVP=TRUE:mailto:${attendeeEmail}`);
  lines.push("STATUS:CONFIRMED", "SEQUENCE:0", "END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

module.exports = { buildInterviewICS };
