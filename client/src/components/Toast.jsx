import { useEffect } from "react";
import { Sparkles, X, AlertCircle } from "lucide-react";

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id]);

  const isError = toast.variant === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={
        "pointer-events-auto w-full sm:max-w-xs text-sm font-medium px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 " +
        (isError
          ? "bg-rose-600 text-white"
          : "bg-slate-900 dark:bg-slate-800 text-white border border-transparent dark:border-slate-700")
      }
    >
      {isError ? <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> : <Sparkles className="w-4 h-4 text-teal-300 shrink-0" aria-hidden="true" />}
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss" className="opacity-70 hover:opacity-100 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div aria-live="polite" aria-atomic="false" className="fixed bottom-5 right-5 z-50 flex flex-col-reverse gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
