"use client";

import { useEffect, useState } from "react";
import type { ComplianceReport } from "@/lib/report-generator";
import { RiskBadge } from "@/components/risk-badge";
import { RequirementCard } from "@/components/requirement-card";
import { createBrowserClient } from "@/lib/supabase/client";

const eurFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-5 border-b border-border pb-3">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        {title}
      </h2>
    </div>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable (permissions, non-secure context).
      // Silently no-op -- the URL is still visible in the address bar.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink-muted"
    >
      {copied ? "Link copied" : "Share report"}
    </button>
  );
}

type PlanState = "checking" | "anon" | "free" | "pro";

function PdfDownloadButton({ report }: { report: ComplianceReport }) {
  const [plan, setPlan] = useState<PlanState>("checking");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkPlan() {
      try {
        const supabase = createBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) setPlan("anon");
          return;
        }

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("plan, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .in("plan", ["pro", "agency"])
          .maybeSingle();

        if (!cancelled) setPlan(subscription ? "pro" : "free");
      } catch {
        if (!cancelled) setPlan("free");
      }
    }

    checkPlan();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDownload() {
    setDownloading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: report.id }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "PDF generation failed.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `regulait-report-${report.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "PDF generation failed."
      );
    } finally {
      setDownloading(false);
    }
  }

  async function handleUpgrade() {
    setRedirecting(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? "Could not start checkout.");
      }

      window.location.href = data.url;
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not start checkout."
      );
      setRedirecting(false);
    }
  }

  if (plan === "pro") {
    return (
      <div className="inline-flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
        >
          {downloading ? "Generating PDF..." : "Download PDF"}
        </button>
        {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowUpgrade((v) => !v)}
        aria-expanded={showUpgrade}
        className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-accent-strong"
      >
        Download PDF
      </button>
      {showUpgrade && (
        <div
          role="tooltip"
          className="absolute right-0 z-10 mt-2 w-64 rounded-sm border border-border bg-surface p-3 text-xs shadow-lg"
        >
          <p className="font-heading font-semibold text-ink">
            Upgrade to Pro
          </p>
          <p className="mt-1 leading-relaxed text-ink-muted">
            PDF export is a Pro feature. Upgrade your account to download a
            shareable, print-ready compliance report.
          </p>
          {plan === "anon" ? (
            <a
              href="/dashboard"
              className="mt-3 inline-flex w-full items-center justify-center rounded-sm bg-accent px-3 py-2 font-medium text-canvas transition-colors hover:bg-accent-strong"
            >
              Sign in to upgrade
            </a>
          ) : (
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={redirecting}
              className="mt-3 inline-flex w-full items-center justify-center rounded-sm bg-accent px-3 py-2 font-medium text-canvas transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
            >
              {redirecting ? "Redirecting..." : "Upgrade -- $29/mo"}
            </button>
          )}
          {errorMsg && <p className="mt-2 text-danger">{errorMsg}</p>}
        </div>
      )}
    </div>
  );
}

export function ReportView({ report }: { report: ComplianceReport }) {
  const createdAt = new Date(report.created_at);
  const hasValidDate = !Number.isNaN(createdAt.getTime());

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
            EU AI Act &middot; Compliance Report
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Compliance Report
          </h1>
          <p className="mt-1 font-mono text-xs text-ink-muted">
            {report.id}
            {hasValidDate && ` · generated ${dateFormatter.format(createdAt)}`}
            {` · ${report.source === "llm" ? "AI-assisted" : "rules-based"} classification`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ShareButton />
          <PdfDownloadButton report={report} />
        </div>
      </div>

      {/* Risk badge */}
      <RiskBadge tier={report.risk_tier} confidence={report.confidence} />

      {/* Reasoning */}
      <section className="mt-10">
        <SectionHeading eyebrow="Assessment" title="Why this classification" />
        <p className="text-sm leading-relaxed text-ink">{report.reasoning}</p>
      </section>

      {/* Requirements */}
      {report.requirements.length > 0 && (
        <section className="mt-12">
          <SectionHeading
            eyebrow={`${report.requirements.length} requirement${
              report.requirements.length === 1 ? "" : "s"
            }`}
            title="Compliance Requirements"
          />
          <div className="space-y-4">
            {report.requirements
              .slice()
              .sort((a, b) => a.number - b.number)
              .map((requirement) => (
                <RequirementCard key={requirement.number} requirement={requirement} />
              ))}
          </div>
        </section>
      )}

      {/* Transparency obligations */}
      {report.transparency_obligations.length > 0 && (
        <section className="mt-12">
          <SectionHeading
            eyebrow="Article 50 / 52"
            title="Transparency Obligations"
          />
          <div className="space-y-4">
            {report.transparency_obligations.map((obligation) => (
              <div
                key={obligation.id}
                className="border border-border bg-surface p-5"
              >
                <h3 className="font-heading text-base font-semibold tracking-tight text-ink">
                  {obligation.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {obligation.description}
                </p>
                {obligation.applies_to.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {obligation.applies_to.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-ink-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Penalties */}
      {report.penalties && (
        <section className="mt-12">
          <SectionHeading eyebrow="Enforcement" title="Penalties for Non-Compliance" />
          <div className="border-l-4 border-danger bg-danger-bg p-6 sm:p-8">
            <p className="text-sm font-medium text-ink">
              {report.penalties.description}
            </p>
            <p className="mt-3 font-heading text-3xl font-semibold tracking-tight text-danger sm:text-4xl">
              Up to {eurFormatter.format(report.penalties.max_fine_eur)}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              or {report.penalties.max_fine_percent}% of total worldwide
              annual turnover
            </p>
            <p className="mt-4 text-xs leading-relaxed text-ink-muted">
              {report.penalties.fine_basis}
            </p>
          </div>
        </section>
      )}

      {/* Exemptions */}
      {(report.exemptions.applicable.length > 0 ||
        report.exemptions.not_applicable.length > 0) && (
        <section className="mt-12">
          <SectionHeading eyebrow="Carve-outs" title="Exemptions" />
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-success">
                Applicable ({report.exemptions.applicable.length})
              </p>
              <div className="space-y-3">
                {report.exemptions.applicable.length === 0 && (
                  <p className="text-sm text-ink-muted">
                    No exemptions apply to this system.
                  </p>
                )}
                {report.exemptions.applicable.map((exemption) => (
                  <div
                    key={exemption.name}
                    className="border-l-4 border-success bg-success-bg p-4"
                  >
                    <h3 className="font-heading text-sm font-semibold tracking-tight text-ink">
                      {exemption.name}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                      {exemption.description}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-ink">
                      <span className="font-medium">Effect: </span>
                      {exemption.effect}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                      <span className="font-medium">Criteria: </span>
                      {exemption.criteria}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-ink-muted">
                Not applicable ({report.exemptions.not_applicable.length})
              </p>
              <div className="space-y-3">
                {report.exemptions.not_applicable.map((exemption) => (
                  <div
                    key={exemption.name}
                    className="border border-border bg-surface p-4 opacity-70"
                  >
                    <h3 className="font-heading text-sm font-semibold tracking-tight text-ink-muted line-through decoration-1">
                      {exemption.name}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                      {exemption.description}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                      <span className="font-medium">Criteria: </span>
                      {exemption.criteria}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Legal disclaimer */}
      <div className="mt-14 border-t border-border pt-6">
        <p className="text-xs leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">Disclaimer.</span> This
          report is generated automatically from self-reported information
          and reflects our interpretation of the EU AI Act at the time of
          generation. It does not constitute legal advice and should not be
          relied upon as a substitute for consultation with a qualified
          legal professional. Regulait makes no warranty as to the accuracy
          or completeness of this report and accepts no liability for
          decisions made on the basis of it.
        </p>
      </div>

      <div className="mt-8 text-center">
        <a
          href="/scan"
          className="text-sm font-medium text-accent hover:text-accent-strong hover:underline"
        >
          Run another scan
        </a>
      </div>
    </div>
  );
}
