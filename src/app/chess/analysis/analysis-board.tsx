"use client";
import { Chess } from "chess.js";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, FlipVertical2, Copy, Upload, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Board, tryMove } from "@/components/chess/board";
import { EvalBar } from "@/components/chess/eval-bar";
import { useEngine } from "@/lib/chess/use-engine";
import { formatScore, type EngineLine } from "@/lib/chess/engine";
import { gameOverText, pvToSan } from "@/lib/chess/pv";

interface Node { fen: string; san: string; from: string; to: string }
const START = new Chess().fen();

export function AnalysisBoard() {
  const q = useSearchParams();
  const [root, setRoot] = useState(START);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [idx, setIdx] = useState(0);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [engineOn, setEngineOn] = useState(true);
  const [multipv, setMultipv] = useState(3);
  const [lines, setLines] = useState<EngineLine[]>([]);
  const [importText, setImportText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { engine, status, error } = useEngine();

  const load = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    // Try FEN first, then PGN
    try {
      const g = new Chess(t);
      setRoot(g.fen()); setNodes([]); setIdx(0); setMsg({ ok: true, text: "FEN loaded." }); return;
    } catch { /* not a FEN */ }
    try {
      const g = new Chess(); g.loadPgn(t);
      const hist = g.history({ verbose: true });
      const start = hist.length ? hist[0].before : g.fen();
      setRoot(start);
      setNodes(hist.map((m) => ({ fen: m.after, san: m.san, from: m.from, to: m.to })));
      setIdx(hist.length); setMsg({ ok: true, text: `PGN loaded: ${hist.length} plies.` });
    } catch (e) { setMsg({ ok: false, text: `Could not read that as FEN or PGN: ${(e as Error).message}` }); }
  }, []);

  useEffect(() => { const f = q.get("pgn") || q.get("fen"); if (f) load(f); }, [q, load]);

  const fen = idx === 0 ? root : nodes[idx - 1].fen;
  const game = useMemo(() => new Chess(fen), [fen]);
  const over = gameOverText(game);

  useEffect(() => {
    setLines([]);
    if (!engineOn || status !== "ready" || over) { engine.current?.stop(); return; }
    let live = true;
    const t = setTimeout(() => {
      engine.current?.search(fen, { depth: 22, multipv }, (ls) => { if (live) setLines(ls); }).catch(() => undefined);
    }, 120);
    return () => { live = false; clearTimeout(t); };
  }, [fen, engineOn, multipv, status, over, engine]);

  const onMove = (from: string, to: string) => {
    const r = tryMove(fen, from, to);
    if (!r) return false;
    const next = nodes.slice(0, idx);
    // if the move matches the existing continuation, just step forward
    if (nodes[idx]?.san === r.move.san) { setIdx(idx + 1); return true; }
    setNodes([...next, { fen: r.game.fen(), san: r.move.san, from, to }]);
    setIdx(idx + 1);
    return true;
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(nodes.length, i + 1));
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [nodes.length]);

  const best = lines[0];
  const arrows = best?.pv[0] ? [{ startSquare: best.pv[0].slice(0, 2), endSquare: best.pv[0].slice(2, 4), color: "rgba(34,211,238,0.85)" }] : [];
  const pgn = useMemo(() => {
    const g = new Chess(root);
    for (const n of nodes) g.move(n.san);
    if (root !== START) { g.header("SetUp", "1", "FEN", root); }
    return g.pgn();
  }, [root, nodes]);
  const startNo = Number(root.split(" ")[5] ?? 1), blackFirst = root.split(" ")[1] === "b";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_1fr]">
      <div>
        <div className="flex gap-2">
          <EvalBar line={engineOn ? best : undefined} orientation={orientation} />
          <Board id="analysis" fen={fen} orientation={orientation} onMove={onMove} arrows={engineOn ? arrows : []} lastMove={idx > 0 ? [nodes[idx - 1].from, nodes[idx - 1].to] : null} className="flex-1" />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button className="btn btn-ghost !px-2" aria-label="Start" onClick={() => setIdx(0)}><ChevronFirst size={16} /></button>
          <button className="btn btn-ghost !px-2" aria-label="Back" onClick={() => setIdx(Math.max(0, idx - 1))}><ChevronLeft size={16} /></button>
          <button className="btn btn-ghost !px-2" aria-label="Forward" onClick={() => setIdx(Math.min(nodes.length, idx + 1))}><ChevronRight size={16} /></button>
          <button className="btn btn-ghost !px-2" aria-label="End" onClick={() => setIdx(nodes.length)}><ChevronLast size={16} /></button>
          <button className="btn btn-ghost" onClick={() => setOrientation(orientation === "white" ? "black" : "white")}><FlipVertical2 size={15} /> Flip</button>
          <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(fen); setMsg({ ok: true, text: "FEN copied." }); }}><Copy size={15} /> FEN</button>
          <Link className="btn btn-ghost" href={`/chess/play?fen=${encodeURIComponent(fen)}`}>Play from here</Link>
        </div>
        {over && <p className="mt-3 border-l-2 border-chess pl-3 text-sm font-medium">{over}</p>}
      </div>

      <div className="space-y-4 min-w-0">
        <div className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <div><div className="font-semibold">Stockfish 19</div><div className="text-xs text-muted">Lite WASM build, running in this tab</div></div>
            <div className="flex items-center gap-2 text-sm">
              <select className="input !py-1 !w-auto" value={multipv} onChange={(e) => setMultipv(+e.target.value)} aria-label="Number of lines">{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} line{n > 1 ? "s" : ""}</option>)}</select>
              <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={engineOn} onChange={(e) => setEngineOn(e.target.checked)} /> On</label>
            </div>
          </div>
          <div className="mt-3 text-sm border-t border-line pt-2">
            {status === "loading" && <div className="text-muted flex items-center gap-2"><Loader2 className="animate-spin" size={15} /> Loading engine…</div>}
            {status === "error" && <div className="text-bad flex items-center gap-2"><AlertTriangle size={15} /> Engine failed to load: {error}</div>}
            {status === "ready" && engineOn && !over && lines.length === 0 && <div className="text-muted flex items-center gap-2"><Loader2 className="animate-spin" size={15} /> Thinking…</div>}
            {engineOn && !over && lines.map((l) => (
              <button key={l.multipv} className="w-full text-left border-t border-line first:border-t-0 hover:bg-surface-2 px-1 py-2 flex gap-3" onClick={() => { const u = l.pv[0]; if (u) onMove(u.slice(0, 2), u.slice(2, 4)); }}>
                <span className={`font-mono font-bold w-14 shrink-0 tabular-nums`}>{formatScore(l)}</span>
                <span className="font-mono text-xs leading-5 truncate">{pvToSan(fen, l.pv).join(" ")}</span>
              </button>
            ))}
            {engineOn && best && <div className="text-xs text-muted">Depth {best.depth} · evaluation from White&apos;s point of view</div>}
          </div>
        </div>

        <div className="card p-4">
          <div className="eyebrow mb-2">Moves</div>
          {nodes.length === 0 ? <p className="text-sm text-muted">Make a move on the board or import a game.</p> : (
            <div className="flex flex-wrap gap-1 font-mono text-sm max-h-48 overflow-auto">
              {nodes.map((n, i) => {
                const k = i + (blackFirst ? 1 : 0), num = startNo + Math.floor(k / 2);
                return <button key={i} onClick={() => setIdx(i + 1)} className={`rounded-sm px-1.5 py-0.5 ${idx === i + 1 ? "bg-fg text-bg" : "hover:bg-surface-2"}`}>{k % 2 === 0 ? `${num}.` : i === 0 ? `${num}...` : ""}{n.san}</button>;
              })}
            </div>
          )}
        </div>

        <div className="card p-4 space-y-2">
          <div className="eyebrow">Import FEN or PGN</div>
          <textarea className="input font-mono text-xs h-24" placeholder="Paste a FEN (e.g. from the photo scanner) or a full PGN…" value={importText} onChange={(e) => setImportText(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => load(importText)}><Upload size={15} /> Load</button>
            <button className="btn btn-ghost" onClick={() => { setRoot(START); setNodes([]); setIdx(0); setMsg(null); }}>New board</button>
            <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(pgn); setMsg({ ok: true, text: "PGN copied." }); }}><Copy size={15} /> Copy PGN</button>
          </div>
          {msg && <p className={`text-sm ${msg.ok ? "text-ok" : "text-bad"}`}>{msg.text}</p>}
          <p className="text-xs text-muted font-mono break-all">{fen}</p>
        </div>
      </div>
    </div>
  );
}
