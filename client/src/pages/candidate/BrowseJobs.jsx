import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api from "../../api/axios";
import JobCard from "../../components/JobCard";
import ApplyWizard from "../../components/ApplyWizard";
import JobPrepGuide from "../../components/JobPrepGuide";
import Pagination from "../../components/Pagination";
import { SkeletonGridCards } from "../../components/Skeleton";
import { useToast } from "../../context/ToastContext";
import { getGenericMessage } from "../../utils/errors";

export default function BrowseJobs({ applications, onApplied }) {
  const notify = useToast();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [applyJob, setApplyJob] = useState(null);
  const [prepGuideJobId, setPrepGuideJobId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  async function loadJobs() {
    setLoading(true);
    const res = await api.get("/jobs", { params: { ...(search ? { search } : {}), page, limit: 8 } });
    setJobs(res.data.jobs);
    setTotalPages(res.data.totalPages);
    setLoading(false);
  }

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => {
    const t = setTimeout(loadJobs, 250);
    return () => clearTimeout(t);
  }, [search, page]);

  async function submitApplication({ skills, years, videoFile, audioFile, resumeFile }) {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("jobId", applyJob._id);
      formData.append("resumeSkills", skills);
      formData.append("yearsExperience", years);
      if (resumeFile) formData.append("resume", resumeFile);
      if (videoFile) formData.append("video", videoFile);
      if (audioFile) formData.append("audio", audioFile);

      await api.post("/applications", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setApplyJob(null);
      notify("Application submitted — AI evaluation is ready.");
      onApplied();
    } catch (err) {
      notify(getGenericMessage(err, "Couldn't submit your application."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">Browse jobs</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">Open roles across TalentFlow's hiring partners.</p>
      <div className="relative mb-5 max-w-sm">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs or companies"
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100"
        />
      </div>
      {loading ? (
        <SkeletonGridCards count={4} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {jobs.map((j) => {
            const applied = applications.some((a) => a.job?._id === j._id);
            return <JobCard key={j._id} job={j} applied={applied} onApply={() => setApplyJob(j)} onPrepGuide={() => setPrepGuideJobId(j._id)} />;
          })}
          {jobs.length === 0 && <div className="text-sm text-slate-400 dark:text-slate-500 col-span-2 py-10 text-center">No jobs match your search.</div>}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      {applyJob && (
        <ApplyWizard job={applyJob} submitting={submitting} onClose={() => setApplyJob(null)} onSubmit={submitApplication} />
      )}
      {prepGuideJobId && <JobPrepGuide jobId={prepGuideJobId} onClose={() => setPrepGuideJobId(null)} />}
    </>
  );
}
