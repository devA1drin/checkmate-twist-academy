"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Board, tryMove } from "@/components/chess/board";
import { KIT_BY_SLUG } from "@/data/openings/kits";
import { START_FEN, analysisHref, numbered } from "@/lib/chess/san";
import { buildPrefixMap, epdOf, loadOpeningIndex, searchOpenings, type OpeningRow } from "@/lib/openings/index-data";

const FIRST = [["", "All"], ["e4", "1.e4"], ["d4", "1.d4"], ["c4", "1.c4"], ["Nf3", "1.Nf3"], ["other", "Other"]] as const;
const PAGE = 60;
const fmt = (moves: string) => numbered(moves.split(" ").map((san) => ({ san })));
const fenOf = (moves: string, base = START_FEN) => { const g = new Chess(base); for (const m of moves.split(" ").filter(Boolean)) g.move(m); return g.fen(); };

function Preview({ row, onExplore }: { row: OpeningRow; onExplore?: (moves: string) => void }) {
  const kit = row[4] ? KIT_BY_SLUG[row[4]] : null;
  return (
    <div>
      <Board id="explorer-preview" fen={fenOf(row[2])} orientation={kit?.side ?? "white"} />
      <p className="eyebrow mt-4">{row[0]}</p>
      <h2 className="text-lg font-semibold leading-snug">{row[1]}</h2>
      <p className="font-mono text-sm mt-2 leading-relaxed">{fmt(row[2])}</p>
      <div className="flex flex-wrap gap-2 mt-4">
        {kit && <Link href={`/openings/${kit.slug}`} className="btn btn-primary">Study the {kit.name} kit</Link>}
        {onExplore && <button className="btn btn-ghost" onClick={() => onExplore(row[2])}>Explore from here</button>}
        <Link href={analysisHref(row[2])} className="btn btn-ghost">Analyse</Link>
      </div>
    </div>
  );
}

function Results({ rows, sel, onSel, label }: { rows: OpeningRow[]; sel: OpeningRow | null; onSel: (r: OpeningRow) => void; label: string }) {
  const [n, setN] = useState(PAGE);
  useEffect(() => setN(PAGE), [rows]);
  return (
    <div>
      <p className="text-sm text-muted mb-2" aria-live="polite">{label}</p>
      <ul className="border-t border-line">
        {rows.slice(0, n).map((r) => (
          <li key={r[0] + r[1] + r[2]}>
            <button onClick={() => onSel(r)} aria-pressed={sel === r} className={`w-full text-left grid grid-cols-[3.25rem_1fr] gap-x-3 py-2.5 px-2 border-b border-line min-h-[52px] ${sel === r ? "bg-surface-2" : "hover:bg-surface"}`}>
              <span className="font-mono text-sm pt-0.5">{r[0]}</span>
              <span className="min-w-0">
                <span className="block leading-snug">{r[1]}{r[4] && <span className="ml-2 align-middle text-[11px] uppercase tracking-wide border border-line px-1.5 py-px text-muted">Kit</span>}</span>
                <span className="block font-mono text-xs text-muted truncate">{fmt(r[2])}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {rows.length > n && <button className="btn btn-ghost mt-3" onClick={() => setN(n + PAGE)}>Show {Math.min(PAGE, rows.length - n)} more</button>}
    </div>
  );
}

export function Explorer() {
  const [rows, setRows] = useState<OpeningRow[] | null>(null);
  const [err, setErr] = useState(false);
  const [mode, setMode] = useState<"text" | "position">("text");
  const [kitF, setKitF] = useState(""), [q, setQ] = useState(""), [first, setFirst] = useState(""), [kitOnly, setKitOnly] = useState(false);
  const [sel, setSel] = useState<OpeningRow | null>(null);
  const [line, setLine] = useState<string[]>([]), [fen, setFen] = useState(START_FEN), [fenInput, setFenInput] = useState(""), [fenErr, setFenErr] = useState("");
  const [base, setBase] = useState(START_FEN);
  const [prefix, setPrefix] = useState<Map<string, number[]> | null>(null);

  useEffect(() => {
    loadOpeningIndex().then(setRows).catch(() => setErr(true));
    const p = new URLSearchParams(window.location.search);
    if (p.get("q")) setQ(p.get("q")!);
    if (p.get("kit") && KIT_BY_SLUG[p.get("kit")!]) setKitF(p.get("kit")!);
    if (p.get("moves")) { const ms = p.get("moves")!.trim().split(/\s+/); try { setFen(fenOf(ms.join(" "))); setLine(ms); setMode("position"); } catch { /* ignore bad link */ } }
  }, []);
  useEffect(() => { if (mode === "position" && rows && !prefix) buildPrefixMap(rows).then(setPrefix); }, [mode, rows, prefix]);
  useEffect(() => {
    const u = new URL(window.location.href);
    if (mode === "text") { u.searchParams.delete("moves"); if (kitF) u.searchParams.set("kit", kitF); else u.searchParams.delete("kit"); if (q) u.searchParams.set("q", q); else u.searchParams.delete("q"); }
    else { u.searchParams.delete("q"); if (line.length && base === START_FEN) u.searchParams.set("moves", line.join(" ")); else u.searchParams.delete("moves"); }
    history.replaceState(null, "", u.toString());
  }, [mode, q, line, base, kitF]);

  const found = useMemo(() => (rows ? searchOpenings(rows, q, { first, kitOnly, kit: kitF }) : []), [rows, q, first, kitOnly, kitF]);
  const epd = epdOf(fen);
  const exact = useMemo(() => (rows ? rows.filter((r) => r[3] === epd) : []), [rows, epd]);
  const cont = useMemo(() => {
    if (!rows || !prefix) return null;
    return (prefix.get(epd) ?? (fen === START_FEN ? rows.map((_, i) => i) : [])).map((i) => rows[i]).filter((r) => r[3] !== epd).sort((a, b) => a[2].length - b[2].length);
  }, [rows, prefix, epd, fen]);

  const explore = (moves: string) => { const ms = moves.split(" "); setBase(START_FEN); setLine(ms); setFen(fenOf(moves)); setMode("position"); setSel(null); window.scrollTo({ top: 0 }); };
  const onMove = (from: string, to: string) => { const r = tryMove(fen, from, to); if (!r) return false; setFen(r.game.fen()); setLine([...line, r.move.san]); return true; };
  const undo = () => { const ms = line.slice(0, -1); setLine(ms); setFen(ms.length ? fenOf(ms.join(" "), base) : base); };
  const loadFen = () => { try { const g = new Chess(fenInput.trim()); setFen(g.fen()); setBase(g.fen()); setLine([]); setFenErr(""); } catch { setFenErr("That FEN is not a legal position."); } };

  if (err) return <p className="notice notice-bad">The openings list did not load. Check your connection and reload the page.</p>;
  return (
    <div>
      <div className="seg mb-6" role="group" aria-label="Search mode">
        <button aria-pressed={mode === "text"} onClick={() => setMode("text")}>Name, ECO or moves</button>
        <button aria-pressed={mode === "position"} onClick={() => setMode("position")}>Position</button>
      </div>

      {mode === "text" ? (
        <div className="grid lg:grid-cols-[1fr_minmax(0,380px)] gap-8 items-start">
          <div className="min-w-0">
            <label htmlFor="op-q" className="label">Search openings</label>
            <input id="op-q" className="input w-full" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Najdorf, B90, or 1.e4 c5 2.Nf3 d6" autoComplete="off" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 mb-5">
              <div className="seg" role="group" aria-label="First move">
                {FIRST.map(([v, l]) => <button key={l} aria-pressed={first === v} onClick={() => setFirst(v)}>{l}</button>)}
              </div>
              <label className="inline-flex items-center gap-2 min-h-[44px] text-sm"><input type="checkbox" checked={kitOnly} onChange={(e) => setKitOnly(e.target.checked)} className="h-4 w-4" />Only openings with a kit</label>
            </div>
            {kitF && <p className="notice mb-4 flex flex-wrap items-center gap-x-3">Showing variations taught in the <Link href={`/openings/${kitF}`} className="link">{KIT_BY_SLUG[kitF].name} kit</Link><button className="link min-h-[44px]" onClick={() => setKitF("")}>Show all openings</button></p>}
            {!rows ? <p className="text-muted">Loading 3,865 openings…</p> :
              <Results rows={found} sel={sel} onSel={setSel} label={`${found.length.toLocaleString()} opening${found.length === 1 ? "" : "s"}${q ? ` match “${q}”` : ""}`} />}
          </div>
          <aside className="lg:sticky lg:top-20" aria-label="Preview">
            {sel ? <Preview row={sel} onExplore={explore} /> : <p className="text-sm text-muted border-t border-line pt-3">Pick an opening to see its position, moves and kit.</p>}
          </aside>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-8 items-start">
          <div>
            <Board id="explorer-pos" fen={fen} onMove={onMove} />
            <div className="flex flex-wrap gap-2 mt-3">
              <button className="btn btn-ghost" onClick={undo} disabled={!line.length}>Undo</button>
              <button className="btn btn-ghost" onClick={() => { setLine([]); setFen(START_FEN); setBase(START_FEN); setFenInput(""); }}>Start position</button>
            </div>
            <p className="font-mono text-sm mt-3 min-h-[1.5rem]">{line.length && base === START_FEN ? fmt(line.join(" ")) : line.length ? `From FEN: ${line.join(" ")}` : fen === START_FEN ? "Play moves on the board, or paste a FEN." : "Position from FEN"}</p>
            <label htmlFor="op-fen" className="label mt-4 block">Or paste a FEN</label>
            <div className="flex gap-2">
              <input id="op-fen" className="input flex-1 min-w-0 font-mono text-sm" value={fenInput} onChange={(e) => setFenInput(e.target.value)} placeholder="rnbqkb1r/pp2pppp/3p1n2/8/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 1 5" />
              <button className="btn btn-ghost" onClick={loadFen}>Load</button>
            </div>
            {fenErr && <p className="text-sm text-[color:var(--bad,#b42318)] mt-2" role="alert">{fenErr}</p>}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold mb-2">This position</h2>
            {!rows ? <p className="text-muted">Loading…</p> : exact.length ? (
              <ul className="space-y-6 mb-8">{exact.map((r) => <li key={r[1] + r[2]}><p className="eyebrow">{r[0]}</p><p className="font-medium">{r[1]}</p><p className="text-sm text-muted font-mono">{fmt(r[2])}</p>
                {r[4] && <Link href={`/openings/${r[4]}`} className="link text-sm">Study the {KIT_BY_SLUG[r[4]].name} kit</Link>}</li>)}</ul>
            ) : <p className="text-muted mb-8">{fen === START_FEN ? "The starting position." : "No opening is named after exactly this position."}</p>}
            <h2 className="text-lg font-semibold mb-2">Openings that continue from here</h2>
            {!cont ? <p className="text-muted">Indexing positions…</p> : cont.length === 0 ? <p className="text-muted">None of the named openings pass through this position.</p> :
              <Results rows={cont} sel={null} onSel={(r) => explore(r[2])} label={`${cont.length.toLocaleString()} opening${cont.length === 1 ? "" : "s"}, shortest first. Pick one to play it on the board.`} />}
          </div>
        </div>
      )}
    </div>
  );
}
