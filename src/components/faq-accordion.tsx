"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Is this legal advice?",
    answer:
      "No. Regulait provides informational guidance based on the EU AI Act's text and our interpretation of it. It is not a substitute for advice from a qualified lawyer, and you should consult one before making compliance decisions that carry legal or financial risk.",
  },
  {
    question: "What is the EU AI Act?",
    answer:
      "The EU AI Act is the European Union's regulation governing the development and use of artificial intelligence. It sorts AI systems into risk tiers -- unacceptable, high, limited, and minimal -- and attaches specific obligations to each tier, from outright bans to transparency and documentation requirements.",
  },
  {
    question: "When does it take effect?",
    answer:
      "The Act entered into force in phases. Obligations for high-risk AI systems become enforceable on August 2, 2026 -- the deadline most companies need to plan around now.",
  },
  {
    question: "What happens if I don't comply?",
    answer:
      "Penalties scale with severity. The most serious violations, such as deploying a prohibited system, can draw fines of up to EUR 35 million or 7% of global annual turnover, whichever is higher.",
  },
  {
    question: "Who needs to comply?",
    answer:
      "Any organization whose AI system is placed on the EU market, deployed in the EU, or used to produce output consumed by people in the EU -- regardless of where the company itself is based.",
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={`h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border/60 border-t border-border/60">
      {FAQS.map((faq, index) => {
        const open = openIndex === index;
        return (
          <div key={faq.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
              className="focus-ring flex w-full items-center justify-between gap-4 rounded-md py-5 text-left"
            >
              <span className="font-heading text-base font-semibold tracking-tight text-ink sm:text-lg">
                {faq.question}
              </span>
              <ChevronIcon open={open} />
            </button>
            <div className="accordion-panel" data-open={open}>
              <div>
                <p className="pb-5 pr-8 text-sm leading-relaxed text-ink-muted">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
