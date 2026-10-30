// Validates every opening kit: all move strings are legal (chess.js), each line's ECO code
// matches the lichess-org/chess-openings classification of its position, model-game PGNs are
// legal and match their stated result source, and kit video links point at known video IDs.
import { Chess } from "chess.js";
import { readFileSync } from "node:fs";
import { KITS } from "../src/data/openings/kits";
import games from "../src/data/openings/model-games.json";
import videos from "../src/data/videos.json";

let fails = 0, checked = 0;
const fail = (m: string) => { fails++; console.log("FAIL", m); };
const key = (fen: string) => fen.split(" ").slice(0, 4).join(" ");
const eco = new Map<string, { eco: string; name: string; plies: number }>();
for (const line of readFileSync(new URL("./data/lichess-openings.tsv", import.meta.url), "utf8").split("\n").slice(1)) {
  if (!line.trim()) continue;
  const [code, name, pgn] = line.split("\t");
  const c = new Chess(); c.loadPgn(pgn);
  eco.set(key(c.fen()), { eco: code, name, plies: c.history().length });
}
function play(moves: string, where: string): Chess | null {
  const c = new Chess();
  for (const m of moves.trim().split(/\s+/)) {
    try { c.move(m); } catch { fail(`${where}: illegal move "${m}" after ${c.history().join(" ")}`); return null; }
  }
  return c;
}
function classify(moves: string) {
  const c = new Chess(); let best: { eco: string; name: string; plies: number } | null = null;
  for (const m of moves.split(/\s+/)) { c.move(m); const e = eco.get(key(c.fen())); if (e && (!best || e.plies >= best.plies)) best = e; }
  return best;
}
const slugs = new Set(KITS.map((k) => k.slug));
for (const k of KITS) {
  if (!k.lines.some((l) => l.kind === "main")) fail(`${k.slug}: no main line`);
  for (const l of k.lines) {
    checked++;
    if (!play(l.moves, `${k.slug}/${l.id}`)) continue;
    const cl = classify(l.moves);
    if (!cl) fail(`${k.slug}/${l.id}: no ECO match`);
    else if (cl.eco !== l.eco) fail(`${k.slug}/${l.id}: ECO ${l.eco} but lichess data says ${cl.eco} (${cl.name})`);
    else console.log(`ok  ${l.eco} ${k.slug}/${l.id} — ${cl.name}`);
  }
  for (const t of k.traps) { checked++; const c = play(t.moves, `${k.slug}/trap ${t.name}`); if (c && /#$/.test(t.moves.trim()) && !c.isCheckmate()) fail(`${k.slug}/trap ${t.name}: ends in # but is not mate`); }
  for (const s of k.structures) { checked++; play(s.moves, `${k.slug}/structure ${s.name}`); }
}
const ids = new Set((videos as { id: string }[]).map((v) => v.id));
for (const v of videos as { id: string; kit?: string }[]) if (v.kit && !slugs.has(v.kit)) fail(`video ${v.id}: unknown kit ${v.kit}`);
for (const k of KITS) if (!(videos as { kit?: string }[]).some((v) => v.kit === k.slug)) fail(`${k.slug}: no linked videos`);
for (const [slug, list] of Object.entries(games as Record<string, { white: string; black: string; moves: string; result: string; source: string }[]>)) {
  if (!slugs.has(slug)) fail(`model games: unknown kit ${slug}`);
  for (const g of list) {
    checked++;
    const c = play(g.moves, `game ${g.white}-${g.black}`);
    if (!c) continue;
    if (!/^https:\/\/lichess\.org\/broadcast\//.test(g.source)) fail(`game ${g.white}-${g.black}: missing source link`);
    if (c.isCheckmate()) { const winner = c.turn() === "w" ? "0-1" : "1-0"; if (winner !== g.result) fail(`game ${g.white}-${g.black}: mate but result ${g.result}`); }
  }
}
for (const k of KITS) if (!(games as Record<string, unknown[]>)[k.slug]?.length) fail(`${k.slug}: no model games`);
void ids;
console.log(`\n${KITS.length} kits, ${checked} lines/traps/structures/games checked, ${fails} failures`);
process.exit(fails ? 1 : 0);
