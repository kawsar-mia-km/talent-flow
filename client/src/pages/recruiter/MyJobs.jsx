import { useState } from "react";
import { PlusCircle, X, Pencil, FileDown, Lock, Unlock } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import { downloadFile } from "../../utils/download";
import Pagination from "../../components/Pagination";
import FieldError, { inputErrorClass } from "../../components/FieldError";
import { parseFieldErrors, getGenericMessage } from "../../utils/errors";

const PAGE_SIZE = 8;

function validateJobForm(form) {
  const errs = {};
  if (!form.title.trim()) errs.title = "Title is required.";
  if (!form.skills.trim()) errs.requiredSkills = "List at least one required skill.";
  return errs;
}

function JobFormModal({ initial, title, submitLabel, onClose, onSubmit, saving, serverErrors }) {
  const [form, setForm] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState({});

  const errors = { ...fieldErrors, ...serverErrors };

  function clear(field) {
    setFieldErrors((f) => ({ ...f, [field]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = validateJobForm(form);
    setFieldErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} noValidate className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-700" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <input
              value={form.title}
              onChange={(e) => { setForm({ ...form, title: e.target.value }); clear("title"); }}
              placeholder="Job title"
              aria-invalid={!!errors.title}
              className={"w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 " + inputErrorClass(errors.title)}
            />
            <FieldError message={errors.title} />
          </div>
          <div>
            <input
              value={form.skills}
              onChange={(e) => { setForm({ ...form, skills: e.target.value }); clear("requiredSkills"); }}
              placeholder="Required skills, comma separated"
              aria-invalid={!!errors.requiredSkills}
              className={"w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 " + inputErrorClass(errors.requiredSkills)}
            />
            <FieldError message={errors.requiredSkills} />
          </div>
          <input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="Experience level (e.g. 2+ years)" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Short description" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100" />
        </div>
        <button disabled={saving} type="submit" className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-60">
          {saving ? "Saving…" : submitLabel}
        </button>
      </form>
    </div>
  );
}

export default function MyJobs({ jobs, applicants, onCreated, onManage }) {
  const notify = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [createErrors, setCreateErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  async function createJob(form) {
    setSaving(true);
    setCreateErrors({});
    try {
      await api.post("/jobs", {
        title: form.title.trim(),
        requiredSkills: form.skills,
        experience: form.experience.trim(),
        description: form.description.trim()
      });
      setShowCreate(false);
      notify("Job posted.");
      onCreated();
    } catch (err) {
      const fe = parseFieldErrors(err);
      if (Object.keys(fe).length > 0) setCreateErrors(fe);
      else notify(getGenericMessage(err, "Couldn't post the job."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(form) {
    setSaving(true);
    setEditErrors({});
    try {
      await api.patch(`/jobs/${editingJob._id}`, {
        title: form.title.trim(),
        requiredSkills: form.skills,
        experience: form.experience.trim(),
        description: form.description.trim()
      });
      setEditingJob(null);
      notify("Job updated.");
      onCreated();
    } catch (err) {
      const fe = parseFieldErrors(err);
      if (Object.keys(fe).length > 0) setEditErrors(fe);
      else notify(getGenericMessage(err, "Couldn't update the job."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleJobStatus(job) {
    try {
      await api.patch(`/jobs/${job._id}`, { status: job.status === "open" ? "closed" : "open" });
      notify(job.status === "open" ? "Job closed to new applicants." : "Job reopened.");
      onCreated();
    } catch (err) {
      notify(err.response?.data?.message || "Couldn't update the job status.", "error");
    }
  }

  async function downloadReport(job) {
    try {
      await downloadFile(`/reports/jobs/${job._id}/report.pdf`, `${job.title}-report.pdf`);
    } catch (err) {
      notify("Couldn't generate the report.", "error");
    }
  }

  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  const visibleJobs = jobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">My jobs</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage postings and see who's applying.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-1.5">
          <PlusCircle className="w-4 h-4" /> New job
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Job title</th>
              <th className="text-left px-4 py-3 font-medium">Applicants</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleJobs.map((j) => (
              <tr key={j._id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{j.title}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{applicants.filter((a) => a.job?._id === j._id).length}</td>
                <td className="px-4 py-3">
                  <span className={"text-xs font-medium px-2 py-1 rounded-full capitalize " + (j.status === "open" ? "bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400")}>{j.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 flex-wrap">
                    <button onClick={() => onManage(j._id)} className="text-teal-700 dark:text-teal-300 text-xs font-medium">Manage</button>
                    <button onClick={() => setEditingJob(j)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 text-xs font-medium flex items-center gap-1"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                    <button onClick={() => toggleJobStatus(j)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 text-xs font-medium flex items-center gap-1">
                      {j.status === "open" ? <><Lock className="w-3.5 h-3.5" /> Close</> : <><Unlock className="w-3.5 h-3.5" /> Reopen</>}
                    </button>
                    <button onClick={() => downloadReport(j)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 text-xs font-medium flex items-center gap-1"><FileDown className="w-3.5 h-3.5" /> PDF report</button>
                  </div>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && <tr><td colSpan={4} className="text-center text-slate-400 dark:text-slate-500 py-8">No jobs posted yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {showCreate && (
        <JobFormModal
          title="Post a new job"
          submitLabel="Publish job"
          initial={{ title: "", skills: "", experience: "", description: "" }}
          saving={saving}
          serverErrors={createErrors}
          onClose={() => { setShowCreate(false); setCreateErrors({}); }}
          onSubmit={createJob}
        />
      )}

      {editingJob && (
        <JobFormModal
          title="Edit job"
          submitLabel="Save changes"
          initial={{
            title: editingJob.title,
            skills: editingJob.requiredSkills.join(", "),
            experience: editingJob.experience,
            description: editingJob.description
          }}
          saving={saving}
          serverErrors={editErrors}
          onClose={() => { setEditingJob(null); setEditErrors({}); }}
          onSubmit={saveEdit}
        />
      )}
    </>
  );
}
