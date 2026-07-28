# Regulait

Free EU AI Act compliance checker. Describe your AI system, get an instant risk classification with actionable requirements.

EU AI Act enforcement begins **August 2, 2026**. Non-compliance fines reach EUR 35M or 7% of global annual turnover.

## What it does

1. **Describe** your AI system (what it does, data types, users, geography)
2. **Classify** against Article 5 prohibitions and Annex III high-risk categories
3. **Act** on a prioritized checklist of applicable requirements with effort estimates and deadlines

Risk tiers: Unacceptable / High / Limited / Minimal --- each with specific obligations, penalties, and exemptions.

## How classification works

- **Deterministic rule engine** runs first (~20 rules mapping inputs to risk tiers)
- **LLM fallback** handles ambiguous cases (provider-agnostic: Groq, OpenAI, Anthropic, Gemini)
- **Pre-processed regulation JSON** embedded in repo --- not RAG, not a vector DB, just structured data with typed accessors

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS 4 |
| Auth | Clerk |
| AI | Provider-agnostic LLM client (env-configured) |
| PDF | @react-pdf/renderer (server-side) |
| Hosting | Vercel |

## Setup

```bash
git clone https://github.com/codedrichy/regulait.git
cd regulait
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
# Clerk (https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# LLM (any supported provider)
LLM_PROVIDER=groq          # groq | openai | anthropic | gemini
LLM_API_KEY=gsk_...
LLM_MODEL=llama-3.3-70b-versatile
```

Run:

```bash
npm run dev
```

Open http://localhost:3000

## Rate limits

| Endpoint | Anonymous | Authenticated |
|----------|-----------|---------------|
| `/api/scan` | 5/hr per IP | 20/hr per user |
| `/api/pdf` | --- | 10/hr per user |

In-memory sliding window. Resets on server restart.

## Project structure

```
src/
  app/              Next.js pages and API routes
  components/       React components (scan form, report view, risk badge)
  data/             Pre-processed EU AI Act JSON
  lib/
    rules.ts        Deterministic rule engine (~20 rules)
    llm.ts          Provider-agnostic LLM client
    classifier.ts   Orchestrates rules + LLM
    report-generator.ts  Builds compliance report from classification
    knowledge-base.ts    Types + accessors for EU AI Act data
    rate-limit.ts   In-memory sliding window rate limiter
    pdf.tsx          Server-side PDF generation
```

## Tests

```bash
npm test
```

30 tests covering knowledge base, rule engine, LLM client, classifier, and report generator.

## Deploy

```bash
vercel --prod
```

Set environment variables in Vercel dashboard. Clerk and LLM keys are required.

## Disclaimer

Regulait provides informational guidance based on the EU AI Act. This is not legal advice. Consult a qualified legal professional for compliance decisions.

## License

MIT
