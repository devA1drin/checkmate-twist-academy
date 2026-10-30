/**
 * 3x3x3 cube state model.
 *
 * State is a 54-character facelet string in Kociemba order (URFDLB, 9 stickers per face,
 * row-major as seen looking at each face, the same convention used by cubejs / Kociemba's
 * two-phase solver). Each character is the face letter whose color the sticker shows.
 *
 * Moves are applied geometrically: every sticker has a 3D cubie position (x,y,z in {-1,0,1})
 * and an outward normal; a move rotates the stickers in the affected layer(s) by 90 degrees.
 * This supports face turns, wide turns, slice moves and whole-cube rotations with one code path.
 */

export type Face = "U" | "R" | "F" | "D" | "L" | "B";
export const FACES: Face[] = ["U", "R", "F", "D", "L", "B"];
export const SOLVED = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

export type Vec3 = [number, number, number];

/** Position of the cubie and outward normal for facelet index i (0..53). */
export function faceletGeometry(i: number): { pos: Vec3; normal: Vec3 } {
  const face = FACES[Math.floor(i / 9)];
  const k = i % 9;
  const r = Math.floor(k / 3);
  const c = k % 3;
  switch (face) {
    case "U": return { pos: [-1 + c, 1, -1 + r], normal: [0, 1, 0] };
    case "R": return { pos: [1, 1 - r, 1 - c], normal: [1, 0, 0] };
    case "F": return { pos: [-1 + c, 1 - r, 1], normal: [0, 0, 1] };
    case "D": return { pos: [-1 + c, -1, 1 - r], normal: [0, -1, 0] };
    case "L": return { pos: [-1, 1 - r, -1 + c], normal: [-1, 0, 0] };
    case "B": return { pos: [1 - c, 1 - r, -1], normal: [0, 0, -1] };
  }
}

const key = (p: Vec3, n: Vec3) => `${p.join(",")}|${n.join(",")}`;
const GEOM = Array.from({ length: 54 }, (_, i) => faceletGeometry(i));
const INDEX_BY_GEOM = new Map<string, number>(GEOM.map((g, i) => [key(g.pos, g.normal), i]));

type Axis = 0 | 1 | 2; // x, y, z

/** Rotate a vector by quarter turns (+1 = +90deg counter-clockwise looking from + axis). */
function rot(v: Vec3, axis: Axis, quarter: number): Vec3 {
  let [x, y, z] = v;
  const q = ((quarter % 4) + 4) % 4;
  for (let t = 0; t < q; t++) {
    if (axis === 0) [y, z] = [-z, y];
    else if (axis === 1) [z, x] = [-x, z];
    else [x, y] = [-y, x];
  }
  return [x + 0, y + 0, z + 0] as Vec3;
}

export interface MoveDef {
  axis: Axis;
  /** Which layers (coordinate values along axis) move. */
  layers: number[];
  /** Quarter turns for the base (clockwise) move, +1 = CCW about +axis. */
  dir: 1 | -1;
}

/** Base move definitions; suffix ' or 2 modifies the amount. */
export const MOVE_DEFS: Record<string, MoveDef> = {
  R: { axis: 0, layers: [1], dir: -1 },
  L: { axis: 0, layers: [-1], dir: 1 },
  U: { axis: 1, layers: [1], dir: -1 },
  D: { axis: 1, layers: [-1], dir: 1 },
  F: { axis: 2, layers: [1], dir: -1 },
  B: { axis: 2, layers: [-1], dir: 1 },
  M: { axis: 0, layers: [0], dir: 1 },
  E: { axis: 1, layers: [0], dir: 1 },
  S: { axis: 2, layers: [0], dir: -1 },
  r: { axis: 0, layers: [0, 1], dir: -1 },
  l: { axis: 0, layers: [-1, 0], dir: 1 },
  u: { axis: 1, layers: [0, 1], dir: -1 },
  d: { axis: 1, layers: [-1, 0], dir: 1 },
  f: { axis: 2, layers: [0, 1], dir: -1 },
  b: { axis: 2, layers: [-1, 0], dir: 1 },
  x: { axis: 0, layers: [-1, 0, 1], dir: -1 },
  y: { axis: 1, layers: [-1, 0, 1], dir: -1 },
  z: { axis: 2, layers: [-1, 0, 1], dir: -1 },
};

export interface ParsedMove {
  base: string; // key of MOVE_DEFS
  amount: 1 | 2 | 3; // quarter turns clockwise (3 = prime)
  text: string; // normalized notation e.g. R, R', R2, Rw -> r
}

const TOKEN = /([RLUDFBMESxyzrludfb])(w?)(2'|'2|2|'|’|3)?/g;

/** Parse an algorithm string; ignores parentheses/brackets. Throws on unknown tokens. */
export function parseAlg(alg: string): ParsedMove[] {
  const cleaned = alg.replace(/[()[\]{}]/g, " ").replace(/’/g, "'").trim();
  if (!cleaned) return [];
  const out: ParsedMove[] = [];
  for (const tok of cleaned.split(/\s+/)) {
    TOKEN.lastIndex = 0;
    let pos = 0;
    let m: RegExpExecArray | null;
    while ((m = TOKEN.exec(tok)) && m.index === pos) {
      pos += m[0].length;
      let base = m[1];
      if (m[2] === "w") {
        if (!"RLUDFB".includes(base)) throw new Error(`Invalid wide move: ${m[0]}`);
        base = base.toLowerCase();
      }
      const suf = m[3] ?? "";
      const amount: 1 | 2 | 3 = suf.includes("2") ? 2 : suf === "'" || suf === "3" ? 3 : 1;
      out.push({ base, amount, text: base + (amount === 2 ? "2" : amount === 3 ? "'" : "") });
    }
    if (pos !== tok.length) throw new Error(`Unrecognized move token "${tok}"`);
  }
  return out;
}

export function moveToString(m: ParsedMove) {
  return m.text;
}

export function invertMoves(moves: ParsedMove[]): ParsedMove[] {
  return moves
    .slice()
    .reverse()
    .map((m) => {
      const amount = (m.amount === 2 ? 2 : m.amount === 1 ? 3 : 1) as 1 | 2 | 3;
      return { base: m.base, amount, text: m.base + (amount === 2 ? "2" : amount === 3 ? "'" : "") };
    });
}

export function invertAlg(alg: string): string {
  return invertMoves(parseAlg(alg)).map((m) => m.text).join(" ");
}

/** Permutation tables: for each base move (single quarter turn), newState[i] = state[perm[i]]. */
const PERMS: Record<string, number[]> = {};
for (const [name, def] of Object.entries(MOVE_DEFS)) {
  const perm = new Array<number>(54);
  for (let i = 0; i < 54; i++) {
    const g = GEOM[i];
    if (def.layers.includes(g.pos[def.axis])) {
      const np = rot(g.pos, def.axis, def.dir);
      const nn = rot(g.normal, def.axis, def.dir);
      const j = INDEX_BY_GEOM.get(key(np, nn));
      if (j === undefined) throw new Error("geometry error");
      perm[j] = i; // sticker at i moves to j
    } else {
      perm[i] = perm[i] ?? i;
    }
  }
  for (let i = 0; i < 54; i++) if (perm[i] === undefined) perm[i] = i;
  PERMS[name] = perm;
}

export function applyMove(state: string, m: ParsedMove): string {
  const perm = PERMS[m.base];
  let s = state;
  for (let t = 0; t < m.amount; t++) {
    let n = "";
    for (let i = 0; i < 54; i++) n += s[perm[i]];
    s = n;
  }
  return s;
}

export function applyAlg(state: string, alg: string | ParsedMove[]): string {
  const moves = typeof alg === "string" ? parseAlg(alg) : alg;
  return moves.reduce(applyMove, state);
}

export function isSolved(state: string): boolean {
  for (let f = 0; f < 6; f++) {
    const c = state[f * 9 + 4];
    for (let k = 0; k < 9; k++) if (state[f * 9 + k] !== c) return false;
  }
  return true;
}

/**
 * Re-express colors relative to the current centers (so a cube that has been rotated
 * with x/y/z reads like a normally held cube). Requires the 6 centers to be distinct.
 */
export function normalizeToCenters(state: string): string {
  const map: Record<string, string> = {};
  for (let f = 0; f < 6; f++) map[state[f * 9 + 4]] = FACES[f];
  return state.split("").map((ch) => map[ch] ?? ch).join("");
}

/** Random-move scramble (used only as a fallback while the random-state solver loads). */
export function randomMoveScramble(length = 25, rng: () => number = Math.random): string {
  const faces = ["U", "D", "R", "L", "F", "B"];
  const axisOf: Record<string, number> = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };
  const out: string[] = [];
  let last = "", prev = "";
  while (out.length < length) {
    const f = faces[Math.floor(rng() * 6)];
    if (f === last) continue;
    if (axisOf[f] === axisOf[last] && axisOf[f] === axisOf[prev]) continue;
    prev = last;
    last = f;
    const suf = ["", "'", "2"][Math.floor(rng() * 3)];
    out.push(f + suf);
  }
  return out.join(" ");
}

/** Simplify consecutive moves on the same base (R R -> R2, R R' -> nothing). */
export function simplify(moves: ParsedMove[]): ParsedMove[] {
  const out: ParsedMove[] = [];
  for (const m of moves) {
    const last = out[out.length - 1];
    if (last && last.base === m.base) {
      const amt = (last.amount + m.amount) % 4;
      out.pop();
      if (amt) out.push({ base: m.base, amount: amt as 1 | 2 | 3, text: m.base + (amt === 2 ? "2" : amt === 3 ? "'" : "") });
    } else out.push(m);
  }
  return out;
}
