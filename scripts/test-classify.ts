// Simulated scans: real cube states rendered with noisy, unevenly lit colors must classify back exactly.
import { classifyStickers, REFERENCE, type RGB } from "../src/lib/cube/color-classify";
import { applyAlg, SOLVED, randomMoveScramble } from "../src/lib/cube/model";
import { validateColors } from "../src/lib/cube/validate";
let ok = 0; const N = 300; let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
for (let t = 0; t < N; t++) {
  const state = applyAlg(SOLVED, randomMoveScramble(25, rnd));
  const samples: RGB[] = [];
  for (let f = 0; f < 6; f++) {
    const light = 0.7 + rnd() * 0.5; // each face photographed under different brightness
    for (let k = 0; k < 9; k++) {
      const base = REFERENCE[state[f * 9 + k]];
      samples.push(base.map((v) => Math.max(0, Math.min(255, v * light + (rnd() - 0.5) * 30))) as RGB);
    }
  }
  const { tokens } = classifyStickers(samples);
  if (tokens.join("") === state && validateColors(tokens).ok) ok++;
}
console.log(`Color classification: ${ok}/${N} simulated noisy scans recovered exactly`);
process.exit(ok >= N * 0.95 ? 0 : 1);
