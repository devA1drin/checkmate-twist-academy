"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Lightbulb, RotateCcw, X } from "lucide-react";
import { Board } from "@/components/chess/board";
import { playSan, START_FEN, numbered } from "@/lib/chess/san";
import type { OpeningKit } from "@/data/openings/kits";
import { useAuth } from "@/lib/auth-context";
import { loadReviews, recordDrill, isDue, dueLabel, type Reviews } from "@/lib/kit-reviews";

/**
 * Opening drill. You play your side's moves from memory; the other side replies automatically.
 * A line played with no mistakes moves up a Leitner box (seen again in 1, 2, 4, 8… days).
 */
export function Drill({ kit }: { kit: OpeningKit }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Reviews>({});
  const [lineId, setLineId] = useState(kit.lines[0].id);
  const [pos, setPos] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [done, setDone] = useState(false);
  const line = kit.lines.find((l) => l.id === lineId)!;
  const plies = useMemo(() => playSan(line.moves), [line.moves]);
  const mine = (i: number) => (kit.side === "white" ? i % 2 === 0 : i % 2 === 1);
  const fen = pos === 0 ? START_FEN : plies[pos - 1].fen;

  useEffect(() => {
    let live = true;
    loadReviews(kit.slug, user?.id).then((r) => {
      if (!live) return;
      setReviews(r);
      const first = kit.lines.find((l) => isDue(r[l.id]));
      if (first) setLineId(first.id);
    });
    return () => { live = false; };
  }, [kit, user?.id]);

  const restart = useCallback((id: string) => { setLineId(id); setPos(0); setMistakes(0); setHint(false); setFeedback(null); setDone(false); }, []);

  // Opponent replies automatically; finishing the last of your moves ends the line.
  useEffect(() => {
    if (done) return;
    if (pos >= plies.length || (!plies.slice(pos).some((_, k) => mine(pos + k)))) {
      if (pos > 0 || plies.length === 0) {
        setDone(true);
        const correct = mistakes === 0;
        recordDrill(kit.slug, line.id, correct, reviews[line.id], user?.id).then((r) => setReviews((x) => ({ ...x, [line.id]: r })));
        setFeedback({ ok: correct, text: correct ? "Line complete with no mistakes. You'll see it again later." : `Line complete with ${mistakes} mistake${mistakes === 1 ? "" : "s"}. It comes back tomorrow.` });
      }
      return;
    }
    if (!mine(pos)) { const t = setTimeout(() => setPos((p) => p + 1), 450); return () => clearTimeout(t); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, plies, done]);

  const onMove = (from: string, to: string) => {
    if (done || !mine(pos)) return false;
    const want = plies[pos];
    if (want.from === from && want.to === to) { setPos(pos + 1); setHint(false); setFeedback(null); return true; }
    setMistakes((m) => m + 1); setHint(true);
    setFeedback({ ok: false, text: `Not this line. The move here is ${want.san}; the arrow shows it.` });
    return false;
  };

  const sideName = kit.side === "white" ? "White" : "Black";
  const due = kit.lines.filter((l) => isDue(reviews[l.id])).length;
  const next = kit.lines.find((l) => l.id !== line.id && isDue(reviews[l.id])) ?? kit.lines[(kit.lines.indexOf(line) + 1) % kit.lines.length];

  return (
    <div className="grid md:grid-cols-[minmax(0,420px)_1fr] gap-6 items-start">
      <div>
        <Board id={`drill-${kit.slug}`} fen={fen} orientation={kit.side} onMove={onMove}
          lastMove={pos > 0 ? [plies[pos - 1].from, plies[pos - 1].to] : null}
          arrows={hint && pos < plies.length ? [{ startSquare: plies[pos].from, endSquare: plies[pos].to, color: "rgba(29,79,216,.8)" }] : []} />
        <div className="flex gap-2 mt-2">
          <button className="btn btn-ghost" onClick={() => { if (!done && mine(pos)) { setHint(true); setMistakes((m) => m + 1); } }} disabled={done || !mine(pos)}><Lightbulb size={16} aria-hidden /> Show move</button>
          <button className="btn btn-ghost" onClick={() => restart(line.id)}><RotateCcw size={16} aria-hidden /> Restart line</button>
        </div>
      </div>
      <div className="min-w-0 space-y-4">
        <div>
          <p className="text-sm text-muted">You play {sideName}. Play the moves of this line from memory.</p>
          <h3 className="text-lg font-semibold mt-1">{line.name} <span className="font-mono text-xs text-muted">{line.eco}</span></h3>
          <p className="font-mono text-sm mt-2 min-h-[1.5rem]" aria-live="polite">{numbered(plies.slice(0, pos)) || "Starting position"}</p>
        </div>
        <div aria-live="assertive">
          {feedback && <p className={`notice flex gap-2 ${feedback.ok ? "notice-ok" : "notice-bad"}`}>{feedback.ok ? <Check size={17} className="text-ok shrink-0 mt-0.5" aria-hidden /> : <X size={17} className="text-bad shrink-0 mt-0.5" aria-hidden />}{feedback.text}</p>}
          {!feedback && !done && <p className="text-sm">{mine(pos) ? <strong>Your move.</strong> : "Opponent is replying…"}</p>}
        </div>
        {done && <button className="btn btn-primary" onClick={() => restart(next.id)}>Next line: {next.name}</button>}
        <div>
          <div className="flex items-baseline justify-between"><h4 className="text-sm font-medium">Lines in this kit</h4><span className="text-xs text-muted">{due} due</span></div>
          <ul className="border-t border-line mt-1">
            {kit.lines.map((l) => (
              <li key={l.id}>
                <button onClick={() => restart(l.id)} aria-current={l.id === line.id ? "true" : undefined}
                  className={`w-full text-left flex items-center justify-between gap-3 py-2.5 px-2 border-b border-line text-sm min-h-[44px] ${l.id === line.id ? "bg-surface-2 font-medium" : "hover:bg-surface"}`}>
                  <span>{l.name}</span>
                  <span className={`text-xs font-mono shrink-0 ${isDue(reviews[l.id]) ? "text-electric" : "text-muted"}`}>{dueLabel(reviews[l.id])}{reviews[l.id] ? ` · box ${reviews[l.id].box}` : ""}</span>
                </button>
              </li>
            ))}
          </ul>
          {!user && <p className="help">Drill progress is saved in this browser. Sign in to keep it on every device and earn XP.</p>}
        </div>
      </div>
    </div>
  );
}
