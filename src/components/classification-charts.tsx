"use client";

import { useRef, useEffect, useState } from "react";
const stats = {
  totalSystems: 75,
  tierDistribution: { unacceptable: 5, high: 35, limited: 15, minimal: 8, ambiguous: 12 } as Record<string, number>,
  ruleFrequency: [
    { rule: "medical_device", count: 10 },
    { rule: "chatbot", count: 8 },
    { rule: "biometric_identification", count: 5 },
    { rule: "resume_screening", count: 5 },
    { rule: "deepfake_generation", count: 5 },
    { rule: "insurance_risk", count: 4 },
    { rule: "migration_border", count: 4 },
    { rule: "credit_scoring", count: 3 },
    { rule: "education_grading", count: 3 },
    { rule: "law_enforcement", count: 3 },
    { rule: "critical_infrastructure", count: 3 },
    { rule: "social_scoring", count: 2 },
  ],
};

const TIER_COLORS: Record<string, string> = {
  unacceptable: "#d44040",
  high: "#d4913a",
  limited: "#c9b645",
  minimal: "#48b070",
  ambiguous: "#6b7280",
};

const TIER_LABELS: Record<string, string> = {
  unacceptable: "Unacceptable",
  high: "High",
  limited: "Limited",
  minimal: "Minimal",
  ambiguous: "Ambiguous",
};

function DonutChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredTier, setHoveredTier] = useState<string | null>(null);

  const tiers = Object.entries(stats.tierDistribution).filter(
    ([, count]) => count > 0
  );
  const total = tiers.reduce((sum, [, count]) => sum + count, 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 240;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = 105;
    const innerR = 65;

    ctx.clearRect(0, 0, size, size);

    let startAngle = -Math.PI / 2;

    for (const [tier, count] of tiers) {
      const sweep = (count / total) * Math.PI * 2;
      const isHovered = hoveredTier === tier;
      const r = isHovered ? outerR + 4 : outerR;

      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, startAngle + sweep);
      ctx.arc(cx, cy, innerR, startAngle + sweep, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = TIER_COLORS[tier] || "#6b7280";
      ctx.globalAlpha = isHovered ? 1 : 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;

      startAngle += sweep;
    }

    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--regulait-ink")
      .trim() || "white";
    ctx.font = "600 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(total), cx, cy - 8);
    ctx.font = "400 11px system-ui, sans-serif";
    ctx.globalAlpha = 0.5;
    ctx.fillText("systems", cx, cy + 14);
    ctx.globalAlpha = 1;
  }, [hoveredTier, tiers, total]);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
      <canvas ref={canvasRef} className="shrink-0" />
      <div className="flex flex-col gap-2">
        {tiers.map(([tier, count]) => (
          <button
            key={tier}
            type="button"
            className="flex items-center gap-3 rounded-md px-2 py-1 text-left transition-colors hover:bg-surface-2/60"
            onMouseEnter={() => setHoveredTier(tier)}
            onMouseLeave={() => setHoveredTier(null)}
          >
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: TIER_COLORS[tier] }}
            />
            <span className="text-sm text-ink">
              {TIER_LABELS[tier] || tier}
            </span>
            <span className="ml-auto font-heading text-sm font-semibold tabular-nums text-ink">
              {count}
            </span>
            <span className="w-10 text-right font-mono text-xs text-ink-muted">
              {Math.round((count / total) * 100)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RuleBarChart() {
  const topRules = stats.ruleFrequency.slice(0, 8);
  const maxCount = topRules[0]?.count || 1;

  return (
    <div className="flex flex-col gap-3">
      {topRules.map((item) => (
        <div key={item.rule} className="group flex items-center gap-3">
          <span className="w-36 shrink-0 truncate text-right text-xs text-ink-muted sm:w-44">
            {item.rule.replace(/_/g, " ")}
          </span>
          <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-surface-2/60">
            <div
              className="absolute inset-y-0 left-0 rounded-md transition-all duration-500 group-hover:brightness-125"
              style={{
                width: `${(item.count / maxCount) * 100}%`,
                backgroundColor: ruleColor(item.rule),
              }}
            />
            <span className="relative z-10 flex h-full items-center px-2 font-mono text-xs font-semibold text-ink">
              {item.count}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ruleColor(rule: string): string {
  const tierMap: Record<string, string> = {
    social_scoring: "unacceptable",
    subliminal_manipulation: "unacceptable",
    realtime_biometric_public: "unacceptable",
    biometric_identification: "high",
    resume_screening: "high",
    credit_scoring: "high",
    education_grading: "high",
    medical_device: "high",
    law_enforcement: "high",
    critical_infrastructure: "high",
    migration_border: "high",
    insurance_risk: "high",
    chatbot: "limited",
    deepfake_generation: "limited",
    content_generation: "limited",
    spam_filter: "minimal",
    game_ai: "minimal",
    inventory_management: "minimal",
    search_ranking: "minimal",
  };
  return TIER_COLORS[tierMap[rule] || "ambiguous"] || "#6b7280";
}

export function ClassificationCharts() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center border-t border-border/60 bg-surface px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-14 max-w-xl">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Telemetry
          </p>
          <h2 className="mt-1 font-heading text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
            {stats.totalSystems} AI systems classified
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Real classification results from our rule engine tested across
            healthcare, finance, law enforcement, education, and more.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="glass-card rounded-[10px] p-6 sm:p-8">
            <h3 className="mb-6 font-heading text-sm font-semibold uppercase tracking-widest text-ink-muted">
              Risk tier distribution
            </h3>
            <DonutChart />
          </div>

          <div className="glass-card rounded-[10px] p-6 sm:p-8">
            <h3 className="mb-6 font-heading text-sm font-semibold uppercase tracking-widest text-ink-muted">
              Most triggered rules
            </h3>
            <RuleBarChart />
          </div>
        </div>
      </div>
    </section>
  );
}
