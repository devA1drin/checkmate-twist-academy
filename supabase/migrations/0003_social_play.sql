-- 0003: onboarding + privacy, friends, live chess (server-authoritative), forum upgrades,
-- server-awarded XP / streaks / achievements / weekly league, daily activities, custom
-- challenges, opening-kit drills, cube battle rooms, reports.
-- Rules: RLS on every table; anything that grants points, ends a game or changes someone
-- else's data goes through SECURITY DEFINER functions with a pinned search_path; internal
-- helpers live in the `private` schema without API grants.

-- ───────────── profiles: onboarding, privacy, presence ─────────────
alter table public.profiles add column if not exists interests text check (interests in ('chess', 'cube', 'both'));
alter table public.profiles add column if not exists skill_level text check (skill_level in ('new', 'beginner', 'intermediate', 'advanced'));
alter table public.profiles add column if not exists onboarded boolean not null default false;
alter table public.profiles add column if not exists tz text not null default 'UTC' check (char_length(tz) <= 64);
alter table public.profiles add column if not exists allow_friend_requests boolean not null default true;
alter table public.profiles add column if not exists allow_challenges text not null default 'friends' check (allow_challenges in ('everyone', 'friends', 'nobody'));
alter table public.profiles add column if not exists profile_visibility text not null default 'public' check (profile_visibility in ('public', 'friends', 'private'));
alter table public.profiles add column if not exists show_online boolean not null default true;
alter table public.profiles add column if not exists last_seen timestamptz;

create or replace function private.validate_tz() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.tz is distinct from 'UTC' and not exists (select 1 from pg_catalog.pg_timezone_names where name = new.tz) then
    new.tz := 'UTC';
  end if;
  return new;
end $$;
drop trigger if exists profiles_validate_tz on public.profiles;
create trigger profiles_validate_tz before insert or update of tz on public.profiles for each row execute function private.validate_tz();

-- ───────────── gamification core ─────────────
create table if not exists public.user_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  xp integer not null default 0,
  streak_current integer not null default 0,
  streak_best integer not null default 0,
  last_active_date date,
  freezes integer not null default 0 check (freezes between 0 and 2),
  freezes_used integer not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  source text not null,
  ref text not null,
  amount integer not null check (amount between 0 and 500),
  created_at timestamptz not null default now(),
  unique (user_id, source, ref)
);
create index if not exists xp_events_user_time_idx on public.xp_events (user_id, created_at);
create index if not exists xp_events_time_idx on public.xp_events (created_at);
alter table public.user_stats enable row level security;
alter table public.xp_events enable row level security;
drop policy if exists "own stats" on public.user_stats;
create policy "own stats" on public.user_stats for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "own xp" on public.xp_events;
create policy "own xp" on public.xp_events for select to authenticated using (user_id = (select auth.uid()));

-- achievements are server-awarded only: replace the old "own rows" (all commands) policy with read-only
drop policy if exists "own rows" on public.user_achievements;
drop policy if exists "own achievements" on public.user_achievements;
create policy "own achievements" on public.user_achievements for select to authenticated using (user_id = (select auth.uid()));

create or replace function private.local_day(p_user uuid) returns date
language sql stable security definer set search_path = '' as $$
  select (pg_catalog.now() at time zone coalesce((select tz from public.profiles where id = p_user), 'UTC'))::date;
$$;

create or replace function private.daily_cap(p_source text) returns integer
language sql immutable set search_path = '' as $$
  select case p_source
    when 'puzzle' then 100 when 'solve' then 50 when 'quiz' then 60 when 'engine' then 60
    when 'online' then 200 when 'drill' then 90 when 'post' then 15 when 'comment' then 10
    when 'battle' then 60 when 'friend' then 25 else 1000 end;
$$;

create or replace function private.check_achievements(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  ids text[] := '{}';
  s public.user_stats;
begin
  if p_user is null then return; end if;
  select * into s from public.user_stats where user_id = p_user;
  if (select count(*) from public.lesson_progress where user_id = p_user) >= 1 then ids := array_append(ids, 'first-lesson'::text); end if;
  if (select count(*) from public.lesson_progress where user_id = p_user) >= 10 then ids := array_append(ids, 'scholar'::text); end if;
  if (select count(*) from public.lesson_progress where user_id = p_user and lesson_id in ('chess:rules-and-pieces', 'chess:special-moves', 'chess:checkmate-basics', 'chess:opening-principles')) = 4 then ids := array_append(ids, 'chess-foundations'::text); end if;
  if exists (select 1 from public.solves where user_id = p_user) then ids := array_append(ids, 'first-solve'::text); end if;
  if exists (select 1 from public.solves where user_id = p_user and penalty is distinct from 'DNF' and time_ms + case when penalty = '+2' then 2000 else 0 end < 60000) then ids := array_append(ids, 'sub-60'::text); end if;
  if exists (select 1 from public.solves where user_id = p_user and penalty is distinct from 'DNF' and time_ms + case when penalty = '+2' then 2000 else 0 end < 30000) then ids := array_append(ids, 'sub-30'::text); end if;
  if (select count(*) from public.solves where user_id = p_user) >= 5 then ids := array_append(ids, 'ao5'::text); end if;
  if (select count(*) from public.solves where user_id = p_user) >= 100 then ids := array_append(ids, 'century'::text); end if;
  if (select count(*) from public.puzzle_attempts where user_id = p_user and solved) >= 10 then ids := array_append(ids, 'tactician'::text); end if;
  if exists (select 1 from public.puzzle_attempts where user_id = p_user and solved and rating >= 1800) then ids := array_append(ids, 'sharp-eye'::text); end if;
  if exists (select 1 from public.quiz_results where user_id = p_user and score = total) then ids := array_append(ids, 'quiz-ace'::text); end if;
  if exists (select 1 from public.engine_games where user_id = p_user and level >= 5 and result <> 'loss') then ids := array_append(ids, 'engine-draw'::text); end if;
  if (select scans from public.profiles where id = p_user) >= 1 then ids := array_append(ids, 'scanner'::text); end if;
  if exists (select 1 from public.games where status = 'finished' and p_user in (white, black)) then ids := array_append(ids, 'online-first'::text); end if;
  if exists (select 1 from public.games where status = 'finished' and ((white = p_user and result = '1-0') or (black = p_user and result = '0-1'))) then ids := array_append(ids, 'online-win'::text); end if;
  if exists (select 1 from public.friendships where status = 'accepted' and p_user in (requester, addressee)) then ids := array_append(ids, 'first-friend'::text); end if;
  if exists (select 1 from public.posts where user_id = p_user and not hidden) then ids := array_append(ids, 'forum-first'::text); end if;
  if (select count(distinct line_id) from public.kit_drills where user_id = p_user and correct) >= 10 then ids := array_append(ids, 'drill-10'::text); end if;
  if exists (select 1 from public.battle_results where user_id = p_user) then ids := array_append(ids, 'battle-first'::text); end if;
  if exists (select 1 from public.challenge_participants where user_id = p_user and completed_at is not null) then ids := array_append(ids, 'challenge-done'::text); end if;
  if exists (select 1 from public.daily_entries where user_id = p_user and solved) then ids := array_append(ids, 'daily-first'::text); end if;
  if coalesce(s.streak_best, 0) >= 7 then ids := array_append(ids, 'streak-7'::text); end if;
  if coalesce(s.streak_best, 0) >= 30 then ids := array_append(ids, 'streak-30'::text); end if;
  if coalesce(s.xp, 0) >= 1000 then ids := array_append(ids, 'level-5'::text); end if;
  insert into public.user_achievements (user_id, achievement_id)
    select p_user, x from unnest(ids) x
    on conflict (user_id, achievement_id) do nothing;
end $$;

-- Award XP for a real event. Idempotent per (user, source, ref); daily caps per source;
-- updates the streak (a missed day is covered by a freeze if one is available) and re-checks achievements.
create or replace function private.award_xp(p_user uuid, p_source text, p_ref text, p_amount integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  today date := private.local_day(p_user);
  earned_today integer;
  amt integer := greatest(0, least(p_amount, 500));
  s public.user_stats;
  inserted integer;
begin
  if p_user is null then return 0; end if;
  select coalesce(sum(amount), 0) into earned_today from public.xp_events
    where user_id = p_user and source = p_source and created_at >= pg_catalog.now() - interval '24 hours';
  amt := greatest(0, least(amt, private.daily_cap(p_source) - earned_today));
  insert into public.xp_events (user_id, source, ref, amount) values (p_user, p_source, p_ref, amt)
    on conflict (user_id, source, ref) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return 0; end if;
  insert into public.user_stats (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into s from public.user_stats where user_id = p_user for update;
  if s.last_active_date is distinct from today then
    if s.last_active_date = today - 1 then
      s.streak_current := s.streak_current + 1;
    elsif s.last_active_date = today - 2 and s.freezes > 0 then
      s.freezes := s.freezes - 1; s.freezes_used := s.freezes_used + 1; s.streak_current := s.streak_current + 1;
    else
      s.streak_current := 1;
    end if;
    if s.streak_current % 7 = 0 then s.freezes := least(2, s.freezes + 1); end if;
  end if;
  update public.user_stats set
    xp = xp + amt,
    streak_current = s.streak_current,
    streak_best = greatest(streak_best, s.streak_current),
    last_active_date = today,
    freezes = s.freezes, freezes_used = s.freezes_used, updated_at = pg_catalog.now()
  where user_id = p_user;
  perform private.check_achievements(p_user);
  return amt;
end $$;

-- ───────────── friends ─────────────
create table if not exists public.friendships (
  id bigint generated always as identity primary key,
  requester uuid not null references public.profiles (id) on delete cascade,
  addressee uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester <> addressee)
);
create unique index if not exists friendships_pair_idx on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index if not exists friendships_addressee_idx on public.friendships (addressee);
create index if not exists friendships_requester_idx on public.friendships (requester);
alter table public.friendships enable row level security;
drop policy if exists "see own friendships" on public.friendships;
create policy "see own friendships" on public.friendships for select to authenticated
  using (requester = (select auth.uid()) or (addressee = (select auth.uid()) and status <> 'blocked'));

create or replace function private.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.friendships where status = 'accepted'
    and ((requester = a and addressee = b) or (requester = b and addressee = a)));
$$;
create or replace function private.is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.friendships where status = 'blocked'
    and ((requester = a and addressee = b) or (requester = b and addressee = a)));
$$;

create or replace function public.send_friend_request(target uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); f public.friendships;
begin
  if me is null then raise exception 'Please sign in first.'; end if;
  if target = me then raise exception 'You cannot add yourself.'; end if;
  if not exists (select 1 from public.profiles where id = target) then raise exception 'User not found.'; end if;
  if private.is_blocked(me, target) then raise exception 'You cannot send a request to this user.'; end if;
  select * into f from public.friendships where least(requester, addressee) = least(me, target) and greatest(requester, addressee) = greatest(me, target);
  if found then
    if f.status = 'accepted' then return 'already_friends'; end if;
    if f.requester = me then return 'already_sent'; end if;
    update public.friendships set status = 'accepted', responded_at = now() where id = f.id;
    perform private.award_xp(me, 'friend', target::text, 5);
    perform private.award_xp(target, 'friend', me::text, 5);
    return 'accepted';
  end if;
  if not (select allow_friend_requests from public.profiles where id = target) then raise exception 'This user is not accepting friend requests.'; end if;
  if (select count(*) from public.friendships where requester = me and status = 'pending' and created_at > now() - interval '1 day') >= 50 then
    raise exception 'Too many friend requests today. Please try again tomorrow.';
  end if;
  insert into public.friendships (requester, addressee, status) values (me, target, 'pending');
  return 'sent';
end $$;

create or replace function public.respond_friend_request(other uuid, accept boolean) returns text
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if accept then
    update public.friendships set status = 'accepted', responded_at = now()
      where requester = other and addressee = me and status = 'pending';
    if not found then raise exception 'No pending request from this user.'; end if;
    perform private.award_xp(me, 'friend', other::text, 5);
    perform private.award_xp(other, 'friend', me::text, 5);
    return 'accepted';
  end if;
  delete from public.friendships where requester = other and addressee = me and status = 'pending';
  return 'declined';
end $$;

create or replace function public.remove_friend(other uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.friendships
  where status in ('accepted', 'pending')
    and ((requester = auth.uid() and addressee = other) or (requester = other and addressee = auth.uid()));
$$;

create or replace function public.block_user(other uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null or other = me then raise exception 'Not allowed.'; end if;
  if exists (select 1 from public.friendships where requester = other and addressee = me and status = 'blocked') then return; end if;
  delete from public.friendships where least(requester, addressee) = least(me, other) and greatest(requester, addressee) = greatest(me, other);
  insert into public.friendships (requester, addressee, status) values (me, other, 'blocked');
end $$;

create or replace function public.unblock_user(other uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.friendships where requester = auth.uid() and addressee = other and status = 'blocked';
$$;

create or replace function private.relation(me uuid, other uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select case when f.status = 'accepted' then 'friend'
                               when f.status = 'blocked' and f.requester = me then 'blocked'
                               when f.status = 'blocked' then 'none'
                               when f.requester = me then 'sent' else 'received' end
                   from public.friendships f
                   where least(f.requester, f.addressee) = least(me, other) and greatest(f.requester, f.addressee) = greatest(me, other)), 'none');
$$;

create or replace function public.search_users(q text) returns table (id uuid, display_name text, username text, relation text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.display_name, p.username, private.relation(auth.uid(), p.id)
  from public.profiles p
  where auth.uid() is not null and p.id <> auth.uid() and char_length(trim(q)) >= 2
    and (p.display_name ilike '%' || replace(replace(trim(q), '%', ''), '_', '\_') || '%' or p.username ilike '%' || replace(replace(trim(q), '%', ''), '_', '\_') || '%')
    and not exists (select 1 from public.friendships f where f.status = 'blocked' and f.requester = p.id and f.addressee = auth.uid())
    and p.profile_visibility <> 'private'
  order by p.display_name limit 20;
$$;

create or replace function public.list_friends() returns table (id uuid, display_name text, username text, relation text, last_seen timestamptz, show_online boolean)
language sql stable security definer set search_path = '' as $$
  select p.id, p.display_name, p.username, private.relation(auth.uid(), p.id),
    case when p.show_online and f.status = 'accepted' then p.last_seen end, p.show_online
  from public.friendships f
  join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where auth.uid() in (f.requester, f.addressee) and not (f.status = 'blocked' and f.addressee = auth.uid())
  order by p.display_name;
$$;

create or replace function public.heartbeat() returns void
language sql security definer set search_path = '' as $$
  update public.profiles set last_seen = now() where id = auth.uid();
$$;

-- ───────────── live chess ─────────────
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  white uuid references public.profiles (id) on delete set null,
  black uuid references public.profiles (id) on delete set null,
  invited uuid references public.profiles (id) on delete set null,
  is_seek boolean not null default false,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished', 'aborted')),
  base_ms integer not null check (base_ms between 60000 and 10800000),
  inc_ms integer not null default 0 check (inc_ms between 0 and 180000),
  white_ms integer not null,
  black_ms integer not null,
  fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  moves text[] not null default '{}',
  sans text[] not null default '{}',
  ply integer not null default 0,
  last_move_at timestamptz,
  draw_offer uuid,
  result text check (result in ('1-0', '0-1', '1/2-1/2')),
  end_reason text check (end_reason in ('checkmate', 'resign', 'timeout', 'stalemate', 'draw_agreed', 'repetition', 'insufficient', 'fifty_move', 'aborted', 'timeout_vs_insufficient')),
  rematch_of uuid references public.games (id) on delete set null,
  rematch_game uuid references public.games (id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);
create index if not exists games_status_idx on public.games (status, visibility, created_at desc);
create index if not exists games_white_idx on public.games (white, created_at desc);
create index if not exists games_black_idx on public.games (black, created_at desc);
create index if not exists games_invited_idx on public.games (invited);
create index if not exists games_created_by_idx on public.games (created_by);
create index if not exists games_rematch_of_idx on public.games (rematch_of);
create index if not exists games_rematch_game_idx on public.games (rematch_game);
alter table public.games enable row level security;
drop policy if exists "read public or own games" on public.games;
create policy "read public or own games" on public.games for select
  using (visibility = 'public' or (select auth.uid()) in (white, black, created_by, invited));
-- no insert/update/delete policies: every change goes through the functions below

create or replace function public.server_now() returns timestamptz language sql stable set search_path = '' as $$ select pg_catalog.now() $$;

create or replace function private.can_challenge(me uuid, target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select not private.is_blocked(me, target) and coalesce(case (select allow_challenges from public.profiles where id = target)
    when 'everyone' then true when 'friends' then private.are_friends(me, target) else false end, false);
$$;

create or replace function public.create_game(p_base_ms integer, p_inc_ms integer, p_color text default 'random', p_visibility text default 'public', p_invite uuid default null, p_seek boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); gid uuid; col text := p_color;
begin
  if me is null then raise exception 'Please sign in to play online.'; end if;
  if p_invite = me then raise exception 'You cannot challenge yourself.'; end if;
  if p_invite is not null and not private.can_challenge(me, p_invite) then raise exception 'This player is not accepting challenges from you.'; end if;
  if (select count(*) from public.games where created_by = me and status = 'waiting') >= 5 then raise exception 'You already have 5 open games. Cancel one first.'; end if;
  if col is null or col not in ('white', 'black') then col := case when random() < 0.5 then 'white' else 'black' end; end if;
  insert into public.games (created_by, white, black, invited, is_seek, visibility, base_ms, inc_ms, white_ms, black_ms)
  values (me, case when col = 'white' then me end, case when col = 'black' then me end, p_invite, coalesce(p_seek, false),
          case when p_visibility = 'private' then 'private' else 'public' end, p_base_ms, p_inc_ms, p_base_ms, p_base_ms)
  returning id into gid;
  return gid;
end $$;

create or replace function public.join_game(p_game uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); g public.games;
begin
  if me is null then raise exception 'Please sign in to play online.'; end if;
  select * into g from public.games where id = p_game for update;
  if not found then raise exception 'Game not found.'; end if;
  if me in (g.white, g.black) then return g.id; end if;
  if g.status <> 'waiting' then raise exception 'This game has already started or ended.'; end if;
  if g.invited is not null and g.invited <> me then raise exception 'This game is reserved for another player.'; end if;
  if private.is_blocked(me, g.created_by) then raise exception 'You cannot join this game.'; end if;
  update public.games set
    white = coalesce(white, me), black = coalesce(black, me), status = 'active',
    started_at = now(), last_move_at = now(), is_seek = false
  where id = g.id;
  return g.id;
end $$;

create or replace function public.quick_match(p_base_ms integer, p_inc_ms integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); gid uuid;
begin
  if me is null then raise exception 'Please sign in to play online.'; end if;
  select id into gid from public.games
    where status = 'waiting' and is_seek and invited is null and visibility = 'public'
      and base_ms = p_base_ms and inc_ms = p_inc_ms and created_by <> me
      and not private.is_blocked(me, created_by)
    order by created_at limit 1 for update skip locked;
  if gid is not null then return public.join_game(gid); end if;
  select id into gid from public.games where status = 'waiting' and is_seek and created_by = me and base_ms = p_base_ms and inc_ms = p_inc_ms limit 1;
  if gid is not null then return gid; end if;
  return public.create_game(p_base_ms, p_inc_ms, 'random', 'public', null, true);
end $$;

create or replace function public.cancel_game(p_game uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.games set status = 'aborted', end_reason = 'aborted', ended_at = now()
    where id = p_game and status = 'waiting' and (created_by = auth.uid() or invited = auth.uid());
  if not found then raise exception 'Only an open game you created or were invited to can be cancelled.'; end if;
end $$;

create or replace function public.game_preview(p_game uuid) returns table (id uuid, status text, base_ms integer, inc_ms integer, white_name text, black_name text, created_by uuid, creator_name text, invited uuid, visibility text)
language sql stable security definer set search_path = '' as $$
  select g.id, g.status, g.base_ms, g.inc_ms,
    (select display_name from public.profiles where id = g.white), (select display_name from public.profiles where id = g.black),
    g.created_by, (select display_name from public.profiles where id = g.created_by), g.invited, g.visibility
  from public.games g where g.id = p_game;
$$;

create or replace function private.bare_king(p_fen text, p_color text) returns boolean
language sql immutable set search_path = '' as $$
  select case when p_color = 'w' then split_part(p_fen, ' ', 1) !~ '[QRBNP]' else split_part(p_fen, ' ', 1) !~ '[qrbnp]' end;
$$;

create or replace function private.finish_game(p_game uuid, p_result text, p_reason text) returns void
language sql security definer set search_path = '' as $$
  update public.games set status = case when p_reason = 'aborted' then 'aborted' else 'finished' end,
    result = case when p_reason = 'aborted' then null else p_result end, end_reason = p_reason, ended_at = now(), draw_offer = null
  where id = p_game and status = 'active';
$$;

-- Ends the game if the side to move has run out of time (or nobody moved within 60 s). Returns true if it ended.
create or replace function private.flag_if_needed(p_game uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare g public.games; side text; left_ms double precision;
begin
  select * into g from public.games where id = p_game for update;
  if not found or g.status <> 'active' then return false; end if;
  if g.ply < 2 then
    if now() - g.last_move_at > interval '60 seconds' then perform private.finish_game(g.id, null, 'aborted'); return true; end if;
    return false;
  end if;
  side := case when g.ply % 2 = 0 then 'w' else 'b' end;
  left_ms := (case when side = 'w' then g.white_ms else g.black_ms end) - extract(epoch from (now() - g.last_move_at)) * 1000;
  if left_ms > 0 then return false; end if;
  update public.games set white_ms = case when side = 'w' then 0 else white_ms end, black_ms = case when side = 'b' then 0 else black_ms end where id = g.id;
  if private.bare_king(g.fen, case when side = 'w' then 'b' else 'w' end) then
    perform private.finish_game(g.id, '1/2-1/2', 'timeout_vs_insufficient');
  else
    perform private.finish_game(g.id, case when side = 'w' then '0-1' else '1-0' end, 'timeout');
  end if;
  return true;
end $$;

create or replace function public.claim_timeout(p_game uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.games where id = p_game and auth.uid() in (white, black)) then raise exception 'Only players can claim a timeout.'; end if;
  return private.flag_if_needed(p_game);
end $$;

create or replace function public.resign_game(p_game uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare g public.games;
begin
  select * into g from public.games where id = p_game for update;
  if not found or auth.uid() not in (g.white, g.black) then raise exception 'You are not playing in this game.'; end if;
  if g.status <> 'active' then raise exception 'The game is not in progress.'; end if;
  if private.flag_if_needed(p_game) then return; end if;
  if g.ply < 2 then perform private.finish_game(p_game, null, 'aborted'); return; end if;
  perform private.finish_game(p_game, case when auth.uid() = g.white then '0-1' else '1-0' end, 'resign');
end $$;

create or replace function public.offer_draw(p_game uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare g public.games; me uuid := auth.uid();
begin
  select * into g from public.games where id = p_game for update;
  if not found or me not in (g.white, g.black) then raise exception 'You are not playing in this game.'; end if;
  if g.status <> 'active' then raise exception 'The game is not in progress.'; end if;
  if private.flag_if_needed(p_game) then return 'ended'; end if;
  if g.draw_offer is not null and g.draw_offer <> me then perform private.finish_game(p_game, '1/2-1/2', 'draw_agreed'); return 'drawn'; end if;
  update public.games set draw_offer = me where id = p_game;
  return 'offered';
end $$;

create or replace function public.respond_draw(p_game uuid, p_accept boolean) returns text
language plpgsql security definer set search_path = '' as $$
declare g public.games; me uuid := auth.uid();
begin
  select * into g from public.games where id = p_game for update;
  if not found or me not in (g.white, g.black) or g.status <> 'active' then raise exception 'No game in progress.'; end if;
  if g.draw_offer is null or g.draw_offer = me then raise exception 'There is no draw offer to answer.'; end if;
  if p_accept then perform private.finish_game(p_game, '1/2-1/2', 'draw_agreed'); return 'drawn'; end if;
  update public.games set draw_offer = null where id = p_game;
  return 'declined';
end $$;

create or replace function public.request_rematch(p_game uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare g public.games; me uuid := auth.uid(); opp uuid; r public.games; nid uuid;
begin
  select * into g from public.games where id = p_game for update;
  if not found or me not in (g.white, g.black) then raise exception 'You did not play in this game.'; end if;
  if g.status not in ('finished', 'aborted') then raise exception 'The game is still in progress.'; end if;
  opp := case when me = g.white then g.black else g.white end;
  if g.rematch_game is not null then
    select * into r from public.games where id = g.rematch_game;
    if r.status = 'waiting' and r.invited = me then return public.join_game(r.id); end if;
    return r.id;
  end if;
  insert into public.games (created_by, white, black, invited, visibility, base_ms, inc_ms, white_ms, black_ms, rematch_of)
  values (me, case when me = g.black then me end, case when me = g.white then me end, opp, g.visibility, g.base_ms, g.inc_ms, g.base_ms, g.base_ms, g.id)
  returning id into nid;
  update public.games set rematch_game = nid where id = g.id;
  return nid;
end $$;

-- Called only by the chess-game Edge Function (service_role) after chess.js validated the move.
create or replace function public.server_apply_move(p_game uuid, p_user uuid, p_ply integer, p_uci text, p_san text, p_fen text, p_result text, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare g public.games; side text; left_ms double precision; nw integer; nb integer;
begin
  select * into g from public.games where id = p_game for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Game not found.'); end if;
  if g.status <> 'active' then return jsonb_build_object('ok', false, 'error', 'The game is not in progress.'); end if;
  side := case when g.ply % 2 = 0 then 'w' else 'b' end;
  if p_user is distinct from (case when side = 'w' then g.white else g.black end) then return jsonb_build_object('ok', false, 'error', 'It is not your turn.'); end if;
  if p_ply <> g.ply then return jsonb_build_object('ok', false, 'error', 'The position changed. Please try again.'); end if;
  nw := g.white_ms; nb := g.black_ms;
  if g.ply >= 2 then
    left_ms := (case when side = 'w' then g.white_ms else g.black_ms end) - extract(epoch from (now() - g.last_move_at)) * 1000;
    if left_ms <= 0 then
      perform private.flag_if_needed(p_game);
      return jsonb_build_object('ok', false, 'error', 'Your time ran out.', 'ended', true);
    end if;
    if side = 'w' then nw := floor(left_ms)::integer + g.inc_ms; else nb := floor(left_ms)::integer + g.inc_ms; end if;
  end if;
  update public.games set moves = moves || p_uci, sans = sans || p_san, fen = p_fen, ply = ply + 1,
    white_ms = nw, black_ms = nb, last_move_at = now(),
    draw_offer = case when draw_offer = p_user then draw_offer else null end
  where id = p_game;
  if p_reason is not null then perform private.finish_game(p_game, p_result, p_reason); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function private.on_game_finished() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'finished' and old.status = 'active' then
    perform private.award_xp(new.white, 'online', new.id::text, 10 + case when new.result = '1-0' then 10 when new.result = '1/2-1/2' then 5 else 0 end);
    perform private.award_xp(new.black, 'online', new.id::text, 10 + case when new.result = '0-1' then 10 when new.result = '1/2-1/2' then 5 else 0 end);
  end if;
  return new;
end $$;
drop trigger if exists games_finished on public.games;
create trigger games_finished after update of status on public.games for each row execute function private.on_game_finished();

-- ───────────── XP for existing learning activity ─────────────
-- These rows are written by the signed-in user (they are self-reported practice), so each source
-- has a small daily XP cap and per-item de-duplication.
create or replace function private.on_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  case tg_table_name
    when 'lesson_progress' then perform private.award_xp(new.user_id, 'lesson', new.lesson_id, 20);
    when 'solves' then perform private.award_xp(new.user_id, 'solve', new.id::text, 1);
    when 'puzzle_attempts' then if new.solved then perform private.award_xp(new.user_id, 'puzzle', new.puzzle_id, 5); end if;
    when 'quiz_results' then perform private.award_xp(new.user_id, 'quiz', new.quiz_id || ':' || private.local_day(new.user_id), least(new.score * 2, 30));
    when 'engine_games' then perform private.award_xp(new.user_id, 'engine', new.id::text, case new.result when 'win' then 10 when 'draw' then 5 else 2 end);
    else null;
  end case;
  perform private.check_achievements(new.user_id);
  return new;
end $$;
do $$
declare t text;
begin
  foreach t in array array['lesson_progress', 'solves', 'puzzle_attempts', 'quiz_results', 'engine_games'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_xp', t);
    execute format('create trigger %I after insert on public.%I for each row execute function private.on_activity()', t || '_xp', t);
  end loop;
end $$;

create or replace function private.on_profile_scans() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.scans is distinct from old.scans then perform private.check_achievements(new.id); end if;
  return new;
end $$;
drop trigger if exists profiles_scans_achievements on public.profiles;
create trigger profiles_scans_achievements after update of scans on public.profiles for each row execute function private.on_profile_scans();

-- ───────────── forum upgrades ─────────────
alter table public.posts drop constraint if exists posts_category_check;
alter table public.posts add constraint posts_category_check check (category in ('chess', 'cube', 'help', 'showcase', 'clubs', 'general'));
alter table public.posts add column if not exists pinned boolean not null default false;
alter table public.posts add column if not exists locked boolean not null default false;
alter table public.posts add column if not exists updated_at timestamptz;
create index if not exists posts_category_idx on public.posts (category, created_at desc);
create index if not exists comments_post_idx on public.comments (post_id, created_at);
create index if not exists posts_search_idx on public.posts using gin (to_tsvector('simple', title || ' ' || body));

create or replace function private.protect_post_fields() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not private.is_staff() then
    if new.pinned is distinct from old.pinned or new.locked is distinct from old.locked then raise exception 'Only moderators can pin or lock threads.'; end if;
    if old.locked then raise exception 'This thread is locked.'; end if;
  end if;
  if new.title is distinct from old.title or new.body is distinct from old.body then new.updated_at := now(); end if;
  return new;
end $$;
drop trigger if exists posts_protect_fields on public.posts;
create trigger posts_protect_fields before update on public.posts for each row execute function private.protect_post_fields();

create or replace function private.post_open(p_post uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.posts where id = p_post and not locked and not hidden);
$$;
drop policy if exists "create own comments" on public.comments;
create policy "create own comments" on public.comments for insert to authenticated
  with check (user_id = (select auth.uid()) and hidden = false and ((select private.post_open(post_id)) or (select private.is_staff())));

create or replace function private.on_forum_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'posts' then
    if (select count(*) from public.posts where user_id = new.user_id and created_at > now() - interval '1 hour') > 10 then raise exception 'You are posting too fast. Please wait a little.'; end if;
    perform private.award_xp(new.user_id, 'post', new.id::text, 5);
  else
    if (select count(*) from public.comments where user_id = new.user_id and created_at > now() - interval '10 minutes') > 20 then raise exception 'You are replying too fast. Please wait a little.'; end if;
    perform private.award_xp(new.user_id, 'comment', new.id::text, 2);
  end if;
  return new;
end $$;
drop trigger if exists posts_xp on public.posts;
create trigger posts_xp after insert on public.posts for each row execute function private.on_forum_insert();
drop trigger if exists comments_xp on public.comments;
create trigger comments_xp after insert on public.comments for each row execute function private.on_forum_insert();

create table if not exists public.post_votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists post_votes_user_idx on public.post_votes (user_id);
alter table public.post_votes enable row level security;
drop policy if exists "read votes" on public.post_votes;
create policy "read votes" on public.post_votes for select using (true);
drop policy if exists "vote as self" on public.post_votes;
create policy "vote as self" on public.post_votes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "unvote as self" on public.post_votes;
create policy "unvote as self" on public.post_votes for delete to authenticated using (user_id = (select auth.uid()));

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'user', 'game', 'battle_result')),
  target_id text not null check (char_length(target_id) <= 80),
  reason text not null check (reason in ('spam', 'abuse', 'cheating', 'impossible_time', 'off_topic', 'other')),
  details text check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_by uuid references public.profiles (id) on delete set null,
  unique (reporter, target_type, target_id)
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists reports_resolved_by_idx on public.reports (resolved_by);
alter table public.reports enable row level security;
drop policy if exists "file reports" on public.reports;
create policy "file reports" on public.reports for insert to authenticated with check (reporter = (select auth.uid()) and status = 'open');
drop policy if exists "see own or moderate reports" on public.reports;
create policy "see own or moderate reports" on public.reports for select to authenticated using (reporter = (select auth.uid()) or (select private.is_staff()));
drop policy if exists "moderate reports" on public.reports;
create policy "moderate reports" on public.reports for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create or replace function public.forum_threads(p_category text default null, p_q text default null, p_sort text default 'active', p_limit integer default 30, p_offset integer default 0)
returns table (id uuid, user_id uuid, author text, category text, title text, body text, pinned boolean, locked boolean, hidden boolean, created_at timestamptz, updated_at timestamptz, votes bigint, replies bigint, last_activity timestamptz, voted boolean)
language sql stable security definer set search_path = '' as $$
  with t as (
    select p.*, coalesce(pr.display_name, pr.username, 'Member') as author,
      (select count(*) from public.post_votes v where v.post_id = p.id) as votes,
      (select count(*) from public.comments c where c.post_id = p.id and not c.hidden) as replies,
      greatest(p.created_at, coalesce((select max(c.created_at) from public.comments c where c.post_id = p.id and not c.hidden), p.created_at)) as last_activity,
      exists (select 1 from public.post_votes v where v.post_id = p.id and v.user_id = auth.uid()) as voted
    from public.posts p join public.profiles pr on pr.id = p.user_id
    where (not p.hidden or p.user_id = auth.uid() or private.is_staff())
      and (p_category is null or p.category = p_category)
      and (p_q is null or char_length(trim(p_q)) < 2 or to_tsvector('simple', p.title || ' ' || p.body) @@ plainto_tsquery('simple', p_q) or p.title ilike '%' || replace(trim(p_q), '%', '') || '%')
  )
  select id, user_id, author, category, title, left(body, 400), pinned, locked, hidden, created_at, updated_at, votes, replies, last_activity, voted
  from t
  order by pinned desc,
    case when p_sort = 'top' then votes end desc nulls last,
    case when p_sort = 'new' then created_at end desc nulls last,
    last_activity desc
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
$$;

-- ───────────── opening-kit drills (spaced repetition) ─────────────
create table if not exists public.kit_drills (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kit text not null check (kit ~ '^[a-z0-9-]{2,40}$'),
  line_id text not null check (char_length(line_id) <= 60),
  correct boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists kit_drills_user_idx on public.kit_drills (user_id, kit, created_at);
alter table public.kit_drills enable row level security;
drop policy if exists "own drills read" on public.kit_drills;
create policy "own drills read" on public.kit_drills for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "own drills insert" on public.kit_drills;
create policy "own drills insert" on public.kit_drills for insert to authenticated with check (user_id = (select auth.uid()));

create table if not exists public.kit_reviews (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kit text not null check (kit ~ '^[a-z0-9-]{2,40}$'),
  line_id text not null check (char_length(line_id) <= 60),
  box integer not null default 0 check (box between 0 and 6),
  due_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, line_id)
);
alter table public.kit_reviews enable row level security;
drop policy if exists "own reviews" on public.kit_reviews;
create policy "own reviews" on public.kit_reviews for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function private.on_drill() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.correct then perform private.award_xp(new.user_id, 'drill', new.line_id || ':' || private.local_day(new.user_id), 3); end if;
  perform private.check_achievements(new.user_id);
  return new;
end $$;
drop trigger if exists kit_drills_xp on public.kit_drills;
create trigger kit_drills_xp after insert on public.kit_drills for each row execute function private.on_drill();

-- ───────────── daily puzzle / daily scramble ─────────────
create table if not exists public.daily_entries (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('puzzle', 'scramble')),
  solved boolean not null,
  time_ms integer check (time_ms is null or time_ms between 1000 and 3600000),
  created_at timestamptz not null default now(),
  primary key (user_id, day, kind)
);
create index if not exists daily_entries_day_idx on public.daily_entries (day, kind);
alter table public.daily_entries enable row level security;
drop policy if exists "own daily" on public.daily_entries;
create policy "own daily" on public.daily_entries for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.submit_daily(p_kind text, p_solved boolean, p_time_ms integer default null) returns boolean
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); d date := (now() at time zone 'UTC')::date; n integer;
begin
  if me is null then raise exception 'Please sign in to save your daily result.'; end if;
  if p_kind not in ('puzzle', 'scramble') then raise exception 'Unknown daily activity.'; end if;
  if p_kind = 'scramble' and p_solved and (p_time_ms is null or p_time_ms < 2500) then raise exception 'That time is too fast to record.'; end if;
  insert into public.daily_entries (user_id, day, kind, solved, time_ms) values (me, d, p_kind, p_solved, p_time_ms)
    on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then return false; end if;
  if p_solved then perform private.award_xp(me, 'daily', p_kind || ':' || d, 15); end if;
  perform private.check_achievements(me);
  return true;
end $$;

create or replace function public.daily_board(p_kind text, p_day date default null)
returns table (display_name text, solved boolean, time_ms integer, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select coalesce(p.display_name, p.username, 'Member'), e.solved, e.time_ms, e.created_at
  from public.daily_entries e join public.profiles p on p.id = e.user_id
  where e.kind = p_kind and e.day = coalesce(p_day, (now() at time zone 'UTC')::date) and p.show_on_leaderboard
  order by e.solved desc, e.time_ms asc nulls last, e.created_at asc limit 50;
$$;

-- ───────────── custom challenges ─────────────
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text check (char_length(description) <= 500),
  kind text not null check (kind in ('puzzles', 'cube_ao5', 'lessons', 'kit', 'solves', 'online_wins')),
  params jsonb not null default '{}'::jsonb,
  target integer not null check (target between 1 and 500),
  visibility text not null default 'public' check (visibility in ('public', 'link')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at and ends_at <= starts_at + interval '90 days')
);
create index if not exists challenges_created_by_idx on public.challenges (created_by);
create index if not exists challenges_public_idx on public.challenges (visibility, ends_at desc);
create table if not exists public.challenge_participants (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  progress integer not null default 0,
  best_ms integer,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
create index if not exists challenge_participants_user_idx on public.challenge_participants (user_id);
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
drop policy if exists "read challenges" on public.challenges;
create policy "read challenges" on public.challenges for select using (true);
drop policy if exists "read participants" on public.challenge_participants;
create policy "read participants" on public.challenge_participants for select using (true);
-- challenges are created via create_challenge(); "link" visibility only hides them from the public list.

create or replace function public.create_challenge(p_title text, p_description text, p_kind text, p_params jsonb, p_target integer, p_days integer, p_visibility text default 'public')
returns uuid language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); cid uuid;
begin
  if me is null then raise exception 'Please sign in to create a challenge.'; end if;
  if (select count(*) from public.challenges where created_by = me and created_at > now() - interval '1 day') >= 10 then raise exception 'You can create up to 10 challenges per day.'; end if;
  if p_days not between 1 and 90 then raise exception 'A challenge can last 1 to 90 days.'; end if;
  if p_kind = 'cube_ao5' and coalesce((p_params ->> 'target_ms')::integer, 0) not between 5000 and 600000 then raise exception 'Set a target average between 5 seconds and 10 minutes.'; end if;
  if p_kind in ('puzzles', 'lessons') and jsonb_array_length(coalesce(p_params -> 'items', '[]'::jsonb)) = 0 then raise exception 'Pick at least one item.'; end if;
  if p_kind = 'kit' and coalesce(p_params ->> 'kit', '') !~ '^[a-z0-9-]{2,40}$' then raise exception 'Pick an opening kit.'; end if;
  insert into public.challenges (created_by, title, description, kind, params, target, visibility, ends_at)
  values (me, trim(p_title), nullif(trim(coalesce(p_description, '')), ''), p_kind, coalesce(p_params, '{}'::jsonb),
          case when p_kind = 'cube_ao5' then 1 when p_kind in ('puzzles', 'lessons') then least(p_target, jsonb_array_length(p_params -> 'items')) else p_target end,
          case when p_visibility = 'link' then 'link' else 'public' end, now() + make_interval(days => p_days))
  returning id into cid;
  insert into public.challenge_participants (challenge_id, user_id) values (cid, me);
  return cid;
end $$;

create or replace function private.best_ao5(p_user uuid, p_since timestamptz, p_until timestamptz) returns integer
language plpgsql stable security definer set search_path = '' as $$
declare t integer[] := '{}'; r record; best integer; w integer[]; s integer[];
begin
  for r in select case when penalty = 'DNF' then 2147483647 else time_ms + case when penalty = '+2' then 2000 else 0 end end as v
           from public.solves where user_id = p_user and created_at between p_since and p_until order by created_at loop
    t := t || r.v;
    if array_length(t, 1) >= 5 then
      w := t[array_length(t, 1) - 4 : array_length(t, 1)];
      select array_agg(x order by x) into s from unnest(w) x;
      if s[4] < 2147483647 then
        best := least(coalesce(best, 2147483647), ((s[2] + s[3] + s[4]) / 3));
      end if;
    end if;
  end loop;
  return best;
end $$;

create or replace function private.challenge_progress(c public.challenges, p_user uuid, p_since timestamptz) returns integer
language plpgsql stable security definer set search_path = '' as $$
declare items text[];
begin
  if c.params ? 'items' then select array_agg(x) into items from jsonb_array_elements_text(c.params -> 'items') x; end if;
  return case c.kind
    when 'puzzles' then (select count(distinct puzzle_id) from public.puzzle_attempts where user_id = p_user and solved and puzzle_id = any (items) and created_at between p_since and c.ends_at)
    when 'lessons' then (select count(*) from public.lesson_progress where user_id = p_user and lesson_id = any (items))
    when 'kit' then (select count(distinct line_id) from public.kit_drills where user_id = p_user and correct and kit = c.params ->> 'kit' and created_at between p_since and c.ends_at)
    when 'solves' then (select count(*) from public.solves where user_id = p_user and created_at between p_since and c.ends_at)
    when 'online_wins' then (select count(*) from public.games where status = 'finished' and coalesce(ended_at, now()) between p_since and c.ends_at and ((white = p_user and result = '1-0') or (black = p_user and result = '0-1')))
    when 'cube_ao5' then case when private.best_ao5(p_user, p_since, c.ends_at) <= (c.params ->> 'target_ms')::integer then 1 else 0 end
    else 0 end;
end $$;

create or replace function public.refresh_challenge(p_challenge uuid) returns table (progress integer, best_ms integer, completed boolean)
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); c public.challenges; cp public.challenge_participants; pr integer; b integer;
begin
  select * into c from public.challenges where id = p_challenge;
  select * into cp from public.challenge_participants where challenge_id = p_challenge and user_id = me for update;
  if c.id is null or cp.user_id is null then raise exception 'Join the challenge first.'; end if;
  pr := least(private.challenge_progress(c, me, cp.joined_at), c.target);
  if c.kind = 'cube_ao5' then b := private.best_ao5(me, cp.joined_at, c.ends_at); end if;
  update public.challenge_participants set progress = pr, best_ms = b, updated_at = now(),
    completed_at = case when completed_at is null and pr >= c.target and now() <= c.ends_at then now() else completed_at end
  where challenge_id = p_challenge and user_id = me
  returning * into cp;
  if cp.completed_at is not null then
    perform private.award_xp(me, 'challenge', p_challenge::text, 50);
    perform private.check_achievements(me);
  end if;
  return query select cp.progress, cp.best_ms, cp.completed_at is not null;
end $$;

create or replace function public.join_challenge(p_challenge uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Please sign in to join.'; end if;
  if not exists (select 1 from public.challenges where id = p_challenge and ends_at > now()) then raise exception 'This challenge has ended or does not exist.'; end if;
  insert into public.challenge_participants (challenge_id, user_id) values (p_challenge, auth.uid()) on conflict do nothing;
end $$;

create or replace function public.leave_challenge(p_challenge uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.challenge_participants where challenge_id = p_challenge and user_id = auth.uid() and completed_at is null;
$$;

create or replace function public.challenge_board(p_challenge uuid) returns table (display_name text, progress integer, best_ms integer, completed_at timestamptz, joined_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select coalesce(p.display_name, p.username, 'Member'), cp.progress, cp.best_ms, cp.completed_at, cp.joined_at
  from public.challenge_participants cp join public.profiles p on p.id = cp.user_id
  where cp.challenge_id = p_challenge
  order by (cp.completed_at is null), cp.completed_at, cp.progress desc, cp.best_ms asc nulls last limit 100;
$$;

drop policy if exists "read participants" on public.challenge_participants;
drop policy if exists "read own participation" on public.challenge_participants;
create policy "read own participation" on public.challenge_participants for select to authenticated using (user_id = (select auth.uid()));

-- ───────────── cube battle arena ─────────────
create table if not exists public.battle_rooms (
  id uuid primary key default gen_random_uuid(),
  host uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(name) between 1 and 60),
  status text not null default 'lobby' check (status in ('lobby', 'running', 'finished')),
  rounds integer not null default 5 check (rounds between 1 and 12),
  inspection_s integer not null default 15 check (inspection_s in (0, 8, 15)),
  visibility text not null default 'link' check (visibility in ('public', 'link')),
  current_round integer not null default 0,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists battle_rooms_host_idx on public.battle_rooms (host);
create index if not exists battle_rooms_status_idx on public.battle_rooms (status, visibility, created_at desc);
create table if not exists public.battle_members (
  room_id uuid not null references public.battle_rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index if not exists battle_members_user_idx on public.battle_members (user_id);
create table if not exists public.battle_rounds (
  room_id uuid not null references public.battle_rooms (id) on delete cascade,
  round_no integer not null check (round_no between 1 and 12),
  scramble text not null check (scramble ~ '^([URFDLB](2|''|)( |$)){15,40}$'),
  started_at timestamptz not null default now(),
  primary key (room_id, round_no)
);
create table if not exists public.battle_results (
  room_id uuid not null,
  round_no integer not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  time_ms integer check (time_ms is null or time_ms between 2500 and 600000),
  dnf boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (room_id, round_no, user_id),
  foreign key (room_id, round_no) references public.battle_rounds (room_id, round_no) on delete cascade,
  check (dnf or time_ms is not null)
);
create index if not exists battle_results_user_idx on public.battle_results (user_id);
alter table public.battle_rooms enable row level security;
alter table public.battle_members enable row level security;
alter table public.battle_rounds enable row level security;
alter table public.battle_results enable row level security;

create or replace function private.battle_member(p_room uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.battle_members where room_id = p_room and user_id = auth.uid());
$$;
drop policy if exists "read rooms" on public.battle_rooms;
create policy "read rooms" on public.battle_rooms for select using (visibility = 'public' or (select private.battle_member(id)));
drop policy if exists "read members" on public.battle_members;
create policy "read members" on public.battle_members for select to authenticated using ((select private.battle_member(room_id)));
drop policy if exists "read rounds" on public.battle_rounds;
create policy "read rounds" on public.battle_rounds for select to authenticated using ((select private.battle_member(room_id)));
drop policy if exists "read results" on public.battle_results;
create policy "read results" on public.battle_results for select to authenticated using ((select private.battle_member(room_id)));

create or replace function public.create_battle(p_name text, p_rounds integer, p_inspection integer, p_visibility text default 'link') returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); rid uuid;
begin
  if me is null then raise exception 'Please sign in to host a battle.'; end if;
  if (select count(*) from public.battle_rooms where host = me and status <> 'finished') >= 3 then raise exception 'Finish or leave one of your open rooms first.'; end if;
  insert into public.battle_rooms (host, name, rounds, inspection_s, visibility)
  values (me, coalesce(nullif(trim(p_name), ''), 'Cube battle'), p_rounds, p_inspection, case when p_visibility = 'public' then 'public' else 'link' end)
  returning id into rid;
  insert into public.battle_members (room_id, user_id) values (rid, me);
  return rid;
end $$;

create or replace function public.join_battle(p_room uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); r public.battle_rooms;
begin
  if me is null then raise exception 'Please sign in to join.'; end if;
  select * into r from public.battle_rooms where id = p_room for update;
  if not found then raise exception 'Room not found.'; end if;
  if exists (select 1 from public.battle_members where room_id = p_room and user_id = me) then return; end if;
  if r.status <> 'lobby' then raise exception 'This battle has already started.'; end if;
  if r.host is not null and private.is_blocked(me, r.host) then raise exception 'You cannot join this room.'; end if;
  if (select count(*) from public.battle_members where room_id = p_room) >= 4 then raise exception 'This room is full (4 players).'; end if;
  insert into public.battle_members (room_id, user_id) values (p_room, me);
end $$;

create or replace function public.leave_battle(p_room uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); r public.battle_rooms; nxt uuid;
begin
  select * into r from public.battle_rooms where id = p_room for update;
  if not found then return; end if;
  delete from public.battle_members where room_id = p_room and user_id = me;
  if r.host = me then
    select user_id into nxt from public.battle_members where room_id = p_room order by joined_at limit 1;
    if nxt is null then
      update public.battle_rooms set host = null, status = 'finished', finished_at = now() where id = p_room;
    else
      update public.battle_rooms set host = nxt where id = p_room;
    end if;
  end if;
end $$;

create or replace function public.battle_room_preview(p_room uuid) returns table (id uuid, name text, status text, rounds integer, inspection_s integer, players bigint, host_name text)
language sql stable security definer set search_path = '' as $$
  select r.id, r.name, r.status, r.rounds, r.inspection_s, (select count(*) from public.battle_members m where m.room_id = r.id),
    (select coalesce(display_name, username, 'Host') from public.profiles where id = r.host)
  from public.battle_rooms r where r.id = p_room;
$$;

create or replace function public.battle_players(p_room uuid) returns table (user_id uuid, display_name text, joined_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.user_id, coalesce(p.display_name, p.username, 'Player'), m.joined_at
  from public.battle_members m join public.profiles p on p.id = m.user_id
  where m.room_id = p_room and private.battle_member(p_room) order by m.joined_at;
$$;

create or replace function public.start_battle_round(p_room uuid, p_scramble text) returns integer
language plpgsql security definer set search_path = '' as $$
declare r public.battle_rooms; n integer;
begin
  select * into r from public.battle_rooms where id = p_room for update;
  if not found or r.host is distinct from auth.uid() then raise exception 'Only the host can start a round.'; end if;
  if r.status = 'finished' then raise exception 'This battle is over.'; end if;
  if (select count(*) from public.battle_members where room_id = p_room) < 2 then raise exception 'At least 2 players are needed.'; end if;
  if r.current_round >= r.rounds then raise exception 'All rounds have been played.'; end if;
  n := r.current_round + 1;
  insert into public.battle_rounds (room_id, round_no, scramble) values (p_room, n, trim(p_scramble));
  update public.battle_rooms set current_round = n, status = 'running' where id = p_room;
  return n;
end $$;

-- Times are self-reported by each player. Sanity limits: 2.5 s to 10 min, and never longer than
-- the time since the round started plus 2 s. Anyone in the room can report a suspicious time.
create or replace function public.submit_battle_result(p_room uuid, p_round integer, p_time_ms integer, p_dnf boolean default false) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); started timestamptz;
begin
  if not private.battle_member(p_room) then raise exception 'You are not in this room.'; end if;
  select started_at into started from public.battle_rounds where room_id = p_room and round_no = p_round;
  if started is null then raise exception 'That round has not started.'; end if;
  if not p_dnf then
    if p_time_ms is null or p_time_ms < 2500 or p_time_ms > 600000 then raise exception 'That time is outside the allowed range (2.5 s to 10 min).'; end if;
    if p_time_ms > extract(epoch from (now() - started)) * 1000 + 2000 then raise exception 'That time is longer than the round has been running.'; end if;
  end if;
  insert into public.battle_results (room_id, round_no, user_id, time_ms, dnf)
  values (p_room, p_round, me, case when p_dnf then null else p_time_ms end, coalesce(p_dnf, false));
  perform private.award_xp(me, 'battle', p_room::text || ':' || p_round, 3);
  perform private.check_achievements(me);
exception when unique_violation then
  raise exception 'You already submitted a time for this round.';
end $$;

create or replace function public.finish_battle(p_room uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.battle_rooms set status = 'finished', finished_at = now() where id = p_room and host = auth.uid() and status <> 'finished';
  if not found then raise exception 'Only the host can finish the battle.'; end if;
end $$;

-- ───────────── stats, league, public profile ─────────────
create or replace function public.my_stats() returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'xp', coalesce(s.xp, 0),
    'streak_current', case when s.last_active_date >= private.local_day(auth.uid()) - case when s.freezes > 0 then 2 else 1 end then coalesce(s.streak_current, 0) else 0 end,
    'streak_best', coalesce(s.streak_best, 0),
    'last_active_date', s.last_active_date,
    'freezes', coalesce(s.freezes, 0),
    'week_xp', (select coalesce(sum(amount), 0) from public.xp_events where user_id = auth.uid() and created_at >= date_trunc('week', now())),
    'today_xp', (select coalesce(sum(amount), 0) from public.xp_events where user_id = auth.uid() and created_at >= now() - interval '24 hours')
  )
  from (select auth.uid() as uid) u left join public.user_stats s on s.user_id = u.uid
  where auth.uid() is not null;
$$;

create or replace function public.weekly_league(lim integer default 50) returns table (display_name text, user_id uuid, xp bigint)
language sql stable security definer set search_path = '' as $$
  select coalesce(p.display_name, p.username, 'Member'), p.id, sum(e.amount)
  from public.xp_events e join public.profiles p on p.id = e.user_id
  where e.created_at >= date_trunc('week', now()) and (p.show_on_leaderboard or p.id = auth.uid())
  group by p.id having sum(e.amount) > 0
  order by 3 desc limit least(greatest(lim, 1), 100);
$$;

create or replace function public.public_profile(p_user uuid) returns json
language plpgsql stable security definer set search_path = '' as $$
declare p public.profiles; me uuid := auth.uid(); rel text;
begin
  select * into p from public.profiles where id = p_user;
  if not found then return null; end if;
  if me is not null and exists (select 1 from public.friendships where status = 'blocked' and requester = p_user and addressee = me) then return null; end if;
  rel := case when me is null then 'none' when me = p_user then 'self' else private.relation(me, p_user) end;
  if me is distinct from p_user and (p.profile_visibility = 'private' or (p.profile_visibility = 'friends' and rel <> 'friend')) then
    return json_build_object('id', p.id, 'display_name', coalesce(p.display_name, p.username, 'Member'), 'restricted', true, 'relation', rel);
  end if;
  return json_build_object(
    'id', p.id, 'display_name', coalesce(p.display_name, p.username, 'Member'), 'username', p.username,
    'interests', p.interests, 'joined', p.created_at, 'restricted', false, 'relation', rel,
    'allow_challenges', private.can_challenge(coalesce(me, p_user), p_user) and me is distinct from p_user,
    'xp', (select coalesce(xp, 0) from public.user_stats where user_id = p_user),
    'streak_best', (select coalesce(streak_best, 0) from public.user_stats where user_id = p_user),
    'achievements', (select coalesce(json_agg(achievement_id order by unlocked_at), '[]'::json) from public.user_achievements where user_id = p_user),
    'games', (select count(*) from public.games where status = 'finished' and p_user in (white, black)),
    'wins', (select count(*) from public.games where status = 'finished' and ((white = p_user and result = '1-0') or (black = p_user and result = '0-1'))),
    'lessons', (select count(*) from public.lesson_progress where user_id = p_user)
  );
end $$;

-- ───────────── grants ─────────────
do $$
declare f record;
begin
  -- internal helpers: no API access, except the few that RLS policies call
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'private' loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
  grant execute on function private.is_admin(), private.is_staff(), private.post_open(uuid), private.battle_member(uuid) to anon, authenticated, service_role;

  -- new public RPCs: signed-in users only by default
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in (
             'send_friend_request', 'respond_friend_request', 'remove_friend', 'block_user', 'unblock_user', 'search_users', 'list_friends', 'heartbeat',
             'create_game', 'join_game', 'quick_match', 'cancel_game', 'claim_timeout', 'resign_game', 'offer_draw', 'respond_draw', 'request_rematch',
             'submit_daily', 'create_challenge', 'refresh_challenge', 'join_challenge', 'leave_challenge',
             'create_battle', 'join_battle', 'leave_battle', 'battle_players', 'start_battle_round', 'submit_battle_result', 'finish_battle', 'my_stats') loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
  -- read-only public RPCs (return display names and aggregates only)
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('server_now', 'game_preview', 'battle_room_preview', 'forum_threads', 'daily_board', 'challenge_board', 'weekly_league', 'public_profile') loop
    execute format('revoke all on function %s from public', f.sig);
    execute format('grant execute on function %s to anon, authenticated', f.sig);
  end loop;
  -- move application: Edge Function only
  revoke all on function public.server_apply_move(uuid, uuid, integer, text, text, text, text, text) from public, anon, authenticated;
  grant execute on function public.server_apply_move(uuid, uuid, integer, text, text, text, text, text) to service_role;
end $$;

-- ───────────── realtime ─────────────
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['games', 'battle_rooms', 'battle_members', 'battle_rounds', 'battle_results', 'comments', 'friendships'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
