"use client";

import { useEffect, useState } from "react";
import {
  type BYOKProvider,
  DEFAULT_MODELS,
  PROVIDER_LABELS,
  BROWSER_SUPPORTED_PROVIDERS,
  getBYOKConfig,
  saveBYOKConfig,
  clearBYOKConfig,
} from "@/lib/client-llm";

const PROVIDERS: BYOKProvider[] = ["gemini", "openai", "groq", "anthropic"];

export function ApiKeySettings() {
  const [provider, setProvider] = useState<BYOKProvider>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODELS.gemini);
  const [configured, setConfigured] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const existing = getBYOKConfig();
    if (existing) {
      setProvider(existing.provider);
      setApiKey(existing.apiKey);
      setModel(existing.model || DEFAULT_MODELS[existing.provider]);
      setConfigured(true);
    }
  }, []);

  function handleProviderChange(next: BYOKProvider) {
    setProvider(next);
    setModel(DEFAULT_MODELS[next]);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    saveBYOKConfig({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || DEFAULT_MODELS[provider],
    });
    setConfigured(true);
    setSavedAt(Date.now());
  }

  function handleClear() {
    clearBYOKConfig();
    setApiKey("");
    setProvider("gemini");
    setModel(DEFAULT_MODELS.gemini);
    setConfigured(false);
    setSavedAt(null);
  }

  const isBrowserSupported = BROWSER_SUPPORTED_PROVIDERS.includes(provider);

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
          {configured && (
            <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-success" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              configured ? "bg-success" : "bg-ink-muted"
            }`}
          />
        </span>
        <p className="text-sm font-medium text-ink">
          {configured ? "API key configured" : "No API key configured"}
        </p>
        {savedAt && (
          <span className="font-mono text-xs text-ink-muted">Saved</span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-ink-muted">
        The rule engine handles most classifications on its own. An API key
        only improves accuracy for ambiguous cases the rules can&apos;t
        confidently resolve. Your key is stored locally in your browser and
        never sent to our servers.
      </p>

      <fieldset>
        <legend className="mb-2 font-heading text-sm font-semibold tracking-tight text-ink">
          Provider
        </legend>
        <div className="grid gap-2">
          {PROVIDERS.map((p) => (
            <label
              key={p}
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                provider === p
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:border-border-strong"
              }`}
            >
              <input
                type="radio"
                name="provider"
                value={p}
                checked={provider === p}
                onChange={() => handleProviderChange(p)}
                className="focus-ring mt-1 accent-accent"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">
                  {p === "gemini" ? "Gemini" : p[0].toUpperCase() + p.slice(1)}
                </span>
                <span className="block text-xs leading-snug text-ink-muted">
                  {PROVIDER_LABELS[p]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {!isBrowserSupported && (
        <div className="rounded-md border-l-2 border-warning bg-warning-bg px-4 py-3 text-sm text-ink">
          {PROVIDER_LABELS[provider]} blocks requests made directly from a
          browser (CORS). This key will only work if you run Regulait
          locally with <code className="font-mono">npm run dev</code>; it
          will fail on the deployed static site. Use Gemini for a provider
          that works everywhere.
        </div>
      )}

      <div>
        <label
          htmlFor="byok-api-key"
          className="mb-1 block font-heading text-sm font-semibold tracking-tight text-ink"
        >
          API key
        </label>
        <input
          id="byok-api-key"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your API key"
          className="focus-ring w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
        />
      </div>

      <div>
        <label
          htmlFor="byok-model"
          className="mb-1 block font-heading text-sm font-semibold tracking-tight text-ink"
        >
          Model
        </label>
        <input
          id="byok-model"
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={DEFAULT_MODELS[provider]}
          className="focus-ring w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
        />
        <p className="mt-1 text-xs text-ink-muted">
          Default: {DEFAULT_MODELS[provider]}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-6">
        <button
          type="submit"
          disabled={!apiKey.trim()}
          className="focus-ring glow-accent inline-flex items-center rounded-md bg-accent px-4 py-2 font-heading text-sm font-semibold tracking-wide text-canvas transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save key
        </button>
        {configured && (
          <button
            type="button"
            onClick={handleClear}
            className="focus-ring inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-border-strong"
          >
            Clear key
          </button>
        )}
      </div>
    </form>
  );
}
