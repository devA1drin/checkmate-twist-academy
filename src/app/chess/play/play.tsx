"use client";
import { Chess } from "chess.js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Flag, RotateCcw, Undo2, Cpu, Loader2, AlertTriangle, Trophy } from "lucide-react";
import { Board, tryMove } from "@/components/chess/board";
import { useEngine } from "@/lib/chess/use-engine";
import { LEVELS } from "@/lib/chess/engine";
import { gameOverText } from "@/lib/chess/pv";
import { useProgress } from "@/lib/progress-context";

const START = new Chess().fen();

export function PlayVsEngine() {
  const q = useSearchParams();
  const initialFen = useMemo(() => { const f = q.get("fen"); try { return f ? new Chess(f).fen() : START; } catch { return START; } }, [q]);
  const [level, setLevel] = useState(() => Math.min(8, Math.max(1, Number(q.get("level")) || 3)));
  const [color, setColor] = useState<"w" | "b">(() => (initialFen.split(" ")[1] as "w" | "b") ?? "w");
  const [startFen, setStartFen] = useState(initialFen);
  const [history, setHistory] = useState<{ fen: string; san: string; from: string; to: string }[]>([]);
  const [thinking, setThinking] = useState(false);
  const [resigned, setResigned] = useState(false);
  const [gameId, setGameId] = useState(0);
  const recorded = useRef(-1);
  const { engine, status, error } = useEngine();
  const { addGame } = useProgress();

  const fen = history.length ? history[history.length - 1].fen : startFen;
  const game = useMemo(() => new Chess(fen), [fen]);
  const over = resigned ? "You resigned — Stockfish wins" : gameOverText(game);

  // engine reply
  useEffect(() => {
    if (status !== "ready" || over || game.turn() === color) return;
    const L = LEVELS[level - 1];
    let live = true;
    setThinking(true);
    engine.current?.search(fen, { depth: L.depth, movetime: L.movetime, skill: L.skill, multipv: 1 }).then((u) => {
      if (!live || !u || u === "(none)") return;
      const r = tryMove(fen, u.slice(0, 2), u.slice(2, 4), u[4] ?? "q");
      if (r) setHistory((h) => [...h, { fen: r.game.fen(), san: r.move.san, from: r.move.from, to: r.move.to }]);
    }).catch(() => undefined).finally(() => { if (live) setThinking(false); });
    return () => { live = false; };
  }, [fen, status, over, color, level, engine, game]);

  // record finished games once
  useEffect(() => {
    if (!over || recorded.current === gameId || history.length < 2) return;
    recorded.current = gameId;
    let result: "win" | "loss" | "draw" = "draw";
    if (resigned) result = "loss";
    else if (game.isCheckmate()) result = game.turn() === color ? "loss" : "win";
    addGame({ result, level, at: new Date().toISOString() });
  }, [over, gameId, history.length, resigned, game, color, level, addGame]);

  const onMove = (from: string, to: string) => {
    if (over || thinking || game.turn() !== color) return false;
    const r = tryMove(fen, from, to);
    if (!r) return false;
    setHistory((h) => [...h, { fen: r.game.fen(), san: r.move.san, from, to }]);
    return true;
  };

  const newGame = (c = color, f = startFen) => { engine.current?.stop(); engine.current?.newGame(); setColor(c); setStartFen(f); setHistory([]); setResigned(false); setGameId((g) => g + 1); };
  const takeBack = () => {
    if (thinking) return;
    // undo the engine's reply and your move
    setHistory((h) => { const n = h.slice(); n.pop(); if (n.length && new Chess(n.length ? n[n.length - 1].fen : startFen).turn() !== color) n.pop(); return n; });
  };
  const last = history[history.length - 1];
  const won = over && !resigned && game.isCheckmate() && game.turn() !== color;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_1fr]">
      <div>
        <Board id="play" fen={fen} orientation={color === "w" ? "white" : "black"} onMove={onMove} lastMove={last ? [last.from, last.to] : null} />
        <div className="mt-3 flex items-center gap-2 text-sm min-h-6">
          {status === "loading" && <><Loader2 size={15} className="animate-spin" /> Loading Stockfish…</>}
          {status === "error" && <span className="text-red-400 flex items-center gap-1.5"><AlertTriangle size={15} /> Engine failed to load: {error}</span>}
          {status === "ready" && !over && (thinking ? <><Cpu size={15} className="text-aqua animate-pulse" /> Stockfish is thinking…</> : game.turn() === color ? <span>Your move ({color === "w" ? "White" : "Black"}){game.inCheck() ? " — you are in check!" : ""}</span> : null)}
        </div>
        {over && <div className={`mt-3 rounded-xl border p-3 flex items-center gap-2 ${won ? "border-emerald-400/50 bg-emerald-400/10" : "border-violet/40 bg-violet/10"}`}>{won && <Trophy size={18} className="text-emerald-400" />}<span className="font-semibold">{over}</span><Link className="ml-auto text-sm text-electric hover:underline" href={`/chess/analysis?fen=${encodeURIComponent(fen)}`}>Analyse final position</Link></div>}
      </div>
      <div className="space-y-4">
        <div className="card p-4 space-y-3">
          <label className="block text-sm font-semibold">Strength</label>
          <select className="input" value={level} onChange={(e) => setLevel(+e.target.value)}>{LEVELS.map((l) => <option key={l.level} value={l.level}>{l.label}</option>)}</select>
          <div className="text-sm font-semibold">Play as</div>
          <div className="flex gap-2">
            <button className={`btn ${color === "w" ? "btn-primary" : "btn-ghost"}`} onClick={() => newGame("w")}>White</button>
            <button className={`btn ${color === "b" ? "btn-primary" : "btn-ghost"}`} onClick={() => newGame("b")}>Black</button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button className="btn btn-ghost" onClick={() => newGame()}><RotateCcw size={15} /> New game</button>
            {startFen !== START && <button className="btn btn-ghost" onClick={() => newGame(color, START)}>Standard start</button>}
            <button className="btn btn-ghost" onClick={takeBack} disabled={!history.length || !!over}><Undo2 size={15} /> Take back</button>
            <button className="btn btn-ghost" onClick={() => setResigned(true)} disabled={!!over || history.length < 2}><Flag size={15} /> Resign</button>
          </div>
          {startFen !== START && <p className="text-xs text-muted">Starting from a custom position (FEN).</p>}
        </div>
        <div className="card p-4">
          <div className="font-semibold mb-2">Moves</div>
          {history.length === 0 ? <p className="text-sm text-muted">{color === "b" && game.turn() === "w" ? "Stockfish moves first." : "Make your first move."}</p> : (
            <ol className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-0.5 font-mono text-sm max-h-72 overflow-auto">
              {(() => {
                const sans = history.map((h) => h.san);
                const bFirst = startFen.split(" ")[1] === "b";
                const all = bFirst ? ["…", ...sans] : sans;
                const n0 = Number(startFen.split(" ")[5] ?? 1);
                const rows = [];
                for (let i = 0; i < all.length; i += 2) rows.push(<li key={i} className="contents"><span className="text-muted">{n0 + i / 2}.</span><span>{all[i]}</span><span>{all[i + 1] ?? ""}</span></li>);
                return rows;
              })()}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
