/**
 * Builds public/data/openings-index.json from the lichess-org/chess-openings
 * dataset (CC0) in scripts/data/lichess-openings.tsv.
 * Each row: [eco, name, SAN moves, EPD of the final position, kit slug or ""].
 * Run: tsx scripts/build-openings-index.ts   (add --check to compare only)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { Chess } from "chess.js";
import { kitForOpening } from "../src/lib/openings/kit-map";

export function buildIndex(): string {
  const rows = readFileSync("scripts/data/lichess-openings.tsv", "utf8").trim().split("\n").slice(1).map((l) => l.split("\t"));
  const out = rows.map(([eco, name, pgn]) => {
    const g = new Chess();
    const sans = pgn.replace(/\d+\.(\.\.)?/g, " ").trim().split(/\s+/).map((s) => g.move(s).san);
    const epd = g.fen().split(" ").slice(0, 4).join(" ");
    return [eco, name, sans.join(" "), epd, kitForOpening(name) ?? ""];
  });
  return JSON.stringify({ source: "https://github.com/lichess-org/chess-openings", license: "CC0-1.0", count: out.length, rows: out });
}

if (process.argv[1]?.endsWith("build-openings-index.ts")) {
  const json = buildIndex();
  const path = "public/data/openings-index.json";
  if (process.argv.includes("--check")) {
    const cur = readFileSync(path, "utf8");
    if (cur !== json) { console.error(`${path} is stale: run tsx scripts/build-openings-index.ts`); process.exit(1); }
    console.log(`${path} is up to date`);
  } else { writeFileSync(path, json); console.log(`wrote ${path} (${(json.length / 1024).toFixed(0)} KB)`); }
}
