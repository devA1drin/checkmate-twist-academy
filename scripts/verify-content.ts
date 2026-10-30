// Validates learning content: chess positions/lines, puzzles, cube lesson algorithms, quizzes.
import { Chess } from "chess.js";
import { CHESS_LESSONS } from "../src/data/chess-lessons";
import { CUBE_LESSONS } from "../src/data/cube-lessons";
import puzzles from "../src/data/puzzles.json";
import videos from "../src/data/videos.json";
import { QUIZZES } from "../src/data/quizzes";
import { parseAlg, applyAlg, SOLVED, isSolved } from "../src/lib/cube/model";
import { caseState, f2lSolved, crossSolved, slotsSolved } from "../src/lib/cube/cases";

let fails = 0, boards = 0, moves = 0, algs = 0;
const fail = (m: string) => { fails++; console.log("FAIL", m); };
const videoIds = new Set((videos as { id: string }[]).map((v) => v.id));

for (const l of CHESS_LESSONS) {
  for (const v of l.videos ?? []) if (!videoIds.has(v)) fail(`${l.slug}: unknown video ${v}`);
  for (const s of l.sections) {
    for (const b of [...(s.board ? [s.board] : []), ...(s.boards ?? [])]) {
      boards++;
      let c: Chess;
      try { c = new Chess(b.fen); } catch (e) { fail(`${l.slug}: bad FEN ${b.fen}: ${e}`); continue; }
      for (const san of b.moves ?? []) {
        try { c.move(san); moves++; } catch { fail(`${l.slug}: illegal move ${san} in "${b.caption}"`); break; }
        if (san.endsWith("#") && !c.isCheckmate()) fail(`${l.slug}: ${san} is not mate`);
        if (san.endsWith("+") && !c.inCheck()) fail(`${l.slug}: ${san} is not check`);
      }
      if (/stalemate/i.test(b.caption) && b.fen && !new Chess(b.fen).isStalemate()) fail(`${l.slug}: claimed stalemate is not stalemate`);
    }
  }
}
// hero position
{ const c = new Chess("r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4"); c.move("Qxf7#"); if (!c.isCheckmate()) fail("hero Qxf7 not mate"); }
console.log(`Chess lessons: ${CHESS_LESSONS.length} lessons, ${boards} boards, ${moves} SAN moves validated with chess.js`);

let pOk = 0;
for (const p of puzzles as { id: string; fen: string; moves: string[]; themes: string[] }[]) {
  try {
    const c = new Chess(p.fen);
    for (const u of p.moves) c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
    if (p.themes.some((t) => t.startsWith("mateIn")) && !c.isCheckmate()) throw new Error("mate theme but final position is not mate");
    pOk++;
  } catch (e) { fail(`puzzle ${p.id}: ${e}`); }
}
console.log(`Puzzles: ${pOk}/${puzzles.length} Lichess puzzle lines legal (mate themes end in checkmate)`);

for (const l of CUBE_LESSONS) {
  for (const v of l.videos ?? []) if (!videoIds.has(v)) fail(`${l.slug}: unknown video ${v}`);
  for (const s of l.sections) for (const a of s.algs ?? []) {
    algs++;
    try { parseAlg(a.alg); } catch (e) { fail(`${l.slug}: ${a.alg}: ${e}`); continue; }
    const st = caseState(a.alg);
    if (a.diagram === "OLL" || a.diagram === "PLL") {
      if (!f2lSolved(st)) fail(`${l.slug}: ${a.alg} should preserve F2L`);
      if (a.diagram === "PLL" && st.slice(0, 9) !== "UUUUUUUUU") fail(`${l.slug}: PLL ${a.alg} changes orientation`);
    }
    if (a.diagram === "F2L" && (!crossSolved(st) || slotsSolved(st).length !== 3)) fail(`${l.slug}: F2L ${a.alg} must affect exactly one slot`);
  }
}
// specific claims made in lesson text
const sexy6 = applyAlg(SOLVED, "R U R' U' ".repeat(6)); if (!isSolved(sexy6)) fail("sexy move x6 is not identity");
for (let n = 1; n < 6; n++) if (isSolved(applyAlg(SOLVED, "R U R' U' ".repeat(n)))) fail("sexy move order < 6");
{ const s = applyAlg(SOLVED, "R U R' U R U2 R' U"); if (!(s[46] === "B" && s[10] === "R" && s[19] === "L" && s[37] === "F" && f2lSolved(s))) fail("Sune+U edge-swap claim wrong"); }
{ const s = applyAlg(SOLVED, "U R U' L' U R' U' L"); if (!(s[8] === "U" && s[9] === "R" && s[20] === "F" && f2lSolved(s))) fail("corner 3-cycle claim wrong (URF must stay)"); }
{ const s = applyAlg(SOLVED, "R' D' R D ".repeat(6)); if (!isSolved(s)) fail("R' D' R D x6 not identity"); }
console.log(`Cube lessons: ${CUBE_LESSONS.length} lessons, ${algs} algorithms parsed/checked, text claims verified with cube model`);

let q = 0;
for (const quiz of QUIZZES) for (const item of quiz.questions) {
  q++;
  if (item.answer < 0 || item.answer >= item.options.length) fail(`${quiz.id}: bad answer index`);
  if (item.fen) {
    try { const c = new Chess(item.fen); if (item.correctSan) { c.move(item.correctSan); if (item.correctSan.endsWith("#") && !c.isCheckmate()) fail(`${quiz.id}: ${item.correctSan} not mate`); } }
    catch (e) { fail(`${quiz.id}: ${e}`); }
  }
  if (item.alg && item.algCheck === "solves-sune" && !isSolved(applyAlg(caseState("R U R' U R U2 R'"), item.alg))) fail(`${quiz.id}: alg check`);
}
console.log(`Quizzes: ${QUIZZES.length} quizzes, ${q} questions checked`);
console.log(fails ? `${fails} FAILURES` : "ALL CONTENT VERIFIED");
process.exit(fails ? 1 : 0);
