-- Checkmate & Twist Academy — initial schema
-- Run in the Supabase SQL editor (or `supabase db push`). Safe defaults: RLS on every table,
-- users can only touch their own rows, leaderboards are exposed via aggregate functions only.

-- gen_random_uuid() is built into PostgreSQL 13+ (Supabase uses 15+).

-- ───────────────────────── profiles ─────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username is null or username ~ '^[A-Za-z0-9_]{3,24}$'),
  display_name text check (display_name is null or char_length(display_name) between 1 and 40),
  role text not null default 'student' check (role in ('student', 'moderator', 'admin')),
  scans integer not null default 0 check (scans >= 0),
  show_on_leaderboard boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)), 40))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator'));
$$;

-- Users may edit their own profile but never their own role. Requests without a user JWT
-- (the SQL editor / service role) are trusted, which is how the first admin is created.
create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'only admins can change roles';
  end if;
  if new.id is distinct from old.id then raise exception 'id is immutable'; end if;
  return new;
end $$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_role();

alter table public.profiles enable row level security;
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- ───────────────────────── progress tables ─────────────────────────
create table if not exists public.lesson_progress (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  lesson_id text not null check (char_length(lesson_id) <= 80),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create table if not exists public.solves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  time_ms integer not null check (time_ms > 0 and time_ms < 86400000),
  penalty text check (penalty in ('+2', 'DNF')),
  scramble text not null check (char_length(scramble) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists solves_user_idx on public.solves (user_id, created_at);
create table if not exists public.quiz_results (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  quiz_id text not null,
  score integer not null check (score >= 0),
  total integer not null check (total > 0 and score <= total),
  created_at timestamptz not null default now()
);
create table if not exists public.puzzle_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  puzzle_id text not null,
  solved boolean not null,
  rating integer not null,
  created_at timestamptz not null default now()
);
create table if not exists public.engine_games (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  result text not null check (result in ('win', 'loss', 'draw')),
  level integer not null check (level between 1 and 8),
  created_at timestamptz not null default now()
);
create table if not exists public.user_achievements (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

do $$
declare t text;
begin
  foreach t in array array['lesson_progress', 'solves', 'quiz_results', 'puzzle_attempts', 'engine_games', 'user_achievements'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- ───────────────────────── community ─────────────────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  category text not null default 'general' check (category in ('chess', 'cube', 'general')),
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 1 and 5000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

alter table public.posts enable row level security;
alter table public.comments enable row level security;
drop policy if exists "read visible posts" on public.posts;
create policy "read visible posts" on public.posts for select using (not hidden or user_id = auth.uid() or public.is_staff());
drop policy if exists "create own posts" on public.posts;
create policy "create own posts" on public.posts for insert to authenticated with check (user_id = auth.uid() and hidden = false);
drop policy if exists "edit own or moderate posts" on public.posts;
create policy "edit own or moderate posts" on public.posts for update to authenticated
  using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());
drop policy if exists "delete own or moderate posts" on public.posts;
create policy "delete own or moderate posts" on public.posts for delete to authenticated using (user_id = auth.uid() or public.is_staff());

drop policy if exists "read visible comments" on public.comments;
create policy "read visible comments" on public.comments for select using (not hidden or user_id = auth.uid() or public.is_staff());
drop policy if exists "create own comments" on public.comments;
create policy "create own comments" on public.comments for insert to authenticated with check (user_id = auth.uid() and hidden = false);
drop policy if exists "edit own or moderate comments" on public.comments;
create policy "edit own or moderate comments" on public.comments for update to authenticated
  using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());
drop policy if exists "delete own or moderate comments" on public.comments;
create policy "delete own or moderate comments" on public.comments for delete to authenticated using (user_id = auth.uid() or public.is_staff());

-- Non-staff users cannot hide/unhide content (only staff moderate).
create or replace function public.protect_hidden() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.hidden is distinct from old.hidden and auth.uid() is not null and not public.is_staff() then
    raise exception 'only moderators can hide content';
  end if;
  if new.user_id is distinct from old.user_id then raise exception 'author is immutable'; end if;
  return new;
end $$;
drop trigger if exists posts_protect on public.posts;
create trigger posts_protect before update on public.posts for each row execute function public.protect_hidden();
drop trigger if exists comments_protect on public.comments;
create trigger comments_protect before update on public.comments for each row execute function public.protect_hidden();

-- ───────────────────────── leaderboards (aggregates only) ─────────────────────────
create or replace function public.leaderboard_cube(lim integer default 25)
returns table (display_name text, best_ms integer, solves bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(p.display_name, p.username, 'Cuber'), min(s.time_ms + case when s.penalty = '+2' then 2000 else 0 end)::int, count(*)
  from public.solves s join public.profiles p on p.id = s.user_id
  where p.show_on_leaderboard and (s.penalty is null or s.penalty <> 'DNF')
  group by p.id order by 2 asc limit least(greatest(lim, 1), 100);
$$;
create or replace function public.leaderboard_puzzles(lim integer default 25)
returns table (display_name text, solved bigint, best_rating integer)
language sql stable security definer set search_path = public as $$
  select coalesce(p.display_name, p.username, 'Player'), count(distinct a.puzzle_id), max(a.rating)
  from public.puzzle_attempts a join public.profiles p on p.id = a.user_id
  where p.show_on_leaderboard and a.solved
  group by p.id order by 2 desc, 3 desc limit least(greatest(lim, 1), 100);
$$;
create or replace function public.leaderboard_lessons(lim integer default 25)
returns table (display_name text, lessons bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(p.display_name, p.username, 'Student'), count(*)
  from public.lesson_progress l join public.profiles p on p.id = l.user_id
  where p.show_on_leaderboard
  group by p.id order by 2 desc limit least(greatest(lim, 1), 100);
$$;

-- ───────────────────────── admin ─────────────────────────
create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return json_build_object(
    'users', (select count(*) from public.profiles),
    'solves', (select count(*) from public.solves),
    'puzzle_attempts', (select count(*) from public.puzzle_attempts),
    'lessons_completed', (select count(*) from public.lesson_progress),
    'posts', (select count(*) from public.posts),
    'hidden_posts', (select count(*) from public.posts where hidden),
    'comments', (select count(*) from public.comments)
  );
end $$;

create or replace function public.admin_list_users(lim integer default 200)
returns table (id uuid, email text, display_name text, username text, role text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query select p.id, u.email::text, p.display_name, p.username, p.role, p.created_at
    from public.profiles p join auth.users u on u.id = p.id order by p.created_at desc limit lim;
end $$;

create or replace function public.admin_set_role(target uuid, new_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if new_role not in ('student', 'moderator', 'admin') then raise exception 'invalid role'; end if;
  if target = auth.uid() and new_role <> 'admin' then raise exception 'you cannot demote yourself'; end if;
  update public.profiles set role = new_role where id = target;
end $$;

revoke all on function public.admin_stats() from public, anon;
revoke all on function public.admin_list_users(integer) from public, anon;
revoke all on function public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_list_users(integer) to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.leaderboard_cube(integer), public.leaderboard_puzzles(integer), public.leaderboard_lessons(integer) to anon, authenticated;

-- Make yourself admin after signing up (run once in the SQL editor, with your email):
--   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
