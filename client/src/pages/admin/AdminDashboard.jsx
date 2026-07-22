import { useEffect, useState } from "react";
import { Home, Users, Briefcase, FileText, ShieldCheck } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { StatCard, STATUS_STYLES } from "../../components/StatCard";
import { SkeletonStatCards, SkeletonChart } from "../../components/Skeleton";
import api from "../../api/axios";
import AdminUsers from "./AdminUsers";
import AdminJobs from "./AdminJobs";
import AdminFairness from "./AdminFairness";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = { candidate: "#0d9488", recruiter: "#3b82f6", admin: "#f59e0b" };

export default function AdminDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);

  async function loadStats() {
    const res = await api.get("/users/stats");
    setStats(res.data);
  }

  useEffect(() => { loadStats(); }, []);

  const items = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "users", label: "Users", icon: Users },
    { key: "jobs", label: "All jobs", icon: Briefcase },
    { key: "fairness", label: "Fairness audit", icon: ShieldCheck }
  ];

  const roleCounts = stats
    ? ["candidate", "recruiter", "admin"].map((r) => ({ name: r, value: stats.roleCounts[r] || 0 }))
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-body flex">
      <Sidebar items={items} active={tab} setActive={setTab} />
      <main id="main-content" tabIndex={-1} className="flex-1 px-5 md:px-8 py-6 max-w-6xl focus:outline-none">
        {tab === "dashboard" && (
          <>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">Admin dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Platform-wide overview.</p>
            {!stats ? (
              <>
                <SkeletonStatCards count={3} />
                <div className="grid md:grid-cols-2 gap-4">
                  <SkeletonChart />
                  <SkeletonChart />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  <StatCard icon={Users} label="Total users" value={stats.totalUsers} tint="bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300" />
                  <StatCard icon={Briefcase} label="Total jobs" value={stats.totalJobs} tint="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300" />
                  <StatCard icon={FileText} label="Total applications" value={stats.totalApplications} tint="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">User roles</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={roleCounts} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                          {roleCounts.map((r, i) => <Cell key={i} fill={COLORS[r.name]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {roleCounts.map((r) => (
                        <span key={r.name} className="flex items-center gap-1.5 capitalize">
                          <span className="w-2 h-2 rounded-full" style={{ background: COLORS[r.name] }} />{r.name}s ({r.value})
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">Recent applications</h3>
                    <div className="space-y-3">
                      {stats.recentApplications.map((a) => (
                        <div key={a._id} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                          <span className="text-slate-700 dark:text-slate-200">{a.candidate?.name} → {a.job?.title}</span>
                          <span className={"text-xs font-medium px-2 py-0.5 rounded-full " + STATUS_STYLES[a.status]}>{a.status}</span>
                        </div>
                      ))}
                      {stats.recentApplications.length === 0 && <div className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">No applications yet.</div>}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === "users" && <AdminUsers onChanged={loadStats} />}
        {tab === "jobs" && <AdminJobs />}
        {tab === "fairness" && <AdminFairness />}
      </main>
    </div>
  );
}
