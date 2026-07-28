"use client";

import { useEffect, useState } from "react";

const ENFORCEMENT_DATE = new Date("2026-08-02T00:00:00Z");
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysUntilEnforcement(): number {
  const diff = ENFORCEMENT_DATE.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / MS_PER_DAY));
}

/**
 * Renders the "N days until enforcement" pill.
 *
 * The homepage is a static page, so a value computed at build/prerender
 * time would go stale between deploys. This component defers the actual
 * day count to a post-mount effect (computed with the visitor's own clock)
 * and shows a date-only fallback for the SSR/prerendered markup, which
 * avoids a hydration mismatch since the fallback text isn't date-derived.
 */
export function EnforcementCountdown() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    setDaysLeft(daysUntilEnforcement());
  }, []);

  return (
    <span className="inline-flex items-center rounded-full bg-danger px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest text-canvas">
      {daysLeft === null
        ? "Enforcement begins Aug 2, 2026"
        : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} until enforcement`}
    </span>
  );
}
