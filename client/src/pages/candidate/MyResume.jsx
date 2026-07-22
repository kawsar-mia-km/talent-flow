import { useEffect, useState } from "react";
import { Plus, Trash2, Download, FileText } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { downloadFile } from "../../utils/download";
import { getGenericMessage } from "../../utils/errors";

function TextField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100"
      />
    </label>
  );
}

function ListEditor({ title, items, onChange, newItem, renderFields }) {
  function update(i, patch) {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    onChange(next);
  }
  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...items, newItem]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50">{title}</h3>
        <button type="button" onClick={add} className="text-xs font-medium text-teal-700 dark:text-teal-300 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 relative">
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove ${title.toLowerCase()} entry ${i + 1}`}
              className="absolute top-2 right-2 text-slate-400 hover:text-rose-600"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            {renderFields(item, (patch) => update(i, patch))}
          </div>
        ))}
        {items.length === 0 && <div className="text-xs text-slate-400 dark:text-slate-500">Nothing added yet.</div>}
      </div>
    </div>
  );
}

export default function MyResume() {
  const { user } = useAuth();
  const notify = useToast();
  const [profile, setProfile] = useState(null);
  const [skillsInput, setSkillsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get("/users/me/profile").then((res) => {
      setProfile(res.data.profile);
      setSkillsInput((res.data.skills || []).join(", "));
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      const skillList = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const [profileRes] = await Promise.all([
        api.put("/users/me/profile", profile),
        api.patch("/users/me/skills", { skills: skillList })
      ]);
      setProfile(profileRes.data.profile);
      notify("CV saved.");
    } catch (err) {
      notify(getGenericMessage(err, "Couldn't save your CV."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function download() {
    setDownloading(true);
    try {
      await downloadFile("/users/me/resume.pdf", `${user.name}-resume.pdf`);
    } catch {
      notify("Add a bit more to your CV (headline, summary, or experience) before downloading.", "error");
    } finally {
      setDownloading(false);
    }
  }

  if (loading || !profile) {
    return <div className="text-sm text-slate-400 dark:text-slate-500 py-10 text-center">Loading your CV…</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">My CV</h1>
        <button
          onClick={download}
          disabled={downloading}
          className="text-xs font-medium bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-lg px-3 py-2 flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> {downloading ? "Preparing…" : "Download PDF"}
        </button>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Build a proper CV once — download it as a PDF any time, and the skills here also power your job recommendations and prep guides.
      </p>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1.5"><FileText className="w-4 h-4" aria-hidden="true" /> Basics</h2>
          <TextField label="Headline" value={profile.headline} onChange={(v) => setProfile({ ...profile, headline: v })} placeholder="Backend Engineer | Node.js · MongoDB" />
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Summary</span>
            <textarea
              value={profile.summary}
              onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
              rows={3}
              placeholder="A short professional summary (2-3 sentences)."
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <TextField label="Phone" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
            <TextField label="Location" value={profile.location} onChange={(v) => setProfile({ ...profile, location: v })} placeholder="Dhaka, Bangladesh" />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <TextField label="LinkedIn" value={profile.links?.linkedin || ""} onChange={(v) => setProfile({ ...profile, links: { ...profile.links, linkedin: v } })} />
            <TextField label="GitHub" value={profile.links?.github || ""} onChange={(v) => setProfile({ ...profile, links: { ...profile.links, github: v } })} />
            <TextField label="Portfolio" value={profile.links?.portfolio || ""} onChange={(v) => setProfile({ ...profile, links: { ...profile.links, portfolio: v } })} />
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Skills (comma separated)</span>
            <input
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Node.js, MongoDB, Docker"
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <ListEditor
            title="Experience"
            items={profile.experience || []}
            onChange={(experience) => setProfile({ ...profile, experience })}
            newItem={{ title: "", company: "", startDate: "", endDate: "", current: false, description: "" }}
            renderFields={(item, update) => (
              <div className="grid sm:grid-cols-2 gap-2">
                <TextField label="Title" value={item.title} onChange={(v) => update({ title: v })} />
                <TextField label="Company" value={item.company} onChange={(v) => update({ company: v })} />
                <TextField label="Start date" value={item.startDate} onChange={(v) => update({ startDate: v })} placeholder="Jan 2023" />
                <TextField label="End date" value={item.endDate} onChange={(v) => update({ endDate: v })} placeholder="Present" />
                <label className="sm:col-span-2 block">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Description</span>
                  <textarea
                    value={item.description}
                    onChange={(e) => update({ description: e.target.value })}
                    rows={2}
                    className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
              </div>
            )}
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <ListEditor
            title="Education"
            items={profile.education || []}
            onChange={(education) => setProfile({ ...profile, education })}
            newItem={{ school: "", degree: "", field: "", startYear: "", endYear: "" }}
            renderFields={(item, update) => (
              <div className="grid sm:grid-cols-2 gap-2">
                <TextField label="School" value={item.school} onChange={(v) => update({ school: v })} />
                <TextField label="Degree" value={item.degree} onChange={(v) => update({ degree: v })} />
                <TextField label="Field of study" value={item.field} onChange={(v) => update({ field: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <TextField label="Start year" value={item.startYear} onChange={(v) => update({ startYear: v })} />
                  <TextField label="End year" value={item.endYear} onChange={(v) => update({ endYear: v })} />
                </div>
              </div>
            )}
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <ListEditor
            title="Projects"
            items={profile.projects || []}
            onChange={(projects) => setProfile({ ...profile, projects })}
            newItem={{ name: "", description: "", link: "" }}
            renderFields={(item, update) => (
              <div className="space-y-2">
                <TextField label="Name" value={item.name} onChange={(v) => update({ name: v })} />
                <TextField label="Link" value={item.link} onChange={(v) => update({ link: v })} />
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Description</span>
                  <textarea
                    value={item.description}
                    onChange={(e) => update({ description: e.target.value })}
                    rows={2}
                    className="mt-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
              </div>
            )}
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm"
        >
          {saving ? "Saving…" : "Save CV"}
        </button>
      </div>
    </>
  );
}
