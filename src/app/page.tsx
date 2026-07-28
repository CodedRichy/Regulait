import Link from "next/link";
import type { Metadata } from "next";
import { FaqAccordion } from "@/components/faq-accordion";
import { EnforcementCountdown } from "@/components/enforcement-countdown";

export const metadata: Metadata = {
  title: "Regulait - EU AI Act Compliance Checker",
  description:
    "Classify your AI system under the EU AI Act in minutes. Get your risk tier, required actions, and a compliance report before enforcement begins August 2, 2026.",
};

const STEPS = [
  {
    number: "01",
    title: "Describe",
    description:
      "Tell us what your AI system does, who it's for, and what data it touches. Structured questions, about two minutes.",
  },
  {
    number: "02",
    title: "Classify",
    description:
      "We run your answers against the Act's Article 5 prohibitions and Annex III high-risk categories to determine your tier.",
  },
  {
    number: "03",
    title: "Act",
    description:
      "Get a prioritized checklist of exactly which Articles apply, tagged by effort, with deadlines attached.",
  },
];

const VALUE_PROPS = [
  {
    label: "Risk classification",
    title: "A defensible risk tier",
    description:
      "Unacceptable, high, limited, or minimal -- classified against the Act's own categories, with the reasoning shown, not just a label.",
  },
  {
    label: "Action checklist",
    title: "A checklist, not a wall of text",
    description:
      "Every applicable requirement mapped to its Article, tagged by effort, with a deadline attached so nothing slips.",
  },
  {
    label: "PDF reports",
    title: "Something you can hand to counsel",
    description:
      "Export a clean, shareable compliance report your legal team, auditors, or investors can actually use.",
  },
];

export default function Home() {
  return (
    <main>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="font-heading text-lg font-semibold tracking-tight text-ink"
          >
            Regulait
          </Link>
          <nav className="hidden items-center gap-8 sm:flex">
            <a
              href="#how-it-works"
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              How it works
            </a>
            <a
              href="#faq"
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="hidden text-sm text-ink-muted transition-colors hover:text-ink sm:inline"
            >
              Settings
            </Link>
            <Link
              href="/scan"
              className="inline-flex items-center rounded-sm bg-accent px-4 py-2 font-heading text-sm font-semibold tracking-wide text-canvas transition-colors hover:bg-accent-strong"
            >
              Start scan
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <EnforcementCountdown />
            <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">
              EU AI Act &middot; Article 5 / Annex III
            </span>
          </div>

          <h1 className="mt-6 font-heading text-4xl font-semibold tracking-tight text-ink sm:text-5xl md:text-6xl">
            Know your EU AI Act exposure before regulators do.
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-ink-muted">
            High-risk AI systems face binding obligations under the EU AI Act
            starting <span className="font-medium text-ink">August 2, 2026</span>.
            Regulait classifies your product against the Act&apos;s own risk
            tiers and tells you exactly what&apos;s required -- in minutes,
            not weeks with outside counsel.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/scan"
              className="inline-flex items-center justify-center rounded-sm bg-accent px-8 py-3.5 font-heading text-sm font-semibold tracking-wide text-canvas transition-colors hover:bg-accent-strong"
            >
              Check your AI system -- free
            </Link>
          </div>

          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-ink-muted">
            No credit card required &middot; results in under 2 minutes
          </p>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-border bg-surface"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mb-14 max-w-xl">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
              Process
            </p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              How it works
            </h2>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step, index) => (
              <div
                key={step.number}
                className={
                  index === 0
                    ? "sm:pr-8"
                    : "border-t border-border pt-8 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0"
                }
              >
                <p className="font-heading text-sm font-semibold tracking-widest text-accent">
                  {step.number}
                </p>
                <h3 className="mt-3 font-heading text-xl font-semibold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mb-14 max-w-xl">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
            What you get
          </p>
          <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Built for the deadline, not a demo
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {VALUE_PROPS.map((prop) => (
            <div
              key={prop.label}
              className="border border-border bg-surface p-6 sm:p-7"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                {prop.label}
              </p>
              <h3 className="mt-3 font-heading text-lg font-semibold tracking-tight text-ink">
                {prop.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mb-8 max-w-xl">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
            FAQ
          </p>
          <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Frequently asked questions
          </h2>
        </div>

        <FaqAccordion />
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="border border-border bg-surface p-6 sm:p-7">
            <p className="text-sm leading-relaxed text-ink-muted">
              <span className="font-medium text-ink">Disclaimer.</span>{" "}
              Regulait provides informational guidance generated from
              self-reported information and our interpretation of the EU AI
              Act. It does not constitute legal advice and should not be
              relied upon as a substitute for consultation with a qualified
              legal professional. Regulait makes no warranty as to the
              accuracy or completeness of any classification or report and
              accepts no liability for decisions made on the basis of it.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="font-heading text-sm font-semibold tracking-tight text-ink">
              Regulait
            </p>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
              &copy; 2026 Regulait &middot; Not legal advice
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
