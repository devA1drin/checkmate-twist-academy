/** Helpers to analyse last-layer cases from cube state (used for diagrams and verification). */
import { applyAlg, invertAlg, normalizeToCenters, SOLVED } from "./model";

export const LL_INDICES = {
  u: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  // top rows of side faces, listed left-to-right as seen from the front of each face
  f: [18, 19, 20], r: [9, 10, 11], b: [45, 46, 47], l: [36, 37, 38],
};

/** The (normalized) state that an algorithm solves: inverse(alg) applied to a solved cube. */
export function caseState(alg: string): string {
  return normalizeToCenters(applyAlg(SOLVED, invertAlg(alg)));
}

/** True if first two layers (D face + middle and bottom rows of sides) are solved. */
export function f2lSolved(s: string): boolean {
  for (let i = 27; i < 36; i++) if (s[i] !== "D") return false;
  for (const f of [9, 18, 36, 45]) for (let k = 3; k < 9; k++) if (s[f + k] !== s[f + 4]) return false;
  return true;
}

export function crossSolved(s: string): boolean {
  for (const i of [28, 30, 32, 34, 31]) if (s[i] !== "D") return false;
  return s[25] === "F" && s[16] === "R" && s[52] === "B" && s[43] === "L";
}

const SLOTS = {
  FR: [29, 26, 15, 23, 12, 24 - 0, 25 - 0].slice(0, 5),
  FL: [27, 24, 44, 21, 41],
  BL: [33, 42, 53, 50, 39],
  BR: [35, 51, 17, 48, 14],
};
export function slotsSolved(s: string): string[] {
  const home: Record<number, string> = {};
  for (let i = 0; i < 54; i++) home[i] = "URFDLB"[Math.floor(i / 9)];
  return Object.entries(SLOTS).filter(([, idx]) => idx.every((i) => s[i] === home[i])).map(([k]) => k);
}

export function llKey(s: string, orientationOnly: boolean): string {
  const idx = [...LL_INDICES.u, ...LL_INDICES.f, ...LL_INDICES.r, ...LL_INDICES.b, ...LL_INDICES.l];
  return idx.map((i) => (orientationOnly ? (s[i] === "U" ? "1" : "0") : s[i])).join("");
}

/** Canonical key of an LL case, invariant under pre-AUF, post-AUF and viewing angle (y). */
export function canonicalCaseKey(alg: string, orientationOnly: boolean): string {
  let best: string | null = null;
  const inv = invertAlg(alg);
  for (let a = 0; a < 4; a++)
    for (let b = 0; b < 4; b++)
      for (let k = 0; k < 4; k++) {
        let s = applyAlg(SOLVED, "U ".repeat(a));
        s = applyAlg(s, inv);
        s = applyAlg(s, "U ".repeat(b) + "y ".repeat(k));
        const key = llKey(normalizeToCenters(s), orientationOnly);
        if (best === null || key < best) best = key;
      }
  return best!;
}
