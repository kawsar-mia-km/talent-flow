import { TrendingUp } from "lucide-react";

export default function Logo({ className = "" }) {
  return (
    <div className={"flex items-center gap-2 " + className}>
      <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
        <TrendingUp className="w-4 h-4 text-white" />
      </div>
      <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-slate-50">
        Talent<span className="text-teal-600">Flow</span>
      </span>
    </div>
  );
}
