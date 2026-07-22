import { useEffect, useState } from "react";
import { X, CheckCircle2, Circle, ExternalLink, ListChecks } from "lucide-react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

export default function JobPrepGuide({ jobId, onClose }) {
  const notify = useToast();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/jobs/${jobId}/prep-guide`)
      .then((res) => setGuide(res.data))
      .catch(() => notify("Couldn't load the prep guide right now.", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Prep guide</div>
            <div className="font-semibold text-slate-900 dark:text-slate-50">{guide?.job?.title || "Loading…"}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 dark:text-slate-500 hover:text-slate-700">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-5">
          {loading && <div className="text-sm text-slate-400 text-center py-10">Loading…</div>}

          {guide && (
            <>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg p-4 mb-5">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                  You match {guide.skillGap.matchedCount} of {guide.skillGap.totalRequired} required skills
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mb-1">
                  <div
                    className="bg-teal-600 h-2 rounded-full"
                    style={{ width: `${guide.skillGap.totalRequired ? (guide.skillGap.matchedCount / guide.skillGap.totalRequired) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">CV completeness: {guide.cvCompleteness}%</div>
              </div>

              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 mb-2 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4" aria-hidden="true" /> Prep checklist
              </h3>
              <ul className="space-y-2 mb-5">
                {guide.checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Circle className="w-3 h-3 mt-1 shrink-0 text-slate-300" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 mb-2">Skills for this role</h3>
              <div className="space-y-3">
                {guide.skillGuides.map((g) => (
                  <div key={g.skill} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      {g.have ? (
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" aria-hidden="true" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
                      )}
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{g.skill}</span>
                      {!g.have && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">To review</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {g.topics.map((t) => (
                        <span key={t} className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">{t}</span>
                      ))}
                    </div>
                    {g.resources?.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {g.resources.map((r) => (
                          <a
                            key={r.url}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1"
                          >
                            {r.label} <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </a>
                        ))}
                      </div>
                    )}
                    {g.note && <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{g.note}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
