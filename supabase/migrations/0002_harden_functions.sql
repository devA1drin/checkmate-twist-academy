-- Checkmate & Twist Academy: harden functions and tidy RLS (fixes Supabase advisor lints 0028/0029/0003/0001).
--
-- 1. Role checks (is_admin / is_staff) move to a `private` schema that PostgREST does not expose,
--    so they can no longer be called as /rest/v1/rpc/*. RLS policies and triggers call them there.
-- 2. Trigger-only functions lose EXECUTE for API roles (triggers fire regardless of caller grants).
-- 3. Every function gets an empty search_path and fully-qualified references.
-- 4. Policies wrap auth.uid() / role checks in (select ...) so they are evaluated once per query.
-- 5. Covering indexes for user_id foreign keys.
--
-- Intentionally still callable through the API:
--   leaderboard_cube / leaderboard_puzzles / leaderboard_lessons  -> anon + authenticated
--     (SECURITY DEFINER so they can aggregate across users; they return only display names of
--      users who opted in via profiles.show_on_leaderboard, plus counts/times. No ids, no emails.)
--   admin_stats / admin_list_users / admin_set_role -> authenticated only
--     (each raises 'admin only' unless private.is_admin() is true for the caller.)

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
create or replace function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'moderator'));
$$;
revoke all on function private.is_admin(), private.is_staff() from public;
grant execute on function private.is_admin(), private.is_staff() to anon, authenticated, service_role;

-- ───────── trigger functions ─────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)), 40))
  on conflict (id) do nothing;
  return new;
end $$;

create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not private.is_admin() then
    raise exception 'only admins can change roles';
  end if;
  if new.id is distinct from old.id then raise exception 'id is immutable'; end if;
  return new;
end $$;

create or replace function public.protect_hidden() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.hidden is distinct from old.hidden and auth.uid() is not null and not private.is_staff() then
    raise exception 'only moderators can hide content';
  end if;
  if new.user_id is distinct from old.user_id then raise exception 'author is immutable'; end if;
  return new;
end $$;

revoke all on function public.handle_new_user(), public.protect_role(), public.protect_hidden() from public, anon, authenticated;

-- ───────── policies (switch to private.*, initplan-friendly) ─────────
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

do $$
declare t text;
begin
  foreach t in array array['lesson_progress', 'solves', 'quiz_results', 'puzzle_attempts', 'engine_games', 'user_achievements'] loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
  foreach t in array array['posts', 'comments'] loop
    execute format('drop policy if exists "read visible %s" on public.%I', t, t);
    execute format('create policy "read visible %s" on public.%I for select using (not hidden or user_id = (select auth.uid()) or (select private.is_staff()))', t, t);
    execute format('drop policy if exists "create own %s" on public.%I', t, t);
    execute format('create policy "create own %s" on public.%I for insert to authenticated with check (user_id = (select auth.uid()) and hidden = false)', t, t);
    execute format('drop policy if exists "edit own or moderate %s" on public.%I', t, t);
    execute format('create policy "edit own or moderate %s" on public.%I for update to authenticated using (user_id = (select auth.uid()) or (select private.is_staff())) with check (user_id = (select auth.uid()) or (select private.is_staff()))', t, t);
    execute format('drop policy if exists "delete own or moderate %s" on public.%I', t, t);
    execute format('create policy "delete own or moderate %s" on public.%I for delete to authenticated using (user_id = (select auth.uid()) or (select private.is_staff()))', t, t);
  end loop;
end $$;

-- ───────── leaderboards (public, opted-in display names + aggregates only) ─────────
create or replace function public.leaderboard_cube(lim integer default 25)
returns table (display_name text, best_ms integer, solves bigint)
language sql stable security definer set search_path = '' as $$
  select coalesce(p.display_name, p.username, 'Cuber'), min(s.time_ms + case when s.penalty = '+2' then 2000 else 0 end)::int, count(*)
  from public.solves s join public.profiles p on p.id = s.user_id
  where p.show_on_leaderboard and (s.penalty is null or s.penalty <> 'DNF')
  group by p.id order by 2 asc limit least(greatest(lim, 1), 100);
$$;
create or replace function public.leaderboard_puzzles(lim integer default 25)
returns table (display_name text, solved bigint, best_rating integer)
language sql stable security definer set search_path = '' as $$
  select coalesce(p.display_name, p.username, 'Player'), count(distinct a.puzzle_id), max(a.rating)
  from public.puzzle_attempts a join public.profiles p on p.id = a.user_id
  where p.show_on_leaderboard and a.solved
  group by p.id order by 2 desc, 3 desc limit least(greatest(lim, 1), 100);
$$;
create or replace function public.leaderboard_lessons(lim integer default 25)
returns table (display_name text, lessons bigint)
language sql stable security definer set search_path = '' as $$
  select coalesce(p.display_name, p.username, 'Student'), count(*)
  from public.lesson_progress l join public.profiles p on p.id = l.user_id
  where p.show_on_leaderboard
  group by p.id order by 2 desc limit least(greatest(lim, 1), 100);
$$;
revoke all on function public.leaderboard_cube(integer), public.leaderboard_puzzles(integer), public.leaderboard_lessons(integer) from public;
grant execute on function public.leaderboard_cube(integer), public.leaderboard_puzzles(integer), public.leaderboard_lessons(integer) to anon, authenticated;

-- ───────── admin RPCs (authenticated callers, admin-checked inside) ─────────
create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
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
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  return query select p.id, u.email::text, p.display_name, p.username, p.role, p.created_at
    from public.profiles p join auth.users u on u.id = p.id
    order by p.created_at desc limit least(greatest(lim, 1), 1000);
end $$;

create or replace function public.admin_set_role(target uuid, new_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  if new_role not in ('student', 'moderator', 'admin') then raise exception 'invalid role'; end if;
  if target = auth.uid() and new_role <> 'admin' then raise exception 'you cannot demote yourself'; end if;
  update public.profiles set role = new_role where id = target;
end $$;

revoke all on function public.admin_stats(), public.admin_list_users(integer), public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.admin_stats(), public.admin_list_users(integer), public.admin_set_role(uuid, text) to authenticated;

-- The old public role checks are no longer referenced by any policy or function.
drop function if exists public.is_admin();
drop function if exists public.is_staff();

-- ───────── covering indexes for foreign keys ─────────
create index if not exists comments_user_idx on public.comments (user_id);
create index if not exists engine_games_user_idx on public.engine_games (user_id);
create index if not exists posts_user_idx on public.posts (user_id, created_at desc);
create index if not exists puzzle_attempts_user_idx on public.puzzle_attempts (user_id);
create index if not exists quiz_results_user_idx on public.quiz_results (user_id);
