import { LogOut, Sun, Moon } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar({ items, active, setActive }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-teal-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <aside
        aria-label="Primary"
        className="hidden md:flex md:flex-col w-56 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-screen sticky top-0 py-5 px-3"
      >
        <div className="px-2 mb-6 flex items-center justify-between">
          <Logo />
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
        <nav aria-label="Dashboard sections" className="flex-1 space-y-1">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => setActive(it.key)}
              aria-current={active === it.key ? "page" : undefined}
              className={
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 " +
                (active === it.key ? "bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50")
              }
            >
              <it.icon className="w-4 h-4" aria-hidden="true" /> {it.label}
            </button>
          ))}
        </nav>
        <div className="px-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{user?.name}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 truncate mb-3">{user?.email}</div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 px-3 py-2 rounded-lg font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" /> Log out
          </button>
        </div>
      </aside>

      <div className="md:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
            </button>
            <button onClick={logout} className="text-rose-600 dark:text-rose-400 w-8 h-8 flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500" aria-label="Log out">
              <LogOut className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <nav aria-label="Dashboard sections" className="flex overflow-x-auto gap-1 px-3 pb-2">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => setActive(it.key)}
              aria-current={active === it.key ? "page" : undefined}
              className={
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 " +
                (active === it.key ? "bg-teal-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")
              }
            >
              <it.icon className="w-3.5 h-3.5" aria-hidden="true" /> {it.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
