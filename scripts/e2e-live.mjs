// Live two-client test against the real Supabase project.
// Usage: E2E_A=a@x E2E_B=b@x E2E_PASS=... node --env-file=.env.local scripts/e2e-live.mjs
// Uses two pre-created temporary users; it never creates or deletes accounts itself.
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const mk = () => createClient(url, key, { auth: { persistSession: false } });
const A = mk(), B = mk();
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(c ? "PASS" : "FAIL", m); if (c) pass++; else fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sa = await A.auth.signInWithPassword({ email: process.env.E2E_A, password: process.env.E2E_PASS });
const sb = await B.auth.signInWithPassword({ email: process.env.E2E_B, password: process.env.E2E_PASS });
ok(!sa.error && !sb.error, "both clients signed in " + (sa.error?.message ?? sb.error?.message ?? ""));
const aId = sa.data.user.id, bId = sb.data.user.id;
const move = async (c, gameId, ply, uci) => {
  const { data, error } = await c.functions.invoke("chess-game", { body: { gameId, ply, from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] } });
  if (error) { let b = {}; try { b = await error.context.json(); } catch {} return { ok: false, status: error.context?.status, ...b }; }
  return data;
};

// ── live chess with realtime ──
let r = await A.rpc("create_game", { p_base_ms: 180000, p_inc_ms: 2000, p_color: "white", p_visibility: "private", p_invite: null, p_seek: false });
const g = r.data; ok(g && !r.error, "A creates a game by link " + (r.error?.message ?? ""));
const seen = [];
const ch = B.channel("g-" + g).on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${g}` }, (p) => seen.push(p.new)).subscribe();
await sleep(2500);
r = await B.rpc("join_game", { p_game: g }); ok(!r.error, "B joins by link");
r = await A.from("games").update({ status: "finished", result: "1-0" }).eq("id", g).select(); ok(!r.data?.length, "direct table update blocked by RLS");
r = await move(B, g, 0, "e7e5"); ok(r.ok === false && /turn/i.test(r.error), "B cannot move on A's turn: " + r.error);
r = await move(A, g, 0, "e2e5"); ok(r.ok === false && r.status === 422, "illegal move e2e5 rejected by server (422)");
const mate = ["e2e4", "e7e5", "f1c4", "b8c6", "d1h5", "g8f6", "h5f7"];
for (let i = 0; i < mate.length; i++) {
  r = await move(i % 2 ? B : A, g, i, mate[i]);
  if (!r.ok) { ok(false, `move ${mate[i]} ` + JSON.stringify(r)); break; }
}
ok(r.ok && r.reason === "checkmate" && r.result === "1-0", "scholar's mate ends the game: " + r.san);
await sleep(2500);
ok(seen.length >= 7 && seen.at(-1)?.status === "finished", `B received ${seen.length} realtime updates, final status ${seen.at(-1)?.status}`);
r = await B.from("games").select("sans, result, end_reason").eq("id", g).single(); ok(r.data?.sans?.join(" ") === "e4 e5 Bc4 Nc6 Qh5 Nf6 Qxf7#", "PGN moves stored: " + r.data?.sans?.join(" "));
await B.removeChannel(ch);
r = await A.rpc("my_stats"); ok(r.data?.xp >= 20, "winner XP recorded server-side: " + r.data?.xp);

// ── timeout (1+0 game, white lets the clock run out) ──
r = await A.rpc("create_game", { p_base_ms: 60000, p_inc_ms: 0, p_color: "white", p_visibility: "private", p_invite: null, p_seek: false });
const t = r.data; await B.rpc("join_game", { p_game: t });
await move(A, t, 0, "d2d4"); await move(B, t, 1, "d7d5");
console.log("… waiting 62 s for white's clock to run out");
await sleep(62000);
r = await move(A, t, 2, "c2c4"); ok(r.ok === false, "move after flag rejected: " + r.error);
r = await B.from("games").select("result, end_reason").eq("id", t).single(); ok(r.data?.end_reason === "timeout" && r.data?.result === "0-1", "timeout recorded: " + JSON.stringify(r.data));

// ── friends ──
r = await A.rpc("send_friend_request", { target: bId }); ok(r.data === "sent", "A sends friend request: " + (r.data ?? r.error?.message));
r = await B.rpc("respond_friend_request", { other: aId, accept: true }); ok(r.data === "accepted", "B accepts");
r = await A.rpc("list_friends"); ok(r.data?.some((f) => f.id === bId && f.relation === "friend"), "A sees B as friend");

// ── forum ──
r = await B.from("posts").insert({ title: "E2E test thread", body: "Temporary test post. [fen]rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1[/fen]", category: "help" }).select().single();
const post = r.data?.id; ok(post, "B creates forum post " + (r.error?.message ?? ""));
r = await A.from("comments").insert({ post_id: post, body: "Temporary reply" }).select(); ok(r.data?.length === 1, "A replies");
r = await A.from("post_votes").insert({ post_id: post }); ok(!r.error, "A upvotes");
r = await A.rpc("forum_threads", { p_category: "help", p_q: "E2E" }); ok(r.data?.some((x) => x.id === post && Number(x.votes) === 1 && Number(x.replies) === 1), "thread listed with vote and reply");
r = await B.from("posts").update({ pinned: true }).eq("id", post).select(); ok(r.error, "student cannot pin");

// ── cube battle ──
r = await A.rpc("create_battle", { p_name: "E2E battle", p_rounds: 3, p_inspection: 15, p_visibility: "link" }); const room = r.data; ok(room, "A creates battle room");
r = await B.rpc("join_battle", { p_room: room }); ok(!r.error, "B joins battle by link");
r = await A.rpc("start_battle_round", { p_room: room, p_scramble: "R U R' U' F2 L D B2 R U F L2 D' B R2 U2 L' F' D2 B'" }); ok(r.data === 1, "round 1 started " + (r.error?.message ?? ""));
const rs = await B.from("battle_rounds").select("scramble").eq("room_id", room); ok(rs.data?.[0]?.scramble?.startsWith("R U R'"), "both see the same scramble");
r = await B.rpc("submit_battle_result", { p_room: room, p_round: 1, p_time_ms: 120000, p_dnf: false }); ok(/longer than the round/.test(r.error?.message ?? ""), "impossible time rejected");
await sleep(4000);
r = await B.rpc("submit_battle_result", { p_room: room, p_round: 1, p_time_ms: 3200, p_dnf: false }); ok(!r.error, "valid time accepted " + (r.error?.message ?? ""));
r = await A.from("battle_results").select("time_ms"); ok(r.data?.some((x) => x.time_ms === 3200), "A sees B's result");

console.log(`\nLive e2e: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
