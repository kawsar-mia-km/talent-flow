import { useEffect, useState } from "react";
import { Home, Briefcase, FileText, Sparkles, Bell, Video, FileEdit } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { StatCard } from "../../components/StatCard";
import { SkeletonStatCards, SkeletonChart } from "../../components/Skeleton";
import JobRecommendations from "../../components/JobRecommendations";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useSocket } from "../../hooks/useSocket";
import BrowseJobs from "./BrowseJobs";
import MyApplications from "./MyApplications";
import MyResume from "./MyResume";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from "recharts";

const COLORS = { Submitted: "#94a3b8", Reviewing: "#f59e0b", Shortlisted: "#0d9488", Rejected: "#e11d48" };

export default function CandidateDashboard() {
  const { user } = useAuth();
  const notify = useToast();
  const [tab, setTab] = useState("dashboard");
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const [appsRes, notifRes] = await Promise.all([
      api.get("/applications/mine"),
      api.get("/notifications/mine")
    ]);
    setApplications(appsRes.data.applications);
    setNotifications(notifRes.data.notifications);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  // Live push over WebSocket — status updates, interview invites, and new
  // messages show up as a toast immediately instead of waiting for the
  // next manual refresh/poll.
  useSocket({
    onNotification: (payload) => {
      notify(payload.message);
      setNotifications((prev) => [{ _id: `live-${Date.now()}`, message: payload.message, createdAt: new Date().toISOString() }, ...prev]);
    },
    onMessage: () => {
      notify("You have a new message from a recruiter.");
    }
  });

  const avgScore = applications.length ? Math.round(applications.reduce((s, a) => s + a.finalScore, 0) / applications.length) : 0;
  const interviewsDone = applications.filter((a) => a.videoCompleted && a.voiceCompleted).length;
  const statusCounts = ["Submitted", "Reviewing", "Shortlisted", "Rejected"].map((s) => ({
    name: s,
    value: applications.filter((a) => a.status === s).length
  }));

  const items = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "jobs", label: "Browse jobs", icon: Briefcase },
    { key: "applications", label: "My applications", icon: FileText },
    { key: "cv", label: "My CV", icon: FileEdit }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-body flex">
      <Sidebar items={items} active={tab} setActive={setTab} />
      <main id="main-content" tabIndex={-1} className="flex-1 px-5 md:px-8 py-6 max-w-5xl focus:outline-none">
        {tab === "dashboard" && (
          <>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">Welcome back, {user.name.split(" ")[0]}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Here's where your applications stand.</p>
            {loading ? (
              <>
                <SkeletonStatCards count={4} />
                <SkeletonChart />
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  <StatCard icon={FileText} label="Applications submitted" value={applications.length} tint="bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300" />
                  <StatCard icon={Sparkles} label="Average AI score" value={avgScore} tint="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300" />
                  <StatCard icon={Video} label="Interviews completed" value={interviewsDone} tint="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300" />
                  <StatCard icon={Bell} label="Status updates" value={notifications.length} tint="bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300" />
                </div>
                <JobRecommendations onApply={() => setTab("jobs")} />
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">Application status overview</h3>
                  {applications.length === 0 ? (
                    <div className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">Apply to a job to see your status breakdown here.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={statusCounts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {statusCounts.map((s, i) => <Cell key={i} fill={COLORS[s.name]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {tab === "jobs" && <BrowseJobs applications={applications} onApplied={loadData} />}
        {tab === "applications" && <MyApplications applications={applications} loading={loading} />}
        {tab === "cv" && <MyResume />}
      </main>
    </div>
  );
}
