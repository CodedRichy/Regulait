function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-surface-2 ${className}`}
      aria-hidden="true"
    />
  );
}

export default function ScanLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-20" aria-busy="true">
      <span className="sr-only">Loading scan form&hellip;</span>

      <SkeletonBlock className="mb-3 h-3 w-48" />
      <SkeletonBlock className="mb-3 h-9 w-80 max-w-full" />
      <SkeletonBlock className="mb-2 h-4 w-full" />
      <SkeletonBlock className="mb-10 h-4 w-2/3" />

      <div className="border border-border bg-surface p-6 sm:p-8">
        <div className="space-y-6">
          <div>
            <SkeletonBlock className="mb-2 h-3 w-32" />
            <SkeletonBlock className="h-11 w-full" />
          </div>
          <div>
            <SkeletonBlock className="mb-2 h-3 w-40" />
            <SkeletonBlock className="h-24 w-full" />
          </div>
          <div>
            <SkeletonBlock className="mb-2 h-3 w-28" />
            <SkeletonBlock className="h-11 w-full" />
          </div>
          <SkeletonBlock className="h-11 w-full sm:w-40" />
        </div>
      </div>
    </main>
  );
}
