import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import api from "../api/axios";

export default function JobRecommendations({ onApply }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/jobs/recommended")
      .then((res) => setRecommendations(res.data.recommendations))
      .catch(() => setRecommendations([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (recommendations.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-6">
      <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1 flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" /> Recommended for you
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Based on the skills in your profile and recent applications.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {recommendations.slice(0, 4).map((r) => (
          <button
            key={r.job._id}
            onClick={() => onApply?.(r.job)}
            className="text-left border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-teal-400 dark:hover:border-teal-500 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium text-sm text-slate-900 dark:text-slate-50 truncate">{r.job.title}</span>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 shrink-0">{r.matchScore}% match</span>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500">{r.job.company} · {r.matchedSkillCount}/{r.totalRequiredSkills} skills matched</div>
          </button>
        ))}
      </div>
    </div>
  );
}
