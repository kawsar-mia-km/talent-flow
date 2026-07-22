function Block({ className = "" }) {
  return <div className={"animate-tf-pulse bg-slate-200 dark:bg-slate-700 rounded " + className} />;
}

export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <Block className="w-10 h-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Block className="h-5 w-12" />
            <Block className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 220 }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
      <Block className="h-4 w-48 mb-4" />
      <Block className="w-full" style={{ height }} />
    </div>
  );
}

export function SkeletonTableRows({ rows = 5, cols = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-slate-100 dark:border-slate-800">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Block className="h-4" style={{ width: c === 0 ? "70%" : "50%" }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonCards({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2">
              <Block className="h-4 w-32" />
              <Block className="h-3 w-48" />
            </div>
            <Block className="h-6 w-10" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Block className="h-8" />
            <Block className="h-8" />
            <Block className="h-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGridCards({ count = 4 }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3">
          <Block className="h-4 w-2/3" />
          <Block className="h-3 w-1/3" />
          <Block className="h-3 w-full" />
          <Block className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
