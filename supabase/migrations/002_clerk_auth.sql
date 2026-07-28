-- Auth moved from Supabase Auth to Clerk. Clerk user ids are strings like
-- "user_2abc123..." (not uuids), and there is no longer a Supabase auth
-- session to populate auth.uid() with -- all authenticated reads/writes now
-- go through the server-side Supabase service role client, keyed off
-- Clerk's userId instead. Update the schema and policies to match.

alter table scans drop constraint if exists scans_user_id_fkey;
alter table scans alter column user_id type text using user_id::text;

alter table subscriptions drop constraint if exists subscriptions_user_id_fkey;
alter table subscriptions alter column user_id type text using user_id::text;

-- These policies relied on auth.uid(), which is never set now that auth is
-- handled by Clerk. Owner-scoped reads/writes happen via the service role
-- client (bypasses RLS) instead, so drop the now-dead policies. The public
-- "read by id" and "insert" policies stay -- they don't depend on auth.uid().
drop policy if exists "Users can list their own scans" on scans;
drop policy if exists "Users can read their own subscriptions" on subscriptions;
