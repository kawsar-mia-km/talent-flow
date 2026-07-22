import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, FileText, Video, Mic, Shield, Sun, Moon } from "lucide-react";
import Logo from "../components/Logo";
import { useTheme } from "../context/ThemeContext";

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-body">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to="/login" className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 px-3 py-2">Log in</Link>
            <Link to="/signup" className="text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg">Get started</Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 pt-14 pb-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-teal-800 dark:text-teal-200 bg-teal-100 dark:bg-teal-900 px-3 py-1 rounded-full mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Multimodal AI hiring
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 dark:text-slate-50 leading-tight mb-5">
            One flow, from resume<br /> to <span className="text-teal-600">right hire</span>.
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg mb-8 max-w-md">
            TalentFlow reads resumes, watches interviews, and listens to responses, then hands recruiters one clear, bias-aware score per candidate.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/signup?role=candidate" className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-3 rounded-lg flex items-center gap-2">
              Find a job <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/signup?role=recruiter" className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:border-slate-400 text-slate-800 dark:text-slate-100 font-medium px-5 py-3 rounded-lg">
              Hire talent
            </Link>
          </div>
          <div className="mt-6 text-xs text-slate-400 dark:text-slate-500">
            Demo logins — candidate@talentflow.com / candidate123, recruiter@talentflow.com / recruit123, admin@talentflow.com / admin123 (run <code>npm run seed</code> first)
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-4 -left-4 w-full h-full border-2 border-teal-200 rounded-2xl hidden sm:block" />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Candidate flow</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">live preview</span>
            </div>
            {[
              { icon: FileText, label: "Resume parsed", note: "4/4 required skills matched" },
              { icon: Video, label: "Video interview", note: "Confidence 82 · Clarity 78" },
              { icon: Mic, label: "Voice response", note: "Tone steady, low stress" },
              { icon: Shield, label: "Final AI score", note: "79 / 100 — Shortlist ready" }
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b last:border-0 border-slate-100 dark:border-slate-800">
                <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <s.icon className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{s.label}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{s.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-14">
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 mb-8">What TalentFlow scores</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FileText, title: "Resume parsing", desc: "Extracts skills and experience, matches against job requirements." },
            { icon: Video, title: "Video interview", desc: "Reads confidence and communication signals from recorded answers." },
            { icon: Mic, title: "Voice analysis", desc: "Evaluates tone, pacing and stress across spoken responses." },
            { icon: Shield, title: "Unified score", desc: "Combines every signal into one transparent, bias-aware number." }
          ].map((f, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-teal-600" />
              </div>
              <div className="font-semibold text-slate-900 dark:text-slate-50 mb-1">{f.title}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-5 py-8 text-xs text-slate-400 dark:text-slate-500 flex justify-between">
        <span>TalentFlow — a hiring platform built on the AI Recruiter proposal</span>
        <span>Contact · Privacy · Terms</span>
      </footer>
    </div>
  );
}
