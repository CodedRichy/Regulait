import { ApiKeySettings } from "@/components/api-key-settings";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Settings - Regulait",
  description: "Configure your own LLM API key for ambiguous case classification",
};

export default function SettingsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
        Regulait &middot; Settings
      </p>
      <h1 className="mb-3 font-heading text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
        LLM API key (optional)
      </h1>
      <p className="mb-10 max-w-lg text-ink-muted">
        Regulait classifies most AI systems with a deterministic rule engine
        that runs entirely in your browser -- no key required. Add your own
        key below only if you want ambiguous cases to be resolved by an LLM
        instead of a lower-confidence rule-engine guess.
      </p>
      <div className="glass-card rounded-[10px] p-6 sm:p-8">
        <ApiKeySettings />
      </div>
      </main>
    </>
  );
}
