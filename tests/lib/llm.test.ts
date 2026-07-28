import { describe, it, expect, vi, beforeEach } from "vitest";
import { getLLMConfig, buildClassificationPrompt } from "@/lib/llm";
import type { StructuredInput } from "@/lib/rules";

describe("llm", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads config from env vars", () => {
    vi.stubEnv("LLM_PROVIDER", "groq");
    vi.stubEnv("LLM_API_KEY", "test-key");
    vi.stubEnv("LLM_MODEL", "llama-3.3-70b-versatile");

    const config = getLLMConfig();
    expect(config.provider).toBe("groq");
    expect(config.apiKey).toBe("test-key");
    expect(config.model).toBe("llama-3.3-70b-versatile");
  });

  it("throws if API key is missing", () => {
    vi.stubEnv("LLM_PROVIDER", "groq");
    vi.stubEnv("LLM_API_KEY", "");

    expect(() => getLLMConfig()).toThrow("LLM_API_KEY");
  });

  it("builds classification prompt with product description", () => {
    const input: StructuredInput = {
      ai_functions: ["screening"],
      data_types: ["personal"],
      user_types: ["businesses"],
      geography: ["eu_countries"],
    };
    const prompt = buildClassificationPrompt(
      "AI tool that ranks candidates",
      input,
      { confident: false, risk_tier: null, matched_rules: [], reasoning: "No match" }
    );
    expect(prompt).toContain("AI tool that ranks candidates");
    expect(prompt).toContain("screening");
    expect(prompt).toContain("EU AI Act");
  });
});
