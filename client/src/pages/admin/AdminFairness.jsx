import { useState } from "react";
import { Upload, ShieldAlert } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

export default function AdminFairness() {
  const notify = useToast();
  const [file, setFile] = useState(null);
  const [threshold, setThreshold] = useState(70);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function runAudit(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("threshold", threshold);
      const res = await api.post("/fairness/audit", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "The fairness audit failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">Fairness audit</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 max-w-2xl">
        TalentFlow doesn't collect protected characteristics (gender, ethnicity, age, etc.) itself. If your HR team
        already holds properly-consented demographic data through a separate process, upload a CSV here with
        <code className="mx-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">applicationId</code> and
        <code className="mx-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">groupLabel</code> columns to audit whether
        AI scores select candidates at different rates across groups. Groups with fewer than 5 applications are
        suppressed automatically to protect individual privacy.
      </p>

      <form onSubmit={runAudit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-6 max-w-lg">
        <label className="flex items-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg px-3 py-3 text-sm text-slate-500 dark:text-slate-400 mb-3 cursor-pointer hover:border-teal-300">
          <Upload className="w-4 h-4" />
          {file ? file.name : "Choose CSV file"}
          <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files[0] || null)} />
        </label>
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm text-slate-600 dark:text-slate-300">Shortlist threshold</label>
          <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-20 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm" />
          <span className="text-xs text-slate-400 dark:text-slate-500">final score ≥ this counts as "selected"</span>
        </div>
        <button disabled={!file || loading} type="submit" className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-medium px-4 py-2.5 rounded-lg">
          {loading ? "Running audit…" : "Run fairness audit"}
        </button>
      </form>

      {error && (
        <div className="max-w-lg bg-rose-50 dark:bg-rose-950 border border-rose-200 text-rose-700 dark:text-rose-300 text-sm rounded-lg p-4 mb-6 flex gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {result && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">Audit results</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">{result.matchedRecords} matched · {result.unmatchedRecords} unmatched</span>
          </div>

          {result.report.error ? (
            <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 rounded-lg p-3">{result.report.error}</div>
          ) : (
            <>
              <table className="w-full text-sm mb-4">
                <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase">
                  <tr><th className="text-left py-2">Group</th><th className="text-left py-2">Count</th><th className="text-left py-2">Avg score</th><th className="text-left py-2">Selection rate</th></tr>
                </thead>
                <tbody>
                  {result.report.groups.map((g) => (
                    <tr key={g.group} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-2 font-medium text-slate-800 dark:text-slate-100">{g.group}</td>
                      <td className="py-2 text-slate-600 dark:text-slate-300">{g.count}</td>
                      <td className="py-2 text-slate-600 dark:text-slate-300">{g.avgScore}</td>
                      <td className="py-2 text-slate-600 dark:text-slate-300">{g.selectionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Demographic parity difference</span>
                <span className={"text-sm font-semibold " + (result.report.demographicParityDifferencePct > 10 ? "text-rose-600 dark:text-rose-400" : "text-teal-700 dark:text-teal-300")}>
                  {result.report.demographicParityDifferencePct} pts
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">{result.report.note}</p>
              {result.report.suppressedGroups?.length > 0 && (
                <p className="text-xs text-amber-600 mt-2">Suppressed for privacy (fewer than 5 applications): {result.report.suppressedGroups.join(", ")}</p>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
