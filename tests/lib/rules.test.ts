import { describe, it, expect } from "vitest";
import { evaluateRules, type StructuredInput } from "@/lib/rules";

function makeInput(overrides: Partial<StructuredInput> = {}): StructuredInput {
  return {
    ai_functions: [],
    data_types: [],
    user_types: ["businesses"],
    geography: ["eu_countries"],
    ...overrides,
  };
}

describe("rule engine", () => {
  it("classifies social scoring as unacceptable", () => {
    const result = evaluateRules(
      "We score citizens based on their social behavior for government services",
      makeInput({ ai_functions: ["scoring"], user_types: ["government"] })
    );
    expect(result.confident).toBe(true);
    expect(result.risk_tier).toBe("unacceptable");
    expect(result.matched_rules.length).toBeGreaterThan(0);
  });

  it("classifies biometric screening as high risk", () => {
    const result = evaluateRules(
      "Our system uses facial recognition to identify employees",
      makeInput({ ai_functions: ["screening"], data_types: ["biometric"] })
    );
    expect(result.confident).toBe(true);
    expect(result.risk_tier).toBe("high");
  });

  it("classifies resume screening as high risk", () => {
    const result = evaluateRules(
      "AI system that screens and ranks job applicants based on resumes",
      makeInput({ ai_functions: ["screening"] })
    );
    expect(result.confident).toBe(true);
    expect(result.risk_tier).toBe("high");
  });

  it("classifies credit scoring as high risk", () => {
    const result = evaluateRules(
      "We use AI to evaluate creditworthiness of loan applicants",
      makeInput({ ai_functions: ["scoring"], data_types: ["financial"] })
    );
    expect(result.confident).toBe(true);
    expect(result.risk_tier).toBe("high");
  });

  it("classifies chatbot as limited risk", () => {
    const result = evaluateRules(
      "Customer support chatbot that answers questions about our products",
      makeInput({ ai_functions: ["generating"], user_types: ["consumers"] })
    );
    expect(result.confident).toBe(true);
    expect(result.risk_tier).toBe("limited");
  });

  it("classifies spam filter as minimal risk", () => {
    const result = evaluateRules(
      "Email spam filter that classifies incoming emails",
      makeInput({ ai_functions: ["detecting"] })
    );
    expect(result.confident).toBe(true);
    expect(result.risk_tier).toBe("minimal");
  });

  it("classifies no EU exposure as out of scope", () => {
    const result = evaluateRules(
      "AI recommendation engine for US-only market",
      makeInput({ geography: ["no_eu_exposure"] })
    );
    expect(result.confident).toBe(true);
    expect(result.risk_tier).toBe("minimal");
    expect(result.reasoning).toContain("outside EU scope");
  });

  it("returns not confident for ambiguous cases", () => {
    const result = evaluateRules(
      "We use AI to optimise our internal supply chain logistics",
      makeInput({ ai_functions: ["recommending"] })
    );
    expect(result.confident).toBe(false);
    expect(result.risk_tier).toBeNull();
  });

  it("classifies deepfake generation as limited risk", () => {
    const result = evaluateRules(
      "AI tool that generates synthetic video content of people",
      makeInput({ ai_functions: ["generating"] })
    );
    expect(result.confident).toBe(true);
    expect(result.risk_tier).toBe("limited");
  });

  it("classifies medical AI as high risk", () => {
    const result = evaluateRules(
      "AI diagnostic tool that analyses medical scans to detect cancer",
      makeInput({ ai_functions: ["detecting"], data_types: ["health"] })
    );
    expect(result.confident).toBe(true);
    expect(result.risk_tier).toBe("high");
  });
});
