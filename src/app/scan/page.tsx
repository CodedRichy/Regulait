import { ScanForm } from "@/components/scan-form";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Scan Your AI System - Regulait",
  description: "Check your AI system's compliance with the EU AI Act",
};

export default function ScanPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
        EU AI Act &middot; Compliance Scan
      </p>
      <h1 className="mb-3 font-heading text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
        Check your AI system
      </h1>
      <p className="mb-10 max-w-lg text-ink-muted">
        Describe your AI product and answer a few structured questions. We
        classify it under the EU AI Act&apos;s risk tiers and generate a
        compliance report with required actions.
      </p>
      <div className="glass-card rounded-[10px] p-6 sm:p-8">
        <ScanForm />
      </div>
      </main>
    </>
  );
}
