"use client";
import { Chess } from "chess.js";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Upload, Eraser, RotateCcw, Trash2, Cpu, Swords, Info, AlertTriangle, CheckCircle2, Square as SquareIcon, Grid3x3 } from "lucide-react";
import { Board } from "@/components/chess/board";
import { useCamera, cameraUnavailableReason } from "@/lib/camera/use-camera";
import { PrivacyNote } from "@/components/privacy-note";

type Cell = string | null; // FEN piece letter
const GLYPH: Record<string, string> = { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const PALETTE = ["K", "Q", "R", "B", "N", "P", "k", "q", "r", "b", "n", "p"];
const empty = (): Cell[][] => Array.from({ length: 8 }, () => Array(8).fill(null));
const startBoard = (): Cell[][] => {
  const b = empty(); const back = "rnbqkbnr";
  for (let f = 0; f < 8; f++) { b[0][f] = back[f]; b[1][f] = "p"; b[6][f] = "P"; b[7][f] = back[f].toUpperCase(); }
  return b;
};
/** board[r][f]: r = 0 is rank 8, f = 0 is the a-file (always stored from White's view). */
function boardToPlacement(b: Cell[][]) {
  return b.map((row) => { let s = "", n = 0; for (const c of row) { if (c) { if (n) { s += n; n = 0; } s += c; } else n++; } return s + (n || ""); }).join("/");
}

export function BoardScanner() {
  const [img, setImg] = useState<string | null>(null);
  const [board, setBoard] = useState<Cell[][]>(empty);
  const [tool, setTool] = useState<string>("P");
  const [whiteBottom, setWhiteBottom] = useState(true);
  const [turn, setTurn] = useState<"w" | "b">("w");
  const [grid, setGrid] = useState({ x: 5, y: 5, w: 90, h: 90 });
  const [showGrid, setShowGrid] = useState(true);
  const [castle, setCastle] = useState({ K: true, Q: true, k: true, q: true });
  const cam = useCamera();
  const fileRef = useRef<HTMLInputElement>(null);
  const [camReason, setCamReason] = useState<string | null>(null);
  useEffect(() => setCamReason(cameraUnavailableReason()), []);
  useEffect(() => () => { if (img?.startsWith("blob:")) URL.revokeObjectURL(img); }, [img]);

  const onFile = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { cam.setError("That file is not an image. Please choose a JPG, PNG or WebP photo."); return; }
    cam.stop(); cam.setError(null);
    setImg(URL.createObjectURL(f)); // object URL: the file never leaves the device
  };
  const capture = () => {
    const c = cam.snapshot();
    if (!c) return;
    setImg(c.toDataURL("image/jpeg", 0.92));
    cam.stop();
  };

  // map a visual cell (row from top, col from left) to board indices
  const toIdx = (r: number, c: number): [number, number] => (whiteBottom ? [r, c] : [7 - r, 7 - c]);
  const place = (r: number, c: number) => {
    const [i, j] = toIdx(r, c);
    setBoard((b) => { const n = b.map((row) => row.slice()); n[i][j] = tool === "x" ? null : n[i][j] === tool ? null : tool; return n; });
  };

  // castling rights only where king and rook are on their original squares
  const can = { K: board[7][4] === "K" && board[7][7] === "R", Q: board[7][4] === "K" && board[7][0] === "R", k: board[0][4] === "k" && board[0][7] === "r", q: board[0][4] === "k" && board[0][0] === "r" };
  const castling = (["K", "Q", "k", "q"] as const).filter((k) => can[k] && castle[k]).join("") || "-";
  const fen = `${boardToPlacement(board)} ${turn} ${castling} - 0 1`;

  const problems = useMemo(() => {
    const p: string[] = [];
    const flat = board.flat();
    const count = (x: string) => flat.filter((c) => c === x).length;
    if (count("K") !== 1) p.push(`White must have exactly one king (found ${count("K")}).`);
    if (count("k") !== 1) p.push(`Black must have exactly one king (found ${count("k")}).`);
    if ([...board[0], ...board[7]].some((c) => c === "P" || c === "p")) p.push("Pawns cannot stand on the first or eighth rank.");
    if (count("P") > 8 || count("p") > 8) p.push("A side cannot have more than 8 pawns.");
    if (flat.filter((c) => c && c === c.toUpperCase()).length > 16 || flat.filter((c) => c && c === c.toLowerCase()).length > 16) p.push("A side cannot have more than 16 pieces.");
    if (!p.length) {
      try {
        new Chess(fen);
        const other = new Chess(fen.replace(` ${turn} `, ` ${turn === "w" ? "b" : "w"} `));
        if (other.inCheck()) p.push(`The side not to move (${turn === "w" ? "Black" : "White"}) is in check — check the side to move.`);
      } catch (e) { p.push((e as Error).message); }
    }
    return p;
  }, [board, fen, turn]);
  const valid = problems.length === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-3 text-sm flex gap-2.5">
        <Info size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div><strong>Honest note:</strong> this tool does <em>not</em> use AI to recognise pieces automatically. Reliable piece recognition from arbitrary photos needs a trained vision model we have not validated, so instead you place the pieces yourself on top of your photo. The engine analysis afterwards is real Stockfish 19.</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => fileRef.current?.click()}><Upload size={15} /> Upload photo</button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
            {cam.state !== "live" ? (
              <button className="btn btn-ghost" disabled={!!camReason || cam.state === "starting"} onClick={() => { setImg(null); cam.start(); }} title={camReason ?? undefined}><Camera size={15} /> {cam.state === "starting" ? "Starting camera…" : "Use camera"}</button>
            ) : (
              <><button className="btn btn-primary" onClick={capture}><Camera size={15} /> Take snapshot</button><button className="btn btn-ghost" onClick={cam.stop}>Stop camera</button></>
            )}
            {img && <button className="btn btn-ghost" onClick={() => setImg(null)}><Trash2 size={15} /> Remove photo</button>}
            <button className="btn btn-ghost" onClick={() => setShowGrid(!showGrid)}><Grid3x3 size={15} /> {showGrid ? "Hide" : "Show"} grid</button>
          </div>
          {camReason && <p className="text-xs text-muted flex items-center gap-1.5"><AlertTriangle size={13} className="text-amber-400" /> {camReason}</p>}
          {cam.error && <div className="rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm flex gap-2"><AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />{cam.error}</div>}

          <div className="relative card overflow-hidden bg-surface-2 select-none" style={{ minHeight: 320 }}>
            <video ref={cam.videoRef} playsInline muted className={cam.state === "live" ? "w-full block" : "hidden"} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {img && cam.state !== "live" && <img src={img} alt="Your chessboard photo (stays on this device)" className="w-full block" />}
            {!img && cam.state !== "live" && <div className="absolute inset-0 grid place-items-center text-muted text-sm p-6 text-center"><div><SquareIcon className="mx-auto mb-2 opacity-50" />No photo yet — upload one or use the camera. You can also set up a position on the empty grid below.</div></div>}
            {showGrid && (
              <div className="absolute grid grid-cols-8 grid-rows-8 border-2 border-aqua/90" style={{ left: `${grid.x}%`, top: `${grid.y}%`, width: `${grid.w}%`, height: `${grid.h}%` }}>
                {Array.from({ length: 64 }, (_, k) => {
                  const r = Math.floor(k / 8), c = k % 8; const [i, j] = toIdx(r, c); const p = board[i][j];
                  return (
                    <button key={k} onClick={() => place(r, c)} aria-label={`Square ${"abcdefgh"[j]}${8 - i}${p ? ` ${p}` : ""}`}
                      className={`relative border border-aqua/40 hover:bg-electric/30 transition grid place-items-center ${(r + c) % 2 ? "bg-violet/10" : ""}`}>
                      {p && <span className="leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,.9)] rounded bg-black/35 px-0.5" style={{ fontSize: "clamp(12px, 3.6vw, 34px)", color: p === p.toUpperCase() ? "#fff" : "#111", WebkitTextStroke: p === p.toUpperCase() ? "1px #111" : "1px #fff" }}>{GLYPH[p]}</span>}
                      {c === 0 && <span className="absolute left-0.5 top-0 text-[9px] text-aqua">{8 - i}</span>}
                      {r === 7 && <span className="absolute right-0.5 bottom-0 text-[9px] text-aqua">{"abcdefgh"[j]}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="card p-3 grid gap-2 sm:grid-cols-2 text-xs">
            {(["x", "y", "w", "h"] as const).map((k) => (
              <label key={k} className="flex items-center gap-2">
                <span className="w-24 text-muted">{{ x: "Grid left", y: "Grid top", w: "Grid width", h: "Grid height" }[k]}</span>
                <input type="range" min={k === "w" || k === "h" ? 20 : 0} max={k === "w" || k === "h" ? 100 : 60} step={0.5} value={grid[k]} onChange={(e) => setGrid({ ...grid, [k]: +e.target.value })} className="flex-1 accent-[var(--blue)]" />
              </label>
            ))}
            <p className="text-muted sm:col-span-2">Line the cyan grid up with the board&apos;s outer edges. For best results, photograph the board from directly above.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <div className="font-semibold">1 · Choose a piece, then tap squares</div>
            <div className="grid grid-cols-6 gap-1.5">
              {PALETTE.map((p) => <button key={p} onClick={() => setTool(p)} aria-label={`Place ${p}`} className={`aspect-square rounded-lg text-2xl grid place-items-center border ${tool === p ? "border-electric bg-electric/20" : "border-line bg-surface-2"}`}>{GLYPH[p]}</button>)}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setTool("x")} className={`btn ${tool === "x" ? "btn-primary" : "btn-ghost"}`}><Eraser size={15} /> Eraser</button>
              <button className="btn btn-ghost" onClick={() => setBoard(startBoard())}><RotateCcw size={15} /> Start position</button>
              <button className="btn btn-ghost" onClick={() => setBoard(empty())}><Trash2 size={15} /> Clear</button>
            </div>
            <p className="text-xs text-muted">Tapping a square that already holds the selected piece removes it.</p>
          </div>
          <div className="card p-4 space-y-3 text-sm">
            <div className="font-semibold">2 · Position details</div>
            <label className="flex items-center justify-between gap-2">Photo orientation
              <select className="input !w-auto !py-1" value={whiteBottom ? "w" : "b"} onChange={(e) => setWhiteBottom(e.target.value === "w")}><option value="w">White at bottom</option><option value="b">Black at bottom</option></select></label>
            <label className="flex items-center justify-between gap-2">Side to move
              <select className="input !w-auto !py-1" value={turn} onChange={(e) => setTurn(e.target.value as "w" | "b")}><option value="w">White</option><option value="b">Black</option></select></label>
            <div className="flex flex-wrap gap-3 text-xs">{(["K", "Q", "k", "q"] as const).map((k) => (
              <label key={k} className={`inline-flex items-center gap-1 ${can[k] ? "" : "opacity-40"}`}><input type="checkbox" disabled={!can[k]} checked={can[k] && castle[k]} onChange={(e) => setCastle({ ...castle, [k]: e.target.checked })} />{{ K: "White O-O", Q: "White O-O-O", k: "Black O-O", q: "Black O-O-O" }[k]}</label>
            ))}</div>
          </div>
          <div className="card p-4 space-y-3">
            <div className="font-semibold">3 · Check and analyse</div>
            <Board id="scan-preview" fen={fen} />
            <p className="font-mono text-[11px] break-all text-muted">{fen}</p>
            {valid ? <p className="text-sm text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={15} /> Legal position</p> : <ul className="text-sm text-red-400 space-y-1">{problems.map((p) => <li key={p} className="flex gap-1.5"><AlertTriangle size={14} className="shrink-0 mt-0.5" />{p}</li>)}</ul>}
            <div className="flex flex-wrap gap-2">
              <Link aria-disabled={!valid} className={`btn btn-primary ${valid ? "" : "pointer-events-none opacity-50"}`} href={`/chess/analysis?fen=${encodeURIComponent(fen)}`}><Cpu size={15} /> Analyse with Stockfish</Link>
              <Link aria-disabled={!valid} className={`btn btn-ghost ${valid ? "" : "pointer-events-none opacity-50"}`} href={`/chess/play?fen=${encodeURIComponent(fen)}`}><Swords size={15} /> Play from here</Link>
            </div>
          </div>
        </div>
      </div>
      <PrivacyNote />
    </div>
  );
}
