import type { ClassificationResult } from "@/lib/client-classifier";
import {
  type RiskTier,
  type Requirement,
  type Penalty,
  type Exemption,
  type TransparencyObligation,
  getRequirementsForTier,
  getPenalties,
  getExemptions,
  getTransparencyObligations,
} from "@/lib/knowledge-base";

export interface ComplianceReport {
  id: string;
  risk_tier: RiskTier;
  confidence: number;
  reasoning: string;
  source: "rules" | "llm";
  requirements: Requirement[];
  penalties: Penalty | null;
  exemptions: {
    applicable: Exemption[];
    not_applicable: Exemption[];
  };
  transparency_obligations: TransparencyObligation[];
  created_at: string;
}

/** Generates a report id using the Web Crypto API, which is available in
 * both browsers and modern Node -- avoids importing Node's "crypto" module,
 * which isn't safe to bundle into client code. */
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (very old browsers).
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function generateReport(
  classification: ClassificationResult
): ComplianceReport {
  const requirements = getRequirementsForTier(classification.risk_tier);
  const penalties = getPenalties(classification.risk_tier);
  const allExemptions = getExemptions();

  const applicable = allExemptions.filter((e) => {
    const key = Object.entries({
      "SME / Startup Exemption": "sme",
      "Open Source Exemption": "open_source",
      "Research and Development Exemption": "research",
      "Personal / Non-Professional Use": "personal_use",
      "Military and National Security": "military",
    }).find(([name]) => e.name === name)?.[1];
    return key && classification.exemptions_applicable.includes(key);
  });

  const not_applicable = allExemptions.filter(
    (e) => !applicable.includes(e)
  );

  const transparency =
    classification.risk_tier === "limited" || classification.risk_tier === "high"
      ? getTransparencyObligations()
      : [];

  return {
    id: generateId(),
    risk_tier: classification.risk_tier,
    confidence: classification.confidence,
    reasoning: classification.reasoning,
    source: classification.source,
    requirements,
    penalties,
    exemptions: { applicable, not_applicable },
    transparency_obligations: transparency,
    created_at: new Date().toISOString(),
  };
}
