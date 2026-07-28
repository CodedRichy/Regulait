import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";
import type { RiskTier } from "@/lib/knowledge-base";

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

interface ScanRow {
  id: string;
  product_desc: string;
  risk_tier: RiskTier;
  created_at: string;
}

function truncate(text: string, max = 140) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trimEnd()}...` : trimmed;
}

async function signOutAction() {
  "use server";
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/dashboard");
}

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-sm px-4 py-20 sm:py-28">
        <p className="text-center font-mono text-xs uppercase tracking-widest text-ink-muted">
          Dashboard
        </p>
        <h1 className="mt-1 text-center font-heading text-2xl font-semibold tracking-tight text-ink">
          Sign in to continue
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-center text-sm leading-relaxed text-ink-muted">
          We&apos;ll email you a one-time link -- no password needed.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </main>
    );
  }

  const { data: scans, error } = await supabase
    .from("scans")
    .select("id, product_desc, risk_tier, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (scans ?? []) as ScanRow[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
            {user.email}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Your scans
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/scan"
            className="inline-flex items-center rounded-sm bg-accent px-4 py-2 font-heading text-sm font-semibold tracking-wide text-canvas transition-colors hover:bg-accent-strong"
          >
            New scan
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center rounded-sm border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink-muted"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="border-l-2 border-danger bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          Couldn&apos;t load your scans. Please try again.
        </p>
      )}

      {!error && rows.length === 0 && (
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
        {rows.map((scan) => {
          const badge = TIER_BADGE[scan.risk_tier];
          const created = new Date(scan.created_at);
          const hasValidDate = !Number.isNaN(created.getTime());
          return (
            <Link
              key={scan.id}
              href={`/report/${scan.id}`}
              className="flex items-start justify-between gap-4 border border-border bg-surface p-4 transition-colors hover:border-ink-muted sm:p-5"
            >
              <div className="min-w-0">
                <span
                  className={`inline-flex items-center rounded-full ${badge.bg} ${badge.text} px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide`}
                >
                  {badge.label}
                </span>
                <p className="mt-2 text-sm leading-snug text-ink">
                  {truncate(scan.product_desc)}
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
