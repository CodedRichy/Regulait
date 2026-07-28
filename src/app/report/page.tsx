"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ComplianceReport } from "@/lib/report-generator";
import { ReportView } from "@/components/report-view";

const REPORT_STORAGE_PREFIX = "regulait_report_";

type LoadState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "found"; report: ComplianceReport };

function ReportPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!id) {
      setState({ status: "not_found" });
      return;
    }

    try {
      const raw = window.localStorage.getItem(`${REPORT_STORAGE_PREFIX}${id}`);
      if (!raw) {
        setState({ status: "not_found" });
        return;
      }
      const report = JSON.parse(raw) as ComplianceReport;
      setState({ status: "found", report });
    } catch {
      setState({ status: "not_found" });
    }
  }, [id]);

  if (state.status === "loading") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
        <p className="font-mono text-sm text-ink-muted">Loading report...</p>
      </main>
    );
  }

  if (state.status === "not_found") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
          404
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink">
          Report not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
          We couldn&apos;t find this report on this device. Reports are
          currently stored locally in your browser, so they won&apos;t be
          available on a different device or after clearing your browser
          data.
        </p>
        <a
          href="/scan"
          className="mt-6 inline-block text-sm font-medium text-accent hover:text-accent-strong hover:underline"
        >
          Run a new scan
        </a>
      </main>
    );
  }

  return <ReportView report={state.report} />;
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <p className="font-mono text-sm text-ink-muted">Loading report...</p>
        </main>
      }
    >
      <ReportPageInner />
    </Suspense>
  );
}
