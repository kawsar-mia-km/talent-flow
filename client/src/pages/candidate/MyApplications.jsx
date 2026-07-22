import { useState, Fragment } from "react";
import { Sparkles, ChevronDown, ChevronUp, CalendarClock, Download } from "lucide-react";
import api from "../../api/axios";
import { STATUS_STYLES } from "../../components/StatCard";
import { SkeletonTableRows } from "../../components/Skeleton";
import MessageThread from "../../components/MessageThread";
import { downloadFile } from "../../utils/download";
import { useToast } from "../../context/ToastContext";

function ExplainRow({ app }) {
  const notify = useToast();
  const [expanded, setExpanded] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (explanation) { setExpanded((v) => !v); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/applications/${app._id}/explain`);
      setExplanation(res.data.explanation);
      setExpanded(true);
    } catch (err) {
      setError(err.response?.data?.message || "Explanation isn't available right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadResume() {
    try {
      await downloadFile(`/applications/${app._id}/resume`, app.resumeFileName || "resume");
    } catch (err) {
      notify("Couldn't download this resume.", "error");
    }
  }

  return (
    <tr className="border-t border-slate-100 dark:border-slate-800">
      <td className="px-4 py-3" colSpan={4}>
        {app.interview?.status === "scheduled" && (
          <div className="bg-teal-50 dark:bg-teal-950 border border-teal-100 rounded-lg px-3 py-2 mb-2 text-xs text-teal-800 dark:text-teal-200 flex items-start gap-2">
            <CalendarClock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Interview scheduled: {new Date(app.interview.scheduledAt).toLocaleString()}</div>
              <div className="text-teal-700 dark:text-teal-300">{app.interview.mode}{app.interview.location ? ` · ${app.interview.location}` : ""}</div>
              {app.interview.notes && <div className="text-teal-700 dark:text-teal-300 mt-0.5">{app.interview.notes}</div>}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={toggle} disabled={loading} className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {loading ? "Loading…" : "Why this score?"}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {app.resumeFileName && (
            <button onClick={handleDownloadResume} className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Download my resume
            </button>
          )}
        </div>
        {error && <div className="text-xs text-rose-500 mt-2">{error}</div>}
        {expanded && explanation && (
          <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3 mt-2 text-sm max-w-md">
            {Object.entries(explanation.contributions).map(([key, val]) => (
              <div key={key} className="flex justify-between py-0.5">
                <span className="text-slate-600 dark:text-slate-300 capitalize">{key.replace("Score", "")}</span>
                <span className={"font-medium " + (val >= 0 ? "text-teal-700 dark:text-teal-300" : "text-rose-600 dark:text-rose-400")}>{val >= 0 ? "+" : ""}{val}</span>
              </div>
            ))}
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">{explanation.note}</div>
          </div>
        )}
        <div className="mt-2 max-w-md">
          <MessageThread applicationId={app._id} otherPartyLabel={`the recruiter at ${app.job?.company || "this company"}`} />
        </div>
      </td>
    </tr>
  );
}

export default function MyApplications({ applications, loading }) {
  return (
    <>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">My applications</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">Track status and AI evaluation for every role you've applied to.</p>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {!loading && applications.length === 0 ? (
          <div className="text-sm text-slate-400 dark:text-slate-500 py-10 text-center">No applications yet — browse jobs to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Job</th>
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-left px-4 py-3 font-medium">AI score</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTableRows rows={4} cols={4} />
              ) : (
                applications.map((a) => (
                  <Fragment key={a._id}>
                    <tr className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{a.job?.title}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{a.job?.company}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{a.finalScore}</td>
                      <td className="px-4 py-3">
                        <span className={"text-xs font-medium px-2 py-1 rounded-full " + STATUS_STYLES[a.status]}>{a.status}</span>
                      </td>
                    </tr>
                    <ExplainRow app={a} />
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

