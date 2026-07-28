"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StructuredInput } from "@/lib/rules";
import { classify } from "@/lib/client-classifier";
import { generateReport } from "@/lib/report-generator";
import { getBYOKConfig } from "@/lib/client-llm";

const MIN_DESCRIPTION_LENGTH = 50;
const REPORT_STORAGE_PREFIX = "regulait_report_";

interface Option {
  value: string;
  label: string;
  description: string;
}

const AI_FUNCTIONS: Option[] = [
  { value: "screening", label: "Screening", description: "Filters or shortlists people, applications, or content" },
  { value: "scoring", label: "Scoring", description: "Assigns a rating, ranking, or score to a person or case" },
  { value: "generating", label: "Generating", description: "Produces text, images, audio, or video output" },
  { value: "recommending", label: "Recommending", description: "Suggests products, content, or next actions" },
  { value: "detecting", label: "Detecting", description: "Flags anomalies, fraud, objects, or specific conditions" },
  { value: "other", label: "Other", description: "Not listed above" },
];

const DATA_TYPES: Option[] = [
  { value: "biometric", label: "Biometric", description: "Facial, fingerprint, iris, or voice identifiers" },
  { value: "personal", label: "Personal", description: "Names, contact details, or other personal identifiers" },
  { value: "financial", label: "Financial", description: "Income, credit history, transactions, or account data" },
  { value: "health", label: "Health", description: "Medical records, diagnoses, or health-related data" },
  { value: "public", label: "Public", description: "Publicly available or non-sensitive data" },
  { value: "other", label: "Other", description: "Not listed above" },
];

const USER_TYPES: Option[] = [
  { value: "consumers", label: "Consumers", description: "General public or individual end users" },
  { value: "businesses", label: "Businesses", description: "Other companies as customers (B2B)" },
  { value: "government", label: "Government", description: "Public sector or government bodies" },
  { value: "internal", label: "Internal", description: "Used only within your own organization" },
];

const GEOGRAPHY: Option[] = [
  { value: "eu_countries", label: "Based in the EU", description: "Your organization is established in an EU member state" },
  { value: "serving_eu_users", label: "Serving EU users", description: "Offered to users in the EU, even if based elsewhere" },
  { value: "no_eu_exposure", label: "No EU exposure", description: "No EU users, customers, or establishment" },
];

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];
}

function withOtherText(values: string[], otherText: string): string[] {
  if (!values.includes("other")) return values;
  const trimmed = otherText.trim();
  return trimmed ? [...values, trimmed] : values;
}

function CheckboxGroup({
  legend,
  hint,
  options,
  selected,
  onToggle,
  otherText,
  onOtherTextChange,
  columns = 2,
}: {
  legend: string;
  hint?: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  otherText?: string;
  onOtherTextChange?: (value: string) => void;
  columns?: 1 | 2;
}) {
  const otherId = useId();
  const hasOther = options.some((o) => o.value === "other");
  const otherSelected = hasOther && selected.includes("other");

  return (
    <fieldset className="border-t border-border/60 pt-6">
      <legend className="mb-1 font-heading text-base font-semibold tracking-tight text-ink">
        {legend}
      </legend>
      {hint ? (
        <p className="mb-4 text-sm text-ink-muted">{hint}</p>
      ) : (
        <div className="mb-4" />
      )}
      <div className={`grid gap-2 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={`group flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                checked
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:border-border-strong"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.value)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                  checked
                    ? "border-accent bg-accent"
                    : "border-border-strong bg-canvas group-hover:border-ink-muted"
                }`}
              >
                {checked && (
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    className="h-3 w-3 text-canvas"
                  >
                    <path
                      d="M3.5 8.5L6.5 11.5L12.5 4.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">
                  {option.label}
                </span>
                <span className="block text-xs leading-snug text-ink-muted">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {hasOther && otherSelected && onOtherTextChange && (
        <div className="mt-3">
          <label htmlFor={otherId} className="sr-only">
            Specify other option for {legend}
          </label>
          <input
            id={otherId}
            type="text"
            value={otherText ?? ""}
            onChange={(e) => onOtherTextChange(e.target.value)}
            placeholder="Please specify..."
            maxLength={120}
            className="focus-ring w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
          />
        </div>
      )}
    </fieldset>
  );
}

export function ScanForm() {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [aiFunctions, setAiFunctions] = useState<string[]>([]);
  const [dataTypes, setDataTypes] = useState<string[]>([]);
  const [userTypes, setUserTypes] = useState<string[]>([]);
  const [geography, setGeography] = useState<string[]>([]);
  const [otherAiFunction, setOtherAiFunction] = useState("");
  const [otherDataType, setOtherDataType] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    setHasApiKey(Boolean(getBYOKConfig()?.apiKey));
  }, []);

  const descriptionLength = description.trim().length;
  const descriptionValid = descriptionLength >= MIN_DESCRIPTION_LENGTH;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedDescription = description.trim();
    if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
      setError(
        `Product description must be at least ${MIN_DESCRIPTION_LENGTH} characters (currently ${trimmedDescription.length}).`
      );
      return;
    }
    if (geography.length === 0) {
      setError("Select at least one geography option so we can assess EU exposure.");
      return;
    }

    setSubmitting(true);

    const structured_input: StructuredInput = {
      ai_functions: withOtherText(aiFunctions, otherAiFunction),
      data_types: withOtherText(dataTypes, otherDataType),
      user_types: userTypes,
      geography,
    };

    try {
      const classification = await classify(trimmedDescription, structured_input);
      const report = generateReport(classification);

      try {
        window.localStorage.setItem(
          `${REPORT_STORAGE_PREFIX}${report.id}`,
          JSON.stringify(report)
        );
      } catch {
        // localStorage may be unavailable (private browsing, quota) -- the
        // report page falls back to a "not found" state, so this is
        // non-fatal to the classification itself.
      }

      router.push(`/report?id=${report.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <div className="mb-1 flex items-baseline justify-between gap-4">
          <label
            htmlFor="product-description"
            className="font-heading text-base font-semibold tracking-tight text-ink"
          >
            Product description
          </label>
          <span
            className={`shrink-0 font-mono text-xs tabular-nums ${
              descriptionValid ? "text-ink-muted" : "text-danger"
            }`}
          >
            {descriptionLength} / {MIN_DESCRIPTION_LENGTH}+
          </span>
        </div>
        <p className="mb-3 text-sm text-ink-muted">
          Describe what your AI system does, who uses it, and what decisions
          or outputs it produces. The more specific, the more accurate the
          classification.
        </p>
        <textarea
          id="product-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Example: Our platform uses a machine learning model to screen incoming resumes for open engineering roles, scoring each candidate from 1-10 based on skills match before a recruiter reviews the shortlist..."
          className="focus-ring w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted"
        />
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full transition-all ${
              descriptionValid ? "bg-accent" : "bg-danger"
            }`}
            style={{
              width: `${Math.min(100, (descriptionLength / MIN_DESCRIPTION_LENGTH) * 100)}%`,
            }}
          />
        </div>
      </div>

      <CheckboxGroup
        legend="AI functions"
        hint="What does the system do? Select all that apply."
        options={AI_FUNCTIONS}
        selected={aiFunctions}
        onToggle={(value) => setAiFunctions((prev) => toggleValue(prev, value))}
        otherText={otherAiFunction}
        onOtherTextChange={setOtherAiFunction}
      />

      <CheckboxGroup
        legend="Data types"
        hint="What kinds of data does it process?"
        options={DATA_TYPES}
        selected={dataTypes}
        onToggle={(value) => setDataTypes((prev) => toggleValue(prev, value))}
        otherText={otherDataType}
        onOtherTextChange={setOtherDataType}
      />

      <CheckboxGroup
        legend="User types"
        hint="Who is the system used on or by?"
        options={USER_TYPES}
        selected={userTypes}
        onToggle={(value) => setUserTypes((prev) => toggleValue(prev, value))}
      />

      <CheckboxGroup
        legend="Geography"
        hint="Required -- determines whether the EU AI Act applies."
        options={GEOGRAPHY}
        selected={geography}
        onToggle={(value) => setGeography((prev) => toggleValue(prev, value))}
        columns={1}
      />

      {error && (
        <div
          role="alert"
          className="rounded-md border-l-2 border-danger bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          <p className="font-medium">Couldn&apos;t submit your scan</p>
          <p className="mt-0.5 text-danger/90">{error}</p>
        </div>
      )}

      {!hasApiKey && (
        <div className="glass-card flex items-start gap-3 rounded-md border-l-2 border-border px-4 py-3 text-sm text-ink-muted">
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="mt-0.5 h-4 w-4 shrink-0"
            fill="none"
          >
            <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10 9v4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="10" cy="6.5" r="0.9" fill="currentColor" />
          </svg>
          <p>
            No LLM API key configured. The rule engine handles most cases on
            its own; for ambiguous ones,{" "}
            <Link href="/settings" className="font-medium text-accent hover:text-accent-strong hover:underline">
              add a free Gemini key in Settings
            </Link>{" "}
            for a more accurate result.
          </p>
        </div>
      )}

      <div className="border-t border-border/60 pt-6">
        <button
          type="submit"
          disabled={submitting}
          className="focus-ring glow-accent relative w-full overflow-hidden rounded-md bg-accent px-4 py-3 font-heading text-sm font-semibold tracking-wide text-canvas transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-90"
        >
          <span className="relative z-10">
            {submitting ? "Analyzing against the EU AI Act..." : "Run compliance scan"}
          </span>
          {submitting && (
            <span
              aria-hidden
              className="absolute inset-0 overflow-hidden"
            >
              <span className="absolute inset-y-0 left-0 w-1/3 animate-[regulait-scan-beam_1.6s_ease-in-out_infinite] bg-white/20" />
            </span>
          )}
        </button>
        <p className="mt-3 text-center text-xs text-ink-muted">
          This is an informational assessment, not legal advice.
        </p>
      </div>
    </form>
  );
}
