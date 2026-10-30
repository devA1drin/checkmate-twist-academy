/** Size-generic model, drag mapping, render engine consistency and the 2x2 solver. */
import { applyAlg, SOLVED } from "../src/lib/cube/model";
import { applyMoves, applyTurn, dragTurn, invertNxn, isSolvedState, parseNxn, solvedState, stickerGeometry, turnToText, type Axis, type Vec3 } from "../src/lib/cube/nxn";
import { CubeEngine } from "../src/lib/cube/engine";
import { solve2x2 } from "../src/lib/cube/solver2";

let fails = 0, checks = 0;
const check = (c: boolean, m: string) => { checks++; if (!c) { fails++; if (fails < 20) console.log("FAIL", m); } };
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

// 1. n = 3 matches the validated 3x3 model for every move type
const ALL3 = ["U", "R", "F", "D", "L", "B", "M", "E", "S", "x", "y", "z", "r", "l", "u", "d", "f", "b", "Rw", "Uw", "Fw", "Lw", "Dw", "Bw"];
for (const b of ALL3) for (const s of ["", "'", "2"]) check(applyMoves(3, SOLVED, parseNxn(3, b + s)) === applyAlg(SOLVED, b + s), `n3 ${b}${s}`);
for (let t = 0; t < 300; t++) {
  const alg = Array.from({ length: 25 }, () => pick(ALL3) + pick(["", "'", "2"])).join(" ");
  check(applyMoves(3, SOLVED, parseNxn(3, alg)) === applyAlg(SOLVED, alg), "n3 random " + alg);
}

for (const n of [2, 3, 4, 5, 6, 7]) {
  const S = solvedState(n);
  const tokens = ["U", "R", "F", "D", "L", "B", "x", "y", "z", ...(n >= 3 ? ["Rw", "Uw", "Fw", "r", "u"] : []), ...(n >= 4 ? ["2R", "2U", "2F", "2L", "3Rw"] : []), ...(n % 2 && n >= 3 ? ["M", "E", "S"] : [])];
  // 2. inverse, order 4, and sexy-move order 6
  for (const tk of tokens) check(applyMoves(n, S, parseNxn(n, `${tk} ${tk} ${tk} ${tk}`)) === S, `n${n} order4 ${tk}`);
  check(applyMoves(n, S, parseNxn(n, "R U R' U' ".repeat(6))) === S, `n${n} sexy x6`);
  for (let t = 0; t < 60; t++) {
    const mv = parseNxn(n, Array.from({ length: 30 }, () => pick(tokens) + pick(["", "'", "2"])).join(" "));
    const s = applyMoves(n, S, mv);
    check(applyMoves(n, s, invertNxn(mv)) === S, `n${n} inverse`);
    // 3. the render engine (cubie positions + orientations) shows exactly the model state
    const e = new CubeEngine(n); e.reset(S);
    mv.forEach((m) => e.turn(m.turn));
    check(e.readState() === s, `n${n} engine == model`);
  }
  // 4. drag mapping: for every sticker and every drag direction, the turn moves that sticker along the drag
  for (let i = 0; i < 6 * n * n; i++) {
    const g = stickerGeometry(n, i);
    const nAxis = g.normal.findIndex((v) => v !== 0);
    for (const tAxis of [0, 1, 2].filter((a) => a !== nAxis)) for (const sgn of [1, -1]) {
      const drag: Vec3 = [0, 0, 0]; drag[tAxis] = sgn * 0.7; const other = 3 - nAxis - tAxis; drag[other] = 0.2 * (rnd() - 0.5);
      const d = dragTurn(g.normal, g.pos, drag);
      check(d.axis === other && d.tangent[tAxis] === sgn, `n${n} drag axis`);
      // small rotation of the sticker point: velocity = axis × pos must point along the drag
      const p = g.pos.map((v, k) => v + g.normal[k]) as Vec3;
      const a: Vec3 = [0, 0, 0]; a[d.axis] = d.sign;
      const vel: Vec3 = [a[1] * p[2] - a[2] * p[1], a[2] * p[0] - a[0] * p[2], a[0] * p[1] - a[1] * p[0]];
      check(vel[tAxis] * sgn > 0, `n${n} drag direction sticker ${i} t${tAxis} ${sgn}`);
      // the notation for that turn reproduces the same permutation
      const turn = { axis: d.axis as Axis, layers: [d.layer], q: d.sign };
      const txt = turnToText(n, turn);
      check(applyMoves(n, S, parseNxn(n, txt)) === applyTurn(n, S, turn), `n${n} turnToText ${txt}`);
    }
  }
  // 5. random drag sequences through the engine stay consistent with the model fed the emitted notation
  for (let t = 0; t < 40; t++) {
    const e = new CubeEngine(n); e.reset(S);
    let model = S;
    for (let k = 0; k < 25; k++) {
      const i = Math.floor(rnd() * 6 * n * n);
      const { normal, cubie } = e.stickerAt(i);
      const nAxis = normal.findIndex((v) => v !== 0);
      const drag: Vec3 = [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]; drag[nAxis] = 0;
      const d = dragTurn(normal, cubie, drag);
      const q = d.sign * pick([1, 1, 2, -1]);
      const turn = { axis: d.axis, layers: [d.layer], q };
      e.turn(turn);
      model = applyMoves(n, model, parseNxn(n, turnToText(n, turn)));
    }
    check(e.readState() === model, `n${n} drag sequence consistent`);
  }
}

// 6. 2x2 optimal solver: solutions solve, are ≤ 11 moves, and bad states are rejected
const S2 = solvedState(2);
const t0 = Date.now();
for (let t = 0; t < 150; t++) {
  const scr = parseNxn(2, Array.from({ length: 20 }, () => pick(["U", "R", "F", "D", "L", "B", "x", "y", "z"]) + pick(["", "'", "2"])).join(" "));
  const s = applyMoves(2, S2, scr);
  const sol = solve2x2(s);
  const moves = sol ? parseNxn(2, sol) : [];
  check(isSolvedState(2, applyMoves(2, s, moves)), "2x2 solves " + sol);
  check(moves.length <= 11, "2x2 optimal length " + moves.length);
}
check(solve2x2(S2) === "", "2x2 solved → empty");
check(parseNxn(2, solve2x2(applyMoves(2, S2, parseNxn(2, "R")))).length === 1, "2x2 one move is optimal");
const bad = (s: string) => { try { solve2x2(s); return false; } catch { return true; } };
{ // twist one corner in place by rotating the three sticker colours of the U-R-F corner
  const s = S2.split("");
  const u = 3, r = 4, f = 9; // U face idx3 (front-right), R face idx0 (top-left = front-top), F face idx1 (top-right)
  check(stickerGeometry(2, u).pos.join() === "1,1,1" && stickerGeometry(2, r).pos.join() === "1,1,1" && stickerGeometry(2, f).pos.join() === "1,1,1", "URF corner stickers");
  [s[u], s[r], s[f]] = [s[r], s[f], s[u]];
  check(bad(s.join("")), "2x2 twisted corner rejected");
}
check(bad(S2.replace("U", "R")), "2x2 bad counts rejected");
console.log(fails ? `${fails}/${checks} failures` : `nxn OK: ${checks} checks (sizes 2–7: model, engine, drag mapping, notation; 3x3 equals validated model; 150 optimal 2x2 solves in ${Date.now() - t0} ms)`);
process.exit(fails ? 1 : 0);
