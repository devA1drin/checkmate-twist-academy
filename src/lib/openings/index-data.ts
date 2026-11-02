import { Chess } from "chess.js";

/** [eco, name, SAN moves, EPD of the final position, kit slug or ""] from public/data/openings-index.json. */
export type OpeningRow = [string, string, string, string, string];

let cache: Promise<OpeningRow[]> | null = null;
export function loadOpeningIndex(): Promise<OpeningRow[]> {
  cache ??= fetch("/data/openings-index.json").then((r) => { if (!r.ok) throw new Error(`index ${r.status}`); return r.json(); }).then((d) => d.rows as OpeningRow[]);
  cache.catch(() => { cache = null; });
  return cache;
}

export const epdOf = (fen: string) => fen.split(" ").slice(0, 4).join(" ");
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9+#=\s-]/g, " ").replace(/\s+/g, " ").trim();

/** Parse a move list such as "1. e4 c5 2.Nf3" into SAN, or null if it is not a legal move list. */
export function parseMoves(q: string): string[] | null {
  const toks = q.replace(/\d+\.(\.\.)?/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!toks.length || !toks.every((t) => /^([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?|O-O(-O)?|0-0(-0)?)[+#]?$/.test(t))) return null;
  const g = new Chess();
  try { return toks.map((t) => g.move(t.replace(/0/g, "O")).san); } catch { return null; }
}

export interface SearchOpts { first?: string; kitOnly?: boolean; kit?: string }
/** Search by ECO code (B90, C4), move list (1.e4 e5 2.Nf3) or words in the name. */
export function searchOpenings(rows: OpeningRow[], q: string, o: SearchOpts = {}): OpeningRow[] {
  let list = rows;
  if (o.first) list = list.filter((r) => { const m = r[2].split(" ")[0]; return o.first === "other" ? !["e4", "d4", "c4", "Nf3"].includes(m) : m === o.first; });
  if (o.kitOnly) list = list.filter((r) => r[4]);
  if (o.kit) list = list.filter((r) => r[4] === o.kit);
  const s = q.trim();
  if (!s) return list;
  if (/^[a-e]\d{0,2}$/i.test(s)) return list.filter((r) => r[0].startsWith(s.toUpperCase()));
  const mv = parseMoves(s);
  if (mv) { const p = mv.join(" "); return list.filter((r) => r[2] === p || r[2].startsWith(p + " ")).sort((a, b) => a[2].length - b[2].length); }
  const words = fold(s).split(" ");
  const scored = list.map((r) => { const n = fold(r[1]); return { r, n, ok: words.every((w) => n.includes(w)) }; }).filter((x) => x.ok);
  const q0 = fold(s);
  return scored.sort((a, b) => Number(b.n.startsWith(q0)) - Number(a.n.startsWith(q0)) || a.r[2].length - b.r[2].length).map((x) => x.r);
}

/** Map of every position reached along each opening's moves to the openings that pass through it. Built in chunks. */
let prefixMap: Promise<Map<string, number[]>> | null = null;
export function buildPrefixMap(rows: OpeningRow[]): Promise<Map<string, number[]>> {
  prefixMap ??= new Promise((resolve) => {
    const map = new Map<string, number[]>();
    let i = 0;
    const step = () => {
      const end = Math.min(rows.length, i + 250);
      for (; i < end; i++) {
        const g = new Chess();
        for (const san of rows[i][2].split(" ")) {
          g.move(san);
          const k = epdOf(g.fen());
          const a = map.get(k); if (a) { if (a[a.length - 1] !== i) a.push(i); } else map.set(k, [i]);
        }
      }
      if (i < rows.length) setTimeout(step, 0); else resolve(map);
    };
    step();
  });
  return prefixMap;
}
