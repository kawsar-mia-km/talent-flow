import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import FieldError, { inputErrorClass } from "../components/FieldError";
import { parseFieldErrors, getGenericMessage } from "../utils/errors";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login, verifyTwoFactor } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState(null);
  const [code, setCode] = useState("");

  function goToDashboard(user) {
    navigate(user.role === "admin" ? "/admin" : user.role === "recruiter" ? "/recruiter" : "/candidate");
  }

  function validateClientSide() {
    const errs = {};
    if (!email.trim()) errs.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) errs.email = "Enter a valid email address.";
    if (!password) errs.password = "Password is required.";
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
      const result = await login(email, password);
      if (result.twoFactorRequired) {
        setTwoFactorToken(result.twoFactorToken);
      } else {
        goToDashboard(result);
      }
    } catch (err) {
      const serverFieldErrors = parseFieldErrors(err);
      if (Object.keys(serverFieldErrors).length > 0) {
        setFieldErrors(serverFieldErrors);
      } else {
        setError(getGenericMessage(err, "Something went wrong logging in."));
      }
    } finally {
      setLoading(false);
    }
  }

  async function submitTwoFactor(e) {
    e.preventDefault();
    setError("");
    if (!code.trim()) { setError("Enter the 6-digit code from your authenticator app."); return; }
    setLoading(true);
    try {
      const user = await verifyTwoFactor(twoFactorToken, code.trim());
      goToDashboard(user);
    } catch (err) {
      setError(getGenericMessage(err, "Incorrect or expired code."));
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
            <h1 className="font-semibold text-slate-900 dark:text-slate-50 text-center mb-5">
              {twoFactorToken ? "Enter your verification code" : "Log in to TalentFlow"}
            </h1>
            {twoFactorToken ? (
              <form onSubmit={submitTwoFactor} noValidate className="space-y-3">
                <div>
                  <label htmlFor="login-2fa-code" className="sr-only">6-digit authenticator code</label>
                  <input
                    id="login-2fa-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    aria-describedby={error ? "login-2fa-error" : undefined}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                {error && <div id="login-2fa-error" role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</div>}
                <button disabled={loading} type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800">
                  {loading ? "Verifying…" : "Verify and log in"}
                </button>
                <button
                  type="button"
                  onClick={() => { setTwoFactorToken(null); setCode(""); setError(""); }}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700"
                >
                  Back to email + password
                </button>
              </form>
            ) : (
            <form onSubmit={submit} noValidate className="space-y-3">
              <div>
                <label htmlFor="login-email" className="sr-only">Email</label>
                <input
                  id="login-email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: undefined })); }}
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                  className={"w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 " + inputErrorClass(fieldErrors.email)}
                />
                <FieldError id="login-email-error" message={fieldErrors.email} />
              </div>
              <div>
                <label htmlFor="login-password" className="sr-only">Password</label>
                <input
                  id="login-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: undefined })); }}
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                  className={"w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100 " + inputErrorClass(fieldErrors.password)}
                />
                <FieldError id="login-password-error" message={fieldErrors.password} />
              </div>
              {error && <div role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</div>}
              <button disabled={loading} type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800">
                {loading ? "Logging in…" : "Log in"}
              </button>
            </form>
            )}
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
              Don't have an account? <Link to="/signup" className="text-teal-700 dark:text-teal-300 font-medium">Sign up</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
