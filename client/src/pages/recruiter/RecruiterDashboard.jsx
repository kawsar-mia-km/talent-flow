import { useEffect, useState } from "react";
import { Home, Briefcase, Users, CheckCircle, XCircle } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { StatCard } from "../../components/StatCard";
import { SkeletonStatCards, SkeletonChart } from "../../components/Skeleton";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useSocket } from "../../hooks/useSocket";
import MyJobs from "./MyJobs";
import Applicants from "./Applicants";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const notify = useToast();
  const [tab, setTab] = useState("dashboard");
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focusJobId, setFocusJobId] = useState(null);

  async function loadData() {
    setLoading(true);
    const [jobsRes, appsRes] = await Promise.all([
      api.get("/jobs/mine", { params: { limit: 50 } }),
      api.get("/applications/recruiter", { params: { limit: 200 } })
    ]);
    setJobs(jobsRes.data.jobs);
    setApplicants(appsRes.data.applications);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  // Live push over WebSocket — new applicants and candidate messages show
  // up as a toast right away; the underlying list still refreshes lazily
  // (next tab switch / manual reload) rather than re-fetching on every event.
  useSocket({
    onNotification: (payload) => notify(payload.message),
    onMessage: () => notify("New message from a candidate.")
  });

  const scoreBuckets = [
    { name: "0-20", value: applicants.filter((a) => a.finalScore <= 20).length },
    { name: "21-40", value: applicants.filter((a) => a.finalScore > 20 && a.finalScore <= 40).length },
    { name: "41-60", value: applicants.filter((a) => a.finalScore > 40 && a.finalScore <= 60).length },
    { name: "61-80", value: applicants.filter((a) => a.finalScore > 60 && a.finalScore <= 80).length },
    { name: "81-100", value: applicants.filter((a) => a.finalScore > 80).length }
  ];

  const items = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "jobs", label: "My jobs", icon: Briefcase },
    { key: "applicants", label: "Applicants", icon: Users }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-body flex">
      <Sidebar items={items} active={tab} setActive={setTab} />
      <main id="main-content" tabIndex={-1} className="flex-1 px-5 md:px-8 py-6 max-w-6xl focus:outline-none">
        {tab === "dashboard" && (
          <>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">Welcome, {user.name.split(" ")[0]}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{user.companyName}</p>
            {loading ? (
              <>
                <SkeletonStatCards count={4} />
                <SkeletonChart />
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  <StatCard icon={Briefcase} label="Total jobs" value={jobs.length} tint="bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300" />
                  <StatCard icon={Users} label="Total applicants" value={applicants.length} tint="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300" />
                  <StatCard icon={CheckCircle} label="Shortlisted" value={applicants.filter((a) => a.status === "Shortlisted").length} tint="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" />
                  <StatCard icon={XCircle} label="Rejected" value={applicants.filter((a) => a.status === "Rejected").length} tint="bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">Candidate score distribution</h3>
                  {applicants.length === 0 ? (
                    <div className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">Scores will appear once candidates apply.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={scoreBuckets}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {tab === "jobs" && (
          <MyJobs
            jobs={jobs}
            applicants={applicants}
            onCreated={loadData}
            onManage={(jobId) => { setFocusJobId(jobId); setTab("applicants"); }}
          />
        )}

        {tab === "applicants" && (
          <Applicants jobs={jobs} applicants={applicants} focusJobId={focusJobId} setFocusJobId={setFocusJobId} onUpdated={loadData} />
        )}
      </main>
    </div>
  );
}
