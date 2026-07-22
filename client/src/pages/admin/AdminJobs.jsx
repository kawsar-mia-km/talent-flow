import { useEffect, useState } from "react";
import api from "../../api/axios";
import Pagination from "../../components/Pagination";
import { SkeletonTableRows } from "../../components/Skeleton";

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get("/jobs/admin/all", { params: { page, limit: 10 } }).then((res) => {
      setJobs(res.data.jobs);
      setTotalPages(res.data.totalPages);
      setLoading(false);
    });
  }, [page]);

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">All jobs</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">Every posting across the platform.</p>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Company</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Applicants</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={5} cols={4} />
            ) : (
              jobs.map((j) => (
                <tr key={j._id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{j.title}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{j.company}</td>
                  <td className="px-4 py-3">
                    <span className={"text-xs font-medium px-2 py-1 rounded-full capitalize " + (j.status === "open" ? "bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400")}>{j.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{j.applicantCount}</td>
                </tr>
              ))
            )}
            {!loading && jobs.length === 0 && <tr><td colSpan={4} className="text-center text-slate-400 dark:text-slate-500 py-8">No jobs yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
