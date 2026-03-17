-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (synced with auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  stripe_customer_id text,
  subscription_status text default 'inactive',
  subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trade analyses
create table public.trade_analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  instrument text,
  timeframe text,
  strategy_notes text,
  chart_image_url text,
  ai_feedback text,
  grade text,
  created_at timestamptz default now()
);

alter table public.trade_analyses enable row level security;
create policy "Users can manage own trades" on public.trade_analyses for all using (auth.uid() = user_id);

-- Journal entries
create table public.journal_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  notes text default '',
  learned text default '',
  improve text default '',
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.journal_entries enable row level security;
create policy "Users can manage own journal" on public.journal_entries for all using (auth.uid() = user_id);

-- P&L entries
create table public.pnl_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  symbol text,
  pnl numeric,
  rr numeric,
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.pnl_entries enable row level security;
create policy "Users can manage own pnl" on public.pnl_entries for all using (auth.uid() = user_id);
