/**
 * Render-side cube engine: every cubie has an integer position and orientation that follow the
 * turns, and every sticker keeps its colour. The 3D view draws from this; tests check that the
 * colours it shows always equal the model state (lib/cube/nxn.ts).
 */
import { rotVec, stickerGeometry, stickerIndexAt, type Turn, type Vec3 } from "./nxn";

export type Mat3 = number[]; // row-major 3x3 of integers
const I3: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const mul = (a: Mat3, b: Mat3): Mat3 => {
  const o = new Array(9).fill(0);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) for (let k = 0; k < 3; k++) o[r * 3 + c] += a[r * 3 + k] * b[k * 3 + c];
  return o;
};
const apply = (m: Mat3, v: Vec3): Vec3 => [0, 1, 2].map((r) => m[r * 3] * v[0] + m[r * 3 + 1] * v[1] + m[r * 3 + 2] * v[2]) as Vec3;
export function quarterMatrix(axis: 0 | 1 | 2, q: number): Mat3 {
  const cols = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((e) => rotVec(e as Vec3, axis, q));
  return [cols[0][0], cols[1][0], cols[2][0], cols[0][1], cols[1][1], cols[2][1], cols[0][2], cols[1][2], cols[2][2]];
}

export interface Cubie { home: Vec3; pos: Vec3; rot: Mat3 }
export interface Sticker { cubie: number; normal: Vec3; color: string; home: number }

export class CubeEngine {
  readonly n: number;
  readonly cubies: Cubie[] = [];
  readonly stickers: Sticker[] = [];
  constructor(n: number) {
    this.n = n;
    const m = n - 1, idx = new Map<string, number>();
    for (let x = -m; x <= m; x += 2) for (let y = -m; y <= m; y += 2) for (let z = -m; z <= m; z += 2) {
      if (Math.abs(x) !== m && Math.abs(y) !== m && Math.abs(z) !== m) continue;
      idx.set(`${x},${y},${z}`, this.cubies.length);
      this.cubies.push({ home: [x, y, z], pos: [x, y, z], rot: I3.slice() });
    }
    for (let i = 0; i < 6 * n * n; i++) {
      const g = stickerGeometry(n, i);
      this.stickers.push({ cubie: idx.get(g.pos.join(","))!, normal: g.normal, color: "X", home: i });
    }
  }
  reset(state: string) {
    for (const c of this.cubies) { c.pos = [...c.home] as Vec3; c.rot = I3.slice(); }
    this.stickers.forEach((s, i) => { s.color = state[i] ?? "X"; });
  }
  inLayer(c: Cubie, t: { axis: number; layers: number[] }) { return t.layers.includes(c.pos[t.axis]); }
  turn(t: Turn) {
    const R = quarterMatrix(t.axis, t.q);
    for (const c of this.cubies) if (this.inLayer(c, t)) { c.pos = rotVec(c.pos, t.axis, t.q); c.rot = mul(R, c.rot); }
  }
  /** Current cube-space normal of a sticker. */
  normalOf(s: Sticker): Vec3 { return apply(this.cubies[s.cubie].rot, s.normal); }
  /** Which facelet index a sticker currently occupies. */
  faceletOf(s: Sticker) { return stickerIndexAt(this.n, this.cubies[s.cubie].pos, this.normalOf(s)); }
  /** The sticker currently shown at facelet index i, with its normal and cubie position. */
  stickerAt(i: number) {
    const g = stickerGeometry(this.n, i);
    const s = this.stickers.find((st) => { const c = this.cubies[st.cubie]; return c.pos.join() === g.pos.join() && this.normalOf(st).join() === g.normal.join(); })!;
    return { sticker: s, normal: g.normal, cubie: g.pos };
  }
  readState(): string {
    const out = new Array<string>(this.stickers.length);
    for (const s of this.stickers) out[this.faceletOf(s)] = s.color;
    return out.join("");
  }
}
