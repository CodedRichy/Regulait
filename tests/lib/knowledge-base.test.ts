import { describe, it, expect } from "vitest";
import {
  getKnowledgeBase,
  getRequirementsForTier,
  getAnnexIIICategories,
  getPenalties,
  getExemptions,
  getTransparencyObligations,
} from "@/lib/knowledge-base";

describe("knowledge-base", () => {
  it("loads full knowledge base without errors", () => {
    const kb = getKnowledgeBase();
    expect(kb.risk_categories).toBeDefined();
    expect(kb.requirements).toBeDefined();
    expect(kb.penalties).toBeDefined();
    expect(kb.exemptions).toBeDefined();
  });

  it("returns all four risk tiers", () => {
    const kb = getKnowledgeBase();
    expect(Object.keys(kb.risk_categories)).toEqual(
      expect.arrayContaining(["unacceptable", "high", "limited", "minimal"])
    );
  });

  it("returns requirements for high-risk tier", () => {
    const reqs = getRequirementsForTier("high");
    expect(reqs.length).toBeGreaterThan(5);
    expect(reqs.some((r) => r.title === "Risk Management System")).toBe(true);
    expect(reqs.some((r) => r.title === "Human Oversight")).toBe(true);
  });

  it("returns no requirements for minimal tier", () => {
    const reqs = getRequirementsForTier("minimal");
    expect(reqs.length).toBe(0);
  });

  it("returns transparency requirements for limited tier", () => {
    const reqs = getRequirementsForTier("limited");
    expect(reqs.some((r) => r.title === "Transparency Obligations")).toBe(true);
  });

  it("returns 8 Annex III categories", () => {
    const cats = getAnnexIIICategories();
    expect(cats.length).toBe(8);
    expect(cats[0].name).toBe("Biometric identification and categorisation");
  });

  it("returns penalties for unacceptable tier", () => {
    const p = getPenalties("unacceptable");
    expect(p).not.toBeNull();
    expect(p!.max_fine_eur).toBe(35000000);
    expect(p!.max_fine_percent).toBe(7);
  });

  it("returns penalties for high-risk tier", () => {
    const p = getPenalties("high");
    expect(p).not.toBeNull();
    expect(p!.max_fine_eur).toBe(15000000);
  });

  it("returns null penalties for minimal tier", () => {
    expect(getPenalties("minimal")).toBeNull();
  });

  it("returns at least 4 exemptions", () => {
    const ex = getExemptions();
    expect(ex.length).toBeGreaterThanOrEqual(4);
    expect(ex.some((e) => e.name === "SME / Startup Exemption")).toBe(true);
  });

  it("returns transparency obligations", () => {
    const obs = getTransparencyObligations();
    expect(obs.length).toBeGreaterThan(0);
    expect(obs.some((o) => o.id === "deepfake_label")).toBe(true);
  });
});
