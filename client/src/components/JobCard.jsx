import { Briefcase, GraduationCap } from "lucide-react";

export default function JobCard({ job, applied, onApply, onPrepGuide }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-50">{job.title}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">{job.company} · {job.experience}</div>
        </div>
        <Briefcase className="w-5 h-5 text-slate-300 shrink-0" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{job.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.requiredSkills.map((s) => (
          <span key={s} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">{s}</span>
        ))}
      </div>
      <div className="flex gap-2">
        {onPrepGuide && (
          <button
            onClick={onPrepGuide}
            className="shrink-0 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium flex items-center gap-1.5"
            aria-label={`Preparation guide for ${job.title}`}
          >
            <GraduationCap className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        <button
          disabled={applied}
          onClick={onApply}
          className={"flex-1 py-2.5 rounded-lg text-sm font-medium " + (applied ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800")}
        >
          {applied ? "Already applied" : "Apply now"}
        </button>
      </div>
    </div>
  );
}
