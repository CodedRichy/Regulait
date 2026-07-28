import { randomUUID } from "crypto";
import type { ClassificationResult } from "@/lib/classifier";
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
    id: randomUUID(),
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
