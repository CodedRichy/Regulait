import { describe, it, expect, beforeEach } from "vitest";
import { classify } from "@/lib/client-classifier";
import { clearBYOKConfig } from "@/lib/client-llm";
import type { StructuredInput } from "@/lib/rules";

describe("client-classifier", () => {
  beforeEach(() => {
    clearBYOKConfig();
  });

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

  it("falls back to a low-confidence best guess when rules are ambiguous and no BYOK key is configured", async () => {
    // getBYOKConfig() returns null outside a browser (no `window`), which is
    // exactly the case here (vitest runs under node) -- so this exercises
    // the same "no LLM available" path a real visitor without a saved key
    // would hit.
    const input: StructuredInput = {
      ai_functions: ["other"],
      data_types: ["other"],
      user_types: ["internal"],
      geography: ["eu_countries"],
    };
    const result = await classify(
      "A completely novel AI workflow tool that doesn't match any known category",
      input
    );
    expect(result.source).toBe("rules");
    expect(result.confidence).toBeLessThan(1);
    expect(result.llm_warning).toBeDefined();
  });
});
