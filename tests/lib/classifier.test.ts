import { describe, it, expect } from "vitest";
import { classify } from "@/lib/classifier";
import type { StructuredInput } from "@/lib/rules";

describe("classifier", () => {
  it("returns rule-based result when rules are confident", async () => {
    const input: StructuredInput = {
      ai_functions: ["detecting"],
      data_types: [],
      user_types: ["businesses"],
      geography: ["eu_countries"],
    };
    const result = await classify("Email spam filter for enterprise", input);
    expect(result.risk_tier).toBe("minimal");
    expect(result.source).toBe("rules");
    expect(result.confidence).toBe(1);
  });

  it("returns rule-based result for biometric screening", async () => {
    const input: StructuredInput = {
      ai_functions: ["screening"],
      data_types: ["biometric"],
      user_types: ["consumers"],
      geography: ["eu_countries"],
    };
    const result = await classify("Facial recognition access control", input);
    expect(result.risk_tier).toBe("high");
    expect(result.source).toBe("rules");
  });
});
