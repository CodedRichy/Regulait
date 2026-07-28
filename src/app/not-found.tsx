import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
        404 &middot; Not Found
      </p>
      <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        This page doesn&apos;t exist.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
        The page you&apos;re looking for may have moved, or the link may be
        out of date. Reports are stored locally in your browser, so a report
        link won&apos;t resolve on a different device.
      </p>
      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/"
          className="focus-ring glow-accent inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-heading text-sm font-semibold tracking-wide text-canvas transition-colors hover:bg-accent-strong"
        >
          Back to home
        </Link>
        <Link
          href="/scan"
          className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          Run a new scan
        </Link>
      </div>
    </main>
  );
}
