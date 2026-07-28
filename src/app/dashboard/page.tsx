"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import type { ComplianceReport } from "@/lib/report-generator";
import type { RiskTier } from "@/lib/knowledge-base";

const REPORT_STORAGE_PREFIX = "regulait_report_";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const TIER_BADGE: Record<RiskTier, { label: string; bg: string; text: string }> = {
  unacceptable: { label: "Unacceptable", bg: "bg-danger", text: "text-canvas" },
  high: { label: "High", bg: "bg-warning", text: "text-canvas" },
  limited: { label: "Limited", bg: "bg-caution", text: "text-ink-on-yellow" },
  minimal: { label: "Minimal", bg: "bg-success", text: "text-canvas" },
};

function truncate(text: string, max = 140) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trimEnd()}...` : trimmed;
}

function loadLocalReports(): ComplianceReport[] {
  if (typeof window === "undefined") return [];

  const reports: ComplianceReport[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(REPORT_STORAGE_PREFIX)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      try {
        reports.push(JSON.parse(raw) as ComplianceReport);
      } catch {
        // Skip malformed entries rather than failing the whole list.
      }
    }
  } catch {
    // localStorage may be unavailable (private browsing, disabled storage).
    return [];
  }

  return reports.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const [reports, setReports] = useState<ComplianceReport[] | null>(null);

  useEffect(() => {
    setReports(loadLocalReports());
  }, []);

  if (!isLoaded || reports === null) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <p className="font-mono text-sm text-ink-muted">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
            {user?.primaryEmailAddress?.emailAddress ?? "Signed in"}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Your scans
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/scan"
            className="inline-flex items-center rounded-sm bg-accent px-4 py-2 font-heading text-sm font-semibold tracking-wide text-canvas transition-colors hover:bg-accent-strong"
          >
            New scan
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <p className="mb-6 text-xs leading-relaxed text-ink-muted">
        Your scan history is stored locally in your browser. It won&apos;t be
        available on a different device or after clearing your browser data.
      </p>

      {reports.length === 0 && (
        <div className="border border-border bg-surface p-8 text-center">
          <p className="text-sm text-ink-muted">
            You haven&apos;t run a scan yet.
          </p>
          <Link
            href="/scan"
            className="mt-3 inline-block text-sm font-medium text-accent hover:text-accent-strong hover:underline"
          >
            Run your first compliance scan
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {reports.map((report) => {
          const badge = TIER_BADGE[report.risk_tier];
          const created = new Date(report.created_at);
          const hasValidDate = !Number.isNaN(created.getTime());
          return (
            <Link
              key={report.id}
              href={`/report/${report.id}`}
              className="flex items-start justify-between gap-4 border border-border bg-surface p-4 transition-colors hover:border-ink-muted sm:p-5"
            >
              <div className="min-w-0">
                <span
                  className={`inline-flex items-center rounded-full ${badge.bg} ${badge.text} px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide`}
                >
                  {badge.label}
                </span>
                <p className="mt-2 text-sm leading-snug text-ink">
                  {truncate(report.reasoning)}
                </p>
              </div>
              {hasValidDate && (
                <span className="shrink-0 font-mono text-xs text-ink-muted">
                  {dateFormatter.format(created)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
