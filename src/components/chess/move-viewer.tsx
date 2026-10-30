"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, FlipVertical2 } from "lucide-react";
import { Board } from "./board";
import { playSan, START_FEN, analysisHref } from "@/lib/chess/san";

/** Step through a move list (SAN from the start position). Arrow keys work when the viewer has focus. */
export function MoveViewer({ id, moves, orientation = "white", startAt, note, footer }: { id: string; moves: string; orientation?: "white" | "black"; startAt?: number; note?: React.ReactNode; footer?: React.ReactNode }) {
  const plies = useMemo(() => playSan(moves), [moves]);
  const [i, setI] = useState(startAt ?? plies.length);
  const [flip, setFlip] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => { setI(startAt ?? plies.length); }, [moves, startAt, plies.length]);
  useEffect(() => { listRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "nearest" }); }, [i]);
  const fen = i === 0 ? START_FEN : plies[i - 1].fen;
  const o = flip ? (orientation === "white" ? "black" : "white") : orientation;
  const go = (n: number) => setI(Math.max(0, Math.min(plies.length, n)));
  const key = (e: React.KeyboardEvent) => {
    const m: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: plies.length };
    if (e.key in m) { e.preventDefault(); go(m[e.key]); }
  };
  const pairs: [number, string, string | undefined][] = [];
  for (let k = 0; k < plies.length; k += 2) pairs.push([k, plies[k].san, plies[k + 1]?.san]);

  return (
    <div className="grid md:grid-cols-[minmax(0,420px)_1fr] gap-6 items-start" onKeyDown={key}>
      <div>
        <Board id={id} fen={fen} orientation={o} lastMove={i > 0 ? [plies[i - 1].from, plies[i - 1].to] : null} />
        <div className="flex items-center gap-1 mt-2" role="group" aria-label="Move controls">
          {([[ChevronFirst, 0, "First position"], [ChevronLeft, i - 1, "Previous move"], [ChevronRight, i + 1, "Next move"], [ChevronLast, plies.length, "Last position"]] as const).map(([Icon, n, label]) => (
            <button key={label} className="btn btn-ghost !px-0 w-12" onClick={() => go(n)} aria-label={label}><Icon size={18} aria-hidden /></button>
          ))}
          <button className="btn btn-ghost !px-0 w-12 ml-auto" onClick={() => setFlip(!flip)} aria-label="Flip board"><FlipVertical2 size={17} aria-hidden /></button>
        </div>
      </div>
      <div className="min-w-0">
        {note}
        <ol ref={listRef} tabIndex={0} aria-label="Moves (use arrow keys)" className="grid grid-cols-[2.5rem_1fr_1fr] text-[15px] font-mono border-t border-line max-h-[360px] overflow-y-auto focus-visible:outline-2">
          {pairs.map(([k, w, b]) => (
            <li key={k} className="contents">
              <span className="text-muted py-1.5 border-b border-line">{k / 2 + 1}.</span>
              <button className={`text-left px-2 py-1.5 border-b border-line ${i === k + 1 ? "bg-electric text-on-electric" : "hover:bg-surface-2"}`} aria-current={i === k + 1 ? "step" : undefined} onClick={() => go(k + 1)}>{w}</button>
              {b ? <button className={`text-left px-2 py-1.5 border-b border-line ${i === k + 2 ? "bg-electric text-on-electric" : "hover:bg-surface-2"}`} aria-current={i === k + 2 ? "step" : undefined} onClick={() => go(k + 2)}>{b}</button> : <span className="border-b border-line" />}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm">
          <Link href={analysisHref(moves)} className="link">Open in analysis board</Link>
          {footer}
        </div>
      </div>
    </div>
  );
}
