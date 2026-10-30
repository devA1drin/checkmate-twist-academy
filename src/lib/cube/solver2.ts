/**
 * Optimal 2x2x2 solver (IDA* in the half-turn metric, moves U, R, F so the DLB corner stays put).
 * Move tables are derived from the same sticker geometry as the 3D cube (lib/cube/nxn.ts), and
 * every solution is checked by applying it to the input before it is returned.
 */
import { applyMoves, isSolvedState, parseNxn, rotVec, stickerIndexAt, type Vec3 } from "./nxn";

const N = 2;
const SLOTS: Vec3[] = [];
for (const x of [1, -1]) for (const y of [1, -1]) for (const z of [1, -1]) SLOTS.push([x, y, z]);
const FIXED = SLOTS.findIndex((p) => p[0] === -1 && p[1] === -1 && p[2] === -1);
const AXIS_N = (p: Vec3, a: number): Vec3 => { const v: Vec3 = [0, 0, 0]; v[a] = p[a]; return v; };
/** Sticker indices of a slot in local order: y-facing, x-facing, z-facing. */
const SLOT_STICKERS = SLOTS.map((p) => [1, 0, 2].map((a) => stickerIndexAt(N, p, AXIS_N(p, a))));
const slotOf = (p: Vec3) => SLOTS.findIndex((s) => s[0] === p[0] && s[1] === p[1] && s[2] === p[2]);

const MOVE_NAMES = ["U", "U2", "U'", "R", "R2", "R'", "F", "F2", "F'"];
/** For each move: slot → new slot, and per slot the local-sticker map. */
const QUARTER = [1, 0, 2].map((axis) => { // U (y), R (x), F (z): one clockwise quarter = -1 about +axis
  const sigma = new Array<number>(8).fill(-1);
  const omap: number[][] = SLOTS.map(() => [0, 1, 2]);
  SLOTS.forEach((p, s) => {
    if (p[axis] !== 1) { sigma[s] = s; return; }
    const np = rotVec(p, axis as 0 | 1 | 2, -1);
    const ns = slotOf(np); sigma[s] = ns;
    for (let j = 0; j < 3; j++) {
      const a = [1, 0, 2][j];
      const nrm = rotVec(AXIS_N(p, a), axis as 0 | 1 | 2, -1);
      const idx = stickerIndexAt(N, np, nrm);
      omap[s][j] = SLOT_STICKERS[ns].indexOf(idx);
    }
  });
  return { sigma, omap };
});

interface Cubies { perm: number[]; ori: number[] }
function quarter(c: Cubies, qi: number): Cubies {
  const { sigma, omap } = QUARTER[qi];
  const perm = c.perm.slice(), ori = c.ori.slice();
  for (let s = 0; s < 8; s++) { perm[sigma[s]] = c.perm[s]; ori[sigma[s]] = omap[s][c.ori[s]]; }
  return { perm, ori };
}
const applyIdx = (c: Cubies, m: number) => { let r = c; for (let k = 0; k <= m % 3; k++) r = quarter(r, Math.floor(m / 3)); return r; };

const FREE = SLOTS.map((_, i) => i).filter((i) => i !== FIXED);
function permIndex(perm: number[]) {
  const p = FREE.map((s) => FREE.indexOf(perm[s]));
  let idx = 0;
  for (let i = 0; i < 7; i++) { let smaller = 0; for (let j = i + 1; j < 7; j++) if (p[j] < p[i]) smaller++; idx = idx * (7 - i) + smaller; }
  return idx;
}
const oriIndex = (ori: number[]) => FREE.reduce((a, s) => a * 3 + ori[s], 0);

let PP: Int8Array | null = null, PO: Int8Array | null = null;
function tables() {
  if (PP && PO) return;
  const solved: Cubies = { perm: SLOTS.map((_, i) => i), ori: new Array(8).fill(0) };
  const bfs = (size: number, key: (c: Cubies) => number) => {
    const t = new Int8Array(size).fill(-1);
    t[key(solved)] = 0;
    let frontier = [solved], d = 0;
    while (frontier.length) {
      const next: Cubies[] = [];
      for (const c of frontier) for (let m = 0; m < 9; m++) { const n = applyIdx(c, m); const k = key(n); if (t[k] === -1) { t[k] = d + 1; next.push(n); } }
      frontier = next; d++;
    }
    return t;
  };
  PP = bfs(5040, (c) => permIndex(c.perm));
  PO = bfs(2187, (c) => oriIndex(c.ori));
}

const OPP: Record<string, string> = { U: "D", D: "U", R: "L", L: "R", F: "B", B: "F" };

/** Read a 24-sticker 2x2 state into cubies (relative to its DLB corner). Throws a readable error. */
function toCubies(state: string): Cubies {
  if (state.length !== 24) throw new Error("A 2x2 state has 24 stickers.");
  const counts: Record<string, number> = {};
  for (const ch of state) counts[ch] = (counts[ch] ?? 0) + 1;
  for (const f of "URFDLB") if (counts[f] !== 4) throw new Error(`Each colour must appear exactly 4 times (${f === "U" ? "white" : f === "D" ? "yellow" : f === "R" ? "red" : f === "L" ? "orange" : f === "F" ? "green" : "blue"} appears ${counts[f] ?? 0}).`);
  const [dc, lc, bc] = SLOT_STICKERS[FIXED].map((i) => state[i]);
  const faceColor: Record<string, string> = { D: dc, U: OPP[dc], L: lc, R: OPP[lc], B: bc, F: OPP[bc] };
  if (new Set(Object.values(faceColor)).size !== 6) throw new Error("The back-left-bottom corner has an impossible colour combination.");
  const expected = SLOTS.map((p) => [p[1] > 0 ? "U" : "D", p[0] > 0 ? "R" : "L", p[2] > 0 ? "F" : "B"].map((f) => faceColor[f]).sort().join(""));
  const perm: number[] = [], ori: number[] = [];
  SLOTS.forEach((_, s) => {
    const cols = SLOT_STICKERS[s].map((i) => state[i]);
    const piece = expected.indexOf([...cols].sort().join(""));
    if (piece < 0) throw new Error("A corner has a colour combination that doesn't exist on a real cube.");
    perm[s] = piece;
    ori[s] = cols.findIndex((c) => c === faceColor.U || c === faceColor.D);
  });
  if (new Set(perm).size !== 8) throw new Error("The same corner appears twice.");
  return { perm, ori };
}

/** Optimal solution (≤ 11 moves) for a 24-character 2x2 state. Verified before returning. */
export function solve2x2(state: string): string {
  tables();
  const start = toCubies(state);
  if (PO![oriIndex(start.ori)] < 0) throw new Error("One corner is twisted; this position can't be reached by turning.");
  const path: number[] = [];
  const h = (c: Cubies) => Math.max(PP![permIndex(c.perm)], PO![oriIndex(c.ori)]);
  const search = (c: Cubies, g: number, bound: number, last: number): boolean => {
    const hv = h(c);
    if (hv === 0) return true;
    if (g + hv > bound) return false;
    for (let m = 0; m < 9; m++) {
      if (last >= 0 && Math.floor(m / 3) === Math.floor(last / 3)) continue;
      path.push(m);
      if (search(applyIdx(c, m), g + 1, bound, m)) return true;
      path.pop();
    }
    return false;
  };
  let found = false;
  for (let bound = h(start); bound <= 14 && !found; bound++) { path.length = 0; found = search(start, 0, bound, -1); }
  if (!found) throw new Error("No solution found.");
  const sol = path.map((m) => MOVE_NAMES[m]).join(" ");
  if (!isSolvedState(N, applyMoves(N, state, sol ? parseNxn(N, sol) : []))) throw new Error("This colouring is not possible on a real cube.");
  return sol;
}
