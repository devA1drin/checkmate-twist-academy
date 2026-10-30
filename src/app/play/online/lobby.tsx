"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { GAME_COLUMNS, TIME_CONTROLS, tcLabel, errMsg, names as fetchNames, type GameRow } from "@/lib/online";

interface Friend { id: string; display_name: string | null; username: string | null; relation: string }

export function Lobby() {
  const { user, configured, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const [tc, setTc] = useState(3);
  const [color, setColor] = useState<"random" | "white" | "black">("random");
  const [vis, setVis] = useState<"public" | "private">("public");
  const [invite, setInvite] = useState(sp.get("invite") ?? "");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [open, setOpen] = useState<GameRow[]>([]);
  const [live, setLive] = useState<GameRow[]>([]);
  const [mine, setMine] = useState<GameRow[]>([]);
  const [who, setWho] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = getSupabase(); if (!sb) return;
    const [o, l, m] = await Promise.all([
      sb.from("games").select(GAME_COLUMNS).eq("status", "waiting").order("created_at", { ascending: false }).limit(30),
      sb.from("games").select(GAME_COLUMNS).eq("status", "active").eq("visibility", "public").order("started_at", { ascending: false }).limit(10),
      user ? sb.from("games").select(GAME_COLUMNS).or(`white.eq.${user.id},black.eq.${user.id}`).in("status", ["finished", "active"]).order("created_at", { ascending: false }).limit(15) : Promise.resolve({ data: [] }),
    ]);
    const all = [...(o.data ?? []), ...(l.data ?? []), ...(m.data ?? [])] as GameRow[];
    setOpen((o.data ?? []) as GameRow[]); setLive((l.data ?? []) as GameRow[]); setMine((m.data ?? []) as GameRow[]);
    setWho(await fetchNames(sb, all.flatMap((g) => [g.white, g.black, g.created_by])));
  }, [user]);

  useEffect(() => {
    load();
    const sb = getSupabase(); if (!sb) return;
    const ch = sb.channel("lobby").on("postgres_changes", { event: "*", schema: "public", table: "games" }, () => load()).subscribe();
    const t = setInterval(load, 15000);
    return () => { sb.removeChannel(ch); clearInterval(t); };
  }, [load]);
  useEffect(() => {
    const sb = getSupabase(); if (!sb || !user) return;
    sb.rpc("list_friends").then(({ data }) => setFriends(((data ?? []) as Friend[]).filter((f) => f.relation === "friend")));
  }, [user]);

  const run = async (key: string, fn: () => PromiseLike<{ data: unknown; error: unknown }>) => {
    setBusy(key); setErr(null);
    const { data, error } = await fn();
    if (error) { setErr(await errMsg(error)); setBusy(null); return; }
    router.push(`/play/online/${data as string}`);
  };
  const t = TIME_CONTROLS[tc];
  const sb = getSupabase();

  if (!configured) return <p className="notice">Online play needs the site&apos;s database, which isn&apos;t set up on this copy.</p>;
  const myId = user?.id;
  const invites = open.filter((g) => g.invited === myId);
  const challenges = open.filter((g) => !g.invited && g.visibility === "public" && g.created_by !== myId && !g.is_seek);
  const myOpen = open.filter((g) => g.created_by === myId);
  const nm = (id: string | null) => (id ? who[id] ?? "Member" : "—");

  return (
    <div className="space-y-12">
      {!loading && !user && <p className="notice">You can watch games without an account. <Link href="/auth" className="link">Sign in</Link> to play.</p>}
      {err && <p role="alert" className="notice notice-bad">{err}</p>}

      {invites.length > 0 && (
        <section aria-labelledby="inv"><h2 id="inv" className="text-xl font-semibold mb-3">Invitations for you</h2>
          <ul className="border-t border-ink">{invites.map((g) => (
            <li key={g.id} className="list-row flex-wrap">
              <span className="flex-1"><strong>{nm(g.created_by)}</strong> challenged you · {tcLabel(g.base_ms, g.inc_ms)}</span>
              <button className="btn btn-primary" disabled={!!busy} onClick={() => run(g.id, () => sb!.rpc("join_game", { p_game: g.id }))}>Accept</button>
              <button className="btn btn-ghost" disabled={!!busy} onClick={async () => { await sb!.rpc("cancel_game", { p_game: g.id }); load(); }}>Decline</button>
            </li>))}</ul>
        </section>
      )}

      <section aria-labelledby="new" className="grid lg:grid-cols-[1fr_1fr] gap-10">
        <div>
          <h2 id="new" className="text-xl font-semibold mb-1">Time control</h2>
          <p className="text-sm text-muted mb-3">Minutes per player + seconds added after each move.</p>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Time control">
            {TIME_CONTROLS.map((x, i) => (
              <button key={x.label} role="radio" aria-checked={tc === i} onClick={() => setTc(i)}
                className={`h-16 border rounded flex flex-col items-center justify-center ${tc === i ? "border-electric bg-surface-2 ring-1 ring-electric" : "border-line hover:border-fg"}`}>
                <span className="text-lg font-semibold tabular-nums">{x.label}</span><span className="text-[11px] text-muted">{x.kind}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-primary w-full mt-4 !min-h-[52px] text-base" disabled={!user || !!busy} onClick={() => run("quick", () => sb!.rpc("quick_match", { p_base_ms: t.base * 60000, p_inc_ms: t.inc * 1000 }))}>
            {busy === "quick" && <Loader2 size={16} className="animate-spin" aria-hidden />} Quick match {t.label}
          </button>
          <p className="help">Pairs you with someone waiting for the same time control, or puts you in the queue.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-3">Play a friend or create a game</h2>
          <div className="space-y-4">
            <div><label className="label" htmlFor="inv-sel">Opponent</label>
              <select id="inv-sel" className="input" value={invite} onChange={(e) => setInvite(e.target.value)} disabled={!user}>
                <option value="">Anyone with the link</option>
                {friends.map((f) => <option key={f.id} value={f.id}>{f.display_name || f.username}</option>)}
              </select>
              {user && friends.length === 0 && <p className="help"><Link href="/friends" className="link">Add friends</Link> to challenge them directly.</p>}
            </div>
            <div className="flex flex-wrap gap-4">
              <div><span className="label">Your colour</span><div className="seg" role="group" aria-label="Your colour">{(["random", "white", "black"] as const).map((c) => <button key={c} aria-pressed={color === c} onClick={() => setColor(c)} className="capitalize">{c}</button>)}</div></div>
              <div><span className="label">Who can watch</span><div className="seg" role="group" aria-label="Visibility">{(["public", "private"] as const).map((v) => <button key={v} aria-pressed={vis === v} onClick={() => setVis(v)}>{v === "public" ? "Anyone" : "Only players"}</button>)}</div></div>
            </div>
            <button className="btn btn-ghost w-full" disabled={!user || !!busy} onClick={() => run("create", () => sb!.rpc("create_game", { p_base_ms: t.base * 60000, p_inc_ms: t.inc * 1000, p_color: color, p_visibility: vis, p_invite: invite || null, p_seek: false }))}>
              {busy === "create" && <Loader2 size={16} className="animate-spin" aria-hidden />} {invite ? "Send challenge" : "Create game and get link"} ({t.label})
            </button>
          </div>
        </div>
      </section>

      {myOpen.length > 0 && (
        <section><h2 className="text-xl font-semibold mb-3">Your open games</h2>
          <ul className="border-t border-ink">{myOpen.map((g) => (
            <li key={g.id} className="list-row"><span className="flex-1">{g.is_seek ? "Quick match" : g.invited ? `Waiting for ${nm(g.invited)}` : "Waiting for anyone with the link"} · {tcLabel(g.base_ms, g.inc_ms)}</span>
              <Link href={`/play/online/${g.id}`} className="btn btn-ghost">Open</Link>
              <button className="btn btn-ghost" onClick={async () => { await sb!.rpc("cancel_game", { p_game: g.id }); load(); }}>Cancel</button></li>))}</ul>
        </section>
      )}

      <section><h2 className="text-xl font-semibold mb-3">Open challenges</h2>
        {challenges.length === 0 ? <p className="text-sm text-muted border-t border-ink pt-3">No open challenges right now. Use Quick match, or create a game and share the link.</p> : (
          <ul className="border-t border-ink">{challenges.map((g) => (
            <li key={g.id} className="list-row"><span className="flex-1"><strong>{nm(g.created_by)}</strong> · {tcLabel(g.base_ms, g.inc_ms)} · plays {g.white ? "White" : g.black ? "Black" : "random"}</span>
              <button className="btn btn-primary" disabled={!user || !!busy} onClick={() => run(g.id, () => sb!.rpc("join_game", { p_game: g.id }))}>Play</button></li>))}</ul>
        )}
      </section>

      <section><h2 className="text-xl font-semibold mb-3">Being played now</h2>
        {live.length === 0 ? <p className="text-sm text-muted border-t border-ink pt-3">No public games in progress.</p> : (
          <ul className="border-t border-ink">{live.map((g) => (
            <li key={g.id} className="list-row"><span className="flex-1">{nm(g.white)} – {nm(g.black)} <span className="text-muted text-sm">· {tcLabel(g.base_ms, g.inc_ms)} · move {Math.floor(g.ply / 2) + 1}</span></span>
              <Link href={`/play/online/${g.id}`} className="btn btn-ghost"><Eye size={16} aria-hidden /> Watch</Link></li>))}</ul>
        )}
      </section>

      {user && (
        <section><h2 className="text-xl font-semibold mb-3">Your games</h2>
          {mine.length === 0 ? <p className="text-sm text-muted border-t border-ink pt-3">No games yet.</p> : (
            <div className="overflow-x-auto"><table className="table"><thead><tr><th>White</th><th>Black</th><th>Result</th><th className="hidden sm:table-cell">Time</th><th className="hidden sm:table-cell">Moves</th><th></th></tr></thead>
              <tbody>{mine.map((g) => (
                <tr key={g.id}><td>{nm(g.white)}</td><td>{nm(g.black)}</td><td className="font-mono">{g.status === "active" ? "playing" : g.result ?? "—"}</td>
                  <td className="hidden sm:table-cell font-mono text-sm">{tcLabel(g.base_ms, g.inc_ms)}</td><td className="hidden sm:table-cell font-mono text-sm">{Math.ceil(g.ply / 2)}</td>
                  <td className="text-right"><Link href={`/play/online/${g.id}`} className="link">{g.status === "active" ? "Resume" : "Review"}</Link></td></tr>))}
              </tbody></table></div>
          )}
        </section>
      )}
    </div>
  );
}
