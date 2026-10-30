// Verifies the Kociemba two-phase solver (cubejs) output with our independent cube model.
import { applyAlg, SOLVED, isSolved, parseAlg, invertAlg } from "../src/lib/cube/model";
import { validateFacelets } from "../src/lib/cube/validate";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Cube = require("cubejs"); require("cubejs/lib/solve");
const t0 = Date.now(); Cube.initSolver(); console.log(`solver init ${Date.now() - t0}ms`);
let fails = 0, total = 0, maxLen = 0, sumLen = 0;
const N = 100;
for (let i = 0; i < N; i++) {
  const state: string = Cube.random().asString();
  if (!validateFacelets(state).ok) { fails++; console.log("random state invalid?"); }
  const sol: string = Cube.fromString(state).solve();
  const len = parseAlg(sol).length; maxLen = Math.max(maxLen, len); sumLen += len; total++;
  if (!isSolved(applyAlg(state, sol))) { fails++; console.log("FAIL solve", state, sol); }
  // random-state scramble = inverse of solution; applying it to solved must reproduce the state
  if (applyAlg(SOLVED, invertAlg(sol)) !== state) { fails++; console.log("FAIL scramble reproduce"); }
}
console.log(`${total - fails}/${total} random-state cubes solved & verified by independent model; avg ${(sumLen / total).toFixed(1)} moves, max ${maxLen}`);
process.exit(fails ? 1 : 0);
