# Regulait

![Regulait Banner](public/og-banner.png)

### Free EU AI Act Compliance Checker

**[Try it live](https://codedrichy.github.io/Regulait/)** -- classify your AI system and get actionable requirements in under 2 minutes.

Non-compliance fines reach EUR 35 million or 7% of global annual turnover. Regulait tells you where you stand before enforcement begins **August 2, 2026**.

---

## What it does

Describe your AI system. Regulait classifies it against the EU AI Act's own risk tiers and returns:

- **Risk tier** (Unacceptable / High / Limited / Minimal) with cited reasoning
- **Action checklist** -- every applicable Article, tagged by effort and deadline
- **Exportable report** you can hand to legal counsel or auditors

75 AI systems tested across healthcare, finance, law enforcement, education, and more. 20 deterministic rules covering Article 5 prohibitions and Annex III categories.

## How it works

A **deterministic rule engine** handles most cases entirely in your browser -- no API key needed, no data leaves your device. For edge cases, an optional **LLM fallback** (bring your own key) provides higher-confidence classification.

| Provider | Browser | Local |
|----------|---------|-------|
| Gemini | Yes | Yes |
| OpenAI | -- | Yes |
| Groq | -- | Yes |
| Anthropic | -- | Yes |

Keys stay in `localStorage`. Nothing is sent to our servers (there are none).

## Run locally

```bash
git clone https://github.com/codedrichy/regulait.git
cd regulait
npm install
npm run dev
```

The rule engine works out of the box at `localhost:3000`. Add a free Gemini API key in Settings for LLM-assisted classification.

## Stack

Next.js 15 (static export) -- Tailwind CSS 4 -- GitHub Pages -- 28 tests

## License

MIT

---

Built by [CodedRichy](https://rishipraseeth.in/)
