"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { notifyActivity } from "@/lib/stats-context";
import { formatTime } from "@/lib/progress-types";
import { CHALLENGE_COLUMNS, LESSON_OPTIONS, goal, puzzleRating, timeLeft, whereTo, type Challenge } from "@/lib/challenges";
import { errMsg } from "@/lib/online";

interface Row { display_name: string; progress: number; best_ms: number | null; completed_at: string | null; joined_at: string }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ChallengeView({ id }: { id: string }) {
  const { user, loading } = useAuth();
  const [c, setC] = useState<Challenge | null | undefined>(undefined);
  const [me, setMe] = useState<{ progress: number; best_ms: number | null; completed: boolean } | null>(null);
  const [board, setBoard] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async (refresh = true) => {
    const sb = getSupabase(); if (!sb || !UUID.test(id)) { setC(null); return; }
    const { data } = await sb.from("challenges").select(CHALLENGE_COLUMNS).eq("id", id).maybeSingle();
    setC((data as Challenge) ?? null);
    if (!data) return;
    if (user) {
      const { data: p } = await sb.from("challenge_participants").select("progress, best_ms, completed_at").eq("challenge_id", id).eq("user_id", user.id).maybeSingle();
      if (p && refresh) {
        const { data: r } = await sb.rpc("refresh_challenge", { p_challenge: id });
        const x = (r as { progress: number; best_ms: number | null; completed: boolean }[] | null)?.[0];
        setMe(x ?? { progress: p.progress, best_ms: p.best_ms, completed: !!p.completed_at });
        if (x?.completed && !p.completed_at) notifyActivity();
      } else setMe(p ? { progress: p.progress, best_ms: p.best_ms, completed: !!p.completed_at } : null);
    }
    const { data: b } = await sb.rpc("challenge_board", { p_challenge: id });
    setBoard((b ?? []) as Row[]);
  }, [id, user]);
  useEffect(() => { if (!loading) load(); }, [loading, load]);

  const act = async (fn: string) => {
    const sb = getSupabase(); if (!sb) return;
    setBusy(true); setErr(null);
    const { error } = await sb.rpc(fn, { p_challenge: id });
    setBusy(false);
    if (error) setErr(await errMsg(error)); else load();
  };

  if (c === undefined) return <p className="text-muted">Loading…</p>;
  if (c === null) return <div className="space-y-3"><p className="notice">This challenge doesn&apos;t exist.</p><Link href="/challenges" className="link">All challenges</Link></div>;
  const ended = Date.parse(c.ends_at) <= Date.now();
  const go = whereTo(c);
  const pct = me ? Math.min(100, Math.round((me.progress / c.target) * 100)) : 0;

  return (
    <div className="space-y-10">
      <Link href="/challenges" className="text-sm link inline-flex items-center gap-1"><ArrowLeft size={14} aria-hidden /> All challenges</Link>
      <header className="border-b border-ink pb-6 space-y-2">
        <p className="label">{timeLeft(c.ends_at)} · ends {new Date(c.ends_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
        <h1 className="text-3xl sm:text-4xl font-semibold">{c.title}</h1>
        <p className="text-lg">{goal(c)}.</p>
        {c.description && <p className="text-muted whitespace-pre-line">{c.description}</p>}
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />} {copied ? "Link copied" : "Copy link"}</button>
          {!user ? <Link className="btn btn-primary" href={`/auth?next=/challenges/${id}`}>Sign in to join</Link>
            : !me ? !ended && <button className="btn btn-primary" disabled={busy} onClick={() => act("join_challenge")}>Join challenge</button>
              : <>
                {!ended && !me.completed && <Link className="btn btn-primary" href={go.href}>{go.label}</Link>}
                <button className="btn btn-ghost" disabled={busy} onClick={() => load()}>Update my progress</button>
                {!me.completed && <button className="btn btn-ghost" disabled={busy} onClick={() => { if (confirm("Leave this challenge?")) act("leave_challenge"); }}>Leave</button>}
              </>}
        </div>
        {err && <p role="alert" className="notice notice-bad">{err}</p>}
      </header>

      {me && (
        <section aria-labelledby="prog">
          <h2 id="prog" className="text-xl font-semibold mb-2">Your progress</h2>
          {me.completed ? <p className="notice notice-ok">Completed. +50 XP.</p> : (
            <><div className="h-3 bg-surface-2 rounded overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={c.target} aria-valuenow={me.progress}><div className="h-full bg-electric" style={{ width: `${pct}%` }} /></div>
              <p className="text-sm text-muted mt-1.5">{c.kind === "cube_ao5" ? `Best average of 5 since you joined: ${me.best_ms ? formatTime(me.best_ms) : "none yet"}` : `${me.progress} of ${c.target}`}. Only activity after you joined counts{c.kind === "lessons" ? " (lessons count whenever you finished them)" : ""}.</p></>
          )}
        </section>
      )}

      {c.kind === "puzzles" && c.params.items && (
        <section><h2 className="text-xl font-semibold mb-2">The puzzles</h2>
          <ol className="grid sm:grid-cols-2 gap-x-6 border-t border-line">{c.params.items.map((p, i) => <li key={p} className="py-2.5 border-b border-line flex justify-between"><Link className="link" href={`/chess/puzzles?id=${p}`}>Puzzle {i + 1}</Link><span className="text-sm text-muted">rating {puzzleRating(p) ?? "?"}</span></li>)}</ol></section>
      )}
      {c.kind === "lessons" && c.params.items && (
        <section><h2 className="text-xl font-semibold mb-2">The lessons</h2>
          <ul className="border-t border-line">{c.params.items.map((l) => { const o = LESSON_OPTIONS.find((x) => x.id === l); return <li key={l} className="py-2.5 border-b border-line">{o ? <Link className="link" href={o.href}>{o.label}</Link> : l}</li>; })}</ul></section>
      )}

      <section aria-labelledby="lb">
        <h2 id="lb" className="text-xl font-semibold mb-2">Participants ({board.length})</h2>
        {board.length === 0 ? <p className="text-muted">Nobody yet.</p> : (
          <table className="w-full text-[15px]"><thead><tr className="text-left text-sm text-muted border-b border-ink"><th className="py-2 w-10 font-normal">#</th><th className="py-2 font-normal">Member</th><th className="py-2 font-normal text-right">{c.kind === "cube_ao5" ? "Best ao5" : "Progress"}</th></tr></thead>
            <tbody>{board.map((r, i) => (
              <tr key={i} className="border-b border-line"><td className="py-2.5 text-muted tabular-nums">{i + 1}</td><td className="py-2.5">{r.display_name}{r.completed_at && <span className="text-ok text-sm ml-2">done</span>}</td>
                <td className="py-2.5 text-right tabular-nums">{c.kind === "cube_ao5" ? (r.best_ms ? formatTime(r.best_ms) : "—") : `${r.progress} / ${c.target}`}</td></tr>))}</tbody></table>
        )}
        <p className="text-xs text-muted mt-2">Each person&apos;s progress updates when they open this page or press “Update my progress”.</p>
      </section>
    </div>
  );
}
