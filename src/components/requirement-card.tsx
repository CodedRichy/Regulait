import type { Requirement } from "@/lib/knowledge-base";

const EFFORT_CONFIG: Record<
  Requirement["effort"],
  { label: string; bgClass: string; textClass: string }
> = {
  low: { label: "Low effort", bgClass: "bg-success-bg", textClass: "text-success" },
  medium: {
    label: "Medium effort",
    bgClass: "bg-caution-bg",
    textClass: "text-caution",
  },
  high: { label: "High effort", bgClass: "bg-danger-bg", textClass: "text-danger" },
};

export function RequirementCard({ requirement }: { requirement: Requirement }) {
  const effort = EFFORT_CONFIG[requirement.effort];

  return (
    <div className="glass-card rounded-[10px] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Article {requirement.number}
          </p>
          <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight text-ink">
            {requirement.title}
          </h3>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full ${effort.bgClass} ${effort.textClass} px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide`}
        >
          {effort.label}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        {requirement.summary}
      </p>

      {requirement.key_actions.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {requirement.key_actions.map((action) => (
            <li
              key={action}
              className="flex gap-2 text-sm leading-snug text-ink"
            >
              <span aria-hidden className="mt-1 text-ink-muted">
                &middot;
              </span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          Deadline
        </span>
        <span className="text-xs font-medium text-ink">
          {requirement.deadline}
        </span>
      </div>
    </div>
  );
}
