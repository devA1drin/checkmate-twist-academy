"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Chess, type Square } from "chess.js";
import { Copy, Flag, Handshake, Loader2, RotateCcw, Wifi, WifiOff } from "lucide-react";
import { Board } from "@/components/chess/board";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { notifyActivity } from "@/lib/stats-context";
import { GAME_COLUMNS, clocks, fmtClock, serverOffset, resultText, toPgn, errMsg, names as fetchNames, tcLabel, type GameRow } from "@/lib/online";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function OnlineGame({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [g, setG] = useState<GameRow | null>(null);
  const [missing, setMissing] = useState(false);
  const [who, setWho] = useState<Record<string, string>>({});
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [pending, setPending] = useState<{ fen: string; from: string; to: string } | null>(null);
  const [promo, setPromo] = useState<{ from: string; to: string } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(true);
  const [oppHere, setOppHere] = useState<boolean | null>(null);
  const [viewPly, setViewPly] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ creator_name: string | null; base_ms: number; inc_ms: number; status: string; invited: string | null } | null>(null);
  const claimed = useRef<string>("");

  const sb = getSupabase();
  const me = user?.id;
  const myColor: "w" | "b" | null = g && me ? (g.white === me ? "w" : g.black === me ? "b" : null) : null;

  const load = useCallback(async () => {
    if (!sb || !UUID.test(id)) { setMissing(true); return; }
    const { data } = await sb.from("games").select(GAME_COLUMNS).eq("id", id).maybeSingle();
    if (data) {
      const row = data as GameRow;
      setG((old) => (old && old.ply > row.ply && old.status === row.status ? old : row));
      setPending(null);
      setWho(await fetchNames(sb, [row.white, row.black, row.created_by, row.invited]));
    } else {
      const { data: p } = await sb.rpc("game_preview", { p_game: id });
      const row = (p as typeof preview[] | null)?.[0];
      if (row) setPreview(row); else setMissing(true);
    }
  }, [sb, id]);

  // Initial load, server clock offset, realtime updates, reconnect handling and a slow safety poll.
  useEffect(() => {
    if (!sb || authLoading) return;
    load();
    serverOffset(sb).then(setOffset);
    const ch = sb.channel(`game:${id}`, { config: { presence: { key: me ?? `guest-${Math.random().toString(36).slice(2)}` } } })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${id}` }, (p) => {
        const row = p.new as GameRow;
        setG((old) => (old && old.ply > row.ply && old.status === row.status ? old : { ...(old ?? {}), ...row }));
        setPending(null);
      })
      .on("presence", { event: "sync" }, () => {
        const keys = Object.keys(ch.presenceState());
        window.dispatchEvent(new CustomEvent("ct:presence", { detail: keys }));
      })
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") { load(); if (me) ch.track({ at: Date.now() }); }
      });
    const poll = setInterval(load, 8000);
    const online = () => load();
    window.addEventListener("online", online); window.addEventListener("focus", online);
    return () => { sb.removeChannel(ch); clearInterval(poll); window.removeEventListener("online", online); window.removeEventListener("focus", online); };
  }, [sb, id, me, authLoading, load]);

  // Opponent presence: is the other player's id in the presence list?
  useEffect(() => {
    const on = (e: Event) => {
      const keys = (e as CustomEvent<string[]>).detail;
      if (!g || !myColor) return;
      const opp = myColor === "w" ? g.black : g.white;
      setOppHere(opp ? keys.includes(opp) : null);
    };
    window.addEventListener("ct:presence", on);
    return () => window.removeEventListener("ct:presence", on);
  }, [g, myColor]);

  // Tick clocks.
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 100); return () => clearInterval(t); }, []);

  const serverNow = now + offset;
  const c = g ? clocks(g, serverNow) : null;
  const firstMoveLeft = g && g.status === "active" && g.ply < 2 && g.last_move_at ? 60000 - (serverNow - Date.parse(g.last_move_at)) : null;

  // When a clock hits zero (or nobody makes the first move in 60 s), ask the server to check and end the game.
  useEffect(() => {
    if (!g || !sb || !myColor || g.status !== "active") return;
    const out = (c && c.running && (c.running === "w" ? c.w : c.b) <= 0) || (firstMoveLeft !== null && firstMoveLeft <= 0);
    const key = `${g.id}:${g.ply}`;
    if (out && claimed.current !== key) { claimed.current = key; sb.rpc("claim_timeout", { p_game: g.id }).then(() => load()); }
  }, [g, c, firstMoveLeft, sb, myColor, load]);

  const shownFen = pending?.fen ?? g?.fen ?? new Chess().fen();
  const turn = new Chess(shownFen).turn();
  const myTurn = !!g && g.status === "active" && myColor === turn && !pending;

  const plies = useMemo(() => {
    if (!g) return [] as { fen: string; from: string; to: string }[];
    const ch = new Chess(); const out: { fen: string; from: string; to: string }[] = [];
    for (const s of g.sans) { try { const m = ch.move(s); out.push({ fen: ch.fen(), from: m.from, to: m.to }); } catch { break; } }
    return out;
  }, [g]);
  const reviewing = viewPly !== null && viewPly < plies.length;
  const boardFen = reviewing ? (viewPly === 0 ? new Chess().fen() : plies[viewPly - 1].fen) : shownFen;
  const last = reviewing ? (viewPly! > 0 ? plies[viewPly! - 1] : null) : pending ?? (plies.length ? plies[plies.length - 1] : null);

  const send = async (from: string, to: string, promotion?: string) => {
    if (!g || !sb) return;
    const local = new Chess(g.fen);
    try { local.move({ from, to, promotion }); } catch { return; }
    setPending({ fen: local.fen(), from, to }); setMsg(null); setViewPly(null);
    const { data, error } = await sb.functions.invoke("chess-game", { body: { gameId: g.id, ply: g.ply, from, to, promotion } });
    if (error || !(data as { ok?: boolean })?.ok) {
      setPending(null);
      setMsg({ ok: false, text: error ? await errMsg(error) : (data as { error?: string })?.error ?? "Move not accepted." });
      load();
    } else { notifyActivity(); }
  };

  const onMove = (from: string, to: string) => {
    if (!myTurn || !g) return false;
    const ch = new Chess(g.fen);
    const p = ch.get(from as Square);
    if (p?.type === "p" && (to[1] === "8" || to[1] === "1")) {
      const legal = ch.moves({ square: from as Square, verbose: true }).some((m) => m.to === to);
      if (legal) setPromo({ from, to });
      return false;
    }
    try { new Chess(g.fen).move({ from, to }); } catch { return false; }
    send(from, to);
    return true;
  };

  const act = async (fn: string, args: Record<string, unknown>, after?: (d: unknown) => void) => {
    if (!sb) return; setBusy(true); setMsg(null);
    const { data, error } = await sb.rpc(fn, args);
    setBusy(false);
    if (error) setMsg({ ok: false, text: await errMsg(error) }); else { after?.(data); load(); }
  };

  if (!sb) return <p className="notice">Online play needs the site&apos;s database.</p>;
  if (missing) return <div className="space-y-4"><p className="notice notice-bad">This game doesn&apos;t exist, or it&apos;s private.</p><Link href="/play/online" className="link">Back to the lobby</Link></div>;

  // A game you can't see yet (private invite or before joining): show the preview and a join button.
  if (!g && preview) {
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">{preview.creator_name ?? "Someone"} invited you to a game</h1>
        <p className="text-muted">{tcLabel(preview.base_ms, preview.inc_ms)} · {preview.status === "waiting" ? "waiting for an opponent" : "already started"}</p>
        {!user ? <Link href={`/auth?next=/play/online/${id}`} className="btn btn-primary">Sign in to play</Link>
          : preview.status === "waiting" ? <button className="btn btn-primary" disabled={busy} onClick={() => act("join_game", { p_game: id })}>Join game</button> : null}
        {msg && <p role="alert" className="notice notice-bad">{msg.text}</p>}
      </div>
    );
  }
  if (!g) return <p className="text-muted flex items-center gap-2"><Loader2 size={16} className="animate-spin" aria-hidden /> Loading game…</p>;

  const nm = (id: string | null) => (id ? who[id] ?? "Member" : "Waiting…");
  const flip = myColor === "b";
  const top = flip ? { id: g.white, side: "w" as const } : { id: g.black, side: "b" as const };
  const bottom = flip ? { id: g.black, side: "b" as const } : { id: g.white, side: "w" as const };
  const url = typeof window !== "undefined" ? window.location.href : "";
  const pgn = toPgn(g, { w: nm(g.white), b: nm(g.black) }, url);
  const oppId = myColor === "w" ? g.black : g.white;
  const theirDraw = g.draw_offer && g.draw_offer !== me;
  const rematchForMe = g.rematch_game && myColor;

  const Clock = ({ side, pid }: { side: "w" | "b"; pid: string | null }) => {
    const ms = c ? (side === "w" ? c.w : c.b) : 0;
    const running = c?.running === side;
    const low = ms < 20000 && g.status === "active";
    return (
      <div className="flex items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden className={`h-3.5 w-3.5 border border-ink shrink-0 ${side === "w" ? "bg-[#f4efe4]" : "bg-[#1b2130]"}`} />
          <span className="font-medium truncate">{nm(pid)}</span>
          {pid && pid === me && <span className="text-xs text-muted">(you)</span>}
          {g.status === "active" && turn === side && <span className="text-xs text-electric">to move</span>}
        </div>
        <span aria-label={`${side === "w" ? "White" : "Black"} clock`} className={`font-mono text-2xl tabular-nums px-3 py-1 rounded ${running ? (low ? "bg-bad text-bg" : "bg-fg text-bg") : "bg-surface-2"}`}>{fmtClock(ms)}</span>
      </div>
    );
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,560px)_1fr] gap-8 items-start">
      <div>
        <Clock side={top.side} pid={top.id} />
        <div className="relative">
          <Board id={`online-${g.id}`} fen={boardFen} orientation={flip ? "black" : "white"} onMove={myTurn && !reviewing ? onMove : undefined} lastMove={last ? [last.from, last.to] : null} />
          {promo && (
            <div className="absolute inset-0 bg-bg/80 grid place-items-center" role="dialog" aria-label="Choose promotion piece">
              <div className="card p-4 flex gap-2">
                {(["q", "r", "b", "n"] as const).map((p) => <button key={p} className="btn btn-ghost w-14 h-14 text-xl" onClick={() => { const x = promo; setPromo(null); send(x.from, x.to, p); }}>{{ q: "Queen", r: "Rook", b: "Bishop", n: "Knight" }[p][0]}<span className="sr-only">{{ q: "Queen", r: "Rook", b: "Bishop", n: "Knight" }[p]}</span></button>)}
                <button className="btn btn-ghost" onClick={() => setPromo(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
        <Clock side={bottom.side} pid={bottom.id} />
      </div>

      <div className="space-y-5 min-w-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span>{tcLabel(g.base_ms, g.inc_ms)} · {g.visibility === "public" ? "public" : "private"}</span>
          <span className="flex items-center gap-1">{connected ? <Wifi size={14} aria-hidden /> : <WifiOff size={14} aria-hidden className="text-bad" />}{connected ? "Live" : "Reconnecting…"}</span>
          {myColor && g.status === "active" && oppHere !== null && <span>Opponent {oppHere ? "connected" : "not connected"}</span>}
          {!myColor && g.status === "active" && <span>You are watching</span>}
        </div>

        <div aria-live="polite" className="space-y-2">
          {g.status === "waiting" && (
            <div className="notice space-y-3">
              {g.created_by === me ? <>
                <p><strong>Waiting for {g.invited ? nm(g.invited) : g.is_seek ? "an opponent (quick match)" : "an opponent"}.</strong> {g.is_seek ? "Keep this page open." : "Send this link:"}</p>
                {!g.is_seek && <div className="flex gap-2"><input className="input font-mono text-sm" readOnly value={url} aria-label="Game link" onFocus={(e) => e.target.select()} /><button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(url); setMsg({ ok: true, text: "Link copied." }); }}><Copy size={15} aria-hidden /> Copy</button></div>}
                <button className="btn btn-ghost" disabled={busy} onClick={() => act("cancel_game", { p_game: g.id }, () => router.push("/play/online"))}>Cancel game</button>
              </> : !user ? <Link href={`/auth?next=/play/online/${id}`} className="btn btn-primary">Sign in to play</Link>
                : <button className="btn btn-primary" disabled={busy} onClick={() => act("join_game", { p_game: g.id })}>Join game</button>}
            </div>
          )}
          {g.status === "active" && firstMoveLeft !== null && <p className="notice">{g.ply === 0 ? "White" : "Black"} has {Math.max(0, Math.ceil(firstMoveLeft / 1000))} s to make the first move, or the game is cancelled.</p>}
          {g.status === "active" && myTurn && <p className="font-medium">Your move.</p>}
          {(g.status === "finished" || g.status === "aborted") && <p className="notice notice-ok text-base"><strong>{g.result ?? ""}</strong> {resultText(g, { w: nm(g.white), b: nm(g.black) })}</p>}
          {theirDraw && g.status === "active" && myColor && (
            <div className="notice flex flex-wrap items-center gap-3"><span className="flex-1">{nm(oppId)} offers a draw.</span>
              <button className="btn btn-primary" disabled={busy} onClick={() => act("respond_draw", { p_game: g.id, p_accept: true })}>Accept draw</button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => act("respond_draw", { p_game: g.id, p_accept: false })}>Decline</button></div>
          )}
          {msg && <p role={msg.ok ? "status" : "alert"} className={`notice ${msg.ok ? "notice-ok" : "notice-bad"}`}>{msg.text}</p>}
        </div>

        {g.status === "active" && myColor && (
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" disabled={busy || g.draw_offer === me} onClick={() => act("offer_draw", { p_game: g.id }, (d) => d === "offered" && setMsg({ ok: true, text: "Draw offered." }))}><Handshake size={16} aria-hidden /> {g.draw_offer === me ? "Draw offered" : "Offer draw"}</button>
            <button className="btn btn-ghost hover:!border-bad" disabled={busy} onClick={() => { if (confirm(g.ply < 2 ? "Cancel this game?" : "Resign this game?")) act("resign_game", { p_game: g.id }); }}><Flag size={16} aria-hidden /> {g.ply < 2 ? "Cancel game" : "Resign"}</button>
          </div>
        )}

        {(g.status === "finished" || g.status === "aborted") && (
          <div className="flex flex-wrap gap-2">
            {myColor && <button className="btn btn-primary" disabled={busy} onClick={() => act("request_rematch", { p_game: g.id }, (nid) => router.push(`/play/online/${nid}`))}><RotateCcw size={16} aria-hidden /> {rematchForMe ? "Go to rematch" : "Rematch"}</button>}
            <Link href={`/chess/analysis?pgn=${encodeURIComponent(pgn)}`} className="btn btn-ghost">Open in analysis</Link>
            <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(pgn); setMsg({ ok: true, text: "PGN copied." }); }}><Copy size={15} aria-hidden /> Copy PGN</button>
            <Link href="/play/online" className="btn btn-ghost">New game</Link>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1"><h2 className="text-sm font-medium">Moves</h2>
            {reviewing && <button className="text-sm link" onClick={() => setViewPly(null)}>Back to live position</button>}</div>
          <ol className="grid grid-cols-[2.5rem_1fr_1fr] font-mono text-[15px] border-t border-line max-h-72 overflow-y-auto" aria-label="Moves">
            {Array.from({ length: Math.ceil(g.sans.length / 2) }, (_, k) => (
              <li key={k} className="contents">
                <span className="text-muted py-1.5 border-b border-line">{k + 1}.</span>
                {[2 * k, 2 * k + 1].map((i) => g.sans[i] ? (
                  <button key={i} onClick={() => setViewPly(i + 1)} className={`text-left px-2 py-1.5 border-b border-line ${(reviewing ? viewPly === i + 1 : i === g.sans.length - 1) ? "bg-surface-2 font-semibold" : "hover:bg-surface"}`}>{g.sans[i]}</button>
                ) : <span key={i} className="border-b border-line" />)}
              </li>
            ))}
          </ol>
          {g.sans.length === 0 && <p className="text-sm text-muted pt-2">No moves yet.</p>}
        </div>
      </div>
    </div>
  );
}
