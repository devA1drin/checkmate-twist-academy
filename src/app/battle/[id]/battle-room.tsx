"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Crown, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { errMsg } from "@/lib/online";
import { notifyActivity } from "@/lib/stats-context";
import { ROOM_COLUMNS, standings, type Player, type Result, type Room } from "@/lib/battle";
import { formatTime } from "@/lib/progress-types";
import { applyAlg, randomMoveScramble, SOLVED } from "@/lib/cube/model";
import { randomStateScramble } from "@/lib/cube/solver-client";
import { CubeNet } from "@/components/cube/cube-net";
import { SolveTimer, type Penalty } from "@/components/cube/solve-timer";
import { ReportButton } from "@/components/forum/report-button";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
interface Preview { name: string; status: string; rounds: number; inspection_s: number; players: number; host_name: string | null }

export function BattleRoom({ id }: { id: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<{ round_no: number; scramble: string; started_at: string }[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase(); if (!sb || !UUID.test(id)) { setRoom(null); return; }
    const isMember = user ? !!(await sb.from("battle_members").select("user_id").eq("room_id", id).eq("user_id", user.id).maybeSingle()).data : false;
    if (!isMember) {
      const { data: pv } = await sb.rpc("battle_room_preview", { p_room: id });
      setPreview((pv as Preview[] | null)?.[0] ?? null); setRoom(null);
      return;
    }
    const [r, p, rd, rs] = await Promise.all([
      sb.from("battle_rooms").select(ROOM_COLUMNS).eq("id", id).maybeSingle(),
      sb.rpc("battle_players", { p_room: id }),
      sb.from("battle_rounds").select("round_no, scramble, started_at").eq("room_id", id).order("round_no"),
      sb.from("battle_results").select("round_no, user_id, time_ms, dnf, created_at").eq("room_id", id),
    ]);
    setPreview(null);
    setRoom((r.data as Room) ?? null); setPlayers((p.data ?? []) as Player[]); setRounds(rd.data ?? []); setResults((rs.data ?? []) as Result[]);
  }, [id, user]);

  useEffect(() => {
    if (loading) return;
    load();
    const sb = getSupabase(); if (!sb || !UUID.test(id)) return;
    const ch = sb.channel(`battle:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_rooms", filter: `id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_members", filter: `room_id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "battle_rounds", filter: `room_id=eq.${id}` }, () => { setReady(false); load(); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "battle_results", filter: `room_id=eq.${id}` }, () => load())
      .subscribe((s) => { if (s === "SUBSCRIBED") load(); });
    const t = setInterval(load, 10000);
    return () => { sb.removeChannel(ch); clearInterval(t); };
  }, [id, loading, load]);

  const rpc = async (fn: string, args: Record<string, unknown>) => {
    const sb = getSupabase(); if (!sb) return false;
    setBusy(true); setErr(null);
    const { error } = await sb.rpc(fn, args);
    setBusy(false);
    if (error) { setErr(await errMsg(error)); return false; }
    load(); return true;
  };

  if (room === undefined && !preview) return <p className="text-muted flex items-center gap-2"><Loader2 size={16} className="animate-spin" aria-hidden /> Loading room…</p>;
  if (!room) {
    if (!preview) return <div className="space-y-3"><p className="notice">This room doesn&apos;t exist.</p><Link className="link" href="/battle">All battles</Link></div>;
    return (
      <div className="max-w-xl space-y-4">
        <p className="label">Cube battle</p>
        <h1 className="text-3xl font-semibold">{preview.name}</h1>
        <p className="text-muted">Hosted by {preview.host_name ?? "someone"} · {preview.players}/4 players · {preview.rounds} round{preview.rounds > 1 ? "s" : ""} · {preview.inspection_s ? `${preview.inspection_s} s inspection` : "no inspection"}</p>
        {preview.status !== "lobby" ? <p className="notice">This battle has already started.</p>
          : !user ? <Link className="btn btn-primary" href={`/auth?next=/battle/${id}`}>Sign in to join</Link>
            : <button className="btn btn-primary" disabled={busy || preview.players >= 4} onClick={() => rpc("join_battle", { p_room: id })}>{preview.players >= 4 ? "Room is full" : "Join battle"}</button>}
        {err && <p role="alert" className="notice notice-bad">{err}</p>}
      </div>
    );
  }

  const isHost = room.host === user?.id;
  const cur = rounds.find((r) => r.round_no === room.current_round);
  const curResults = results.filter((r) => r.round_no === room.current_round);
  const mine = curResults.find((r) => r.user_id === user?.id);
  const allIn = players.length > 0 && players.every((p) => curResults.some((r) => r.user_id === p.user_id));
  const table = standings(players, results, room.rounds);

  const startRound = async () => {
    setBusy(true); setErr(null);
    let s: string;
    try { s = (await randomStateScramble()).scramble; } catch { s = randomMoveScramble(25); }
    setBusy(false);
    await rpc("start_battle_round", { p_room: id, p_scramble: s.trim().replace(/\s+/g, " ") });
  };
  const submit = async (ms: number | null, pen: Penalty | "giveup") => {
    if (!cur) return;
    const dnf = pen === "DNF" || pen === "giveup" || ms === null;
    const ok = await rpc("submit_battle_result", { p_room: id, p_round: cur.round_no, p_time_ms: dnf ? null : ms! + (pen === "+2" ? 2000 : 0), p_dnf: dnf });
    if (ok) notifyActivity();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-5">
        <div>
          <Link href="/battle" className="text-sm link">All battles</Link>
          <h1 className="text-3xl font-semibold mt-1">{room.name}</h1>
          <p className="text-muted">{room.status === "lobby" ? "Waiting to start" : room.status === "finished" ? "Finished" : `Round ${room.current_round} of ${room.rounds}`} · {room.inspection_s ? `${room.inspection_s} s inspection` : "no inspection"} · {players.length}/4 players</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {room.status === "lobby" && <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />} {copied ? "Copied" : "Copy invite link"}</button>}
          {room.status !== "finished" && <button className="btn btn-ghost" disabled={busy} onClick={async () => { if (confirm("Leave this battle?") && await rpc("leave_battle", { p_room: id })) router.push("/battle"); }}>Leave</button>}
        </div>
      </header>
      {err && <p role="alert" className="notice notice-bad">{err}</p>}

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10">
        <section aria-label="Current round" className="space-y-5">
          {room.status === "lobby" && (
            <div className="space-y-4">
              <p className="text-lg">{players.length < 2 ? "Waiting for at least one more player. Send them the invite link." : isHost ? "Everyone in? Start the first round." : "Waiting for the host to start."}</p>
              {isHost && <button className="btn btn-primary" disabled={busy || players.length < 2} onClick={startRound}>{busy ? "Generating scramble…" : "Start round 1"}</button>}
            </div>
          )}
          {room.status === "running" && cur && (
            <>
              <div>
                <p className="label">Round {cur.round_no} scramble (same for everyone)</p>
                <p className="font-mono text-xl sm:text-2xl leading-relaxed mt-1">{cur.scramble}</p>
                <div className="mt-3 max-w-[16rem]"><CubeNet state={applyAlg(SOLVED, cur.scramble)} size={12} /></div>
              </div>
              {mine ? <p className="notice notice-ok">Your time: <strong>{mine.dnf ? "DNF" : formatTime(mine.time_ms)}</strong>. {allIn ? (isHost ? "Everyone is done." : "Everyone is done. Waiting for the host.") : "Waiting for the others…"}</p>
                : !ready ? <div className="flex flex-wrap gap-2"><button className="btn btn-primary" onClick={() => setReady(true)}>I&apos;ve scrambled my cube</button><button className="btn btn-ghost" disabled={busy} onClick={() => { if (confirm("Record a DNF for this round?")) submit(null, "giveup"); }}>Skip (DNF)</button></div>
                  : <SolveTimer key={cur.round_no} inspection={room.inspection_s} onDone={(ms, pen) => submit(ms, pen)} />}
              {isHost && (room.current_round < room.rounds
                ? <button className="btn btn-primary" disabled={busy} onClick={() => { if (allIn || confirm("Not everyone has a time yet. Start the next round anyway?")) startRound(); }}>Start round {room.current_round + 1}</button>
                : <button className="btn btn-primary" disabled={busy} onClick={() => { if (allIn || confirm("Not everyone has a time yet. Finish anyway?")) rpc("finish_battle", { p_room: id }); }}>Finish battle</button>)}
            </>
          )}
          {room.status === "finished" && table[0] && <div className="notice notice-ok text-lg"><Crown size={18} className="inline mr-1.5" aria-hidden /><strong>{table[0].display_name}</strong> wins with {table[0].wins} round win{table[0].wins === 1 ? "" : "s"}.</div>}

          {rounds.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[15px] min-w-[28rem]">
                <caption className="text-left text-sm text-muted pb-2">Times by round. Self-reported; report a time if it looks wrong.</caption>
                <thead><tr className="border-b border-ink text-left text-sm text-muted"><th className="py-2 font-normal">Round</th>{players.map((p) => <th key={p.user_id} className="py-2 font-normal">{p.display_name}{p.user_id === room.host && <span className="sr-only"> (host)</span>}</th>)}</tr></thead>
                <tbody>{[...rounds].reverse().map((r) => {
                  const rr = results.filter((x) => x.round_no === r.round_no);
                  const best = rr.filter((x) => !x.dnf).sort((a, b) => a.time_ms! - b.time_ms!)[0];
                  return (
                    <tr key={r.round_no} className="border-b border-line align-top">
                      <td className="py-2.5 tabular-nums">{r.round_no}</td>
                      {players.map((p) => { const x = rr.find((y) => y.user_id === p.user_id); return (
                        <td key={p.user_id} className={`py-2.5 tabular-nums ${best && x === best ? "font-semibold text-ok" : ""}`}>
                          {x ? (x.dnf ? "DNF" : formatTime(x.time_ms)) : <span className="text-muted">…</span>}
                          {x && !x.dnf && p.user_id !== user?.id && <div><ReportButton type="battle_result" id={`${id}:${r.round_no}:${p.user_id}`} label="Report" reasons={["impossible_time", "cheating", "other"]} /></div>}
                        </td>); })}
                    </tr>);
                })}</tbody>
              </table>
            </div>
          )}
        </section>

        <aside aria-labelledby="standings">
          <h2 id="standings" className="text-xl font-semibold mb-2">Standings</h2>
          <ol className="border-t border-ink">{table.map((p, i) => (
            <li key={p.user_id} className="flex items-center gap-3 py-3 border-b border-line">
              <span className="w-6 text-muted tabular-nums">{i + 1}</span>
              <span className="flex-1 min-w-0 truncate font-medium">{p.display_name}{p.user_id === user?.id && <span className="text-xs text-muted ml-1.5">(you)</span>}{p.user_id === room.host && <span className="text-xs text-muted ml-1.5">host</span>}</span>
              <span className="text-sm text-right"><span className="tabular-nums">{p.wins}</span> win{p.wins === 1 ? "" : "s"}<span className="block text-xs text-muted">mean {p.mean ? formatTime(p.mean) : "—"}{p.dnfs ? ` · ${p.dnfs} DNF` : ""}</span></span>
            </li>))}</ol>
          <p className="text-xs text-muted mt-3">Most round wins takes the battle; ties go to fewer DNFs, then the lower mean.</p>
          {room.status === "finished" && <Link className="btn btn-ghost mt-4" href="/battle">New battle</Link>}
        </aside>
      </div>
    </div>
  );
}
