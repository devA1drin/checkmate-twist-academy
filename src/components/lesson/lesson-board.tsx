"use client";
import { Chess } from "chess.js";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Cpu, Swords, Hand } from "lucide-react";
import { Board, tryMove } from "@/components/chess/board";
import type { BoardBlock } from "@/data/lesson-types";

/** Interactive lesson board: step through the lesson line, or explore freely with legal moves. */
export function LessonBoard({ block, id }: { block: BoardBlock; id: string }) {
  const start = block.fen ?? new Chess().fen();
  const line = useMemo(() => {
    const g = new Chess(start);
    const fens = [start]; const sans: string[] = []; const last: ([string, string] | null)[] = [null];
    for (const s of block.moves ?? []) { const m = g.move(s); fens.push(g.fen()); sans.push(m.san); last.push([m.from, m.to]); }
    return { fens, sans, last };
  }, [start, block.moves]);
  const [ply, setPly] = useState(0);
  const [explore, setExplore] = useState<{ fen: string; last: [string, string] | null } | null>(null);
  const fen = explore?.fen ?? line.fens[ply];
  const startNo = Number(start.split(" ")[5] ?? 1);
  const blackFirst = start.split(" ")[1] === "b";

  const onMove = (from: string, to: string) => {
    const r = tryMove(fen, from, to);
    if (!r) return false;
    // following the lesson line? advance; otherwise switch to free exploration
    if (!explore && line.sans[ply] === r.move.san) { setPly(ply + 1); return true; }
    setExplore({ fen: r.game.fen(), last: [from, to] });
    return true;
  };

  return (
    <figure className="card p-3 sm:p-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,340px)_1fr] items-start">
        <Board id={id} fen={fen} orientation={block.orientation} onMove={onMove} lastMove={explore ? explore.last : line.last[ply]} />
        <div className="space-y-3 text-sm">
          <figcaption className="text-muted">{block.caption}</figcaption>
          {line.sans.length > 0 && (
            <div className="flex flex-wrap gap-1 font-mono text-xs">
              {line.sans.map((s, i) => {
                const idx = i + (blackFirst ? 1 : 0);
                const num = startNo + Math.floor(idx / 2);
                const label = idx % 2 === 0 ? `${num}.${s}` : i === 0 ? `${num}...${s}` : s;
                return <button key={i} onClick={() => { setExplore(null); setPly(i + 1); }} className={`rounded px-1.5 py-0.5 ${!explore && ply === i + 1 ? "bg-electric text-white" : "hover:bg-surface-2"}`}>{label}</button>;
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {line.sans.length > 0 && <>
              <button className="btn btn-ghost !px-2" aria-label="Previous move" onClick={() => { setExplore(null); setPly(Math.max(0, ply - 1)); }}><ChevronLeft size={16} /></button>
              <button className="btn btn-ghost !px-2" aria-label="Next move" onClick={() => { setExplore(null); setPly(Math.min(line.sans.length, ply + 1)); }}><ChevronRight size={16} /></button>
            </>}
            <button className="btn btn-ghost !px-2" aria-label="Reset" onClick={() => { setExplore(null); setPly(0); }}><RotateCcw size={16} /></button>
            <Link className="btn btn-ghost" href={`/chess/analysis?fen=${encodeURIComponent(fen)}`}><Cpu size={15} /> Analyse</Link>
            {block.practice && <Link className="btn btn-primary" href={`/chess/play?fen=${encodeURIComponent(start)}&level=${block.practice.level}`}><Swords size={15} /> {block.practice.label}</Link>}
          </div>
          <p className="text-xs text-muted flex items-center gap-1.5"><Hand size={13} /> {explore ? "Exploring your own moves — press reset to return to the lesson line." : "Drag or tap pieces to explore. Playing the lesson move advances the line."}</p>
        </div>
      </div>
    </figure>
  );
}
