import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
const db = new PGlite();
const read = (f) => fs.readFileSync(new URL(`../supabase/migrations/${f}`, import.meta.url), "utf8");
const sql = read("0001_init.sql");
const sql2 = read("0002_harden_functions.sql");
const sql3 = read("0003_social_play.sql");
// Minimal stand-in for Supabase's auth schema and roles
await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
`);
await db.exec(sql);
await db.exec(sql2);
await db.exec(sql3);
await db.exec(`grant select, insert, update, delete on all tables in schema public to anon, authenticated;`);
await db.exec(`grant usage on schema auth to service_role; grant execute on function auth.uid() to service_role; grant usage on schema public to service_role; grant select, insert, update, delete on all tables in schema public to service_role;`);
await db.exec(sql); await db.exec(sql2); await db.exec(sql3); // idempotency: running the migrations twice must work
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const A = "11111111-1111-1111-1111-111111111111", B = "22222222-2222-2222-2222-222222222222";
await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values ('${A}', 'alice@example.com', '{"display_name":"Alice"}'), ('${B}', 'bob@example.com', '{}')`);
const as = async (uid, q) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid === "service" ? "" : uid ?? ""}', false); set role ${uid === "service" ? "service_role" : uid ? "authenticated" : "anon"};`);
  try { return { rows: (await db.query(q)).rows }; } catch (e) { return { error: e.message }; } finally { await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);"); }
};
let r = await db.query("select display_name, role from public.profiles order by display_name");
ok(r.rows.length === 2 && r.rows.some((x) => x.display_name === "Alice") && r.rows.some((x) => x.display_name === "bob"), "profiles auto-created by trigger");
ok((await as(A, `insert into public.solves (time_ms, penalty, scramble) values (12345, null, 'R U') returning id`)).rows?.length === 1, "alice inserts own solve");
ok((await as(B, `insert into public.solves (time_ms, scramble) values (9000, 'F')`)).rows !== undefined, "bob inserts solve");
ok((await as(B, `insert into public.solves (user_id, time_ms, scramble) values ('${A}', 1000, 'F')`)).error, "bob cannot insert as alice");
ok((await as(B, `select * from public.solves`)).rows.length === 1, "bob sees only his own solves");
ok((await as(null, `select * from public.solves`)).rows?.length === 0 || (await as(null, `select * from public.solves`)).error, "anon sees no solves");
r = await as(B, `update public.profiles set role = 'admin' where id = '${B}'`); ok(r.error?.includes("only admins"), "bob cannot self-promote");
r = await as(B, `update public.profiles set display_name = 'Bobby' where id = '${B}' returning display_name`); ok(r.rows?.[0]?.display_name === "Bobby", "bob can rename himself");
r = await as(B, `update public.profiles set display_name = 'Hacked' where id = '${A}' returning id`); ok(r.rows?.length === 0, "bob cannot edit alice");
r = await as(null, `select * from public.leaderboard_cube(10)`); ok(r.rows?.length === 2 && r.rows[0].best_ms === 9000, "cube leaderboard aggregates");
r = await as(B, `select public.admin_stats()`); ok(r.error?.includes("admin only"), "non-admin blocked from admin_stats");
await db.exec(`update public.profiles set role = 'admin' where id = '${A}'`);
r = await as(A, `select public.admin_stats() as s`); ok(r.rows?.[0]?.s?.users === 2, "admin stats");
r = await as(A, `select * from public.admin_list_users()`); ok(r.rows?.length === 2 && r.rows.some((x) => x.email === "bob@example.com"), "admin lists users");
r = await as(A, `select public.admin_set_role('${B}', 'moderator')`); ok(!r.error, "admin sets role " + (r.error ?? ""));
r = await as(A, `select public.admin_set_role('${A}', 'student')`); ok(r.error?.includes("demote"), "admin cannot demote self");
r = await as(B, `insert into public.posts (title, body, category) values ('Hello world', 'First post', 'cube') returning id`); const pid = r.rows?.[0]?.id; ok(pid, "post created " + (r.error ?? ""));
r = await as(A, `insert into public.comments (post_id, body) values ('${pid}', 'Nice') returning id`); ok(r.rows?.length === 1, "comment created");
await db.exec(`update public.profiles set role = 'student' where id = '${B}'`);
r = await as(B, `update public.posts set hidden = true where id = '${pid}'`); ok(r.error?.includes("moderators"), "student cannot hide");
r = await as(A, `update public.posts set hidden = true where id = '${pid}' returning hidden`); ok(r.rows?.[0]?.hidden === true, "admin hides post");
r = await as(null, `select * from public.posts`); ok(r.rows?.length === 0, "anon cannot see hidden post");
r = await as(B, `select * from public.posts`); ok(r.rows?.length === 1, "author still sees own hidden post");
r = await as(B, `insert into public.lesson_progress (lesson_id) values ('chess:rules-and-pieces')`); ok(!r.error, "lesson progress insert");
r = await as(null, `select * from public.leaderboard_lessons(5)`); ok(r.rows?.[0]?.lessons == 1, "lessons leaderboard");
r = await as(B, `insert into public.user_achievements (achievement_id) values ('century') on conflict (user_id, achievement_id) do nothing`); ok(r.error, "users cannot self-award achievements (server-only now)");
r = await as(B, `select achievement_id from public.user_achievements`); ok(r.rows?.some((x) => x.achievement_id === "first-solve") && r.rows?.some((x) => x.achievement_id === "first-lesson"), "achievements awarded by server triggers");
r = await as(B, `insert into public.engine_games (result, level) values ('win', 9)`); ok(r.error, "engine level out of range rejected");
// hardening (0002)
r = await as(null, `select public.handle_new_user()`); ok(r.error?.includes("permission denied"), "anon cannot call trigger function");
r = await as(B, `select public.protect_role()`); ok(r.error?.includes("permission denied"), "authenticated cannot call trigger function");
r = await as(null, `select public.admin_stats()`); ok(r.error?.includes("permission denied"), "anon cannot call admin_stats");
r = await db.query(`select count(*)::int n from pg_proc where proname in ('is_admin','is_staff') and pronamespace = 'public'::regnamespace`); ok(r.rows[0].n === 0, "role checks no longer in public schema");
r = await db.query(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public','private') and p.prosecdef and not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%')`); ok(r.rows[0].n === 0, "every security definer function pins search_path");
r = await as(null, `select * from public.leaderboard_cube(10)`); ok(r.rows && Object.keys(r.rows[0]).join() === "display_name,best_ms,solves", "leaderboard exposes only display name + aggregates");
await import("./test-schema-0003.mjs").then((m) => m.run({ db, as, ok, A, B }));
console.log(`Supabase schema test (PGlite with stubbed auth): ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
