/**
 * Beginner layer-by-layer guide generator (3x3, standard colour scheme).
 *
 * Produces the classic beginner method as stages: white cross, white corners, middle layer,
 * yellow cross, yellow edges, yellow corner positions, yellow corner twists. Each stage is
 * found by a small search over the usual beginner triggers, and every stage is checked
 * against its goal on the cube model. If any stage cannot be found or checked, the
 * generator returns null and no beginner guide is shown.
 */
import { applyAlg, isSolved, parseAlg } from "./model";
import { CORNER_FACELETS, EDGE_FACELETS } from "./validate";

export interface Stage { id: string; title: string; goal: string; how: string; moves: string[] }

const face = (i: number) => Math.floor(i / 9);
const centre = (s: string, i: number) => s[face(i) * 9 + 4];
const solvedAt = (s: string, idx: number[]) => idx.every((i) => s[i] === centre(s, i));
const flat = (xs: number[][]) => xs.flat();

// ---- facelet movement tables (where a sticker at position p goes after a move) ----
const BASIC = ["U", "U'", "U2", "R", "R'", "R2", "F", "F'", "F2", "D", "D'", "D2", "L", "L'", "L2", "B", "B'", "B2"];
const PROBE = Array.from({ length: 54 }, (_, i) => String.fromCharCode(0x100 + i)).join("");
const FWD: Record<string, Int8Array> = {};
for (const m of BASIC) {
  const after = applyAlg(PROBE, m);
  const f = new Int8Array(54);
  for (let i = 0; i < 54; i++) f[after.charCodeAt(i) - 0x100] = i;
  FWD[m] = f;
}

/** Optimal-per-edge cross search on tracked sticker positions (fast, no string work). */
function solveCrossEdge(start: string, solvedEdges: number[], target: number): string[] | null {
  const tracked = [...solvedEdges, target];
  // current positions of each tracked edge's two stickers, matched to its home positions
  const home: number[] = [], cur: number[] = [];
  for (const k of tracked) {
    const [h0, h1] = EDGE_FACELETS[k];
    const c0 = start[face(h0) * 9 + 4], c1 = start[face(h1) * 9 + 4];
    let found = false;
    for (const [a, b] of EDGE_FACELETS) {
      if (start[a] === c0 && start[b] === c1) { cur.push(a, b); found = true; break; }
      if (start[b] === c0 && start[a] === c1) { cur.push(b, a); found = true; break; }
    }
    if (!found) return null;
    home.push(h0, h1);
  }
  // distance tables per tracked edge (BFS over that edge's 24 placements)
  const dist = tracked.map((_, t) => {
    const d = new Map<number, number>(); const key = (a: number, b: number) => a * 54 + b;
    let frontier = [[home[2 * t], home[2 * t + 1]]]; d.set(key(home[2 * t], home[2 * t + 1]), 0);
    for (let depth = 1; frontier.length; depth++) {
      const next: number[][] = [];
      for (const [a, b] of frontier) for (const m of BASIC) {
        const na = FWD[m][a], nb = FWD[m][b], k = key(na, nb);
        if (!d.has(k)) { d.set(k, depth); next.push([na, nb]); }
      }
      frontier = next;
    }
    return d;
  });
  const h = (pos: number[]) => { let mx = 0; for (let t = 0; t < tracked.length; t++) mx = Math.max(mx, dist[t].get(pos[2 * t] * 54 + pos[2 * t + 1])!); return mx; };
  const path: string[] = [];
  const dfs = (pos: number[], g: number, bound: number, lastFace: string): boolean => {
    const hv = h(pos);
    if (hv === 0) return true;
    if (g + hv > bound) return false;
    for (const m of BASIC) {
      if (m[0] === lastFace) continue;
      const np = pos.map((p) => FWD[m][p]);
      path.push(m);
      if (dfs(np, g + 1, bound, m[0])) return true;
      path.pop();
    }
    return false;
  };
  for (let bound = 0; bound <= 9; bound++) if (dfs(cur, 0, bound, "")) return path.slice();
  return null;
}

/** Iterative-deepening search over trigger sequences until goal(state) holds. */
function macroSearch(start: string, macros: string[], goal: (s: string) => boolean, maxDepth: number): string[] | null {
  if (goal(start)) return [];
  const isU = (m: string) => /^U['2]?$/.test(m);
  const path: string[] = [];
  const dfs = (s: string, depth: number, last: string): boolean => {
    if (depth === 0) return goal(s);
    for (const m of macros) {
      if (last && isU(last) && isU(m)) continue;
      path.push(m);
      if (dfs(applyAlg(s, m), depth - 1, m)) return true;
      path.pop();
    }
    return false;
  };
  for (let d = 1; d <= maxDepth; d++) if (dfs(start, d, "")) return path.slice();
  return null;
}

const U_TURNS = ["U", "U'", "U2"];
// (front, right, left) seen from each side, used to write each trigger without rotating the cube
const SIDES: [string, string, string][] = [["F", "R", "L"], ["R", "B", "F"], ["B", "L", "R"], ["L", "F", "B"]];
const inv = (m: string) => (m.endsWith("'") ? m[0] : m.endsWith("2") ? m : m + "'");

const D_EDGES = [5, 4, 7, 6];          // DF, DR, DB, DL (indices into EDGE_FACELETS)
const D_CORNERS = [4, 7, 6, 5];        // DFR, DRB, DBL, DLF
const MID_EDGES = [8, 11, 10, 9];      // FR, BR, BL, FL
const CORNER_TRIGGER: Record<number, string> = { 4: "R U R' U'", 7: "B U B' U'", 6: "L U L' U'", 5: "F U F' U'" };

export function beginnerGuide(input: string): Stage[] | null {
  try {
    if (!/^[URFDLB]{54}$/.test(input)) return null;
    // white goes to the bottom so the last layer is on top, as in every beginner tutorial
    let s = applyAlg(input, "z2");
    const stages: Stage[] = [{ id: "hold", title: "Hold the cube", goal: "White on the bottom, green still facing you.", how: "Turn the whole cube upside down (a z2 rotation). Every step below assumes this grip.", moves: ["z2"] }];
    const push = (st: Omit<Stage, "moves">, moves: string[]) => { stages.push({ ...st, moves }); s = applyAlg(s, moves.join(" ")); };

    // 1. white cross
    const cross: string[] = []; const solvedE: number[] = [];
    for (const k of D_EDGES) {
      if (!solvedAt(s, EDGE_FACELETS[k])) {
        const mv = solveCrossEdge(s, solvedE, k); if (!mv) return null;
        cross.push(...mv); s = applyAlg(s, mv.join(" "));
      }
      solvedE.push(k);
      if (!solvedE.every((e) => solvedAt(s, EDGE_FACELETS[e]))) return null;
    }
    stages.push({ id: "cross", title: "White cross", goal: "Four white edges on the bottom, each matching its side centre.", how: "Bring one white edge at a time down next to its matching centre, without disturbing the edges already placed.", moves: cross });
    const crossIdx = flat(D_EDGES.map((k) => EDGE_FACELETS[k]));

    // 2. white corners: repeat the trigger above each corner's slot
    const corners: string[] = []; const doneC: number[] = [];
    const cornerMacros = [...U_TURNS, ...Object.values(CORNER_TRIGGER).flatMap((t) => [1, 2, 3, 4, 5].map((k) => Array(k).fill(t).join(" ")))];
    for (const k of D_CORNERS) {
      const keep = [...crossIdx, ...flat(doneC.map((c) => CORNER_FACELETS[c])), ...CORNER_FACELETS[k]];
      const mv = macroSearch(s, cornerMacros, (x) => solvedAt(x, keep), 3); if (!mv) return null;
      corners.push(...mv); s = applyAlg(s, mv.join(" ")); doneC.push(k);
    }
    stages.push({ id: "corners", title: "White corners", goal: "The whole white layer solved.", how: "Turn the top until a white corner sits above its slot, then repeat the trigger for that slot (for example R U R' U') until the corner drops in correctly.", moves: corners });
    const layer1 = [...crossIdx, ...flat(D_CORNERS.map((c) => CORNER_FACELETS[c]))];

    // 3. middle layer edges
    const insertR = SIDES.map(([f, r]) => `U ${r} U' ${r}' U' ${f}' U ${f}`);
    const insertL = SIDES.map(([f, , l]) => `U' ${l}' U ${l} U ${f} U' ${f}'`);
    const mid: string[] = []; const doneM: number[] = [];
    for (const k of MID_EDGES) {
      const keep = [...layer1, ...flat(doneM.map((e) => EDGE_FACELETS[e])), ...EDGE_FACELETS[k]];
      const mv = macroSearch(s, [...U_TURNS, ...insertR, ...insertL], (x) => solvedAt(x, keep), 3); if (!mv) return null;
      mid.push(...mv); s = applyAlg(s, mv.join(" ")); doneM.push(k);
    }
    stages.push({ id: "middle", title: "Middle layer", goal: "The first two layers solved.", how: "Find a top edge without yellow, line it up with its centre, then insert it to the right (U R U' R' U' F' U F) or left (U' L' U L U F U' F').", moves: mid });
    const f2l = [...layer1, ...flat(MID_EDGES.map((e) => EDGE_FACELETS[e]))];

    // 4. yellow cross
    const yc = macroSearch(s, [...U_TURNS, "F R U R' U' F'"], (x) => solvedAt(x, f2l) && [1, 3, 5, 7].every((i) => x[i] === x[4]), 6); if (!yc) return null;
    push({ id: "ycross", title: "Yellow cross", goal: "A yellow cross on top.", how: "Hold a yellow line horizontally or an L shape at the back-left, then do F R U R' U' F'. Repeat until the cross appears." }, yc);

    // 5. yellow edges
    const sune = SIDES.map(([, r]) => `${r} U ${r}' U ${r} U2 ${r}'`);
    const ye = macroSearch(s, [...U_TURNS, ...sune], (x) => solvedAt(x, [...f2l, ...flat([0, 1, 2, 3].map((e) => EDGE_FACELETS[e]))]), 6); if (!ye) return null;
    push({ id: "yedges", title: "Yellow edges", goal: "Each top edge matches its side centre.", how: "Turn the top so two edges match, hold them at the back and right, then do R U R' U R U2 R' and turn the top to finish." }, ye);
    const allEdges = [...f2l, ...flat([0, 1, 2, 3].map((e) => EDGE_FACELETS[e]))];

    // 6. yellow corners to their places (any twist)
    const cornerHome = (x: string, c: number) => { const want = CORNER_FACELETS[c].map((i) => centre(x, i)).sort().join(""); return CORNER_FACELETS[c].map((i) => x[i]).sort().join("") === want; };
    const niklas = SIDES.map(([, r, l]) => `U ${r} U' ${l}' U ${r}' U' ${l}`);
    const yp = macroSearch(s, [...niklas, ...niklas.map((a) => a.split(" ").reverse().map(inv).join(" "))], (x) => solvedAt(x, allEdges) && [0, 1, 2, 3].every((c) => cornerHome(x, c)), 3); if (!yp) return null;
    push({ id: "ycornerpos", title: "Yellow corner positions", goal: "Every top corner in its correct place (it may still be twisted).", how: "Hold a corner that is already in place at the front-right and do U R U' L' U R' U' L until all four corners are in place." }, yp);

    // 7. twist the yellow corners with R' D' R D
    const tw: string[] = [];
    for (let c = 0; c < 4; c++) {
      let reps = 0;
      while (s[8] !== s[4]) { tw.push("R'", "D'", "R", "D"); s = applyAlg(s, "R' D' R D"); if (++reps > 6) return null; }
      tw.push("U"); s = applyAlg(s, "U");
    }
    const fin = macroSearch(s, U_TURNS, isSolved, 1);
    if (!fin) return null;
    tw.push(...fin); s = applyAlg(s, fin.join(" "));
    stages.push({ id: "ytwist", title: "Twist the yellow corners", goal: "The cube is solved.", how: "With a twisted corner at the front-right of the top, repeat R' D' R D until its yellow faces up (the bottom will look scrambled; keep going). Then turn only the top (U) to bring the next twisted corner to the front-right. When all are yellow, the bottom fixes itself.", moves: tw });

    // final check of the whole guide from the original scanned state
    const all = stages.flatMap((st) => st.moves).join(" ");
    if (!isSolved(applyAlg(input, all))) return null;
    // tidy notation: merge repeated turns of the same face within a stage
    for (const st of stages) st.moves = simplifyTokens(st.moves);
    if (!isSolved(applyAlg(input, stages.flatMap((st) => st.moves).join(" ")))) return null;
    return stages;
  } catch { return null; }
}

/** Merge consecutive turns of the same face (R R → R2, R R' → nothing). */
export function simplifyTokens(tokens: string[]): string[] {
  const out: string[] = [];
  const amt = (m: string) => (m.endsWith("2") ? 2 : m.endsWith("'") ? 3 : 1);
  for (const raw of tokens.flatMap((t) => t.split(" ")).filter(Boolean)) {
    const last = out[out.length - 1];
    if (last && last[0] === raw[0] && /^[URFDLB]/.test(raw)) {
      const a = (amt(last) + amt(raw)) % 4; out.pop();
      if (a) out.push(raw[0] + (a === 2 ? "2" : a === 3 ? "'" : ""));
    } else out.push(raw);
  }
  return out;
}
export const countMoves = (stages: Stage[]) => stages.reduce((n, s) => n + parseAlg(s.moves.join(" ")).length, 0);
