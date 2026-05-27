-- DROP ALL Fanzone TABLES, TRIGGERS, POLICIES, VIEWS (for a clean slate)
-- Run this block first if you want to fully reset your schema (DANGEROUS: deletes all data!)

-- Drop views
DROP VIEW IF EXISTS public.leaderboard_current CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trg_matches_updated_at ON public.matches;
DROP TRIGGER IF EXISTS trg_predictions_updated_at ON public.predictions;
DROP TRIGGER IF EXISTS trg_collectibles_updated_at ON public.collectibles;
DROP TRIGGER IF EXISTS trg_user_collectibles_updated_at ON public.user_collectibles;
DROP TRIGGER IF EXISTS trg_content_posts_updated_at ON public.content_posts;
DROP TRIGGER IF EXISTS trg_polls_updated_at ON public.polls;
DROP TRIGGER IF EXISTS trg_poll_options_updated_at ON public.poll_options;
DROP TRIGGER IF EXISTS trg_poll_votes_updated_at ON public.poll_votes;
DROP TRIGGER IF EXISTS trg_leaderboard_snapshots_updated_at ON public.leaderboard_snapshots;

-- Drop policies
DROP POLICY IF EXISTS "Profiles are readable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are insertable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are updatable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Matches are readable by anyone" ON public.matches;
DROP POLICY IF EXISTS "Predictions are readable by owner" ON public.predictions;
DROP POLICY IF EXISTS "Predictions are insertable by owner" ON public.predictions;
DROP POLICY IF EXISTS "Predictions are updatable by owner" ON public.predictions;
DROP POLICY IF EXISTS "Predictions are deletable by owner" ON public.predictions;
DROP POLICY IF EXISTS "Collectibles are readable by anyone" ON public.collectibles;
DROP POLICY IF EXISTS "User collectibles are readable by owner" ON public.user_collectibles;
DROP POLICY IF EXISTS "User collectibles are insertable by owner" ON public.user_collectibles;
DROP POLICY IF EXISTS "User collectibles are updatable by owner" ON public.user_collectibles;
DROP POLICY IF EXISTS "Content posts are readable by anyone" ON public.content_posts;
DROP POLICY IF EXISTS "Polls are readable by anyone" ON public.polls;
DROP POLICY IF EXISTS "Poll options are readable by anyone" ON public.poll_options;
DROP POLICY IF EXISTS "Poll votes are readable by owner" ON public.poll_votes;
DROP POLICY IF EXISTS "Poll votes are insertable by owner" ON public.poll_votes;
DROP POLICY IF EXISTS "Poll votes are updatable by owner" ON public.poll_votes;
DROP POLICY IF EXISTS "Leaderboard snapshots are readable by anyone" ON public.leaderboard_snapshots;

-- Drop tables (in dependency order: children first)
DROP TABLE IF EXISTS public.poll_votes CASCADE;
DROP TABLE IF EXISTS public.poll_options CASCADE;
DROP TABLE IF EXISTS public.polls CASCADE;
DROP TABLE IF EXISTS public.content_posts CASCADE;
DROP TABLE IF EXISTS public.user_collectibles CASCADE;
DROP TABLE IF EXISTS public.collectibles CASCADE;
DROP TABLE IF EXISTS public.predictions CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.leaderboard_snapshots CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.set_profiles_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at CASCADE;

-- Drop extension (optional, only if you want to fully reset)
-- DROP EXTENSION IF EXISTS pgcrypto CASCADE;

-- Now run the rest of your schema.sql to recreate everything from scratch.

-- -------------------
-- END DROP BLOCK
-- -------------------

-- Drop all policies before any table or function definitions
drop policy if exists "Profiles are readable by owner" on public.profiles;
drop policy if exists "Profiles are insertable by owner" on public.profiles;
drop policy if exists "Profiles are updatable by owner" on public.profiles;
drop policy if exists "Matches are readable by anyone" on public.matches;
drop policy if exists "Predictions are readable by owner" on public.predictions;
drop policy if exists "Predictions are insertable by owner" on public.predictions;
drop policy if exists "Predictions are updatable by owner" on public.predictions;
drop policy if exists "Predictions are deletable by owner" on public.predictions;
drop policy if exists "Collectibles are readable by anyone" on public.collectibles;
drop policy if exists "User collectibles are readable by owner" on public.user_collectibles;
drop policy if exists "User collectibles are insertable by owner" on public.user_collectibles;
drop policy if exists "User collectibles are updatable by owner" on public.user_collectibles;
drop policy if exists "Content posts are readable by anyone" on public.content_posts;
drop policy if exists "Polls are readable by anyone" on public.polls;
drop policy if exists "Poll options are readable by anyone" on public.poll_options;
drop policy if exists "Poll votes are readable by owner" on public.poll_votes;
drop policy if exists "Poll votes are insertable by owner" on public.poll_votes;
drop policy if exists "Poll votes are updatable by owner" on public.poll_votes;
drop policy if exists "Leaderboard snapshots are readable by anyone" on public.leaderboard_snapshots;
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  age_verified boolean default false,
  date_of_birth date,
  team_affinity text,
  favorite_players text[] default '{}',
  xp_score integer not null default 0,
  prediction_accuracy integer not null default 0,
  collectibles_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are readable by owner"
on public.profiles
for select
using (auth.uid() = id);

create policy "Profiles are insertable by owner"
on public.profiles
with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
on public.profiles
for update
using (auth.uid() = id);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
CREATE TRIGGER trg_leaderboard_snapshots_updated_at
BEFORE UPDATE ON public.leaderboard_snapshots
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

-- -----------------------------------------------------------------------------
-- FanZone domain tables
-- -----------------------------------------------------------------------------

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  provider_match_id text unique,
  competition text,
  home_team text not null,
  away_team text not null,
  home_team_emoji text,
  away_team_emoji text,
  kickoff timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'finished')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  prediction_type text not null check (prediction_type in ('match-result', 'correct-score', 'first-goalscorer', 'cards', 'possession')),
  prediction_value text not null,
  odds numeric(8, 3),
  xp_reward integer not null default 0,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_predictions_user_match_type unique (user_id, match_id, prediction_type)
);
create table if not exists public.collectibles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  rarity text not null default 'common' check (rarity in ('common', 'rare', 'epic', 'legendary')),
  match_date date,
  player_name text,
  is_limited_edition boolean not null default false,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_collectibles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  collectible_id uuid not null references public.collectibles (id) on delete cascade,
  source_prediction_id uuid references public.predictions (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint uq_user_collectibles_user_collectible unique (user_id, collectible_id)
);

create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('video', 'article', 'poll', 'ugc')),
  title text not null,
  description text,
  image_url text,
  video_url text,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  is_age_gated boolean not null default false,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  content_post_id uuid unique references public.content_posts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  option_text text not null,
  votes_count integer not null default 0,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_poll_votes_poll_user unique (poll_id, user_id)
);

create table if not exists public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'global' check (scope in ('global', 'club', 'friends')),
  rank integer not null,
  xp_score integer not null,
  prediction_accuracy integer not null,
  correct_predictions integer not null default 0,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_predictions_user_id on public.predictions (user_id);
create index if not exists idx_predictions_match_id on public.predictions (match_id);
create index if not exists idx_predictions_status on public.predictions (status);
create index if not exists idx_content_posts_type on public.content_posts (type);
create index if not exists idx_content_posts_published_at on public.content_posts (published_at desc);
create index if not exists idx_poll_options_poll_id on public.poll_options (poll_id);
create index if not exists idx_poll_votes_poll_id on public.poll_votes (poll_id);
create index if not exists idx_poll_votes_user_id on public.poll_votes (user_id);
create index if not exists idx_leaderboard_scope_rank on public.leaderboard_snapshots (scope, rank);

drop trigger if exists trg_matches_updated_at on public.matches;
create trigger trg_matches_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

drop trigger if exists trg_predictions_updated_at on public.predictions;
create trigger trg_predictions_updated_at
before update on public.predictions
for each row execute function public.set_updated_at();

create trigger trg_collectibles_updated_at
before update on public.collectibles
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_collectibles_updated_at on public.user_collectibles;
create trigger trg_user_collectibles_updated_at
before update on public.user_collectibles
for each row execute function public.set_updated_at();


drop trigger if exists trg_polls_updated_at on public.polls;
create trigger trg_polls_updated_at
before update on public.polls
for each row execute function public.set_updated_at();

drop trigger if exists trg_poll_options_updated_at on public.poll_options;
create trigger trg_poll_options_updated_at
before update on public.poll_options
for each row execute function public.set_updated_at();

drop trigger if exists trg_poll_votes_updated_at on public.poll_votes;
create trigger trg_poll_votes_updated_at
before update on public.poll_votes
for each row execute function public.set_updated_at();

drop trigger if exists trg_leaderboard_snapshots_updated_at on public.leaderboard_snapshots;
create trigger trg_leaderboard_snapshots_updated_at
for each row execute function public.set_updated_at();

alter table public.content_posts enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.leaderboard_snapshots enable row level security;

create policy "Matches are readable by anyone"
on public.matches
for select
using (true);

create policy "Predictions are readable by owner"
on public.predictions
for select
using (auth.uid() = user_id);

create policy "Predictions are insertable by owner"
on public.predictions
for insert
with check (auth.uid() = user_id);

create policy "Predictions are updatable by owner"
on public.predictions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Predictions are deletable by owner"
on public.predictions
for delete
using (auth.uid() = user_id);

create policy "Collectibles are readable by anyone"
on public.collectibles
for select
using (true);

create policy "User collectibles are readable by owner"
on public.user_collectibles
for select
using (auth.uid() = user_id);

create policy "User collectibles are insertable by owner"
on public.user_collectibles
for insert
with check (auth.uid() = user_id);

create policy "User collectibles are updatable by owner"
on public.user_collectibles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Content posts are readable by anyone"
on public.content_posts
for select
using (true);

create policy "Polls are readable by anyone"
on public.polls
for select
using (true);

create policy "Poll options are readable by anyone"
on public.poll_options
for select
using (true);

create policy "Poll votes are readable by owner"
on public.poll_votes
for select
using (auth.uid() = user_id);

create policy "Poll votes are insertable by owner"
on public.poll_votes
for insert
with check (auth.uid() = user_id);

create policy "Poll votes are updatable by owner"
on public.poll_votes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Leaderboard snapshots are readable by anyone"
on public.leaderboard_snapshots
for select
using (true);

create or replace view public.leaderboard_current as
select
  p.id as user_id,
  p.display_name,
  p.xp_score,
  p.prediction_accuracy,
  count(*) filter (where pr.status = 'correct')::integer as correct_predictions,
  rank() over (order by p.xp_score desc, p.prediction_accuracy desc) as rank
from public.profiles p
left join public.predictions pr on pr.user_id = p.id
group by p.id, p.display_name, p.xp_score, p.prediction_accuracy;
