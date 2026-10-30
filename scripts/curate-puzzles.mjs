// Builds src/data/puzzles.json from a slice of the Lichess puzzle database (CC0).
// Usage: node scripts/curate-puzzles.mjs <path-to-lichess_db_puzzle.csv>
import { readFileSync, writeFileSync } from "node:fs";
import { Chess } from "chess.js";
const lines = readFileSync(process.argv[2], "utf8").split("\n").slice(1);
const themes = ["mateIn1", "mateIn2", "mateIn3", "fork", "pin", "skewer", "discoveredAttack", "backRankMate", "hangingPiece", "deflection", "sacrifice", "promotion", "endgame", "attraction", "doubleCheck", "trappedPiece"];
const bands = [[600, 1000], [1000, 1400], [1400, 1800], [1800, 2200], [2200, 2700]];
const PER = 3;
const picked = new Map();
const quota = new Map();
let rejected = 0;
for (const line of lines) {
  const f = line.split(",");
  if (f.length < 9) continue;
  const [id, fen, moves, rating, rd, pop, plays, th, url, opening] = f;
  const r = +rating;
  if (+pop < 90 || +plays < 2000 || +rd > 80) continue;
  const tset = th.split(" ");
  const band = bands.findIndex(([a, b]) => r >= a && r < b);
  if (band < 0) continue;
  const theme = themes.find((t) => tset.includes(t) && (quota.get(`${t}|${band}`) ?? 0) < PER);
  if (!theme || picked.has(id)) continue;
  // validate full line with chess.js
  try {
    const c = new Chess(fen);
    for (const u of moves.split(" ")) c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
    if (tset.some((t) => t.startsWith("mateIn")) && !c.isCheckmate()) throw new Error("mate theme but no mate");
  } catch { rejected++; continue; }
  quota.set(`${theme}|${band}`, (quota.get(`${theme}|${band}`) ?? 0) + 1);
  picked.set(id, { id, fen, moves: moves.split(" "), rating: r, themes: tset, primary: theme, gameUrl: url, opening: opening || undefined });
}
const out = [...picked.values()].sort((a, b) => a.rating - b.rating);
writeFileSync(new URL("../src/data/puzzles.json", import.meta.url), JSON.stringify(out));
console.log(`curated ${out.length} puzzles (${rejected} rejected during validation)`);
