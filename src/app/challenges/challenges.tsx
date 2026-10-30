"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { CHALLENGE_COLUMNS, KINDS, KIT_OPTIONS, LESSON_OPTIONS, PUZZLE_BANDS, goal, pickPuzzles, timeLeft, type Challenge, type ChallengeKind } from "@/lib/challenges";

export function Challenges() {
  const { user, configured } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState<Challenge[] | null>(null);
  const [mine, setMine] = useState<(Challenge & { progress: number; completed: boolean })[]>([]);
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState({ title: "", description: "", kind: "puzzles" as ChallengeKind, target: 5, days: 7, band: "mid", kit: KIT_OPTIONS[0]?.id ?? "", lessons: [] as string[], seconds: 30, visibility: "public" as "public" | "link" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase(); if (!sb) return;
    const now = new Date().toISOString();
    const { data } = await sb.from("challenges").select(CHALLENGE_COLUMNS).eq("visibility", "public").gt("ends_at", now).order("created_at", { ascending: false }).limit(40);
    setOpen((data ?? []) as Challenge[]);
    if (user) {
      const { data: parts } = await sb.from("challenge_participants").select("challenge_id, progress, completed_at").eq("user_id", user.id);
      const ids = (parts ?? []).map((p) => p.challenge_id);
      if (ids.length) {
        const { data: cs } = await sb.from("challenges").select(CHALLENGE_COLUMNS).in("id", ids).order("ends_at", { ascending: false });
        setMine(((cs ?? []) as Challenge[]).map((c) => { const p = parts!.find((x) => x.challenge_id === c.id)!; return { ...c, progress: p.progress, completed: !!p.completed_at }; }));
      } else setMine([]);
    }
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase(); if (!sb) return;
    let params: Record<string, unknown> = {}, target = f.target;
    if (f.kind === "puzzles") { const items = pickPuzzles(f.band, Math.min(Math.max(f.target, 1), 30)); params = { items, band: f.band }; target = items.length; }
    if (f.kind === "lessons") { if (!f.lessons.length) { setErr("Pick at least one lesson."); return; } params = { items: f.lessons }; target = f.lessons.length; }
    if (f.kind === "kit") params = { kit: f.kit };
    if (f.kind === "cube_ao5") { params = { target_ms: Math.round(f.seconds * 1000) }; target = 1; }
    setBusy(true); setErr(null);
    const { data, error } = await sb.rpc("create_challenge", { p_title: f.title.trim(), p_description: f.description.trim(), p_kind: f.kind, p_params: params, p_target: target, p_days: f.days, p_visibility: f.visibility });
    setBusy(false);
    if (error) setErr(error.message); else router.push(`/challenges/${data}`);
  };

  if (!configured) return <p className="notice">Challenges need the site&apos;s database.</p>;

  return (
    <div className="space-y-12">
      {mine.length > 0 && (
        <section aria-labelledby="mine"><h2 id="mine" className="text-xl font-semibold mb-3">Your challenges</h2>
          <ul className="border-t border-ink">{mine.map((c) => (
            <li key={c.id} className="list-row flex-wrap">
              <Link href={`/challenges/${c.id}`} className="flex-1 min-w-0"><span className="font-medium hover:underline">{c.title}</span><span className="block text-sm text-muted">{goal(c)} · {timeLeft(c.ends_at)}</span></Link>
              <span className={`text-sm tabular-nums ${c.completed ? "text-ok font-medium" : ""}`}>{c.completed ? "Completed" : `${c.progress} / ${c.target}`}</span>
            </li>))}</ul>
        </section>
      )}

      <section aria-labelledby="new">
        <div className="flex items-center justify-between mb-3"><h2 id="new" className="text-xl font-semibold">Create a challenge</h2>
          {user ? <button className="btn btn-ghost" aria-expanded={creating} onClick={() => setCreating((c) => !c)}>{creating ? "Close" : "New challenge"}</button> : <Link className="btn btn-ghost" href="/auth?next=/challenges">Sign in to create</Link>}</div>
        {creating && user && (
          <form onSubmit={create} className="border border-ink rounded p-4 sm:p-6 space-y-5">
            <fieldset><legend className="label mb-2">Type</legend>
              <div className="grid sm:grid-cols-3 gap-2">{KINDS.map((k) => (
                <label key={k.id} className={`border rounded p-3 cursor-pointer ${f.kind === k.id ? "border-electric ring-1 ring-electric" : "border-line hover:border-ink"}`}>
                  <input type="radio" name="kind" className="sr-only" checked={f.kind === k.id} onChange={() => setF({ ...f, kind: k.id })} />
                  <span className="font-medium block">{k.label}</span><span className="text-sm text-muted">{k.help}</span></label>))}</div>
            </fieldset>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block"><span className="label">Title</span><input className="input mt-1" required minLength={3} maxLength={80} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Ten tactics this week" /></label>
              <label className="block"><span className="label">Length</span><select className="input mt-1" value={f.days} onChange={(e) => setF({ ...f, days: +e.target.value })}>{[1, 3, 7, 14, 30].map((d) => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}</select></label>
            </div>
            {f.kind === "puzzles" && <div className="grid sm:grid-cols-2 gap-4">
              <label className="block"><span className="label">Rating</span><select className="input mt-1" value={f.band} onChange={(e) => setF({ ...f, band: e.target.value })}>{PUZZLE_BANDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select></label>
              <label className="block"><span className="label">Number of puzzles</span><input type="number" min={1} max={30} className="input mt-1" value={f.target} onChange={(e) => setF({ ...f, target: +e.target.value })} /></label></div>}
            {f.kind === "kit" && <div className="grid sm:grid-cols-2 gap-4">
              <label className="block"><span className="label">Opening kit</span><select className="input mt-1" value={f.kit} onChange={(e) => setF({ ...f, kit: e.target.value })}>{KIT_OPTIONS.map((k) => <option key={k.id} value={k.id}>{k.label} ({k.lines} lines)</option>)}</select></label>
              <label className="block"><span className="label">Lines to drill correctly</span><input type="number" min={1} max={KIT_OPTIONS.find((k) => k.id === f.kit)?.lines ?? 20} className="input mt-1" value={f.target} onChange={(e) => setF({ ...f, target: +e.target.value })} /></label></div>}
            {(f.kind === "solves" || f.kind === "online_wins") && <label className="block max-w-xs"><span className="label">{f.kind === "solves" ? "Number of solves" : "Number of wins"}</span><input type="number" min={1} max={500} className="input mt-1" value={f.target} onChange={(e) => setF({ ...f, target: +e.target.value })} /></label>}
            {f.kind === "cube_ao5" && <label className="block max-w-xs"><span className="label">Target average (seconds)</span><input type="number" min={5} max={600} step={0.5} className="input mt-1" value={f.seconds} onChange={(e) => setF({ ...f, seconds: +e.target.value })} /></label>}
            {f.kind === "lessons" && <fieldset><legend className="label mb-2">Lessons ({f.lessons.length} picked)</legend>
              <div className="max-h-64 overflow-y-auto border border-line rounded divide-y divide-line">{LESSON_OPTIONS.map((l) => (
                <label key={l.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface"><input type="checkbox" className="h-4 w-4" checked={f.lessons.includes(l.id)} onChange={(e) => setF({ ...f, lessons: e.target.checked ? [...f.lessons, l.id] : f.lessons.filter((x) => x !== l.id) })} />{l.label}</label>))}</div></fieldset>}
            <label className="block"><span className="label">Description (optional)</span><textarea className="input mt-1" maxLength={500} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
            <div><span className="label">Who can find it</span><div className="seg mt-1" role="group" aria-label="Visibility"><button type="button" aria-pressed={f.visibility === "public"} onClick={() => setF({ ...f, visibility: "public" })}>Listed publicly</button><button type="button" aria-pressed={f.visibility === "link"} onClick={() => setF({ ...f, visibility: "link" })}>Only with the link</button></div></div>
            {err && <p role="alert" className="notice notice-bad">{err}</p>}
            <button className="btn btn-primary" disabled={busy}>Create challenge</button>
          </form>
        )}
      </section>

      <section aria-labelledby="open">
        <h2 id="open" className="text-xl font-semibold mb-3">Open challenges</h2>
        {open === null ? <p className="text-muted">Loading…</p> : open.length === 0 ? <p className="text-muted border-t border-ink pt-3">No public challenges are running. Create the first one.</p> : (
          <ul className="border-t border-ink">{open.map((c) => (
            <li key={c.id} className="list-row flex-wrap">
              <Link href={`/challenges/${c.id}`} className="flex-1 min-w-0"><span className="font-medium hover:underline">{c.title}</span><span className="block text-sm text-muted">{goal(c)}</span></Link>
              <span className="text-sm text-muted">{timeLeft(c.ends_at)}</span>
            </li>))}</ul>
        )}
      </section>
    </div>
  );
}
