create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  product_desc text not null,
  structured_input jsonb not null,
  risk_tier text not null check (risk_tier in ('unacceptable', 'high', 'limited', 'minimal')),
  report jsonb not null,
  created_at timestamptz default now()
);

alter table scans enable row level security;

create policy "Anyone can read scans by id"
  on scans for select
  using (true);

create policy "Authenticated users can insert scans"
  on scans for insert
  with check (true);

create policy "Users can list their own scans"
  on scans for select
  using (auth.uid() = user_id);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  plan text not null check (plan in ('free', 'pro', 'agency')),
  stripe_customer text,
  stripe_sub text,
  status text not null check (status in ('active', 'canceled', 'past_due')),
  created_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users can read their own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);
