// Checks for migration 0003 (friends, live chess, forum moderation, XP, challenges, battles).
export async function run({ db, as, ok, A, B }) {
  const C = "33333333-3333-3333-3333-333333333333";
  await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values ('${C}', 'carol@example.com', '{"display_name":"Carol"}')`);
  let r;
  // ── friends ──
  r = await as(A, `select * from public.search_users('ca')`); ok(r.rows?.length === 1 && r.rows[0].relation === "none", "search finds carol " + (r.error ?? ""));
  r = await as(A, `select public.send_friend_request('${C}') s`); ok(r.rows?.[0]?.s === "sent", "friend request sent " + (r.error ?? ""));
  r = await as(A, `select public.send_friend_request('${C}') s`); ok(r.rows?.[0]?.s === "already_sent", "duplicate request is idempotent");
  r = await as(B, `select * from public.friendships`); ok(r.rows?.length === 0, "outsiders cannot see friendships");
  r = await as(B, `insert into public.friendships (requester, addressee, status) values ('${B}', '${A}', 'accepted')`); ok(r.error, "no direct friendship inserts");
  r = await as(C, `select public.respond_friend_request('${A}', true) s`); ok(r.rows?.[0]?.s === "accepted", "carol accepts");
  r = await as(A, `select * from public.list_friends()`); ok(r.rows?.length === 1 && r.rows[0].relation === "friend", "alice lists carol as friend");
  r = await as(C, `select achievement_id from public.user_achievements where achievement_id = 'first-friend'`); ok(r.rows?.length === 1, "first-friend badge awarded");
  r = await as(B, `select public.block_user('${C}')`); ok(!r.error, "bob blocks carol");
  r = await as(C, `select public.send_friend_request('${B}')`); ok(r.error, "blocked user cannot send a request");
  r = await as(C, `select * from public.search_users('bob')`); ok(r.rows?.length === 0, "blocker hidden from search for blocked user");
  r = await as(B, `select public.unblock_user('${C}')`); ok(!r.error, "unblock");
  await db.exec(`update public.profiles set allow_friend_requests = false where id = '${B}'`);
  r = await as(C, `select public.send_friend_request('${B}')`); ok(r.error?.includes("not accepting"), "privacy: friend requests off");
  await db.exec(`update public.profiles set allow_friend_requests = true where id = '${B}'`);

  // ── live chess ──
  r = await as(B, `select public.create_game(180000, 2000, 'white', 'public', '${C}', false) id`); ok(r.error?.includes("not accepting"), "challenge respects allow_challenges=friends");
  r = await as(A, `select public.create_game(180000, 2000, 'white', 'public', null, false) id`); const g = r.rows?.[0]?.id; ok(g, "alice creates game " + (r.error ?? ""));
  r = await as(A, `update public.games set status = 'finished', result = '1-0' where id = '${g}' returning id`); ok(!r.rows?.length, "players cannot update games directly");
  r = await as(B, `select public.join_game('${g}')`); ok(!r.error, "bob joins " + (r.error ?? ""));
  r = await as(A, `select public.server_apply_move('${g}', '${A}', 0, 'e2e4', 'e4', 'x', null, null)`); ok(r.error?.includes("permission denied"), "server_apply_move is service-role only");
  const mv = (u, ply, uci, san, res = "null", reason = "null") => as("service", `select public.server_apply_move('${g}', '${u}', ${ply}, '${uci}', '${san}', 'fen${ply}', ${res}, ${reason}) r`);
  r = await mv(B, 0, "e2e4", "e4"); ok(r.rows?.[0]?.r?.ok === false && r.rows[0].r.error.includes("turn"), "wrong side rejected");
  r = await mv(A, 0, "e2e4", "e4"); ok(r.rows?.[0]?.r?.ok === true, "white move applied " + JSON.stringify(r));
  r = await mv(B, 0, "e7e5", "e5"); ok(r.rows?.[0]?.r?.ok === false, "stale ply rejected");
  r = await mv(B, 1, "e7e5", "e5"); ok(r.rows?.[0]?.r?.ok === true, "black move applied");
  r = await as(B, `select public.offer_draw('${g}') s`); ok(r.rows?.[0]?.s === "offered", "draw offered");
  r = await as(A, `select public.respond_draw('${g}', false) s`); ok(r.rows?.[0]?.s === "declined", "draw declined");
  // simulate white's clock running out
  await db.exec(`update public.games set last_move_at = now() - interval '200 seconds' where id = '${g}'`);
  r = await mv(A, 2, "g1f3", "Nf3"); ok(r.rows?.[0]?.r?.ended === true, "move after flag rejected");
  r = await as(null, `select status, result, end_reason from public.games where id = '${g}'`); ok(r.rows?.[0]?.end_reason === "timeout" && r.rows[0].result === "0-1", "timeout recorded " + JSON.stringify(r.rows));
  r = await as(B, `select xp from public.user_stats`); ok(r.rows?.[0]?.xp >= 20, "winner got online XP");
  r = await as(A, `select public.request_rematch('${g}') id`); const g2 = r.rows?.[0]?.id; ok(g2, "rematch requested");
  r = await as(B, `select public.request_rematch('${g}') id`); ok(r.rows?.[0]?.id === g2, "rematch accepted by opponent");
  r = await as(null, `select white, black, status from public.games where id = '${g2}'`); ok(r.rows?.[0]?.status === "active" && r.rows[0].white === B, "rematch swaps colours");
  r = await as(A, `select public.resign_game('${g2}')`); r = await as(null, `select status from public.games where id = '${g2}'`); ok(r.rows?.[0]?.status === "aborted", "resign before 2 plies aborts");
  r = await as(A, `select public.quick_match(300000, 0) id`); const q1 = r.rows?.[0]?.id;
  r = await as(B, `select public.quick_match(300000, 0) id`); ok(r.rows?.[0]?.id === q1, "quick match pairs two seekers");
  r = await as(A, `select public.create_game(600000, 0, 'white', 'private', null, false) id`); const gp = r.rows?.[0]?.id;
  r = await as(C, `select id from public.games where id = '${gp}'`); ok(r.rows?.length === 0, "private open game hidden from outsiders");
  r = await as(C, `select * from public.game_preview('${gp}')`); ok(r.rows?.length === 1, "invite link preview works");

  // ── forum ──
  r = await as(C, `insert into public.posts (title, body, category) values ('Best opening?', 'London or Italian [fen]8/8/8/8/8/8/8/8 w - - 0 1[/fen]', 'help') returning id`); const p = r.rows?.[0]?.id; ok(p, "help post " + (r.error ?? ""));
  r = await as(C, `update public.posts set pinned = true where id = '${p}'`); ok(r.error?.includes("moderators"), "students cannot pin");
  r = await as(A, `update public.posts set locked = true where id = '${p}' returning locked`); ok(r.rows?.[0]?.locked === true, "admin locks thread");
  r = await as(B, `insert into public.comments (post_id, body) values ('${p}', 'hi')`); ok(r.error, "no replies on locked thread");
  r = await as(C, `update public.posts set body = 'edited' where id = '${p}'`); ok(r.error?.includes("locked"), "author cannot edit locked thread");
  r = await as(B, `insert into public.post_votes (post_id) values ('${p}')`); ok(!r.error, "upvote");
  r = await as(B, `insert into public.post_votes (post_id, user_id) values ('${p}', '${A}')`); ok(r.error, "cannot vote as someone else");
  r = await as(null, `select title, votes, replies from public.forum_threads('help', 'opening')`); ok(r.rows?.length === 1 && Number(r.rows[0].votes) === 1, "thread search with votes " + (r.error ?? ""));
  r = await as(B, `insert into public.reports (target_type, target_id, reason) values ('post', '${p}', 'spam')`); ok(!r.error, "report filed");
  r = await as(C, `select * from public.reports`); ok(r.rows?.length === 0, "reports private to reporter and staff");
  r = await as(A, `select * from public.reports`); ok(r.rows?.length === 1, "staff sees reports");

  // ── XP / gamification ──
  r = await as(C, `insert into public.user_stats (user_id, xp) values ('${C}', 99999)`); ok(r.error, "no self-inserted XP");
  r = await as(C, `insert into public.xp_events (user_id, source, ref, amount) values ('${C}', 'x', 'y', 100)`); ok(r.error, "no self-inserted XP events");
  for (let i = 0; i < 25; i++) await as(C, `insert into public.puzzle_attempts (puzzle_id, solved, rating) values ('p${i}', true, 1200)`);
  await as(C, `insert into public.puzzle_attempts (puzzle_id, solved, rating) values ('p0', true, 1200)`);
  r = await db.query(`select coalesce(sum(amount),0)::int s from public.xp_events where user_id = '${C}' and source = 'puzzle'`); ok(r.rows[0].s === 100, "puzzle XP capped at 100/day and de-duplicated, got " + r.rows[0].s);
  r = await as(C, `select public.my_stats() s`); ok(r.rows?.[0]?.s?.streak_current === 1, "streak started");
  // streak with freeze: pretend last activity was 2 days ago with one freeze
  await db.exec(`update public.user_stats set last_active_date = (now() at time zone 'UTC')::date - 2, freezes = 1, streak_current = 6 where user_id = '${C}'`);
  await as(C, `insert into public.kit_drills (kit, line_id, correct) values ('london', 'lo-main', true)`);
  r = await db.query(`select streak_current, freezes, freezes_used from public.user_stats where user_id = '${C}'`); ok(r.rows[0].streak_current === 7 && r.rows[0].freezes_used === 1 && r.rows[0].freezes === 1, "freeze covers a missed day and 7-day streak earns a new one " + JSON.stringify(r.rows[0]));
  r = await as(A, `select * from public.kit_drills`); ok(r.rows?.length === 0, "drills private");
  r = await as(null, `select * from public.weekly_league(10)`); ok(r.rows?.length >= 2, "weekly league");
  r = await as(B, `select public.submit_daily('puzzle', true, 20000) s`); ok(r.rows?.[0]?.s === true, "daily submitted");
  r = await as(B, `select public.submit_daily('puzzle', true, 20000) s`); ok(r.rows?.[0]?.s === false, "daily only once per day");
  r = await as(B, `select public.submit_daily('scramble', true, 1000)`); ok(r.error, "impossible daily scramble time rejected");

  // ── challenges ──
  r = await as(A, `select public.create_challenge('Five solves', null, 'solves', '{}'::jsonb, 5, 7, 'link') id`); const ch = r.rows?.[0]?.id; ok(ch, "challenge created " + (r.error ?? ""));
  r = await as(C, `select public.join_challenge('${ch}')`); ok(!r.error, "joined challenge");
  for (let i = 0; i < 5; i++) await as(C, `insert into public.solves (time_ms, scramble) values (${20000 + i * 1000}, 'R U')`);
  r = await as(C, `select * from public.refresh_challenge('${ch}')`); ok(r.rows?.[0]?.completed === true && r.rows[0].progress === 5, "progress computed by server " + JSON.stringify(r));
  r = await as(C, `update public.challenge_participants set progress = 500 where challenge_id = '${ch}' returning progress`); ok(!r.rows?.length, "cannot fake progress");
  r = await as(null, `select * from public.challenge_board('${ch}')`); ok(r.rows?.[0]?.display_name === "Carol", "challenge leaderboard");
  r = await as(A, `select public.create_challenge('Ao5', null, 'cube_ao5', '{"target_ms": 25000}'::jsonb, 1, 7) id`); const ch2 = r.rows?.[0]?.id;
  await db.exec(`update public.challenge_participants set joined_at = now() - interval '1 hour' where challenge_id = '${ch2}'`);
  for (const t of [21000, 22000, 23000, 24000, 50000]) await as(A, `insert into public.solves (time_ms, scramble) values (${t}, 'R')`);
  r = await as(A, `select * from public.refresh_challenge('${ch2}')`); ok(r.rows?.[0]?.best_ms === 22000 && r.rows[0].completed, "best rolling ao5 (incl. earlier 12.3s solve) drops best and worst " + JSON.stringify(r));

  // ── cube battles ──
  r = await as(A, `select public.create_battle('Sunday race', 3, 15, 'link') id`); const room = r.rows?.[0]?.id; ok(room, "battle created");
  r = await as(A, `select public.start_battle_round('${room}', 'R U R'' U'' F2 L D B2 R U F L2 D'' B R2 U2')`); ok(r.error?.includes("2 players"), "needs two players");
  r = await as(B, `select public.join_battle('${room}')`); ok(!r.error, "bob joins battle");
  r = await as(B, `select public.start_battle_round('${room}', 'R U R'' U'' F2 L D B2 R U F L2 D'' B R2 U2')`); ok(r.error?.includes("host"), "only host starts rounds");
  r = await as(A, `select public.start_battle_round('${room}', 'not a scramble')`); ok(r.error, "invalid scramble rejected");
  r = await as(A, `select public.start_battle_round('${room}', 'R U R'' U'' F2 L D B2 R U F L2 D'' B R2 U2') n`); ok(r.rows?.[0]?.n === 1, "round 1 started " + (r.error ?? ""));
  r = await as(B, `select public.submit_battle_result('${room}', 1, 60000, false)`); ok(r.error?.includes("longer than the round"), "time longer than elapsed rejected");
  await db.exec(`update public.battle_rounds set started_at = now() - interval '40 seconds' where room_id = '${room}'`);
  r = await as(B, `select public.submit_battle_result('${room}', 1, 1500, false)`); ok(r.error?.includes("allowed range"), "sub-2.5s rejected");
  r = await as(B, `select public.submit_battle_result('${room}', 1, 21000, false)`); ok(!r.error, "valid time accepted " + (r.error ?? ""));
  r = await as(B, `select public.submit_battle_result('${room}', 1, 20000, false)`); ok(r.error?.includes("already"), "one result per round");
  r = await as(C, `select * from public.battle_results`); ok(r.rows?.length === 0, "outsiders cannot read results");
  r = await as(C, `select * from public.battle_room_preview('${room}')`); ok(Number(r.rows?.[0]?.players) === 2, "room preview for invite link");
  r = await as(A, `select public.leave_battle('${room}')`); r = await db.query(`select host from public.battle_rooms where id = '${room}'`); ok(r.rows[0].host === B, "host hands over when leaving");

  // ── profile privacy & grants ──
  await db.exec(`update public.profiles set profile_visibility = 'friends' where id = '${C}'`);
  r = await as(B, `select public.public_profile('${C}') p`); ok(r.rows?.[0]?.p?.restricted === true, "friends-only profile restricted for non-friends");
  r = await as(A, `select public.public_profile('${C}') p`); ok(r.rows?.[0]?.p?.restricted === false, "friends see full profile");
  r = await as(null, `select public.create_game(180000, 0)`); ok(r.error?.includes("permission denied"), "anon cannot create games");
  r = await as(B, `select private.award_xp('${B}', 'x', 'y', 500)`); ok(r.error?.includes("permission denied"), "award_xp not callable by users");
  r = await db.query(`select count(*)::int n from pg_tables where schemaname = 'public' and not rowsecurity`); ok(r.rows[0].n === 0, "RLS on every public table");
}
