import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import FieldError, { inputErrorClass } from "../components/FieldError";
import { parseFieldErrors, getGenericMessage } from "../utils/errors";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { signup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = params.get("role") === "recruiter" ? "recruiter" : "candidate";

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function clearFieldError(field) {
    setFieldErrors((f) => ({ ...f, [field]: undefined }));
  }

  function validateClientSide() {
    const errs = {};
    if (!name.trim()) errs.name = "Name is required.";
    if (!email.trim()) errs.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) errs.email = "Enter a valid email address.";
    if (role === "recruiter" && !companyName.trim()) errs.companyName = "Company name helps candidates recognize your postings.";
    if (!password) errs.password = "Password is required.";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (confirm !== password) errs.confirm = "Passwords don't match.";
    return errs;
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    const clientErrors = validateClientSide();
    setFieldErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setLoading(true);
    try {
      const user = await signup({ name, email, password, role, companyName });
      navigate(user.role === "recruiter" ? "/recruiter" : "/candidate");
    } catch (err) {
      const serverFieldErrors = parseFieldErrors(err);
      if (Object.keys(serverFieldErrors).length > 0) {
        setFieldErrors(serverFieldErrors);
      } else {
        setError(getGenericMessage(err, "Something went wrong signing up."));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-body flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-5 py-4 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6"><Logo className="justify-center" /></div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <h1 className="font-semibold text-slate-900 dark:text-slate-50 text-center mb-5">Create your account</h1>
            <form onSubmit={submit} noValidate className="space-y-3">
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-1">
                <button type="button" onClick={() => setRole("candidate")} className={"flex-1 text-xs font-medium py-1.5 rounded-md " + (role === "candidate" ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-50" : "text-slate-500 dark:text-slate-400")}>Candidate</button>
                <button type="button" onClick={() => setRole("recruiter")} className={"flex-1 text-xs font-medium py-1.5 rounded-md " + (role === "recruiter" ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-50" : "text-slate-500 dark:text-slate-400")}>Recruiter</button>
              </div>

              <div>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
                  placeholder="Full name"
                  aria-invalid={!!fieldErrors.name}
                  className={"w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 " + inputErrorClass(fieldErrors.name)}
                />
                <FieldError message={fieldErrors.name} />
              </div>

              <div>
                <input
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                  type="email"
                  placeholder="Email"
                  aria-invalid={!!fieldErrors.email}
                  className={"w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 " + inputErrorClass(fieldErrors.email)}
                />
                <FieldError message={fieldErrors.email} />
              </div>

              {role === "recruiter" && (
                <div>
                  <input
                    value={companyName}
                    onChange={(e) => { setCompanyName(e.target.value); clearFieldError("companyName"); }}
                    placeholder="Company name"
                    aria-invalid={!!fieldErrors.companyName}
                    className={"w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 " + inputErrorClass(fieldErrors.companyName)}
                  />
                  <FieldError message={fieldErrors.companyName} />
                </div>
              )}

              <div>
                <input
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                  type="password"
                  placeholder="Password (min 6 characters)"
                  aria-invalid={!!fieldErrors.password}
                  className={"w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 " + inputErrorClass(fieldErrors.password)}
                />
                <FieldError message={fieldErrors.password} />
              </div>

              <div>
                <input
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); clearFieldError("confirm"); }}
                  type="password"
                  placeholder="Confirm password"
                  aria-invalid={!!fieldErrors.confirm}
                  className={"w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 " + inputErrorClass(fieldErrors.confirm)}
                />
                <FieldError message={fieldErrors.confirm} />
              </div>

              {error && <div className="text-xs text-rose-600 dark:text-rose-400">{error}</div>}
              <button disabled={loading} type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-60">
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
              Already have an account? <Link to="/login" className="text-teal-700 dark:text-teal-300 font-medium">Log in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
