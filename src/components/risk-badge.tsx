import type { RiskTier } from "@/lib/knowledge-base";

interface RiskTierConfig {
  pillLabel: string;
  heading: string;
  description: string;
  pillBgClass: string;
  pillTextClass: string;
  cardBorderClass: string;
  cardBgClass: string;
  headingTextClass: string;
  descriptionTextClass: string;
}

const RISK_CONFIG: Record<RiskTier, RiskTierConfig> = {
  unacceptable: {
    pillLabel: "Unacceptable Risk",
    heading: "Prohibited under the EU AI Act",
    description:
      "This system falls into a banned category (Article 5). It cannot be placed on the EU market, deployed, or put into service in any form.",
    pillBgClass: "bg-danger",
    pillTextClass: "text-canvas",
    cardBorderClass: "border-danger",
    cardBgClass: "bg-danger-bg",
    headingTextClass: "text-danger",
    descriptionTextClass: "text-ink-muted",
  },
  high: {
    pillLabel: "High Risk",
    heading: "Strict obligations apply before market entry",
    description:
      "This system is high-risk under Annex III. It must satisfy risk management, data governance, documentation, oversight, and registration requirements before deployment.",
    pillBgClass: "bg-warning",
    pillTextClass: "text-canvas",
    cardBorderClass: "border-warning",
    cardBgClass: "bg-warning-bg",
    headingTextClass: "text-warning",
    descriptionTextClass: "text-ink-muted",
  },
  limited: {
    pillLabel: "Limited Risk",
    heading: "Transparency obligations apply",
    description:
      "This system must disclose that people are interacting with AI, and label any synthetic content it generates. No conformity assessment is required.",
    pillBgClass: "bg-caution",
    pillTextClass: "text-ink-on-yellow",
    cardBorderClass: "border-caution",
    cardBgClass: "bg-caution-bg",
    headingTextClass: "text-ink-on-yellow",
    // caution-bg is fixed (light) across themes, so its body copy needs the
    // fixed dark ink-on-yellow color too, not the theme-flipping ink-muted.
    descriptionTextClass: "text-ink-on-yellow/75",
  },
  minimal: {
    pillLabel: "Minimal Risk",
    heading: "No mandatory obligations",
    description:
      "This system falls outside the Act's regulated categories. Voluntary codes of conduct are encouraged, but no specific legal requirements apply.",
    pillBgClass: "bg-success",
    pillTextClass: "text-canvas",
    cardBorderClass: "border-success",
    cardBgClass: "bg-success-bg",
    headingTextClass: "text-success",
    descriptionTextClass: "text-ink-muted",
  },
};

export function RiskBadge({
  tier,
  confidence,
}: {
  tier: RiskTier;
  confidence?: number;
}) {
  const config = RISK_CONFIG[tier];

  return (
    <div
      className={`border-l-4 ${config.cardBorderClass} ${config.cardBgClass} rounded-sm px-6 py-6 sm:px-8 sm:py-7`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full ${config.pillBgClass} ${config.pillTextClass} px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest`}
        >
          {config.pillLabel}
        </span>
        {typeof confidence === "number" && (
          <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>
      <h2
        className={`mt-4 font-heading text-2xl font-semibold tracking-tight sm:text-3xl ${config.headingTextClass}`}
      >
        {config.heading}
      </h2>
      <p className={`mt-2 max-w-xl text-sm ${config.descriptionTextClass}`}>
        {config.description}
      </p>
    </div>
  );
}
