"use client";

import { useId, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        setStatus("error");
        setError(signInError.message);
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="border border-border bg-surface p-6 text-center">
        <p className="font-heading text-sm font-semibold text-ink">
          Check your email
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          We sent a one-time sign-in link to <strong className="text-ink">{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor={emailId} className="sr-only">
          Email address
        </label>
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
        />
      </div>
      {status === "error" && error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-sm bg-accent px-4 py-2.5 font-heading text-sm font-semibold tracking-wide text-canvas transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "sending" ? "Sending link..." : "Send magic link"}
      </button>
    </form>
  );
}
