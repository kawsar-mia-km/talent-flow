import { useState } from "react";
import { CheckCircle, XCircle, Sparkles, FileText, ChevronDown, ChevronUp, Download, CalendarClock, Ban, LayoutGrid, List } from "lucide-react";
import api from "../../api/axios";
import { ScoreBar, STATUS_STYLES } from "../../components/StatCard";
import Pagination from "../../components/Pagination";
import MessageThread from "../../components/MessageThread";
import { useToast } from "../../context/ToastContext";
import { downloadFile } from "../../utils/download";
import FieldError, { inputErrorClass } from "../../components/FieldError";
import { getGenericMessage } from "../../utils/errors";

const PAGE_SIZE = 6;
const KANBAN_STATUSES = ["Submitted", "Reviewing", "Shortlisted", "Rejected"];

function ScheduleInterviewModal({ app, onClose, onScheduled }) {
  const notify = useToast();
  const [scheduledAt, setScheduledAt] = useState("");
  const [mode, setMode] = useState("video-call");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!scheduledAt) { setDateError("Pick a date and time for the interview."); return; }
    if (new Date(scheduledAt) < new Date()) { setDateError("Choose a time in the future."); return; }
    setDateError("");
    setSaving(true);
    try {
      await api.patch(`/applications/${app._id}/interview`, { scheduledAt, mode, location, notes });
      notify("Interview scheduled and the candidate has been notified.");
      onScheduled();
      onClose();
    } catch (err) {
      notify(getGenericMessage(err, "Couldn't schedule the interview."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4">
      <form onSubmit={submit} noValidate className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">Schedule interview with {app.candidate?.name}</h3>
        <div className="space-y-3">
          <div>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => { setScheduledAt(e.target.value); setDateError(""); }}
              aria-invalid={!!dateError}
              className={"w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 " + inputErrorClass(dateError)}
            />
            <FieldError message={dateError} />
          </div>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100">
            <option value="video-call">Video call</option>
            <option value="phone">Phone</option>
            <option value="onsite">Onsite</option>
          </select>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Meeting link or address" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes for the candidate (optional)" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100" />
        </div>
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium py-2.5 rounded-lg">Cancel</button>
          <button disabled={saving} type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg">
            {saving ? "Scheduling…" : "Schedule"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ApplicantCard({ a, onUpdateStatus, onScheduled }) {
  const notify = useToast();
  const [expanded, setExpanded] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  async function loadExplanation() {
    if (explanation) { setExpanded((v) => !v); return; }
    setLoadingExplain(true);
    try {
      const res = await api.get(`/applications/${a._id}/explain`);
      setExplanation(res.data.explanation);
      setExpanded(true);
    } catch (err) {
      notify(err.response?.data?.message || "Explanation isn't available right now.", "error");
    } finally {
      setLoadingExplain(false);
    }
  }

  async function handleDownloadResume() {
    try {
      await downloadFile(`/applications/${a._id}/resume`, a.resumeFileName || "resume");
    } catch (err) {
      notify("Couldn't download this resume.", "error");
    }
  }

  async function cancelInterview() {
    try {
      await api.delete(`/applications/${a._id}/interview`);
      notify("Interview cancelled.");
      onScheduled();
    } catch (err) {
      notify("Couldn't cancel the interview.", "error");
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            {a.candidate?.name}
            <span className={"text-[10px] font-medium px-1.5 py-0.5 rounded-full " + (a.scoringSource === "real" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
              {a.scoringSource === "real" ? "Real AI scoring" : "Simulated scoring"}
            </span>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">{a.job?.title} · applied {new Date(a.createdAt).toLocaleDateString()}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">{a.finalScore}</span>
          <span className={"text-xs font-medium px-2 py-1 rounded-full " + STATUS_STYLES[a.status]}>{a.status}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-3">
        <ScoreBar label="Resume match" value={a.resumeScore} colorClass="bg-blue-500" />
        <ScoreBar label="Video signal" value={a.videoScore} colorClass="bg-teal-500" />
        <ScoreBar label="Voice signal" value={a.voiceScore} colorClass="bg-amber-500" />
      </div>

      {a.extractedSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {a.extractedSkills.map((s) => (
            <span key={s} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">{s}</span>
          ))}
        </div>
      )}

      {a.interview?.status === "scheduled" && (
        <div className="bg-teal-50 dark:bg-teal-950 border border-teal-100 rounded-lg px-3 py-2 mb-3 text-xs text-teal-800 dark:text-teal-200 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <CalendarClock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Interview: {new Date(a.interview.scheduledAt).toLocaleString()}</div>
              <div className="text-teal-700 dark:text-teal-300">{a.interview.mode}{a.interview.location ? ` · ${a.interview.location}` : ""}</div>
            </div>
          </div>
          <button onClick={cancelInterview} className="text-teal-700 dark:text-teal-300 hover:text-rose-600 shrink-0" aria-label="Cancel interview"><Ban className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap mb-3">
        <button onClick={loadExplanation} disabled={loadingExplain} className="text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {loadingExplain ? "Loading…" : "Explain this score"}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {a.resumeFileName && (
          <button onClick={handleDownloadResume} className="text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Resume
          </button>
        )}
        {a.interview?.status !== "scheduled" && (
          <button onClick={() => setShowSchedule(true)} className="text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" /> Schedule interview
          </button>
        )}
      </div>

      {expanded && explanation && (
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg p-4 mb-4 text-sm">
          <div className="text-slate-500 dark:text-slate-400 mb-2">Baseline (typical candidate): <span className="font-medium text-slate-700 dark:text-slate-200">{explanation.baseValue}</span></div>
          {Object.entries(explanation.contributions).map(([key, val]) => (
            <div key={key} className="flex justify-between py-1">
              <span className="text-slate-600 dark:text-slate-300 capitalize">{key.replace("Score", "")}</span>
              <span className={"font-medium " + (val >= 0 ? "text-teal-700 dark:text-teal-300" : "text-rose-600 dark:text-rose-400")}>{val >= 0 ? "+" : ""}{val}</span>
            </div>
          ))}
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">{explanation.note}</div>
        </div>
      )}

      {a.transcript && (
        <details className="mb-4 text-sm">
          <summary className="cursor-pointer text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> View voice transcript</summary>
          <p className="text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-950 rounded-lg p-3">{a.transcript}</p>
        </details>
      )}

      <div className="mb-4">
        <MessageThread applicationId={a._id} otherPartyLabel={a.candidate?.name} />
      </div>

      <div className="flex gap-2">
        <button onClick={() => onUpdateStatus(a._id, "Shortlisted")} disabled={a.status === "Shortlisted"} className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-1.5">
          <CheckCircle className="w-4 h-4" /> Shortlist
        </button>
        <button onClick={() => onUpdateStatus(a._id, "Rejected")} disabled={a.status === "Rejected"} className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-1.5">
          <XCircle className="w-4 h-4" /> Reject
        </button>
      </div>

      {showSchedule && <ScheduleInterviewModal app={a} onClose={() => setShowSchedule(false)} onScheduled={onScheduled} />}
    </div>
  );
}

function KanbanCard({ a, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, a._id)}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-2 cursor-grab active:cursor-grabbing"
    >
      <div className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{a.candidate?.name}</div>
      <div className="text-xs text-slate-400 dark:text-slate-500 truncate mb-1">{a.job?.title}</div>
      <div className="text-xs font-semibold text-teal-700 dark:text-teal-300">{a.finalScore}/100</div>
    </div>
  );
}

function KanbanBoard({ applicants, onUpdateStatus }) {
  const [dragOverStatus, setDragOverStatus] = useState(null);

  function onDragStart(e, appId) {
    e.dataTransfer.setData("text/plain", appId);
  }

  function onDrop(e, status) {
    e.preventDefault();
    const appId = e.dataTransfer.getData("text/plain");
    setDragOverStatus(null);
    if (appId) onUpdateStatus(appId, status);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {KANBAN_STATUSES.map((status) => (
        <div
          key={status}
          onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
          onDragLeave={() => setDragOverStatus((s) => (s === status ? null : s))}
          onDrop={(e) => onDrop(e, status)}
          className={
            "rounded-xl p-3 min-h-[120px] border-2 border-dashed transition-colors " +
            (dragOverStatus === status
              ? "border-teal-400 bg-teal-50/50 dark:bg-teal-950/30"
              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50")
          }
        >
          <div className={"text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2 " + STATUS_STYLES[status]}>
            {status} · {applicants.filter((a) => a.status === status).length}
          </div>
          {applicants.filter((a) => a.status === status).map((a) => (
            <KanbanCard key={a._id} a={a} onDragStart={onDragStart} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Applicants({ jobs, applicants, focusJobId, setFocusJobId, onUpdated }) {
  const notify = useToast();
  const [page, setPage] = useState(1);
  const [view, setView] = useState("list");

  async function updateStatus(appId, status) {
    try {
      await api.patch(`/applications/${appId}/status`, { status });
      notify(`Candidate ${status.toLowerCase()}.`);
      onUpdated();
    } catch (err) {
      notify(err.response?.data?.message || "Couldn't update status.", "error");
    }
  }

  const filtered = applicants.filter((a) => !focusJobId || a.job?._id === focusJobId);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeJobFilter(jobId) {
    setFocusJobId(jobId);
    setPage(1);
  }

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">Applicants</h1>
        <div className="flex items-center gap-2">
          <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden" role="group" aria-label="View mode">
            <button
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={"px-2.5 py-1.5 flex items-center gap-1 text-xs font-medium " + (view === "list" ? "bg-slate-900 text-white" : "text-slate-600 dark:text-slate-300")}
            >
              <List className="w-3.5 h-3.5" aria-hidden="true" /> List
            </button>
            <button
              onClick={() => setView("kanban")}
              aria-pressed={view === "kanban"}
              className={"px-2.5 py-1.5 flex items-center gap-1 text-xs font-medium " + (view === "kanban" ? "bg-slate-900 text-white" : "text-slate-600 dark:text-slate-300")}
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" /> Pipeline
            </button>
          </div>
          <button
            onClick={async () => {
              try {
                await downloadFile(
                  `/reports/applicants.xlsx${focusJobId ? `?jobId=${focusJobId}` : ""}`,
                  "talentflow-applicants.xlsx"
                );
              } catch {
                notify("Couldn't export the report.", "error");
              }
            }}
            className="text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>
      </div>
      <div className="flex gap-2 mb-5 flex-wrap mt-3">
        <button onClick={() => changeJobFilter(null)} className={"text-xs font-medium px-3 py-1.5 rounded-full " + (!focusJobId ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}>
          All jobs
        </button>
        {jobs.map((j) => (
          <button key={j._id} onClick={() => changeJobFilter(j._id)} className={"text-xs font-medium px-3 py-1.5 rounded-full " + (focusJobId === j._id ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}>
            {j.title}
          </button>
        ))}
      </div>

      {view === "kanban" ? (
        <KanbanBoard applicants={filtered} onUpdateStatus={updateStatus} />
      ) : (
        <>
          <div className="space-y-3">
            {visible.map((a) => <ApplicantCard key={a._id} a={a} onUpdateStatus={updateStatus} onScheduled={onUpdated} />)}
            {filtered.length === 0 && <div className="text-sm text-slate-400 dark:text-slate-500 py-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">No applicants yet for this view.</div>}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
