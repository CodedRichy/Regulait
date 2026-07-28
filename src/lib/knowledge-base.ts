export type RiskTier = "unacceptable" | "high" | "limited" | "minimal";

export interface AnnexIIICategory {
  id: number;
  name: string;
  examples: string[];
}

export interface TransparencyObligation {
  id: string;
  title: string;
  description: string;
  applies_to: string[];
}

export interface Requirement {
  number: number;
  title: string;
  applies_to: RiskTier[];
  summary: string;
  key_actions: string[];
  effort: "low" | "medium" | "high";
  deadline: string;
}

export interface Penalty {
  description: string;
  max_fine_eur: number;
  max_fine_percent: number;
  fine_basis: string;
}

export interface Exemption {
  name: string;
  description: string;
  effect: string;
  criteria: string;
}

export interface RiskCategory {
  description: string;
  articles: number[];
  criteria?: string[];
  annex_iii_categories?: AnnexIIICategory[];
  obligations?: TransparencyObligation[];
}

export interface EUAIActData {
  risk_categories: Record<RiskTier, RiskCategory>;
  requirements: Record<string, Requirement>;
  penalties: Record<string, Penalty | { description: string; note: string }>;
  exemptions: Record<string, Exemption>;
  timeline: Record<string, string>;
}

import euAIActRaw from "@/data/eu-ai-act.json";

const euAIAct = euAIActRaw as unknown as EUAIActData;

export function getKnowledgeBase(): EUAIActData {
  return euAIAct;
}

export function getRequirementsForTier(tier: RiskTier): Requirement[] {
  return Object.values(euAIAct.requirements).filter((req) =>
    req.applies_to.includes(tier)
  );
}

export function getAnnexIIICategories(): AnnexIIICategory[] {
  return euAIAct.risk_categories.high.annex_iii_categories ?? [];
}

export function getPenalties(tier: RiskTier): Penalty | null {
  if (tier === "unacceptable") {
    return euAIAct.penalties.unacceptable as Penalty;
  }
  if (tier === "high" || tier === "limited") {
    return euAIAct.penalties.high_risk_non_compliance as Penalty;
  }
  return null;
}

export function getExemptions(): Exemption[] {
  return Object.values(euAIAct.exemptions);
}

export function getTransparencyObligations(): TransparencyObligation[] {
  return euAIAct.risk_categories.limited.obligations ?? [];
}
