import { applyAlg, SOLVED, isSolved, invertAlg, randomMoveScramble } from "../src/lib/cube/model";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Cube = require("cubejs");
let fails = 0;
const check = (cond: boolean, msg: string) => { if (!cond) { fails++; console.log("FAIL", msg); } };
for (const mv of ["U","R","F","D","L","B","U'","R2","F'","M","E","S","x","y","z","r","u'","f2","b","l","d"]) {
  const mine = applyAlg(SOLVED, mv);
  const theirs = new Cube().move(mv).asString();
  check(mine === theirs, `move ${mv}: mine=${mine} cubejs=${theirs}`);
}
for (let t = 0; t < 200; t++) {
  const s = randomMoveScramble(30);
  check(applyAlg(SOLVED, s) === new Cube().move(s).asString(), "scramble " + s);
  check(isSolved(applyAlg(applyAlg(SOLVED, s), invertAlg(s))), "inverse " + s);
}
check(isSolved(applyAlg(SOLVED, "R U R' U' ".repeat(6))), "sexy x6");
console.log(fails ? `${fails} failures` : "model OK: matches cubejs for all tested moves + 200 random scrambles");
process.exit(fails ? 1 : 0);
