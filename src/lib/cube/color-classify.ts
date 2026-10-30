/**
 * Sticker color classification for the camera scanner.
 * Pure functions (no I/O) so they can be unit-tested. Works in CIE Lab space.
 */
export type RGB = [number, number, number];
export type Lab = [number, number, number];

export function rgbToLab([r, g, b]: RGB): Lab {
  const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const R = lin(r), G = lin(g), B = lin(b);
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
export const deltaE = (a: Lab, b: Lab) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Typical sticker colors, used only for the live preview before centers are known. */
export const REFERENCE: Record<string, RGB> = {
  U: [235, 235, 230], R: [190, 25, 40], F: [20, 165, 85], D: [235, 215, 40], L: [245, 120, 25], B: [20, 75, 195],
};
export function nearestReference(rgb: RGB): string {
  const l = rgbToLab(rgb);
  let best = "U", bd = Infinity;
  for (const [k, v] of Object.entries(REFERENCE)) { const d = deltaE(l, rgbToLab(v)); if (d < bd) { bd = d; best = k; } }
  return best;
}

/**
 * Classify 54 sampled stickers into the 6 colors defined by the 6 sampled centers.
 * Balanced assignment (each color gets exactly 9 stickers) seeded by the centers, then refined
 * by recomputing cluster means (k-means with a capacity constraint). Returns face-letter tokens
 * (the color of the center of face U, R, F, D, L, B) and a confidence per sticker.
 */
export function classifyStickers(samples: RGB[], faces = "URFDLB"): { tokens: string[]; confidence: number[] } {
  const labs = samples.map(rgbToLab);
  let means: Lab[] = faces.split("").map((_, i) => labs[i * 9 + 4]);
  let tokens: string[] = new Array(54).fill("?");
  const confidence: number[] = new Array(54).fill(1);
  for (let iter = 0; iter < 4; iter++) {
    const pairs: { s: number; c: number; d: number }[] = [];
    for (let s = 0; s < 54; s++) for (let c = 0; c < 6; c++) pairs.push({ s, c, d: deltaE(labs[s], means[c]) });
    pairs.sort((a, b) => a.d - b.d);
    const count = new Array(6).fill(0), assigned = new Array(54).fill(-1);
    // centers are fixed
    for (let c = 0; c < 6; c++) { assigned[c * 9 + 4] = c; count[c]++; }
    for (const p of pairs) { if (assigned[p.s] >= 0 || count[p.c] >= 9) continue; assigned[p.s] = p.c; count[p.c]++; }
    tokens = assigned.map((c) => faces[c]);
    const next: Lab[] = means.map(() => [0, 0, 0]);
    assigned.forEach((c, s) => { next[c][0] += labs[s][0] / 9; next[c][1] += labs[s][1] / 9; next[c][2] += labs[s][2] / 9; });
    means = next;
  }
  // confidence: margin between nearest and second-nearest cluster
  for (let s = 0; s < 54; s++) {
    const ds = means.map((m) => deltaE(labs[s], m)).sort((a, b) => a - b);
    confidence[s] = Math.max(0, Math.min(1, (ds[1] - ds[0]) / (ds[1] + 1e-6)));
  }
  return { tokens, confidence };
}
