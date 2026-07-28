function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-surface-2 ${className}`}
      aria-hidden="true"
    />
  );
}

export default function ReportLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16" aria-busy="true">
      <span className="sr-only">Loading compliance report&hellip;</span>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="w-full max-w-sm">
          <SkeletonBlock className="mb-2 h-3 w-56" />
          <SkeletonBlock className="mb-2 h-8 w-64" />
          <SkeletonBlock className="h-3 w-40" />
        </div>
        <div className="flex shrink-0 gap-2">
          <SkeletonBlock className="h-9 w-28" />
          <SkeletonBlock className="h-9 w-32" />
        </div>
      </div>

      {/* Risk badge */}
      <SkeletonBlock className="h-40 w-full" />

      {/* Reasoning */}
      <div className="mt-10">
        <SkeletonBlock className="mb-5 h-6 w-56" />
        <SkeletonBlock className="mb-2 h-4 w-full" />
        <SkeletonBlock className="mb-2 h-4 w-full" />
        <SkeletonBlock className="h-4 w-2/3" />
      </div>

      {/* Requirements */}
      <div className="mt-12">
        <SkeletonBlock className="mb-5 h-6 w-64" />
        <div className="space-y-4">
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
