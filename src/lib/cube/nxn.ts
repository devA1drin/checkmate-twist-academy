/**
 * Size-generic cube model (2x2 up to 7x7) used by the 3D cube and the simulator.
 *
 * State: 6·n·n facelet string, faces in URFDLB order, each face row-major as seen looking at
 * it (Kociemba order; for n = 3 it is exactly the same string as lib/cube/model.ts).
 * Coordinates are doubled so they stay integers for every size: a cubie coordinate runs over
 * -(n-1), -(n-3), …, n-1 along each axis.
 *
 * A Turn rotates some layers of one axis by q quarter turns, q > 0 meaning counter-clockwise
 * looking from the + end of the axis. Notation is mapped onto turns; the renderer, the drag
 * handler and the model all work on turns, so they cannot disagree.
 */
export type Vec3 = [number, number, number];
export type Axis = 0 | 1 | 2;
export interface Turn { axis: Axis; layers: number[]; q: number }
export interface NxnMove { text: string; turn: Turn }

const FACE_ORDER = "URFDLB";
export const solvedState = (n: number) => FACE_ORDER.split("").map((f) => f.repeat(n * n)).join("");

export function stickerGeometry(n: number, i: number): { pos: Vec3; normal: Vec3 } {
  const m = n - 1, nn = n * n;
  const face = FACE_ORDER[Math.floor(i / nn)];
  const k = i % nn, r = Math.floor(k / n), c = k % n;
  switch (face) {
    case "U": return { pos: [-m + 2 * c, m, -m + 2 * r], normal: [0, 1, 0] };
    case "R": return { pos: [m, m - 2 * r, m - 2 * c], normal: [1, 0, 0] };
    case "F": return { pos: [-m + 2 * c, m - 2 * r, m], normal: [0, 0, 1] };
    case "D": return { pos: [-m + 2 * c, -m, m - 2 * r], normal: [0, -1, 0] };
    case "L": return { pos: [-m, m - 2 * r, -m + 2 * c], normal: [-1, 0, 0] };
    default: return { pos: [m - 2 * c, m - 2 * r, -m], normal: [0, 0, -1] };
  }
}

/** Rotate an integer vector by quarter turns about an axis (+ = CCW looking from +axis). */
export function rotVec(v: Vec3, axis: Axis, quarter: number): Vec3 {
  let [x, y, z] = v;
  const q = ((quarter % 4) + 4) % 4;
  for (let t = 0; t < q; t++) {
    if (axis === 0) [y, z] = [-z, y];
    else if (axis === 1) [z, x] = [-x, z];
    else [x, y] = [-y, x];
  }
  return [x + 0, y + 0, z + 0];
}

const gkey = (p: Vec3, nrm: Vec3) => `${p[0]},${p[1]},${p[2]}|${nrm[0]},${nrm[1]},${nrm[2]}`;
const lookupCache = new Map<number, Map<string, number>>();
/** Facelet index of the sticker at cubie position p facing normal nrm. */
export function stickerIndexAt(n: number, p: Vec3, nrm: Vec3): number {
  let m = lookupCache.get(n);
  if (!m) {
    m = new Map();
    for (let i = 0; i < 6 * n * n; i++) { const g = stickerGeometry(n, i); m.set(gkey(g.pos, g.normal), i); }
    lookupCache.set(n, m);
  }
  const i = m.get(gkey(p, nrm));
  if (i === undefined) throw new Error("no sticker at " + gkey(p, nrm));
  return i;
}

const permCache = new Map<string, number[]>();
/** newState[j] = state[perm[j]] for a single quarter (+1) turn of the given layers. */
function quarterPerm(n: number, axis: Axis, layers: number[]): number[] {
  const k = `${n}:${axis}:${layers.join(",")}`;
  const hit = permCache.get(k);
  if (hit) return hit;
  const total = 6 * n * n;
  const perm = Array.from({ length: total }, (_, i) => i);
  for (let i = 0; i < total; i++) {
    const g = stickerGeometry(n, i);
    if (!layers.includes(g.pos[axis])) continue;
    perm[stickerIndexAt(n, rotVec(g.pos, axis, 1), rotVec(g.normal, axis, 1))] = i;
  }
  permCache.set(k, perm);
  return perm;
}

export function applyTurn(n: number, state: string, t: Turn): string {
  const perm = quarterPerm(n, t.axis, [...t.layers].sort((a, b) => a - b));
  let s = state;
  const q = ((t.q % 4) + 4) % 4;
  for (let r = 0; r < q; r++) { let o = ""; for (let i = 0; i < perm.length; i++) o += s[perm[i]]; s = o; }
  return s;
}
export const applyMoves = (n: number, state: string, moves: NxnMove[]) => moves.reduce((s, m) => applyTurn(n, s, m.turn), state);

/** All faces one colour (any orientation). */
export function isSolvedState(n: number, state: string): boolean {
  const nn = n * n;
  for (let f = 0; f < 6; f++) for (let k = 1; k < nn; k++) if (state[f * nn + k] !== state[f * nn]) return false;
  return true;
}

// ---------- notation ----------
const FACE_INFO: Record<string, { axis: Axis; side: 1 | -1; dir: 1 | -1 }> = {
  R: { axis: 0, side: 1, dir: -1 }, L: { axis: 0, side: -1, dir: 1 },
  U: { axis: 1, side: 1, dir: -1 }, D: { axis: 1, side: -1, dir: 1 },
  F: { axis: 2, side: 1, dir: -1 }, B: { axis: 2, side: -1, dir: 1 },
};
const SLICE: Record<string, { axis: Axis; dir: 1 | -1 }> = { M: { axis: 0, dir: 1 }, E: { axis: 1, dir: 1 }, S: { axis: 2, dir: -1 } };
const ROT: Record<string, Axis> = { x: 0, y: 1, z: 2 };

/** Coordinate of the k-th layer (1-based) counted from a face's side. */
const layerFrom = (n: number, side: 1 | -1, k: number) => side * (n - 1 - 2 * (k - 1));

const TOKEN = /^(\d*)([URFDLBMESxyzrludfb])(w?)(2'|'2|2|'|3)?$/;

/** Parse notation for an n×n cube: R U' F2, wide Rw/r/3Rw, inner slices 2R, M E S (odd sizes), x y z. */
export function parseNxn(n: number, alg: string): NxnMove[] {
  const cleaned = alg.replace(/[()[\]{}]/g, " ").replace(/’/g, "'").trim();
  if (!cleaned) return [];
  const out: NxnMove[] = [];
  for (const raw of cleaned.split(/\s+/)) {
    // allow concatenated tokens like R2U' by splitting before each letter group
    const parts = raw.match(/\d*[URFDLBMESxyzrludfb]w?(?:2'|'2|2|'|3)?/g);
    if (!parts || parts.join("") !== raw) throw new Error(`Unrecognized move "${raw}"`);
    for (const tok of parts) {
      const m = TOKEN.exec(tok);
      if (!m) throw new Error(`Unrecognized move "${tok}"`);
      const [, num, letter, w, suf = ""] = m;
      const amount = suf.includes("2") ? 2 : suf === "'" || suf === "3" ? 3 : 1;
      let axis: Axis, layers: number[], dir: 1 | -1;
      if (letter in ROT) {
        if (num || w) throw new Error(`Invalid rotation "${tok}"`);
        axis = ROT[letter]; dir = -1;
        layers = Array.from({ length: n }, (_, i) => -(n - 1) + 2 * i);
      } else if (letter in SLICE) {
        if (num || w) throw new Error(`Invalid slice move "${tok}"`);
        if (n % 2 === 0) throw new Error(`${letter} moves need an odd-sized cube`);
        ({ axis, dir } = SLICE[letter]); layers = [0];
      } else {
        const upper = letter.toUpperCase();
        const fi = FACE_INFO[upper];
        axis = fi.axis; dir = fi.dir;
        const wide = w === "w" || letter !== upper;
        const k = num ? parseInt(num, 10) : wide ? 2 : 1;
        if (k < 1 || k > n) throw new Error(`Layer out of range in "${tok}"`);
        if (letter !== upper && num) throw new Error(`Invalid move "${tok}"`);
        layers = wide ? Array.from({ length: k }, (_, i) => layerFrom(n, fi.side, i + 1)) : [layerFrom(n, fi.side, k)];
      }
      const q = dir * (amount === 3 ? -1 : amount);
      out.push({ text: tok.replace(/'2|2'/, "2").replace(/3$/, "'"), turn: { axis, layers, q } });
    }
  }
  return out;
}

/** Notation for a turn produced by dragging (single layer or whole cube). */
export function turnToText(n: number, t: Turn): string {
  const q = ((t.q % 4) + 4) % 4;
  if (q === 0) return "";
  const suffix = (amt: number) => (amt === 2 ? "2" : amt === 3 ? "'" : "");
  if (t.layers.length === n) return "xyz"[t.axis] + suffix((4 - q) % 4);
  if (t.layers.length !== 1) throw new Error("turnToText: only single layers or whole-cube turns");
  const c = t.layers[0];
  const pos = ["R", "U", "F"][t.axis], neg = ["L", "D", "B"][t.axis];
  if (c === 0 && n === 3) {
    const sl = "MES"[t.axis]; const d = SLICE[sl].dir;
    return sl + suffix(d === 1 ? q : (4 - q) % 4);
  }
  if (c > 0 || c === 0) {
    const k = (n - 1 - c) / 2 + 1;
    return (k > 1 ? String(k) : "") + pos + suffix((4 - q) % 4);
  }
  const k = (n - 1 + c) / 2 + 1;
  return (k > 1 ? String(k) : "") + neg + suffix(q);
}

export function invertNxn(moves: NxnMove[]): NxnMove[] {
  return moves.slice().reverse().map((m) => {
    const t = { ...m.turn, q: -m.turn.q };
    const amt = m.text.endsWith("2") ? "2" : m.text.endsWith("'") ? "" : "'";
    const base = m.text.replace(/['2]$/, "");
    return { text: base + amt, turn: t };
  });
}

// ---------- drag → turn ----------
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * Which layer turns when a sticker is dragged. `normal` is the sticker's face axis (unit, in cube
 * space), `cubie` its doubled cubie coordinate, `drag` the drag vector in cube space (any length).
 * Returns the axis, the layer and the sign of rotation (+1 = CCW about +axis) that moves the
 * sticker along the drag, plus the unit tangent the drag was snapped to.
 */
export function dragTurn(normal: Vec3, cubie: Vec3, drag: Vec3): { axis: Axis; layer: number; sign: 1 | -1; tangent: Vec3 } {
  const nAxis = normal.findIndex((v) => v !== 0);
  const others = [0, 1, 2].filter((a) => a !== nAxis) as Axis[];
  const tAxis = Math.abs(drag[others[0]]) >= Math.abs(drag[others[1]]) ? others[0] : others[1];
  const axis = others.find((a) => a !== tAxis)!;
  const tangent: Vec3 = [0, 0, 0]; tangent[tAxis] = Math.sign(drag[tAxis]) || 1;
  const a: Vec3 = [0, 0, 0]; a[axis] = 1;
  const motion = cross(a, normal); // direction a sticker on this face moves for a + rotation
  const sign = (dot(motion, tangent) > 0 ? 1 : -1) as 1 | -1;
  return { axis, layer: cubie[axis], sign, tangent };
}
