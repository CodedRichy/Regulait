# Regulait

![Regulait Banner](public/og-banner.png)

**Free EU AI Act compliance checker.** Describe your AI system, get an instant risk classification with actionable requirements -- before enforcement begins August 2, 2026.

Non-compliance fines reach EUR 35M or 7% of global annual turnover. Two minutes with Regulait tells you where you stand.

## How it works

1. **Describe** -- What your AI system does, who uses it, what data it touches
2. **Classify** -- Checked against Article 5 prohibitions and Annex III high-risk categories
3. **Act** -- Prioritized checklist of applicable requirements with effort estimates and deadlines

Risk tiers: **Unacceptable** / **High** / **Limited** / **Minimal** -- each with specific obligations, penalties, and exemptions.

## What you get

- **Risk classification** -- Defensible risk tier with reasoning, not just a label
- **Action checklist** -- Every requirement mapped to its Article, tagged by effort, with deadlines
- **PDF reports** -- Export a clean report you can hand to legal counsel, auditors, or investors

## How classification works

A **deterministic rule engine** (~20 rules) handles the majority of cases entirely in your browser -- no API key needed. For ambiguous cases, an optional **LLM fallback** (BYOK -- bring your own key) provides higher-confidence classification. Gemini works directly from the browser; other providers work when running locally.

Pre-processed EU AI Act regulation data is embedded in the app as structured JSON with typed accessors -- no RAG, no vector DB.

## Run it yourself

```bash
git clone https://github.com/codedrichy/regulait.git
cd regulait
npm install
npm run dev
```

Open http://localhost:3000

No environment variables required. The rule engine works out of the box. To enable LLM-assisted classification for ambiguous cases, add a free Gemini API key in Settings.

## Deploy to GitHub Pages

The app is a fully static Next.js export. Push to `main` and GitHub Actions deploys to Pages automatically.

To set up Pages: repo Settings > Pages > Source: GitHub Actions.

## BYOK (Bring Your Own Key)

| Provider | Browser | Local dev |
|----------|---------|-----------|
| Gemini | Yes | Yes |
| OpenAI | No (CORS) | Yes |
| Groq | No (CORS) | Yes |
| Anthropic | No (CORS) | Yes |

Keys are stored in localStorage and never leave your browser.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (static export) |
| Styling | Tailwind CSS 4 |
| Classification | Rule engine + optional LLM |
| Hosting | GitHub Pages |

## Tests

```bash
npm test
```

28 tests covering the knowledge base, rule engine, classifier, and report generator.

## Disclaimer

Regulait provides informational guidance based on the EU AI Act. This is not legal advice. Consult a qualified legal professional for compliance decisions.

## License

MIT
