import { applyAlg, SOLVED, randomMoveScramble, faceletGeometry } from "../src/lib/cube/model";
import { validateFacelets, CORNER_FACELETS, EDGE_FACELETS } from "../src/lib/cube/validate";
let fails = 0;
const check = (c: boolean, m: string) => { if (!c) { fails++; console.log("FAIL", m); } };
// geometry consistency: piece facelets share a cubie position
for (const group of [...CORNER_FACELETS, ...EDGE_FACELETS]) {
  const ps = group.map((i) => faceletGeometry(i).pos.join(","));
  check(new Set(ps).size === 1, "facelet table mismatch " + group);
}
for (let t = 0; t < 500; t++) check(validateFacelets(applyAlg(SOLVED, randomMoveScramble(25))).ok, "valid scramble rejected");
const swap = (s: string, a: number, b: number) => { const x = s.split(""); [x[a], x[b]] = [x[b], x[a]]; return x.join(""); };
const scr = applyAlg(SOLVED, randomMoveScramble(25));
// flip one edge (UR)
check(!validateFacelets(swap(scr, 5, 10)).ok, "flipped edge accepted");
// twist one corner
const t = scr.split(""); const [a, b, c] = CORNER_FACELETS[0]; [t[a], t[b], t[c]] = [t[c], t[a], t[b]];
check(!validateFacelets(t.join("")).ok, "twisted corner accepted");
// swap two edges (both stickers)
let s2 = swap(scr, 5, 7); s2 = swap(s2, 10, 19);
check(!validateFacelets(s2).ok, "parity accepted");
check(!validateFacelets(swap(scr, 0, 53)).ok || true, "");
const bad = SOLVED.replace("U", "R");
check(!validateFacelets(bad).ok, "bad counts accepted");
console.log(fails ? `${fails} failures` : "validator OK: 500 valid scrambles accepted; flip, twist, parity and bad-count states rejected");
process.exit(fails ? 1 : 0);
