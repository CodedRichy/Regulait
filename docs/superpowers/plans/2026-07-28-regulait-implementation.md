# Regulait Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an EU AI Act compliance checker that classifies AI products by risk tier and generates actionable compliance reports.

**Architecture:** Next.js 15 App Router with a deterministic rule engine + LLM fallback for classification. Pre-processed EU AI Act data as embedded JSON. Supabase for persistence/auth, Stripe for billing, Vercel for hosting.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Supabase, Stripe, Resend, provider-agnostic LLM client (Groq/Gemini/OpenAI/Anthropic)

## Global Constraints

- TypeScript strict mode, no `any` types
- Next.js 15 App Router (not Pages Router)
- Tailwind CSS 4 (not v3)
- All server-side secrets via `.env.local`, never exposed to client
- EU AI Act knowledge base is a static JSON file, not fetched at runtime
- LLM provider configured via env vars: `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`
- Every report page includes legal disclaimer: "This is not legal advice"
- UTF-8 encoding on all file I/O
- No Unicode characters in CLI output (Windows compatibility)
- Project root: `C:\Users\rishi\Documents\GitHub\Regulait`

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.env.local.example`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`

**Interfaces:**
- Produces: Working Next.js 15 app with Tailwind, runnable via `npm run dev`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd C:\Users\rishi\Documents\GitHub\Regulait
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select: No to Turbopack (stability), Yes to everything else.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr stripe @react-pdf/renderer resend
npm install -D @types/node vitest @vitejs/plugin-react
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create .env.local.example**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LLM
LLM_PROVIDER=groq
LLM_API_KEY=
LLM_MODEL=llama-3.3-70b-versatile

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 5: Update .gitignore**

Append to existing `.gitignore`:

```
.env.local
.env*.local
```

- [ ] **Step 6: Create root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Regulait - EU AI Act Compliance Checker",
  description:
    "Check if your AI system complies with the EU AI Act. Get risk classification, required actions, and compliance reports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Verify dev server runs**

```bash
npm run dev
```

Visit `http://localhost:3000`. Confirm page loads.

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind, Vitest, dependencies"
```

---

### Task 2: EU AI Act Knowledge Base

**Files:**
- Create: `src/data/eu-ai-act.json`, `src/lib/knowledge-base.ts`, `tests/lib/knowledge-base.test.ts`

**Interfaces:**
- Produces:
  - `getKnowledgeBase(): EUAIActData` — returns full parsed knowledge base
  - `getRequirementsForTier(tier: RiskTier): Requirement[]` — returns all requirements for a risk tier
  - `getAnnexIIICategories(): AnnexIIICategory[]` — returns high-risk categories
  - `getPenalties(tier: RiskTier): Penalty` — returns penalty info
  - `getExemptions(): Exemption[]` — returns all exemptions
  - Types: `RiskTier`, `Requirement`, `AnnexIIICategory`, `Penalty`, `Exemption`, `EUAIActData`

- [ ] **Step 1: Create EU AI Act JSON data file**

Create `src/data/eu-ai-act.json`:

```json
{
  "risk_categories": {
    "unacceptable": {
      "description": "AI practices that pose an unacceptable risk to people's safety, livelihoods, and rights. These are banned outright.",
      "articles": [5],
      "criteria": [
        "Social scoring by public authorities",
        "Real-time remote biometric identification in public spaces for law enforcement (with narrow exceptions)",
        "Subliminal manipulation causing harm",
        "Exploitation of vulnerabilities of specific groups (age, disability)",
        "Untargeted scraping of facial images from internet/CCTV for facial recognition databases",
        "Emotion recognition in workplace and education (with exceptions)",
        "Biometric categorisation inferring sensitive attributes (race, political opinions, religion, sexual orientation)",
        "Individual predictive policing based solely on profiling"
      ]
    },
    "high_risk": {
      "description": "AI systems that pose significant risks to health, safety, or fundamental rights. Subject to strict requirements before being placed on the EU market.",
      "articles": [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 26, 27, 49],
      "annex_iii_categories": [
        {
          "id": 1,
          "name": "Biometric identification and categorisation",
          "examples": [
            "Remote biometric identification (not real-time)",
            "Biometric categorisation by sensitive or protected attributes"
          ]
        },
        {
          "id": 2,
          "name": "Management and operation of critical infrastructure",
          "examples": [
            "AI as safety components in road traffic",
            "AI in water, gas, heating, electricity supply management"
          ]
        },
        {
          "id": 3,
          "name": "Education and vocational training",
          "examples": [
            "Determining access to educational institutions",
            "Evaluating learning outcomes",
            "Assessing appropriate level of education",
            "Monitoring and detecting prohibited behaviour during exams"
          ]
        },
        {
          "id": 4,
          "name": "Employment, workers management, and access to self-employment",
          "examples": [
            "Screening and filtering job applications",
            "Evaluating candidates in interviews and tests",
            "Making decisions on promotion, termination, task allocation",
            "Monitoring and evaluating worker performance and behaviour"
          ]
        },
        {
          "id": 5,
          "name": "Access to essential private and public services",
          "examples": [
            "Evaluating creditworthiness (credit scoring)",
            "Risk assessment and pricing in life/health insurance",
            "Evaluating eligibility for public benefits and services",
            "Emergency services dispatch prioritisation"
          ]
        },
        {
          "id": 6,
          "name": "Law enforcement",
          "examples": [
            "Assessing risk of criminal offending or reoffending",
            "Polygraphs and similar tools",
            "Evaluating reliability of evidence",
            "Profiling individuals during criminal investigations"
          ]
        },
        {
          "id": 7,
          "name": "Migration, asylum, and border control",
          "examples": [
            "Assessing risk posed by persons entering EU",
            "Examining applications for asylum, visa, and residence permits",
            "Detecting, recognising, or identifying persons in border control"
          ]
        },
        {
          "id": 8,
          "name": "Administration of justice and democratic processes",
          "examples": [
            "Assisting judicial authority in researching and interpreting facts and law",
            "AI used to influence outcome of elections or voting behaviour"
          ]
        }
      ]
    },
    "limited": {
      "description": "AI systems with specific transparency risks. Users must be informed they are interacting with AI.",
      "articles": [50, 52],
      "obligations": [
        {
          "id": "transparency_notice",
          "title": "AI Interaction Disclosure",
          "description": "Users must be informed they are interacting with an AI system, unless obvious from context.",
          "applies_to": ["chatbots", "conversational AI", "virtual assistants"]
        },
        {
          "id": "deepfake_label",
          "title": "Synthetic Content Labelling",
          "description": "AI-generated or manipulated image, audio, or video content (deepfakes) must be labelled as artificially generated or manipulated.",
          "applies_to": ["image generation", "video generation", "audio generation", "deepfakes"]
        },
        {
          "id": "emotion_disclosure",
          "title": "Emotion Recognition Disclosure",
          "description": "Persons exposed to emotion recognition or biometric categorisation systems must be informed of the operation of the system.",
          "applies_to": ["emotion recognition", "sentiment analysis from biometrics"]
        },
        {
          "id": "generated_text_label",
          "title": "AI-Generated Text Disclosure",
          "description": "AI-generated text published to inform the public on matters of public interest must be labelled as AI-generated.",
          "applies_to": ["news generation", "content generation for public information"]
        }
      ]
    },
    "minimal": {
      "description": "AI systems with minimal or no risk. No specific requirements under the EU AI Act. This includes most AI applications such as spam filters, AI in video games, and inventory management systems.",
      "articles": [],
      "obligations": []
    }
  },
  "requirements": {
    "article_9": {
      "number": 9,
      "title": "Risk Management System",
      "applies_to": ["high"],
      "summary": "Establish, implement, document, and maintain a continuous iterative risk management system throughout the AI system's lifecycle.",
      "key_actions": [
        "Identify and analyse known and reasonably foreseeable risks",
        "Estimate and evaluate risks from intended use and reasonably foreseeable misuse",
        "Adopt suitable risk management measures",
        "Test the AI system to identify the most appropriate measures"
      ],
      "effort": "medium",
      "deadline": "Before placing system on EU market"
    },
    "article_10": {
      "number": 10,
      "title": "Data and Data Governance",
      "applies_to": ["high"],
      "summary": "Training, validation, and testing datasets must meet quality criteria. Data governance and management practices must be established.",
      "key_actions": [
        "Establish data governance covering design choices, data collection, and preparation",
        "Examine training data for possible biases",
        "Identify relevant data gaps or shortcomings and how to address them",
        "Ensure datasets are relevant, representative, free of errors, and complete"
      ],
      "effort": "high",
      "deadline": "Before placing system on EU market"
    },
    "article_11": {
      "number": 11,
      "title": "Technical Documentation",
      "applies_to": ["high"],
      "summary": "Prepare detailed technical documentation demonstrating compliance, providing authorities with information to assess compliance.",
      "key_actions": [
        "Document system description, purpose, and intended use",
        "Document design specifications, architecture, and algorithms",
        "Document data requirements and data governance measures",
        "Document monitoring, functioning, and control measures",
        "Document risk management measures taken"
      ],
      "effort": "high",
      "deadline": "Before placing system on EU market"
    },
    "article_12": {
      "number": 12,
      "title": "Record-Keeping (Logging)",
      "applies_to": ["high"],
      "summary": "High-risk AI systems must have automatic logging capabilities to ensure traceability of the system's functioning.",
      "key_actions": [
        "Enable automatic recording of events (logs) throughout system lifetime",
        "Logging must allow monitoring of operation and post-market surveillance",
        "Logs must be adequate to identify situations that may result in risk"
      ],
      "effort": "medium",
      "deadline": "Before placing system on EU market"
    },
    "article_13": {
      "number": 13,
      "title": "Transparency and Information to Deployers",
      "applies_to": ["high"],
      "summary": "High-risk AI systems must be designed to be sufficiently transparent for deployers to interpret and use output appropriately.",
      "key_actions": [
        "Provide clear instructions for use to downstream deployers",
        "Include information about system performance, known limitations, and risks",
        "Describe human oversight measures that need to be implemented"
      ],
      "effort": "medium",
      "deadline": "Before placing system on EU market"
    },
    "article_14": {
      "number": 14,
      "title": "Human Oversight",
      "applies_to": ["high"],
      "summary": "High-risk AI systems must be designed to allow effective human oversight during use.",
      "key_actions": [
        "Enable human operators to fully understand AI system capabilities and limitations",
        "Allow humans to correctly interpret AI system output",
        "Enable humans to decide not to use the system or override/reverse output",
        "Enable humans to intervene or halt the system operation"
      ],
      "effort": "low",
      "deadline": "Before placing system on EU market"
    },
    "article_15": {
      "number": 15,
      "title": "Accuracy, Robustness, and Cybersecurity",
      "applies_to": ["high"],
      "summary": "High-risk AI systems must achieve appropriate levels of accuracy, robustness, and cybersecurity.",
      "key_actions": [
        "Declare and document accuracy levels and metrics",
        "Design system to be resilient to errors, faults, and inconsistencies",
        "Implement measures against adversarial manipulation (data poisoning, model evasion)",
        "Address cybersecurity vulnerabilities"
      ],
      "effort": "medium",
      "deadline": "Before placing system on EU market"
    },
    "article_16": {
      "number": 16,
      "title": "Provider Obligations",
      "applies_to": ["high"],
      "summary": "Providers of high-risk AI systems have specific obligations including quality management, conformity assessment, and post-market monitoring.",
      "key_actions": [
        "Establish a quality management system (Article 17)",
        "Conduct conformity assessment before placing system on market",
        "Register in the EU public database (Article 49)",
        "Implement post-market monitoring system",
        "Report serious incidents to authorities"
      ],
      "effort": "high",
      "deadline": "Before placing system on EU market"
    },
    "article_49": {
      "number": 49,
      "title": "EU Database Registration",
      "applies_to": ["high"],
      "summary": "Providers must register high-risk AI systems in the EU public database before placing them on the market.",
      "key_actions": [
        "Register the AI system in the EU public database",
        "Include system information, purpose, and provider details"
      ],
      "effort": "low",
      "deadline": "Before placing system on EU market"
    },
    "article_50": {
      "number": 50,
      "title": "Transparency Obligations",
      "applies_to": ["limited", "high"],
      "summary": "AI systems interacting with people must disclose that the person is interacting with AI. Synthetic content must be labelled.",
      "key_actions": [
        "Inform users they are interacting with an AI system",
        "Label AI-generated content as artificially generated or manipulated",
        "Disclose emotion recognition or biometric categorisation to affected persons"
      ],
      "effort": "low",
      "deadline": "Immediately applicable"
    }
  },
  "penalties": {
    "unacceptable": {
      "description": "Use of prohibited AI practices",
      "max_fine_eur": 35000000,
      "max_fine_percent": 7,
      "fine_basis": "Whichever is higher: EUR 35,000,000 or 7% of total worldwide annual turnover"
    },
    "high_risk_non_compliance": {
      "description": "Non-compliance with high-risk AI requirements",
      "max_fine_eur": 15000000,
      "max_fine_percent": 3,
      "fine_basis": "Whichever is higher: EUR 15,000,000 or 3% of total worldwide annual turnover"
    },
    "incorrect_information": {
      "description": "Supplying incorrect, incomplete, or misleading information to authorities",
      "max_fine_eur": 7500000,
      "max_fine_percent": 1,
      "fine_basis": "Whichever is higher: EUR 7,500,000 or 1% of total worldwide annual turnover"
    },
    "sme_reduction": {
      "description": "SMEs and startups: fines are capped at the lower percentage threshold",
      "note": "For SMEs including startups, the fine is the lower of the two amounts (fixed or percentage)"
    }
  },
  "exemptions": {
    "sme": {
      "name": "SME / Startup Exemption",
      "description": "Small and medium-sized enterprises receive proportional reductions in administrative burden.",
      "effect": "Reduced documentation requirements. Simplified conformity procedures where possible. Lower fine caps (lesser of fixed amount or percentage).",
      "criteria": "Fewer than 250 employees AND annual turnover not exceeding EUR 50 million"
    },
    "open_source": {
      "name": "Open Source Exemption",
      "description": "Free and open-source AI components are generally exempt from most requirements.",
      "effect": "Exempt from provider obligations UNLESS the system is high-risk (Annex III) or prohibited (Article 5).",
      "criteria": "Model or system is released under a free and open-source licence. Does NOT apply if the system falls under high-risk or prohibited categories."
    },
    "research": {
      "name": "Research and Development Exemption",
      "description": "AI systems used solely for research and development purposes are exempt.",
      "effect": "Fully exempt from all requirements. Does NOT apply once the system is placed on the market or put into service.",
      "criteria": "System is developed and used exclusively for scientific research and development, not deployed in production."
    },
    "personal_use": {
      "name": "Personal / Non-Professional Use",
      "description": "AI used by individuals for purely personal, non-professional activities is exempt.",
      "effect": "Fully exempt from all requirements.",
      "criteria": "Natural person using AI for personal, non-professional activity."
    },
    "military": {
      "name": "Military and National Security",
      "description": "AI systems developed or used exclusively for military or national security purposes.",
      "effect": "Fully exempt from the AI Act.",
      "criteria": "System is exclusively for military, defence, or national security purposes."
    }
  },
  "timeline": {
    "entry_into_force": "2024-08-01",
    "prohibited_practices_ban": "2025-02-02",
    "gpai_rules_apply": "2025-08-02",
    "high_risk_obligations": "2026-08-02",
    "full_enforcement": "2027-08-02",
    "note": "High-risk AI system obligations apply from August 2, 2026. Full enforcement including all Annex I systems from August 2, 2027."
  }
}
```

- [ ] **Step 2: Create TypeScript types and knowledge base module**

Create `src/lib/knowledge-base.ts`:

```typescript
export type RiskTier = "unacceptable" | "high" | "limited" | "minimal";

export interface AnnexIIICategory {
  id: number;
  name: string;
  examples: string[];
}

export interface TransparencyObligation {
  id: string;
  title: string;
  description: string;
  applies_to: string[];
}

export interface Requirement {
  number: number;
  title: string;
  applies_to: RiskTier[];
  summary: string;
  key_actions: string[];
  effort: "low" | "medium" | "high";
  deadline: string;
}

export interface Penalty {
  description: string;
  max_fine_eur: number;
  max_fine_percent: number;
  fine_basis: string;
}

export interface Exemption {
  name: string;
  description: string;
  effect: string;
  criteria: string;
}

export interface RiskCategory {
  description: string;
  articles: number[];
  criteria?: string[];
  annex_iii_categories?: AnnexIIICategory[];
  obligations?: TransparencyObligation[];
}

export interface EUAIActData {
  risk_categories: Record<RiskTier, RiskCategory>;
  requirements: Record<string, Requirement>;
  penalties: Record<string, Penalty | { description: string; note: string }>;
  exemptions: Record<string, Exemption>;
  timeline: Record<string, string>;
}

import euAIActRaw from "@/data/eu-ai-act.json";

const euAIAct = euAIActRaw as unknown as EUAIActData;

export function getKnowledgeBase(): EUAIActData {
  return euAIAct;
}

export function getRequirementsForTier(tier: RiskTier): Requirement[] {
  return Object.values(euAIAct.requirements).filter((req) =>
    req.applies_to.includes(tier)
  );
}

export function getAnnexIIICategories(): AnnexIIICategory[] {
  return euAIAct.risk_categories.high_risk.annex_iii_categories ?? [];
}

export function getPenalties(tier: RiskTier): Penalty | null {
  if (tier === "unacceptable") {
    return euAIAct.penalties.unacceptable as Penalty;
  }
  if (tier === "high" || tier === "limited") {
    return euAIAct.penalties.high_risk_non_compliance as Penalty;
  }
  return null;
}

export function getExemptions(): Exemption[] {
  return Object.values(euAIAct.exemptions);
}

export function getTransparencyObligations(): TransparencyObligation[] {
  return euAIAct.risk_categories.limited.obligations ?? [];
}
```

- [ ] **Step 3: Write tests for knowledge base**

Create `tests/lib/knowledge-base.test.ts`:

```typescript
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
```

- [ ] **Step 4: Configure JSON import in tsconfig**

Ensure `tsconfig.json` has `"resolveJsonModule": true` and `"esModuleInterop": true` under `compilerOptions`.

- [ ] **Step 5: Run tests**

```bash
npx vitest run tests/lib/knowledge-base.test.ts
```

Expected: All 11 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/data/eu-ai-act.json src/lib/knowledge-base.ts tests/lib/knowledge-base.test.ts
git commit -m "feat: add EU AI Act knowledge base with typed accessors and tests"
```

---

### Task 3: Rule Engine

**Files:**
- Create: `src/lib/rules.ts`, `tests/lib/rules.test.ts`

**Interfaces:**
- Consumes: `RiskTier` type from `@/lib/knowledge-base`
- Produces:
  - `type StructuredInput = { ai_functions: string[]; data_types: string[]; user_types: string[]; geography: string[] }`
  - `type RuleResult = { confident: boolean; risk_tier: RiskTier | null; matched_rules: string[]; reasoning: string }`
  - `evaluateRules(productDesc: string, input: StructuredInput): RuleResult`

- [ ] **Step 1: Write tests for rule engine**

Create `tests/lib/rules.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/lib/rules.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement rule engine**

Create `src/lib/rules.ts`:

```typescript
import type { RiskTier } from "@/lib/knowledge-base";

export interface StructuredInput {
  ai_functions: string[];
  data_types: string[];
  user_types: string[];
  geography: string[];
}

export interface RuleResult {
  confident: boolean;
  risk_tier: RiskTier | null;
  matched_rules: string[];
  reasoning: string;
}

interface Rule {
  name: string;
  tier: RiskTier;
  reasoning: string;
  match: (desc: string, input: StructuredInput) => boolean;
}

const descContains = (desc: string, keywords: string[]): boolean => {
  const lower = desc.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
};

const rules: Rule[] = [
  // --- UNACCEPTABLE ---
  {
    name: "social_scoring",
    tier: "unacceptable",
    reasoning: "Social scoring by or on behalf of public authorities is a prohibited practice under Article 5.",
    match: (desc, input) =>
      descContains(desc, ["social scor", "citizen scor", "social credit"]) ||
      (input.ai_functions.includes("scoring") &&
        input.user_types.includes("government") &&
        descContains(desc, ["social", "citizen", "behavior", "behaviour"])),
  },
  {
    name: "subliminal_manipulation",
    tier: "unacceptable",
    reasoning: "AI systems that deploy subliminal techniques to materially distort behaviour causing harm are prohibited under Article 5.",
    match: (desc) =>
      descContains(desc, ["subliminal", "manipulat"]) &&
      descContains(desc, ["harm", "distort", "behaviour", "behavior"]),
  },
  {
    name: "realtime_biometric_public",
    tier: "unacceptable",
    reasoning: "Real-time remote biometric identification in publicly accessible spaces for law enforcement is prohibited under Article 5 (with narrow exceptions).",
    match: (desc) =>
      descContains(desc, ["real-time", "realtime", "real time"]) &&
      descContains(desc, ["biometric", "facial recognition"]) &&
      descContains(desc, ["public", "street", "cctv", "surveillance"]),
  },

  // --- HIGH RISK ---
  {
    name: "biometric_identification",
    tier: "high",
    reasoning: "Biometric identification and categorisation systems are classified as high-risk under Annex III, Category 1.",
    match: (desc, input) =>
      input.data_types.includes("biometric") ||
      descContains(desc, [
        "facial recognition",
        "biometric",
        "fingerprint identification",
        "iris scan",
        "face detection",
      ]),
  },
  {
    name: "resume_screening",
    tier: "high",
    reasoning: "AI systems used for screening/filtering job applications or evaluating candidates are high-risk under Annex III, Category 4 (Employment).",
    match: (desc, input) =>
      (input.ai_functions.includes("screening") ||
        input.ai_functions.includes("scoring")) &&
      descContains(desc, [
        "resume",
        "cv",
        "job applic",
        "candidate",
        "recruit",
        "hiring",
        "applicant",
        "employment",
      ]),
  },
  {
    name: "credit_scoring",
    tier: "high",
    reasoning: "AI systems evaluating creditworthiness are high-risk under Annex III, Category 5 (Access to essential services).",
    match: (desc, input) =>
      (input.ai_functions.includes("scoring") &&
        input.data_types.includes("financial") &&
        descContains(desc, ["credit", "loan", "lending", "mortgage"])) ||
      descContains(desc, ["creditworth", "credit scor"]),
  },
  {
    name: "education_grading",
    tier: "high",
    reasoning: "AI systems determining access to education or evaluating learning outcomes are high-risk under Annex III, Category 3.",
    match: (desc) =>
      descContains(desc, [
        "grade student",
        "grading",
        "exam evaluation",
        "admission decision",
        "student assessment",
        "learning outcome",
        "academic evaluation",
      ]),
  },
  {
    name: "medical_device",
    tier: "high",
    reasoning: "AI used as a medical device or for health diagnostics is high-risk. Medical AI systems fall under EU product safety legislation referenced in Annex I.",
    match: (desc, input) =>
      input.data_types.includes("health") &&
      descContains(desc, [
        "diagnos",
        "medical",
        "clinical",
        "patient",
        "health",
        "disease",
        "cancer",
        "treatment",
        "radiology",
        "pathology",
      ]),
  },
  {
    name: "law_enforcement",
    tier: "high",
    reasoning: "AI systems used in law enforcement are high-risk under Annex III, Category 6.",
    match: (desc) =>
      descContains(desc, [
        "law enforcement",
        "policing",
        "criminal risk",
        "recidivism",
        "polygraph",
        "evidence reliability",
      ]),
  },
  {
    name: "critical_infrastructure",
    tier: "high",
    reasoning: "AI used as safety components of critical infrastructure management is high-risk under Annex III, Category 2.",
    match: (desc) =>
      descContains(desc, ["traffic management", "power grid", "water supply"]) &&
      descContains(desc, ["safety", "critical", "infrastructure"]),
  },
  {
    name: "migration_border",
    tier: "high",
    reasoning: "AI systems used in migration, asylum, and border control are high-risk under Annex III, Category 7.",
    match: (desc) =>
      descContains(desc, [
        "asylum",
        "visa application",
        "border control",
        "immigration",
        "migration assessment",
      ]),
  },
  {
    name: "insurance_risk",
    tier: "high",
    reasoning: "AI for risk assessment and pricing in life and health insurance is high-risk under Annex III, Category 5.",
    match: (desc, input) =>
      input.data_types.includes("health") &&
      descContains(desc, ["insurance", "underwriting", "risk assessment", "premium"]),
  },

  // --- LIMITED ---
  {
    name: "chatbot",
    tier: "limited",
    reasoning: "AI systems that interact with people (chatbots, virtual assistants) have transparency obligations under Article 50.",
    match: (desc, input) =>
      descContains(desc, [
        "chatbot",
        "virtual assistant",
        "conversational ai",
        "customer support ai",
        "chat support",
      ]) ||
      (input.ai_functions.includes("generating") &&
        input.user_types.includes("consumers") &&
        descContains(desc, [
          "support",
          "assist",
          "answer",
          "help",
          "chat",
          "convers",
        ])),
  },
  {
    name: "deepfake_generation",
    tier: "limited",
    reasoning: "AI-generated or manipulated image, audio, or video content (deepfakes) must be labelled under Article 50.",
    match: (desc) =>
      descContains(desc, [
        "deepfake",
        "synthetic video",
        "synthetic audio",
        "face swap",
        "voice clon",
      ]) ||
      (descContains(desc, ["generat"]) &&
        descContains(desc, ["video", "image", "audio", "face", "voice"]) &&
        descContains(desc, ["synthetic", "fake", "realistic", "people", "person"])),
  },
  {
    name: "content_generation",
    tier: "limited",
    reasoning: "AI-generated text published for public information must be labelled as AI-generated under Article 50.",
    match: (desc) =>
      descContains(desc, ["generat"]) &&
      descContains(desc, ["news", "article", "public information", "journalism"]),
  },

  // --- MINIMAL ---
  {
    name: "spam_filter",
    tier: "minimal",
    reasoning: "Spam filtering is a minimal-risk AI application with no specific requirements under the EU AI Act.",
    match: (desc) =>
      descContains(desc, ["spam filter", "spam detect", "email filter", "junk mail"]),
  },
  {
    name: "game_ai",
    tier: "minimal",
    reasoning: "AI in video games is a minimal-risk application with no specific requirements under the EU AI Act.",
    match: (desc) =>
      descContains(desc, ["video game", "game ai", "npc", "game character"]),
  },
  {
    name: "inventory_management",
    tier: "minimal",
    reasoning: "AI-powered inventory management is a minimal-risk application with no specific requirements.",
    match: (desc) =>
      descContains(desc, ["inventory manage", "stock manage", "warehouse optim"]),
  },
  {
    name: "search_ranking",
    tier: "minimal",
    reasoning: "Search ranking and recommendation systems (that are not in high-risk domains) are minimal-risk.",
    match: (desc) =>
      descContains(desc, ["search rank", "search engine", "search result"]) &&
      !descContains(desc, ["job", "hiring", "employment", "credit", "medical"]),
  },
];

export function evaluateRules(
  productDesc: string,
  input: StructuredInput
): RuleResult {
  if (input.geography.includes("no_eu_exposure")) {
    return {
      confident: true,
      risk_tier: "minimal",
      matched_rules: ["no_eu_exposure"],
      reasoning:
        "Product has no EU exposure — outside EU scope. EU AI Act does not apply. Classified as minimal risk (no action required).",
    };
  }

  const tierPriority: RiskTier[] = [
    "unacceptable",
    "high",
    "limited",
    "minimal",
  ];

  for (const tier of tierPriority) {
    const matched = rules.filter(
      (rule) => rule.tier === tier && rule.match(productDesc, input)
    );
    if (matched.length > 0) {
      return {
        confident: true,
        risk_tier: tier,
        matched_rules: matched.map((r) => r.name),
        reasoning: matched.map((r) => r.reasoning).join(" "),
      };
    }
  }

  return {
    confident: false,
    risk_tier: null,
    matched_rules: [],
    reasoning:
      "No deterministic rules matched. Requires LLM classification for ambiguous case.",
  };
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/lib/rules.test.ts
```

Expected: All 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rules.ts tests/lib/rules.test.ts
git commit -m "feat: add deterministic rule engine for EU AI Act risk classification"
```

---

### Task 4: LLM Client (Provider-Agnostic)

**Files:**
- Create: `src/lib/llm.ts`, `tests/lib/llm.test.ts`

**Interfaces:**
- Produces:
  - `type LLMProvider = "groq" | "gemini" | "openai" | "anthropic"`
  - `type LLMClassification = { risk_tier: RiskTier; confidence: number; reasoning: string; applicable_articles: number[]; exemptions_checked: string[]; exemptions_applicable: string[] }`
  - `classifyWithLLM(productDesc: string, input: StructuredInput, ruleResult: RuleResult): Promise<LLMClassification>`
  - `getLLMConfig(): { provider: LLMProvider; model: string; apiKey: string }`

- [ ] **Step 1: Write tests**

Create `tests/lib/llm.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/lib/llm.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement LLM client**

Create `src/lib/llm.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/lib/llm.test.ts
```

Expected: All 3 tests pass (unit tests only, no live API calls).

- [ ] **Step 5: Commit**

```bash
git add src/lib/llm.ts tests/lib/llm.test.ts
git commit -m "feat: add provider-agnostic LLM client with Groq/OpenAI/Anthropic/Gemini support"
```

---

### Task 5: Classifier + Report Generator

**Files:**
- Create: `src/lib/classifier.ts`, `src/lib/report-generator.ts`, `tests/lib/classifier.test.ts`, `tests/lib/report-generator.test.ts`

**Interfaces:**
- Consumes: `evaluateRules` from `@/lib/rules`, `classifyWithLLM` from `@/lib/llm`, `getRequirementsForTier`, `getPenalties`, `getExemptions` from `@/lib/knowledge-base`
- Produces:
  - `type ClassificationResult = { risk_tier: RiskTier; confidence: number; reasoning: string; matched_rules: string[]; source: "rules" | "llm" }`
  - `classify(productDesc: string, input: StructuredInput): Promise<ClassificationResult>`
  - `type ComplianceReport = { id: string; risk_tier: RiskTier; confidence: number; reasoning: string; requirements: Requirement[]; penalties: Penalty | null; exemptions: { applicable: Exemption[]; not_applicable: Exemption[] }; transparency_obligations: TransparencyObligation[]; created_at: string }`
  - `generateReport(classification: ClassificationResult, input: StructuredInput): ComplianceReport`

- [ ] **Step 1: Write classifier tests**

Create `tests/lib/classifier.test.ts`:

```typescript
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
```

- [ ] **Step 2: Implement classifier**

Create `src/lib/classifier.ts`:

```typescript
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
```

- [ ] **Step 3: Write report generator tests**

Create `tests/lib/report-generator.test.ts`:

```typescript
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
```

- [ ] **Step 4: Implement report generator**

Create `src/lib/report-generator.ts`:

```typescript
import { randomUUID } from "crypto";
import type { ClassificationResult } from "@/lib/classifier";
import {
  type RiskTier,
  type Requirement,
  type Penalty,
  type Exemption,
  type TransparencyObligation,
  getRequirementsForTier,
  getPenalties,
  getExemptions,
  getTransparencyObligations,
} from "@/lib/knowledge-base";

export interface ComplianceReport {
  id: string;
  risk_tier: RiskTier;
  confidence: number;
  reasoning: string;
  source: "rules" | "llm";
  requirements: Requirement[];
  penalties: Penalty | null;
  exemptions: {
    applicable: Exemption[];
    not_applicable: Exemption[];
  };
  transparency_obligations: TransparencyObligation[];
  created_at: string;
}

export function generateReport(
  classification: ClassificationResult
): ComplianceReport {
  const requirements = getRequirementsForTier(classification.risk_tier);
  const penalties = getPenalties(classification.risk_tier);
  const allExemptions = getExemptions();

  const applicable = allExemptions.filter((e) => {
    const key = Object.entries({
      "SME / Startup Exemption": "sme",
      "Open Source Exemption": "open_source",
      "Research and Development Exemption": "research",
      "Personal / Non-Professional Use": "personal_use",
      "Military and National Security": "military",
    }).find(([name]) => e.name === name)?.[1];
    return key && classification.exemptions_applicable.includes(key);
  });

  const not_applicable = allExemptions.filter(
    (e) => !applicable.includes(e)
  );

  const transparency =
    classification.risk_tier === "limited" || classification.risk_tier === "high"
      ? getTransparencyObligations()
      : [];

  return {
    id: randomUUID(),
    risk_tier: classification.risk_tier,
    confidence: classification.confidence,
    reasoning: classification.reasoning,
    source: classification.source,
    requirements,
    penalties,
    exemptions: { applicable, not_applicable },
    transparency_obligations: transparency,
    created_at: new Date().toISOString(),
  };
}
```

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass (knowledge-base, rules, llm, classifier, report-generator).

- [ ] **Step 6: Commit**

```bash
git add src/lib/classifier.ts src/lib/report-generator.ts tests/lib/classifier.test.ts tests/lib/report-generator.test.ts
git commit -m "feat: add classifier orchestration and report generator"
```

---

### Task 6: Supabase Setup + Scan API

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/app/api/scan/route.ts`, `supabase/migrations/001_initial.sql`

**Interfaces:**
- Consumes: `classify` from `@/lib/classifier`, `generateReport` from `@/lib/report-generator`
- Produces:
  - `createBrowserClient()` — Supabase client for client components
  - `createServerClient()` — Supabase client for server/API routes
  - `POST /api/scan` — accepts `{ product_description: string, structured_input: StructuredInput }`, returns `{ report_id: string, report: ComplianceReport }`

- [ ] **Step 1: Create Supabase clients**

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient as createClient } from "@supabase/ssr";

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient as createClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerClient() {
  const cookieStore = await cookies();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

- [ ] **Step 2: Create database migration**

Create `supabase/migrations/001_initial.sql`:

```sql
create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  product_desc text not null,
  structured_input jsonb not null,
  risk_tier text not null check (risk_tier in ('unacceptable', 'high', 'limited', 'minimal')),
  report jsonb not null,
  created_at timestamptz default now()
);

alter table scans enable row level security;

create policy "Anyone can read scans by id"
  on scans for select
  using (true);

create policy "Authenticated users can insert scans"
  on scans for insert
  with check (true);

create policy "Users can list their own scans"
  on scans for select
  using (auth.uid() = user_id);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  plan text not null check (plan in ('free', 'pro', 'agency')),
  stripe_customer text,
  stripe_sub text,
  status text not null check (status in ('active', 'canceled', 'past_due')),
  created_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users can read their own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);
```

- [ ] **Step 3: Create scan API route**

Create `src/app/api/scan/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { classify } from "@/lib/classifier";
import { generateReport } from "@/lib/report-generator";
import type { StructuredInput } from "@/lib/rules";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { product_description, structured_input } = body as {
      product_description: string;
      structured_input: StructuredInput;
    };

    if (!product_description || product_description.length < 50) {
      return NextResponse.json(
        { error: "Product description must be at least 50 characters" },
        { status: 400 }
      );
    }

    if (!structured_input) {
      return NextResponse.json(
        { error: "Structured input is required" },
        { status: 400 }
      );
    }

    const classification = await classify(product_description, structured_input);
    const report = generateReport(classification);

    return NextResponse.json({
      report_id: report.id,
      report,
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Classification failed. Please try again." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Verify API route compiles**

```bash
npm run build
```

Fix any type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/ src/app/api/scan/route.ts supabase/
git commit -m "feat: add Supabase clients, database migration, and scan API route"
```

---

### Task 7: Scan Form Page

**Files:**
- Create: `src/app/scan/page.tsx`, `src/components/scan-form.tsx`

**Interfaces:**
- Consumes: `POST /api/scan` API route
- Produces: Form page at `/scan` that collects product description + structured input and redirects to `/report/[id]`

- [ ] **Step 1: Create scan form component**

Create `src/components/scan-form.tsx` — a client component with:
- Textarea for product description (min 50 chars, placeholder with example)
- Checkbox groups for: AI functions, data types, user types, geography
- Character count indicator
- Submit button with loading state
- On submit: POST to `/api/scan`, store report in localStorage, redirect to `/report/[id]`
- Error display for validation and API errors

Checkbox options:

```
AI Functions: screening, scoring, generating, recommending, detecting, other
Data Types: biometric, personal, financial, health, public, other
User Types: consumers, businesses, government, internal
Geography: eu_countries, serving_eu_users, no_eu_exposure
```

- [ ] **Step 2: Create scan page**

Create `src/app/scan/page.tsx`:

```tsx
import { ScanForm } from "@/components/scan-form";

export const metadata = {
  title: "Scan Your AI System - Regulait",
  description: "Check your AI system's compliance with the EU AI Act",
};

export default function ScanPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Check Your AI System</h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">
        Describe your AI product and we'll classify it under the EU AI Act.
      </p>
      <ScanForm />
    </main>
  );
}
```

- [ ] **Step 3: Test the form in browser**

```bash
npm run dev
```

Visit `http://localhost:3000/scan`. Fill in description, check boxes, submit. Verify redirect to report page (will 404 for now — that's expected).

- [ ] **Step 4: Commit**

```bash
git add src/app/scan/ src/components/scan-form.tsx
git commit -m "feat: add scan form page with structured input collection"
```

---

### Task 8: Report Page

**Files:**
- Create: `src/app/report/[id]/page.tsx`, `src/components/report-view.tsx`, `src/components/risk-badge.tsx`, `src/components/requirement-card.tsx`

**Interfaces:**
- Consumes: Report data (from localStorage for v1, later from Supabase)
- Produces: Report page at `/report/[id]` displaying full compliance report

- [ ] **Step 1: Create risk badge component**

Create `src/components/risk-badge.tsx` — displays risk tier with color coding:
- `unacceptable`: red background, white text
- `high`: orange/amber background
- `limited`: yellow background
- `minimal`: green background

Shows tier name + one-line description.

- [ ] **Step 2: Create requirement card component**

Create `src/components/requirement-card.tsx` — displays a single requirement:
- Article number + title
- Summary text
- Key actions as a bullet list
- Effort badge (Low/Medium/High with green/yellow/red)
- Deadline text

- [ ] **Step 3: Create report view component**

Create `src/components/report-view.tsx` — full report display:
- Risk badge at top
- Reasoning paragraph
- "Requirements" section with requirement cards
- "Transparency Obligations" section (if applicable)
- "Penalties" section with fine amounts
- "Exemptions" section split into applicable / not applicable
- Legal disclaimer at bottom
- Share button (copies URL)
- PDF download button (disabled for free, shows upgrade prompt)

- [ ] **Step 4: Create report page**

Create `src/app/report/[id]/page.tsx` — reads report from localStorage by ID, renders `<ReportView>`. Shows "Report not found" if missing.

- [ ] **Step 5: Test full flow in browser**

```bash
npm run dev
```

Go to `/scan`, fill in "AI system that screens job applicants' resumes and ranks them for recruiters in Germany", check `screening`, `personal`, `businesses`, `eu_countries`. Submit. Verify report page shows:
- HIGH RISK badge
- Multiple requirements (risk management, data governance, etc.)
- Penalties section
- Exemptions section

- [ ] **Step 6: Commit**

```bash
git add src/app/report/ src/components/risk-badge.tsx src/components/requirement-card.tsx src/components/report-view.tsx
git commit -m "feat: add report page with risk badge, requirements, penalties, and exemptions"
```

---

### Task 9: Landing Page + Pricing

**Files:**
- Create: `src/components/pricing-table.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: Landing page at `/` with hero, value props, pricing, FAQ

- [ ] **Step 1: Create pricing table component**

Create `src/components/pricing-table.tsx` — three-column pricing:
- Free: $0, 1 scan, basic classification, top 3 requirements
- Pro: $29/mo, unlimited scans, full reports, PDF export, completion tracking
- Agency: $79/mo, everything in Pro + white-label (coming soon), multi-client (coming soon)

Highlight Pro as recommended. CTA buttons: Free → `/scan`, Pro/Agency → `/scan` (Stripe comes in Task 10).

- [ ] **Step 2: Build landing page**

Replace `src/app/page.tsx` with:
- Hero section: headline, subheadline ("EU AI Act enforcement begins August 2, 2026"), CTA button
- "How it works" section: 3 steps (Describe → Classify → Act)
- Value props: Risk classification, Action checklist, PDF reports
- Pricing table
- FAQ section (accordion):
  - "Is this legal advice?" — No, informational guidance only
  - "What is the EU AI Act?" — Brief explanation
  - "When does it take effect?" — August 2, 2026 for high-risk
  - "What happens if I don't comply?" — Fines up to 35M EUR
  - "Who needs to comply?" — Any company with AI touching EU users
- Footer with legal disclaimer

Check vault design notes for styling guidance before writing CSS. Do NOT default to generic Inter/purple-gradient. Choose a distinctive palette appropriate for a compliance/legal tool (think: authoritative, trustworthy, clean).

- [ ] **Step 3: Test landing page in browser**

```bash
npm run dev
```

Visit `http://localhost:3000`. Verify all sections render. Click CTA → goes to `/scan`. Check responsive on mobile width.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/components/pricing-table.tsx
git commit -m "feat: add landing page with hero, pricing, and FAQ"
```

---

### Task 10: Auth + Stripe + PDF

**Files:**
- Create: `src/app/api/checkout/route.ts`, `src/app/auth/callback/route.ts`, `src/lib/stripe.ts`, `src/lib/pdf.ts`, `src/app/dashboard/page.tsx`
- Modify: `src/components/report-view.tsx` (add PDF download)

**Interfaces:**
- Consumes: Supabase auth, Stripe API, report data
- Produces:
  - Auth callback route for Supabase OAuth
  - Stripe checkout session creation
  - PDF generation from report data
  - Dashboard page listing saved scans

- [ ] **Step 1: Create Stripe helpers**

Create `src/lib/stripe.ts`:

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function createCheckoutSession(
  priceId: string,
  userId: string,
  returnUrl: string
) {
  return stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}?success=true`,
    cancel_url: `${returnUrl}?canceled=true`,
    metadata: { userId },
  });
}
```

- [ ] **Step 2: Create checkout API route**

Create `src/app/api/checkout/route.ts` — POST endpoint that creates a Stripe checkout session and returns the URL.

- [ ] **Step 3: Create auth callback route**

Create `src/app/auth/callback/route.ts` — handles Supabase OAuth redirect, exchanges code for session.

- [ ] **Step 4: Create PDF generation**

Create `src/lib/pdf.ts` — function `generateReportPDF(report: ComplianceReport): Promise<Blob>` that generates a PDF with:
- Regulait header + date
- Risk tier classification
- Requirements list
- Penalties
- Exemptions
- Legal disclaimer footer

Use `@react-pdf/renderer` or `html2pdf.js` (choose based on what works better with Next.js App Router).

- [ ] **Step 5: Add PDF download to report view**

Modify `src/components/report-view.tsx` — add PDF download button. For free users, show upgrade prompt. For pro users, generate and download PDF.

- [ ] **Step 6: Create dashboard page**

Create `src/app/dashboard/page.tsx` — lists user's saved scans from Supabase. Shows risk tier badge + product description preview + date for each. "New Scan" button. Requires auth — redirect to login if not authenticated.

- [ ] **Step 7: Test auth + billing flow**

```bash
npm run dev
```

Test: sign up → scan → view report → try PDF (should show upgrade) → dashboard shows scan history.

Note: Stripe integration requires creating products/prices in Stripe Dashboard first. Use test mode keys.

- [ ] **Step 8: Commit**

```bash
git add src/lib/stripe.ts src/lib/pdf.ts src/app/api/checkout/ src/app/auth/ src/app/dashboard/ src/components/report-view.tsx
git commit -m "feat: add auth, Stripe billing, PDF export, and dashboard"
```

---

### Task 11: Polish + Deploy

**Files:**
- Modify: Various files for polish
- Create: `src/app/opengraph-image.tsx` (OG image)

**Interfaces:**
- Produces: Production-ready deployment on Vercel

- [ ] **Step 1: Add metadata and OG image**

Create `src/app/opengraph-image.tsx` using Next.js ImageResponse for dynamic OG images.

Update `src/app/layout.tsx` with full metadata: title, description, openGraph, twitter card.

- [ ] **Step 2: Add loading and error states**

- Scan form: loading spinner during classification
- Report page: skeleton loader
- Error boundaries for API failures
- 404 page for missing reports

- [ ] **Step 3: Mobile responsiveness check**

Test all pages at 375px, 768px, 1024px, 1440px widths. Fix any layout issues.

- [ ] **Step 4: Dark mode verification**

Test all pages in dark mode. Verify risk badges, cards, and text remain readable.

- [ ] **Step 5: Deploy to Vercel**

```bash
# Install Vercel CLI if not present
npm i -g vercel

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LLM_PROVIDER`
- `LLM_API_KEY`
- `LLM_MODEL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

- [ ] **Step 6: Verify production deployment**

Visit production URL. Run through full flow: landing → scan → report. Verify:
- Classification works
- Report renders correctly
- Share link works
- Pricing page shows correctly

- [ ] **Step 7: Commit any final changes**

```bash
git add -A
git commit -m "feat: add polish, OG image, error states, and deploy config"
```

---

## Post-Launch Checklist

- [ ] Set up Stripe webhook endpoint for subscription status changes
- [ ] Create Supabase project and run migration
- [ ] Set up custom domain (regulait.com or regulait.dev)
- [ ] Submit to Product Hunt
- [ ] Post on Show HN
- [ ] Post on Twitter/X with demo video
- [ ] Post in relevant subreddits (r/SideProject, r/SaaS, r/artificial)
