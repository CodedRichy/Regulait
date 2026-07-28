import type { RiskTier } from "@/lib/knowledge-base";
import { evaluateRules, type StructuredInput } from "@/lib/rules";
import { classifyWithLLM } from "@/lib/llm";

export interface ClassificationResult {
  risk_tier: RiskTier;
  confidence: number;
  reasoning: string;
  matched_rules: string[];
  applicable_articles: number[];
  exemptions_applicable: string[];
  source: "rules" | "llm";
}

export async function classify(
  productDesc: string,
  input: StructuredInput
): Promise<ClassificationResult> {
  const ruleResult = evaluateRules(productDesc, input);

  if (ruleResult.confident && ruleResult.risk_tier !== null) {
    const articleMap: Record<RiskTier, number[]> = {
      unacceptable: [5],
      high: [6, 9, 10, 11, 12, 13, 14, 15, 16, 49, 50],
      limited: [50],
      minimal: [],
    };

    return {
      risk_tier: ruleResult.risk_tier,
      confidence: 1,
      reasoning: ruleResult.reasoning,
      matched_rules: ruleResult.matched_rules,
      applicable_articles: articleMap[ruleResult.risk_tier],
      exemptions_applicable: [],
      source: "rules",
    };
  }

  const llmResult = await classifyWithLLM(productDesc, input, ruleResult);

  return {
    risk_tier: llmResult.risk_tier,
    confidence: llmResult.confidence,
    reasoning: llmResult.reasoning,
    matched_rules: [],
    applicable_articles: llmResult.applicable_articles,
    exemptions_applicable: llmResult.exemptions_applicable,
    source: "llm",
  };
}
