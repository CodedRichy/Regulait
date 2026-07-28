import type { RiskTier } from "@/lib/knowledge-base";
import type { StructuredInput, RuleResult } from "@/lib/rules";

export type LLMProvider = "groq" | "gemini" | "openai" | "anthropic";

export interface LLMClassification {
  risk_tier: RiskTier;
  confidence: number;
  reasoning: string;
  applicable_articles: number[];
  exemptions_checked: string[];
  exemptions_applicable: string[];
}

interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
}

const PROVIDER_ENDPOINTS: Record<LLMProvider, string> = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
};

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
  gemini: "gemini-2.0-flash",
};

export function getLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER || "groq") as LLMProvider;
  const apiKey = process.env.LLM_API_KEY || "";
  const model = process.env.LLM_MODEL || DEFAULT_MODELS[provider];

  if (!apiKey) {
    throw new Error("LLM_API_KEY environment variable is required");
  }

  return { provider, model, apiKey };
}

export function buildClassificationPrompt(
  productDesc: string,
  input: StructuredInput,
  ruleResult: RuleResult
): string {
  return `You are an EU AI Act compliance expert. Classify the following AI system according to the EU AI Act risk tiers.

## EU AI Act Risk Tiers
- **Unacceptable**: Banned practices (social scoring, real-time biometric surveillance in public, subliminal manipulation)
- **High Risk**: Annex III categories (biometric ID, critical infrastructure, education, employment, essential services, law enforcement, migration, justice). Requires extensive documentation, risk management, human oversight.
- **Limited Risk**: Transparency obligations (chatbots, deepfakes, emotion recognition). Must disclose AI use.
- **Minimal Risk**: No requirements (spam filters, games, inventory management).

## Product Description
${productDesc}

## Structured Information
- AI Functions: ${input.ai_functions.join(", ") || "not specified"}
- Data Types Processed: ${input.data_types.join(", ") || "not specified"}
- User Types: ${input.user_types.join(", ") || "not specified"}
- Geography: ${input.geography.join(", ") || "not specified"}

## Preliminary Rule Engine Assessment
${ruleResult.reasoning}

## Instructions
Classify this AI system. Respond with ONLY a JSON object (no markdown, no code fences):
{
  "risk_tier": "unacceptable" | "high" | "limited" | "minimal",
  "confidence": 0.0-1.0,
  "reasoning": "One paragraph explaining the classification",
  "applicable_articles": [list of article numbers that apply],
  "exemptions_checked": ["sme", "open_source", "research", "personal_use", "military"],
  "exemptions_applicable": [list of exemption keys that apply to this product]
}

Be conservative: if uncertain, classify at the HIGHER risk tier. It is safer to over-classify than under-classify.`;
}

async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function parseClassification(raw: string): LLMClassification {
  const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  const validTiers: RiskTier[] = ["unacceptable", "high", "limited", "minimal"];
  if (!validTiers.includes(parsed.risk_tier)) {
    throw new Error(`Invalid risk_tier from LLM: ${parsed.risk_tier}`);
  }

  return {
    risk_tier: parsed.risk_tier,
    confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
    reasoning: parsed.reasoning || "No reasoning provided",
    applicable_articles: parsed.applicable_articles || [],
    exemptions_checked: parsed.exemptions_checked || [],
    exemptions_applicable: parsed.exemptions_applicable || [],
  };
}

export async function classifyWithLLM(
  productDesc: string,
  input: StructuredInput,
  ruleResult: RuleResult
): Promise<LLMClassification> {
  const config = getLLMConfig();
  const prompt = buildClassificationPrompt(productDesc, input, ruleResult);

  let raw: string;

  switch (config.provider) {
    case "groq":
    case "openai":
      raw = await callOpenAICompatible(
        PROVIDER_ENDPOINTS[config.provider],
        config.apiKey,
        config.model,
        prompt
      );
      break;
    case "anthropic":
      raw = await callAnthropic(config.apiKey, config.model, prompt);
      break;
    case "gemini":
      raw = await callGemini(config.apiKey, config.model, prompt);
      break;
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }

  return parseClassification(raw);
}
