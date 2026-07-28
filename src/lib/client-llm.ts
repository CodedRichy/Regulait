// Browser-safe BYOK (bring-your-own-key) LLM client. This module never
// touches a server -- it reads a user-supplied API key from localStorage
// and calls the provider's API directly from the browser.
//
// Only Gemini reliably supports CORS from a browser context. OpenAI, Groq,
// and Anthropic block cross-origin requests, so those providers are only
// usable when Regulait is run locally (npm run dev), not on the deployed
// static site.

import type { RiskTier } from "@/lib/knowledge-base";
import type { StructuredInput, RuleResult } from "@/lib/rules";

export type BYOKProvider = "gemini" | "openai" | "groq" | "anthropic";

export interface BYOKConfig {
  provider: BYOKProvider;
  apiKey: string;
  model: string;
}

export interface LLMClassification {
  risk_tier: RiskTier;
  confidence: number;
  reasoning: string;
  applicable_articles: number[];
  exemptions_checked: string[];
  exemptions_applicable: string[];
}

const STORAGE_KEY = "regulait_llm_config";

export const DEFAULT_MODELS: Record<BYOKProvider, string> = {
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
  anthropic: "claude-haiku-4-5-20251001",
};

export const PROVIDER_LABELS: Record<BYOKProvider, string> = {
  gemini: "Gemini (recommended -- works in browser)",
  openai: "OpenAI (local dev only -- blocks browser CORS)",
  groq: "Groq (local dev only -- blocks browser CORS)",
  anthropic: "Anthropic (local dev only -- blocks browser CORS)",
};

/** Providers that can be called directly from a browser (no CORS block). */
export const BROWSER_SUPPORTED_PROVIDERS: BYOKProvider[] = ["gemini"];

export function getBYOKConfig(): BYOKConfig | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as BYOKConfig;
  } catch {
    return null;
  }
}

export function saveBYOKConfig(config: BYOKConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearBYOKConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
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

/** OpenAI/Groq-compatible chat completions endpoint. Browser calls to these
 * will typically fail with a CORS error -- callers should catch that and
 * show the "run locally" message rather than a generic failure. */
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
      "anthropic-dangerous-direct-browser-access": "true",
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

export class BYOKUnsupportedProviderError extends Error {
  constructor(provider: BYOKProvider) {
    super(
      `${provider} doesn't support browser-based calls. Use Gemini for best results, or run Regulait locally with "npm run dev".`
    );
    this.name = "BYOKUnsupportedProviderError";
  }
}

export async function classifyWithBYOK(
  productDesc: string,
  input: StructuredInput,
  ruleResult: RuleResult,
  config: BYOKConfig
): Promise<LLMClassification> {
  const prompt = buildClassificationPrompt(productDesc, input, ruleResult);

  let raw: string;

  switch (config.provider) {
    case "gemini":
      raw = await callGemini(config.apiKey, config.model, prompt);
      break;
    case "groq":
      raw = await callOpenAICompatible(
        "https://api.groq.com/openai/v1/chat/completions",
        config.apiKey,
        config.model,
        prompt
      );
      break;
    case "openai":
      raw = await callOpenAICompatible(
        "https://api.openai.com/v1/chat/completions",
        config.apiKey,
        config.model,
        prompt
      );
      break;
    case "anthropic":
      raw = await callAnthropic(config.apiKey, config.model, prompt);
      break;
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }

  return parseClassification(raw);
}
