/**
 * Physical-validity check for a 54-facelet cube (URFDLB Kociemba order).
 * Rejects states that cannot occur on a real 3x3x3: wrong sticker counts, duplicate or
 * impossible pieces, twisted corners, flipped edges, and swapped pieces (parity).
 */
import { FACES } from "./model";

const CORNER_FACELETS = [
  [8, 9, 20], [6, 18, 38], [0, 36, 47], [2, 45, 11],
  [29, 26, 15], [27, 44, 24], [33, 53, 42], [35, 17, 51],
];
const CORNER_COLORS = [
  ["U", "R", "F"], ["U", "F", "L"], ["U", "L", "B"], ["U", "B", "R"],
  ["D", "F", "R"], ["D", "L", "F"], ["D", "B", "L"], ["D", "R", "B"],
];
const EDGE_FACELETS = [
  [5, 10], [7, 19], [3, 37], [1, 46], [32, 16], [28, 25], [30, 43], [34, 52],
  [23, 12], [21, 41], [50, 39], [48, 14],
];
const EDGE_COLORS = [
  ["U", "R"], ["U", "F"], ["U", "L"], ["U", "B"], ["D", "R"], ["D", "F"], ["D", "L"], ["D", "B"],
  ["F", "R"], ["F", "L"], ["B", "L"], ["B", "R"],
];
export const CORNER_NAMES = ["URF", "UFL", "ULB", "UBR", "DFR", "DLF", "DBL", "DRB"];
export const EDGE_NAMES = ["UR", "UF", "UL", "UB", "DR", "DF", "DL", "DB", "FR", "FL", "BL", "BR"];
export { CORNER_FACELETS, EDGE_FACELETS };

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  /** Facelet string re-labeled with face letters (URFDLB) based on center colors. */
  facelets?: string;
}

function parity(perm: number[]): number {
  let p = 0;
  const seen = new Array(perm.length).fill(false);
  for (let i = 0; i < perm.length; i++) {
    if (seen[i]) continue;
    let len = 0;
    for (let j = i; !seen[j]; j = perm[j]) { seen[j] = true; len++; }
    p += len - 1;
  }
  return p % 2;
}

/**
 * Validate a cube given as 54 arbitrary color tokens (e.g. "white","red"... or single letters)
 * in URFDLB facelet order. Centers define which color belongs to which face.
 */
export function validateColors(colors: string[]): ValidationResult {
  const errors: string[] = [];
  if (colors.length !== 54) return { ok: false, errors: ["Need exactly 54 stickers."] };
  const centerToFace = new Map<string, string>();
  FACES.forEach((f, i) => {
    const c = colors[i * 9 + 4];
    if (centerToFace.has(c)) errors.push(`Two centers share the color "${c}" — each face center must be a different color.`);
    centerToFace.set(c, f);
  });
  if (errors.length) return { ok: false, errors };
  const counts = new Map<string, number>();
  for (const c of colors) counts.set(c, (counts.get(c) ?? 0) + 1);
  for (const [c, n] of counts) {
    if (!centerToFace.has(c)) errors.push(`Color "${c}" does not match any center.`);
    else if (n !== 9) errors.push(`Color "${c}" appears ${n} times (must be exactly 9).`);
  }
  if (errors.length) return { ok: false, errors };
  const f = colors.map((c) => centerToFace.get(c)!).join("");
  return validateFacelets(f);
}

/** Validate a facelet string that already uses U/R/F/D/L/B letters. */
export function validateFacelets(f: string): ValidationResult {
  const errors: string[] = [];
  if (!/^[URFDLB]{54}$/.test(f)) return { ok: false, errors: ["Facelet string must be 54 letters of URFDLB."] };
  for (let i = 0; i < 6; i++) if (f[i * 9 + 4] !== FACES[i]) errors.push("Centers are not in standard orientation.");
  if (errors.length) return { ok: false, errors };

  // Corners
  const cp: number[] = [];
  let twist = 0;
  const cornerSeen = new Array(8).fill(0);
  for (let i = 0; i < 8; i++) {
    const fl = CORNER_FACELETS[i];
    let ori = 0;
    for (; ori < 3; ori++) if (f[fl[ori]] === "U" || f[fl[ori]] === "D") break;
    if (ori === 3) { errors.push(`Corner at ${CORNER_NAMES[i]} has no white/yellow (U/D) sticker — impossible piece.`); continue; }
    const c1 = f[fl[(ori + 1) % 3]], c2 = f[fl[(ori + 2) % 3]];
    const j = CORNER_COLORS.findIndex((cc) => cc[1] === c1 && cc[2] === c2 && cc[0] === f[fl[ori]]);
    if (j < 0) { errors.push(`Corner at ${CORNER_NAMES[i]} has an impossible color combination (${f[fl[0]]}${f[fl[1]]}${f[fl[2]]}).`); continue; }
    cp[i] = j; cornerSeen[j]++; twist += ori;
  }
  // Edges
  const ep: number[] = [];
  let flip = 0;
  const edgeSeen = new Array(12).fill(0);
  for (let i = 0; i < 12; i++) {
    const [a, b] = EDGE_FACELETS[i];
    let j = EDGE_COLORS.findIndex((ec) => ec[0] === f[a] && ec[1] === f[b]);
    if (j >= 0) { ep[i] = j; edgeSeen[j]++; continue; }
    j = EDGE_COLORS.findIndex((ec) => ec[0] === f[b] && ec[1] === f[a]);
    if (j >= 0) { ep[i] = j; edgeSeen[j]++; flip++; continue; }
    errors.push(`Edge at ${EDGE_NAMES[i]} has an impossible color pair (${f[a]}${f[b]}).`);
  }
  cornerSeen.forEach((n, j) => { if (n > 1) errors.push(`Corner ${CORNER_NAMES[j]} appears ${n} times.`); });
  edgeSeen.forEach((n, j) => { if (n > 1) errors.push(`Edge ${EDGE_NAMES[j]} appears ${n} times.`); });
  if (errors.length) return { ok: false, errors };
  if (twist % 3 !== 0) errors.push("Twisted corner: corner orientations don't add up — one corner has been physically twisted. Check the corner sticker colors.");
  if (flip % 2 !== 0) errors.push("Flipped edge: an odd number of edges are flipped — one edge was popped out and reinserted. Check edge colors.");
  if (parity(cp) !== parity(ep)) errors.push("Permutation parity error: two pieces are swapped (impossible on a real cube). Re-check the scanned colors.");
  return { ok: errors.length === 0, errors, facelets: f };
}
