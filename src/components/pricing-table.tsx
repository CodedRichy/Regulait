import Link from "next/link";

interface PricingFeature {
  label: string;
  excluded?: boolean;
  comingSoon?: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  ctaLabel: string;
  href: string;
  features: PricingFeature[];
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "See where your AI system stands before you commit to anything.",
    ctaLabel: "Start free scan",
    href: "/scan",
    features: [
      { label: "1 compliance scan" },
      { label: "Risk tier classification" },
      { label: "Top 3 requirements" },
      { label: "Full requirement list", excluded: true },
      { label: "PDF export", excluded: true },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For teams that need the full picture, on demand.",
    ctaLabel: "Get Pro",
    href: "/scan",
    highlighted: true,
    features: [
      { label: "Unlimited scans" },
      { label: "Full compliance reports" },
      { label: "PDF export" },
      { label: "Completion tracking" },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: "$79",
    period: "/mo",
    description: "Run compliance across every client from one place.",
    ctaLabel: "Get Agency",
    href: "/scan",
    features: [
      { label: "Everything in Pro" },
      { label: "White-label reports", comingSoon: true },
      { label: "Multi-client dashboard", comingSoon: true },
    ],
  },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-accent">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-ink-muted/40">
      <line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PricingTable() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {PLANS.map((plan) => (
        <div
          key={plan.id}
          className={
            plan.highlighted
              ? "relative flex flex-col border-2 border-accent bg-surface p-6 shadow-xl sm:-translate-y-3 sm:p-7"
              : "flex flex-col border border-border bg-surface p-6 sm:p-7"
          }
        >
          {plan.highlighted && (
            <span className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-accent px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-canvas">
              Recommended
            </span>
          )}

          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
            {plan.name}
          </p>
          <p className="mt-2 flex items-baseline gap-1 font-heading text-4xl font-semibold tracking-tight text-ink">
            {plan.price}
            {plan.period && (
              <span className="font-sans text-sm font-normal text-ink-muted">
                {plan.period}
              </span>
            )}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {plan.description}
          </p>

          <ul className="mt-6 flex-1 space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature.label} className="flex items-center gap-2.5 text-sm">
                {feature.excluded ? <DashIcon /> : <CheckIcon />}
                <span
                  className={
                    feature.excluded
                      ? "text-ink-muted/60 line-through decoration-1"
                      : "text-ink"
                  }
                >
                  {feature.label}
                </span>
                {feature.comingSoon && (
                  <span className="ml-auto inline-flex shrink-0 items-center rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                    Soon
                  </span>
                )}
              </li>
            ))}
          </ul>

          <Link
            href={plan.href}
            className={
              plan.highlighted
                ? "mt-7 inline-flex items-center justify-center rounded-sm bg-accent px-4 py-3 font-heading text-sm font-semibold tracking-wide text-canvas transition-colors hover:bg-accent-strong"
                : "mt-7 inline-flex items-center justify-center rounded-sm border border-border px-4 py-3 font-heading text-sm font-semibold tracking-wide text-ink transition-colors hover:border-ink-muted"
            }
          >
            {plan.ctaLabel}
          </Link>
        </div>
      ))}
    </div>
  );
}
