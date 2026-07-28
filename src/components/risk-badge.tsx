import type { RiskTier } from "@/lib/knowledge-base";

interface RiskTierConfig {
  pillLabel: string;
  heading: string;
  description: string;
  pillBgClass: string;
  pillTextClass: string;
  borderClass: string;
  glowClass: string;
  headingTextClass: string;
}

const RISK_CONFIG: Record<RiskTier, RiskTierConfig> = {
  unacceptable: {
    pillLabel: "Unacceptable Risk",
    heading: "Prohibited under the EU AI Act",
    description:
      "This system falls into a banned category (Article 5). It cannot be placed on the EU market, deployed, or put into service in any form.",
    pillBgClass: "bg-danger",
    pillTextClass: "text-canvas",
    borderClass: "border-danger",
    glowClass: "glow-danger",
    headingTextClass: "text-danger",
  },
  high: {
    pillLabel: "High Risk",
    heading: "Strict obligations apply before market entry",
    description:
      "This system is high-risk under Annex III. It must satisfy risk management, data governance, documentation, oversight, and registration requirements before deployment.",
    pillBgClass: "bg-warning",
    pillTextClass: "text-canvas",
    borderClass: "border-warning",
    glowClass: "",
    headingTextClass: "text-warning",
  },
  limited: {
    pillLabel: "Limited Risk",
    heading: "Transparency obligations apply",
    description:
      "This system must disclose that people are interacting with AI, and label any synthetic content it generates. No conformity assessment is required.",
    pillBgClass: "bg-caution",
    pillTextClass: "text-ink-on-yellow",
    borderClass: "border-caution",
    glowClass: "",
    headingTextClass: "text-caution",
  },
  minimal: {
    pillLabel: "Minimal Risk",
    heading: "No mandatory obligations",
    description:
      "This system falls outside the Act's regulated categories. Voluntary codes of conduct are encouraged, but no specific legal requirements apply.",
    pillBgClass: "bg-success",
    pillTextClass: "text-canvas",
    borderClass: "border-success",
    glowClass: "",
    headingTextClass: "text-success",
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
      className={`glass-card ${config.glowClass} rounded-[10px] border-l-4 ${config.borderClass} px-6 py-6 sm:px-8 sm:py-7`}
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
      <p className="mt-2 max-w-xl text-sm text-ink-muted">
        {config.description}
      </p>
    </div>
  );
}
