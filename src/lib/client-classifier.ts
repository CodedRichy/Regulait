// Client-safe classification pipeline. Runs the deterministic rule engine
// first (works fully offline); for ambiguous cases falls back to a
// BYOK (bring-your-own-key) LLM call made directly from the browser when
// the user has configured one, or to the rule engine's best-effort guess
// with reduced confidence otherwise.

import type { RiskTier } from "@/lib/knowledge-base";
import { evaluateRules, type StructuredInput } from "@/lib/rules";
import {
  classifyWithBYOK,
  getBYOKConfig,
  BROWSER_SUPPORTED_PROVIDERS,
  BYOKUnsupportedProviderError,
} from "@/lib/client-llm";

export interface ClassificationResult {
  risk_tier: RiskTier;
  confidence: number;
  reasoning: string;
  matched_rules: string[];
  applicable_articles: number[];
  exemptions_applicable: string[];
  source: "rules" | "llm";
  llm_warning?: string;
}

const ARTICLE_MAP: Record<RiskTier, number[]> = {
  unacceptable: [5],
  high: [6, 9, 10, 11, 12, 13, 14, 15, 16, 49, 50],
  limited: [50],
  minimal: [],
};

export async function classify(
  productDesc: string,
  input: StructuredInput
): Promise<ClassificationResult> {
  const ruleResult = evaluateRules(productDesc, input);

  if (ruleResult.confident && ruleResult.risk_tier !== null) {
    return {
      risk_tier: ruleResult.risk_tier,
      confidence: 1,
      reasoning: ruleResult.reasoning,
      matched_rules: ruleResult.matched_rules,
      applicable_articles: ARTICLE_MAP[ruleResult.risk_tier],
      exemptions_applicable: [],
      source: "rules",
    };
  }

  // Rule engine could not confidently classify -- try a BYOK LLM call if
  // the user has configured one.
  const byokConfig = getBYOKConfig();

  if (byokConfig && byokConfig.apiKey) {
    try {
      const llmResult = await classifyWithBYOK(
        productDesc,
        input,
        ruleResult,
        byokConfig
      );

      return {
        risk_tier: llmResult.risk_tier,
        confidence: llmResult.confidence,
        reasoning: llmResult.reasoning,
        matched_rules: [],
        applicable_articles: llmResult.applicable_articles,
        exemptions_applicable: llmResult.exemptions_applicable,
        source: "llm",
      };
    } catch (err) {
      const warning =
        err instanceof BYOKUnsupportedProviderError
          ? err.message
          : !BROWSER_SUPPORTED_PROVIDERS.includes(byokConfig.provider)
            ? `${byokConfig.provider} doesn't support browser-based calls. Use Gemini for best results, or run Regulait locally with "npm run dev".`
            : `LLM classification failed (${
                err instanceof Error ? err.message : "unknown error"
              }). Falling back to the rule engine's best guess.`;

      return bestEffortFallback(ruleResult, warning);
    }
  }

  return bestEffortFallback(
    ruleResult,
    "No LLM API key configured. This is the rule engine's best guess for an ambiguous case -- add a free Gemini API key in Settings for a more accurate classification."
  );
}

/**
 * When the rule engine isn't confident and no LLM is available (or the LLM
 * call failed), fall back to "minimal" with low confidence rather than
 * silently guessing at something riskier. The warning explains why.
 */
function bestEffortFallback(
  ruleResult: ReturnType<typeof evaluateRules>,
  warning: string
): ClassificationResult {
  const tier: RiskTier = "minimal";
  return {
    risk_tier: tier,
    confidence: 0.35,
    reasoning: `${ruleResult.reasoning} ${warning}`,
    matched_rules: ruleResult.matched_rules,
    applicable_articles: ARTICLE_MAP[tier],
    exemptions_applicable: [],
    source: "rules",
    llm_warning: warning,
  };
}
