export function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3">
      <div className={"w-10 h-10 rounded-lg flex items-center justify-center shrink-0 " + tint}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-none">{value}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
      </div>
    </div>
  );
}

export function ScoreBar({ label, value, colorClass }) {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className="font-semibold text-slate-800 dark:text-slate-100">{value}</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={"h-full rounded-full " + colorClass} style={{ width: value + "%" }} />
      </div>
    </div>
  );
}

export const STATUS_STYLES = {
  Submitted: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200",
  Reviewing: "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200",
  Shortlisted: "bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200",
  Rejected: "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300"
};
