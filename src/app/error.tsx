"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the console for now -- swap in an error-reporting service
    // (Sentry, etc.) if one gets wired up later.
    console.error("Regulait runtime error:", error);
  }, [error]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
      <p className="font-mono text-xs uppercase tracking-widest text-danger">
        Something went wrong
      </p>
      <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        We hit a snag processing that.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
        An unexpected error interrupted the page. This has been logged. You
        can try again, or head back to the homepage.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-ink-muted">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
        <button
          type="button"
          onClick={() => reset()}
          className="focus-ring glow-accent inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-heading text-sm font-semibold tracking-wide text-canvas transition-colors hover:bg-accent-strong"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          Back to home
        </Link>
      </div>
      </main>
    </>
  );
}
