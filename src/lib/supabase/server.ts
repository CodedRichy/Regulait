import { createClient } from "@supabase/supabase-js";

// Auth is handled by Clerk now -- Supabase is database-only, so these
// clients no longer need cookie-based session plumbing (that was
// @supabase/ssr's job for Supabase Auth sessions, which don't exist here).

/**
 * Anon-key client for public, unauthenticated reads that are covered by an
 * RLS policy with `using (true)` (e.g. fetching a report by id).
 */
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Service-role client that bypasses RLS entirely. Use for any operation
 * scoped to a Clerk-authenticated user (scan persistence with user_id,
 * dashboard scan listing, subscription lookups) -- RLS policies keyed on
 * `auth.uid()` can't work here since there's no Supabase auth session, only
 * a Clerk session. Never expose this client or its key to the browser.
 */
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
