# Regulait — Design Spec

**Date:** 2026-07-28
**Status:** Approved
**Ship target:** 2026-08-01 (Friday)

## Overview

Regulait is a web app that tells companies whether their AI system complies with the EU AI Act. User describes their product, gets a structured compliance report with risk classification, required actions, effort estimates, and penalties.

EU AI Act enforcement begins August 2, 2026. Target buyers: SaaS founders, startup CTOs, agencies — anyone using AI that touches EU users. Pricing: Free (1 scan, partial report) / Pro $29/mo / Agency $79/mo.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Supabase (Postgres + Auth + RLS) |
| Hosting | Vercel |
| AI Engine | Provider-agnostic (env: LLM_PROVIDER, LLM_API_KEY, LLM_MODEL). Supports Groq, Gemini, OpenAI, Anthropic |
| Payments | Stripe Checkout |
| Email | Resend (transactional) |
| PDF | @react-pdf/renderer or html2pdf.js (client-side) |
| EU AI Act Source | Pre-processed JSON embedded in repo |

## Pages & Routes

### Landing `/`
- Hero: "Is your AI system compliant with the EU AI Act?" + CTA
- Value props (3): Risk classification, Action checklist, PDF reports
- Pricing table (Free / Pro / Agency)
- FAQ (includes "not legal advice" disclaimer)
- Footer

### Scan Form `/scan`
- Step 1: Free-text product description (500 char minimum)
- Step 2: Structured checkboxes
  - AI function: screening, scoring, generating, recommending, detecting, other
  - Data types: biometric, personal, financial, health, public, other
  - Users: consumers, businesses, government, internal
  - Geography: EU countries, serving EU users, no EU exposure
- Submit → loading state → redirect to /report/[id]

### Report `/report/[id]`
- Risk tier badge (Unacceptable / High / Limited / Minimal) with color coding
- Applicable articles list, each with:
  - Article number + title
  - Plain English requirement
  - Effort estimate (Low / Medium / High)
  - Checkbox for completion tracking (pro only)
- Penalties section
- Exemptions analysis
- PDF download (pro)
- Shareable link (public, read-only)

### Dashboard `/dashboard` (pro users only)
- List of saved scans with risk tier + date
- Completion progress per scan
- "New Scan" button

## Auth Flow

No auth required for free scan. Anonymous UUID assigned to report. Account creation prompted when user wants to:
- Save scan history
- Track completion
- Access pro features

Auth via Supabase: email/password + Google OAuth.

## Database Schema

```sql
-- scans
id              uuid PK default gen_random_uuid()
user_id         uuid FK references auth.users(id) nullable
product_desc    text not null
structured_input jsonb not null
risk_tier       text not null check (risk_tier in ('unacceptable','high','limited','minimal'))
report          jsonb not null
created_at      timestamptz default now()

-- subscriptions
id              uuid PK default gen_random_uuid()
user_id         uuid FK references auth.users(id) not null
plan            text not null check (plan in ('free','pro','agency'))
stripe_customer text
stripe_sub      text
status          text not null check (status in ('active','canceled','past_due'))
created_at      timestamptz default now()
```

RLS policies:
- scans: anyone can read by id (shareable links). Only owner can list their scans.
- subscriptions: only owner can read/write.

## AI Engine Architecture

### Rule Engine (deterministic, runs first)

```
Input: structured_input checkboxes + product_desc keywords
Output: { confident: boolean, risk_tier?: string, matched_rules?: string[] }

Rules (~20):
- biometric data + screening → HIGH RISK (Annex III)
- social scoring → UNACCEPTABLE (Article 5)
- credit scoring → HIGH RISK (Annex III)
- medical device AI → HIGH RISK (Annex III)
- education grading → HIGH RISK (Annex III)
- emotion recognition (workplace) → LIMITED + restrictions
- deepfake generation → LIMITED (transparency)
- spam filter → MINIMAL
- game AI → MINIMAL
- search ranking → MINIMAL
- no EU exposure → OUT OF SCOPE
```

If rule engine returns `confident: true`, skip LLM. Use rule result directly + generate report from knowledge base.

If `confident: false`, proceed to LLM.

### LLM Classification (ambiguous cases only)

Provider-agnostic client. Env vars:
- `LLM_PROVIDER`: groq | gemini | openai | anthropic
- `LLM_API_KEY`: provider API key
- `LLM_MODEL`: model identifier (e.g., llama-3.3-70b-versatile)

System prompt: EU AI Act expert classifier. Receives product description + structured input + rule engine preliminary assessment.

Output: structured JSON via function calling or JSON mode:
```json
{
  "risk_tier": "high",
  "confidence": 0.85,
  "reasoning": "This system falls under Annex III Category 4...",
  "applicable_articles": [6, 9, 10, 11, 12, 13, 14, 15, 49, 50],
  "exemptions_checked": ["sme", "open_source", "research"],
  "exemptions_applicable": ["sme_partial"]
}
```

### Report Generator

Takes risk_tier + applicable_articles → builds full report from knowledge base:
- Maps each article to plain English requirement
- Assigns effort estimate based on article complexity
- Lists penalties for non-compliance
- Identifies exemptions that apply/don't apply
- Generates summary

### EU AI Act Knowledge Base

Pre-processed `eu-ai-act.json` in `src/data/`. Structure:

```json
{
  "risk_categories": {
    "unacceptable": {
      "description": "...",
      "articles": [5],
      "criteria": ["social scoring", "real-time biometric in public", "..."]
    },
    "high_risk": {
      "description": "...",
      "articles": [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
      "annex_iii_categories": [
        { "id": 1, "name": "Biometric identification", "examples": ["..."] },
        { "id": 2, "name": "Critical infrastructure", "examples": ["..."] },
        { "id": 3, "name": "Education and training", "examples": ["..."] },
        { "id": 4, "name": "Employment and workers", "examples": ["..."] },
        { "id": 5, "name": "Essential services", "examples": ["..."] },
        { "id": 6, "name": "Law enforcement", "examples": ["..."] },
        { "id": 7, "name": "Migration and border", "examples": ["..."] },
        { "id": 8, "name": "Justice and democracy", "examples": ["..."] }
      ]
    },
    "limited": {
      "description": "...",
      "articles": [50, 52],
      "obligations": ["transparency_notice", "deepfake_label", "emotion_disclosure"]
    },
    "minimal": {
      "description": "...",
      "articles": [],
      "obligations": []
    }
  },
  "requirements": {
    "article_9": {
      "title": "Risk Management System",
      "applies_to": ["high"],
      "summary": "Establish and maintain a continuous risk management process",
      "effort": "medium",
      "deadline": "Before placing on EU market"
    }
  },
  "penalties": {
    "unacceptable": "EUR 35M or 7% global annual turnover",
    "high_risk_non_compliance": "EUR 15M or 3% global annual turnover",
    "incorrect_information": "EUR 7.5M or 1% global annual turnover"
  },
  "exemptions": {
    "sme": { "description": "...", "effect": "Reduced documentation burden" },
    "open_source": { "description": "...", "effect": "Exempt unless high-risk" },
    "research": { "description": "...", "effect": "Fully exempt if not deployed" }
  }
}
```

## Monetization Gates

| Feature | Free | Pro $29/mo | Agency $79/mo |
|---|---|---|---|
| Scans | 1 total | Unlimited | Unlimited |
| Risk classification | Yes | Yes | Yes |
| Full requirement list | Top 3 only | All | All |
| PDF export | No | Yes | Yes |
| Completion tracking | No | Yes | Yes |
| Saved history | No | Yes | Yes |
| White-label reports | No | No | Yes (v2) |
| Multi-client dashboard | No | No | Yes (v2) |

Free tier shows enough to prove value (risk tier + top 3 requirements + penalties), then gates the full report behind Pro.

## Project Structure

```
Regulait/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # landing
│   │   ├── scan/page.tsx             # scan form
│   │   ├── report/[id]/page.tsx      # report view
│   │   ├── dashboard/page.tsx        # pro dashboard
│   │   ├── api/
│   │   │   ├── scan/route.ts         # POST: run classification + report
│   │   │   ├── report/[id]/route.ts  # GET: fetch saved report
│   │   │   └── checkout/route.ts     # POST: create Stripe session
│   │   ├── auth/
│   │   │   └── callback/route.ts     # Supabase auth callback
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── llm.ts                    # provider-agnostic LLM client
│   │   ├── rules.ts                  # deterministic rule engine
│   │   ├── classifier.ts             # orchestrates rules + LLM
│   │   ├── report-generator.ts       # builds structured report from classification
│   │   ├── knowledge-base.ts         # loads + queries eu-ai-act.json
│   │   ├── pdf.ts                    # PDF generation
│   │   ├── supabase/
│   │   │   ├── client.ts             # browser client
│   │   │   └── server.ts             # server client
│   │   └── stripe.ts                 # billing helpers
│   ├── components/
│   │   ├── scan-form.tsx
│   │   ├── report-view.tsx
│   │   ├── risk-badge.tsx
│   │   ├── requirement-card.tsx
│   │   ├── pricing-table.tsx
│   │   └── ui/                       # shared primitives
│   └── data/
│       └── eu-ai-act.json            # pre-processed regulation
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
├── public/
├── .env.local.example
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Legal Disclaimer

Every report page includes:
> "Regulait provides informational guidance based on the EU AI Act. This is not legal advice. Consult a qualified legal professional for compliance decisions."

## 5-Day Ship Plan

| Day | Deliverable |
|---|---|
| Day 1 (Mon) | Project scaffold, Supabase setup, EU AI Act knowledge base JSON, rule engine |
| Day 2 (Tue) | LLM integration, classifier, report generator, scan API route |
| Day 3 (Wed) | Scan form UI, report page UI, risk badge, requirement cards |
| Day 4 (Thu) | Landing page, Stripe integration, PDF export, auth flow |
| Day 5 (Fri) | Polish, deploy to Vercel, launch (Product Hunt, Show HN, Twitter/X) |

## Out of Scope (v1)

- White-label reports
- Multi-client agency dashboard
- Figma/design tool integrations
- API access for programmatic scanning
- Email notifications for regulation updates
- Multi-language support
- Comparison between scans over time
