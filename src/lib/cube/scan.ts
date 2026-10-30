/**
 * Pure helpers for the camera scanner (no DOM), so everything here is unit-tested:
 * the scan order and orientation rule, pixel sampling of the 3x3 grid, live colour readout,
 * stability for auto-capture, plain-language validation, and move descriptions.
 */
import { deltaE, REFERENCE, rgbToLab, type RGB } from "./color-classify";
import { CORNER_FACELETS, EDGE_FACELETS, validateColors } from "./validate";

export const COLOR_WORD: Record<string, string> = { U: "white", R: "red", F: "green", D: "yellow", L: "orange", B: "blue" };
export const FACE_WORD: Record<string, string> = { U: "top", D: "bottom", R: "right", L: "left", F: "front", B: "back" };

/**
 * Orientation rule: start with GREEN facing the camera and WHITE on top. Faces are scanned in
 * this order; `rot` is the whole-cube rotation from that start grip that brings the face to the
 * camera, `step` the rotation from the previous face. Rows/columns of each captured picture then
 * match the standard facelet layout directly (checked by tests).
 */
export const SCAN_STEPS: { face: string; top: string; rot: string; step: string; say: string }[] = [
  { face: "F", top: "U", rot: "", step: "", say: "Hold the cube with the green centre facing the camera and white on top." },
  { face: "R", top: "U", rot: "y", step: "y", say: "Turn the whole cube a quarter to the left so red faces the camera. White stays on top." },
  { face: "B", top: "U", rot: "y2", step: "y", say: "Turn it another quarter to the left so blue faces the camera. White stays on top." },
  { face: "L", top: "U", rot: "y'", step: "y", say: "One more quarter to the left: orange faces the camera, white on top." },
  { face: "U", top: "B", rot: "x'", step: "y x'", say: "Turn back to green facing you, then tip the top towards you so white faces the camera (blue is now on top)." },
  { face: "D", top: "F", rot: "x", step: "x2", say: "Tip the cube over twice, top away from you, so yellow faces the camera with green on top." },
];
export const FACE_ORDER = "URFDLB";
export const faceIndex = (f: string) => FACE_ORDER.indexOf(f);

// ---------------- pixel sampling ----------------
export interface Region { x: number; y: number; size: number }
/** The alignment square: centred, 62% of the shorter side. */
export const gridRegion = (w: number, h: number, frac = 0.62): Region => { const size = Math.min(w, h) * frac; return { x: (w - size) / 2, y: (h - size) / 2, size }; };

/**
 * Average colour of the middle of each of the 9 cells (row-major), using a trimmed mean that
 * ignores the darkest and brightest 15% of pixels (sticker edges, glare). `spread` is the
 * luminance spread inside the patch, used to tell a flat sticker from clutter.
 */
export function sampleGrid(data: Uint8ClampedArray | number[], w: number, h: number, r: Region): { rgb: RGB[]; spread: number[] } {
  const cell = r.size / 3, patch = Math.max(2, Math.round(cell * 0.4));
  const rgb: RGB[] = [], spread: number[] = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    const px0 = Math.round(r.x + col * cell + (cell - patch) / 2), py0 = Math.round(r.y + row * cell + (cell - patch) / 2);
    const px: [number, number, number, number][] = [];
    for (let y = py0; y < py0 + patch; y += 2) for (let x = px0; x < px0 + patch; x += 2) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = (y * w + x) * 4; const R = data[i], G = data[i + 1], B = data[i + 2];
      px.push([R, G, B, R * 0.299 + G * 0.587 + B * 0.114]);
    }
    px.sort((a, b) => a[3] - b[3]);
    const lo = Math.floor(px.length * 0.15), hi = Math.max(lo + 1, Math.ceil(px.length * 0.85));
    const sel = px.slice(lo, hi);
    rgb.push([0, 1, 2].map((k) => sel.reduce((s, p) => s + p[k], 0) / Math.max(1, sel.length)) as RGB);
    spread.push(sel.length ? sel[sel.length - 1][3] - sel[0][3] : 255);
  }
  return { rgb, spread };
}

// ---------------- colour features ----------------
/**
 * Colour features that ignore how bright the light is: chromaticity (each channel's share of
 * the total) plus a small brightness term. Camera exposure changes from face to face and light
 * falls off across a face; both scale all channels together, which chromaticity cancels out.
 * The brightness term keeps white apart from grey-ish blue in dim light.
 */
export type Feat = [number, number, number, number];
export function feat([r, g, b]: RGB): Feat {
  const s = r + g + b + 1;
  return [(r / s) * 300, (g / s) * 300, (b / s) * 300, ((r + g + b) / 3) * 0.12];
}
const fdist = (a: Feat, b: Feat) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]);

// ---------------- live readout ----------------
/** Session palette: the centres captured so far (calibrated to this cube and light), else typical colours. */
export function palette(centres: Partial<Record<string, RGB>>): Record<string, Feat> {
  const p: Record<string, Feat> = {};
  for (const f of FACE_ORDER) p[f] = feat(centres[f] ?? REFERENCE[f]);
  return p;
}
export function nearest(rgb: RGB, pal: Record<string, Feat>): { face: string; margin: number } {
  const l = feat(rgb);
  const d = Object.entries(pal).map(([f, m]) => ({ f, d: fdist(l, m) })).sort((a, b) => a.d - b.d);
  return { face: d[0].f, margin: (d[1].d - d[0].d) / (d[1].d + 1e-6) };
}
/** Largest colour change of any sticker between two consecutive samples (for "holding still"). */
export const motion = (a: RGB[], b: RGB[]) => Math.max(...a.map((c, i) => deltaE(rgbToLab(c), rgbToLab(b[i]))));

// ---------------- classification of all 54 ----------------
/**
 * White balance from the white centre (gains that make it neutral, i.e. per-session
 * calibration to this light), then a balanced clustering seeded by the six centres: every
 * colour gets exactly 9 stickers, assigned greedily by distance, then cluster means are
 * re-estimated and the assignment repeated. Confidence is the margin to the second-best colour.
 */
export function classifyScan(samples: RGB[]): { tokens: string[]; confidence: number[] } {
  const w = samples[4];
  const lum = (w[0] + w[1] + w[2]) / 3;
  const balanced = lum > 30 ? samples.map((c) => c.map((v, k) => Math.min(255, (v * lum) / Math.max(1, w[k]))) as RGB) : samples;
  const fs = balanced.map(feat);
  let means: Feat[] = FACE_ORDER.split("").map((_, i) => fs[i * 9 + 4]);
  let assigned: number[] = [];
  for (let iter = 0; iter < 6; iter++) {
    const pairs: { s: number; c: number; d: number }[] = [];
    for (let s = 0; s < 54; s++) for (let c = 0; c < 6; c++) pairs.push({ s, c, d: fdist(fs[s], means[c]) });
    pairs.sort((a, b) => a.d - b.d);
    const count = new Array(6).fill(0); assigned = new Array(54).fill(-1);
    for (let c = 0; c < 6; c++) { assigned[c * 9 + 4] = c; count[c]++; }
    for (const p of pairs) { if (assigned[p.s] >= 0 || count[p.c] >= 9) continue; assigned[p.s] = p.c; count[p.c]++; }
    const next: Feat[] = means.map(() => [0, 0, 0, 0]);
    assigned.forEach((c, s) => { for (let k = 0; k < 4; k++) next[c][k] += fs[s][k] / 9; });
    means = next;
  }
  // pairwise refinement: greedy filling can leave two stickers holding each other's colour
  for (let pass = 0, changed = true; pass < 5 && changed; pass++) {
    changed = false;
    for (let a = 0; a < 54; a++) for (let b = a + 1; b < 54; b++) {
      const ca = assigned[a], cb = assigned[b];
      if (ca === cb || a % 9 === 4 || b % 9 === 4) continue;
      if (fdist(fs[a], means[cb]) + fdist(fs[b], means[ca]) < fdist(fs[a], means[ca]) + fdist(fs[b], means[cb]) - 1e-9) { assigned[a] = cb; assigned[b] = ca; changed = true; }
    }
  }
  const confidence = fs.map((f) => { const ds = means.map((m) => fdist(f, m)).sort((a, b) => a - b); return Math.max(0, Math.min(1, (ds[1] - ds[0]) / (ds[1] + 1e-6))); });
  return { tokens: assigned.map((c) => FACE_ORDER[c]), confidence };
}

// ---------------- plain-language validation ----------------
export interface Problem { text: string; stickers: number[] }
const faceOf = (i: number) => FACE_ORDER[Math.floor(i / 9)];
const faceList = (idx: number[]) => [...new Set(idx.map(faceOf))].map((f) => `${COLOR_WORD[f]}-centre`).join(" and ");

export function diagnose(tokens: string[], confidence: number[] = []): { ok: boolean; facelets?: string; problems: Problem[] } {
  const problems: Problem[] = [];
  const unset = tokens.map((t, i) => (t === "?" ? i : -1)).filter((i) => i >= 0);
  if (unset.length) return { ok: false, problems: [{ text: `${unset.length} sticker${unset.length > 1 ? "s are" : " is"} not set yet.`, stickers: unset }] };
  const counts: Record<string, number[]> = {};
  tokens.forEach((t, i) => (counts[t] ??= []).push(i));
  const over = FACE_ORDER.split("").filter((f) => (counts[f]?.length ?? 0) > 9), under = FACE_ORDER.split("").filter((f) => (counts[f]?.length ?? 0) < 9);
  if (over.length || under.length) {
    for (const f of over) {
      const extra = counts[f].length - 9;
      // least certain stickers of the over-counted colour are the likely misreads
      const suspects = counts[f].filter((i) => i % 9 !== 4).sort((a, b) => (confidence[a] ?? 1) - (confidence[b] ?? 1)).slice(0, Math.max(2, extra + 1));
      const short = under.map((u) => `${COLOR_WORD[u]} (${counts[u]?.length ?? 0})`).join(", ");
      problems.push({ text: `There are ${counts[f].length} ${COLOR_WORD[f]} stickers but a cube has 9 of each${short ? `; too few: ${short}` : ""}. ${extra === 1 ? "One" : extra} ${COLOR_WORD[f]} reading${extra > 1 ? "s are" : " is"} probably wrong; check the outlined stickers on the ${faceList(suspects)} face${new Set(suspects.map(faceOf)).size > 1 ? "s" : ""}.`, stickers: suspects });
    }
    return { ok: false, problems };
  }
  const centres = FACE_ORDER.split("").map((_, i) => tokens[i * 9 + 4]);
  if (new Set(centres).size !== 6) return { ok: false, problems: [{ text: "Two centres were read as the same colour. Retake the faces whose centres look alike.", stickers: centres.map((_, i) => i * 9 + 4) }] };
  // impossible pieces
  const want = (idx: number[]) => idx.map((i) => tokens[i]);
  const validCorner = new Set(CORNER_FACELETS.map((c) => c.map((i) => FACE_ORDER[Math.floor(i / 9)]).sort().join("")));
  const validEdge = new Set(EDGE_FACELETS.map((e) => e.map((i) => FACE_ORDER[Math.floor(i / 9)]).sort().join("")));
  const seen = new Map<string, number[]>();
  for (const c of CORNER_FACELETS) {
    const k = want(c).sort().join("");
    if (!validCorner.has(k)) problems.push({ text: `The corner where the ${faceList(c)} faces meet reads ${want(c).map((t) => COLOR_WORD[t]).join("-")}, which no real corner has.`, stickers: c });
    else if (seen.has("c" + k)) problems.push({ text: `Two corners both read ${want(c).map((t) => COLOR_WORD[t]).join("-")}. One of them was misread.`, stickers: [...seen.get("c" + k)!, ...c] });
    seen.set("c" + k, c);
  }
  for (const e of EDGE_FACELETS) {
    const k = want(e).sort().join("");
    if (!validEdge.has(k)) problems.push({ text: `The edge between the ${faceList(e)} faces reads ${want(e).map((t) => COLOR_WORD[t]).join("-")}, which no real edge has.`, stickers: e });
    else if (seen.has("e" + k)) problems.push({ text: `Two edges both read ${want(e).map((t) => COLOR_WORD[t]).join("-")}. One of them was misread.`, stickers: [...seen.get("e" + k)!, ...e] });
    seen.set("e" + k, e);
  }
  if (problems.length) return { ok: false, problems };
  const v = validateColors(tokens);
  if (v.ok && v.facelets) return { ok: true, facelets: v.facelets, problems: [] };
  const low = tokens.map((_, i) => i).filter((i) => i % 9 !== 4).sort((a, b) => (confidence[a] ?? 1) - (confidence[b] ?? 1)).slice(0, 4);
  for (const err of v.errors) {
    if (/twist/i.test(err)) problems.push({ text: "Every piece is there, but one corner looks twisted, which can't happen by turning. Usually two corner stickers were swapped when reading; check the outlined stickers, or the corner was physically twisted.", stickers: low });
    else if (/flip/i.test(err)) problems.push({ text: "Every piece is there, but one edge looks flipped. Usually an edge's two colours were read the wrong way round; check the outlined stickers.", stickers: low });
    else if (/parity|swap/i.test(err)) problems.push({ text: "Every piece is there, but two pieces look swapped, which can't happen by turning. Usually one face was scanned turned sideways; retake the faces with outlined stickers.", stickers: low });
    else problems.push({ text: err, stickers: [] });
  }
  return { ok: false, problems };
}

// ---------------- move descriptions ----------------
const SLICE: Record<string, string> = { M: "middle slice (between left and right, turning like the left face)", E: "equator slice (between top and bottom, turning like the bottom face)", S: "standing slice (between front and back, turning like the front face)" };
const ROT: Record<string, string> = { x: "the whole cube forwards, like turning the right face", y: "the whole cube to the left, like turning the top face", z: "the whole cube like turning the front face" };
export function describeMove(tok: string): string {
  const base = tok[0], mod = tok.slice(1);
  const how = mod.includes("2") ? "twice (a half turn)" : mod.includes("'") ? "counter-clockwise (a quarter turn)" : "clockwise (a quarter turn)";
  if (FACE_WORD[base]) return `Turn the ${FACE_WORD[base]} face ${how}.`;
  if (SLICE[base]) return `Turn the ${SLICE[base]} ${how}.`;
  if (ROT[base]) return `Rotate ${ROT[base]}, ${how}${base === "z" && mod === "2" ? ": the cube ends upside down" : ""}.`;
  return tok;
}
