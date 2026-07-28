import { describe, it, expect } from "vitest";
import { generateReport } from "@/lib/report-generator";
import type { ClassificationResult } from "@/lib/classifier";

describe("report-generator", () => {
  it("generates report for high-risk classification", () => {
    const classification: ClassificationResult = {
      risk_tier: "high",
      confidence: 1,
      reasoning: "Resume screening is high-risk under Annex III",
      matched_rules: ["resume_screening"],
      applicable_articles: [6, 9, 10, 11, 12, 13, 14, 15, 16, 49, 50],
      exemptions_applicable: ["sme"],
      source: "rules",
    };
    const report = generateReport(classification);
    expect(report.risk_tier).toBe("high");
    expect(report.requirements.length).toBeGreaterThan(5);
    expect(report.penalties).not.toBeNull();
    expect(report.penalties!.max_fine_eur).toBe(15000000);
    expect(report.id).toBeDefined();
    expect(report.created_at).toBeDefined();
  });

  it("generates report for minimal-risk with no requirements", () => {
    const classification: ClassificationResult = {
      risk_tier: "minimal",
      confidence: 1,
      reasoning: "Spam filter",
      matched_rules: ["spam_filter"],
      applicable_articles: [],
      exemptions_applicable: [],
      source: "rules",
    };
    const report = generateReport(classification);
    expect(report.risk_tier).toBe("minimal");
    expect(report.requirements.length).toBe(0);
    expect(report.penalties).toBeNull();
  });

  it("includes transparency obligations for limited risk", () => {
    const classification: ClassificationResult = {
      risk_tier: "limited",
      confidence: 1,
      reasoning: "Chatbot",
      matched_rules: ["chatbot"],
      applicable_articles: [50],
      exemptions_applicable: [],
      source: "rules",
    };
    const report = generateReport(classification);
    expect(report.transparency_obligations.length).toBeGreaterThan(0);
  });

  it("splits exemptions into applicable and not applicable", () => {
    const classification: ClassificationResult = {
      risk_tier: "high",
      confidence: 0.9,
      reasoning: "Credit scoring",
      matched_rules: ["credit_scoring"],
      applicable_articles: [6, 9, 10, 11, 12, 13, 14, 15],
      exemptions_applicable: ["sme"],
      source: "llm",
    };
    const report = generateReport(classification);
    expect(report.exemptions.applicable.length).toBeGreaterThan(0);
    expect(report.exemptions.not_applicable.length).toBeGreaterThan(0);
    expect(
      report.exemptions.applicable.some((e) => e.name.includes("SME"))
    ).toBe(true);
  });
});
