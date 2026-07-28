import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-40 border-b border-border/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link
          href="/"
          className="focus-ring rounded-md font-heading text-lg font-semibold tracking-tight text-ink"
        >
          Regulait
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="hidden text-sm text-ink-muted transition-colors hover:text-ink sm:inline"
          >
            Settings
          </Link>
          <Link
            href="/scan"
            className="focus-ring inline-flex items-center rounded-md bg-accent px-4 py-2 font-heading text-sm font-semibold tracking-wide text-canvas transition-colors hover:bg-accent-strong"
          >
            Start scan
          </Link>
        </div>
      </div>
    </header>
  );
}
