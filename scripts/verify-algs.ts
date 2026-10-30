import { OLL, PLL, F2L } from "../src/data/algorithms";
import { applyAlg, invertAlg, isSolved, normalizeToCenters, SOLVED, parseAlg } from "../src/lib/cube/model";
import { caseState, f2lSolved, crossSolved, slotsSolved, canonicalCaseKey } from "../src/lib/cube/cases";
let fails = 0;
const fail = (m: string) => { fails++; console.log("FAIL", m); };
const ok = { oll: 0, pll: 0, f2l: 0 };

const anyAuf = (alg: string, pred: (s: string) => boolean) => {
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
    const s = normalizeToCenters(applyAlg(applyAlg(applyAlg(SOLVED, "U ".repeat(a)), invertAlg(alg)), "U ".repeat(b)));
    if (pred(s)) return true;
  }
  return false;
};

// OLL
const ollKeys = new Map<string, number[]>();
for (const c of OLL) {
  const n = Number(c.id.split("-")[1]);
  for (const alg of [c.alg, ...(c.alts ?? [])]) {
    try { parseAlg(alg); } catch (e) { fail(`${c.name} parse: ${e}`); continue; }
    const s = caseState(alg);
    let good = true;
    if (!f2lSolved(s)) { fail(`${c.name}: does not preserve F2L (${alg})`); good = false; }
    const uOriented = [0,1,2,3,5,6,7,8].every((i) => s[i] === "U");
    if (uOriented) { fail(`${c.name}: case is already oriented`); good = false; }
    if (!isSolved(applyAlg(s, alg))) { fail(`${c.name}: alg does not orient LL`); good = false; }
    const edges = [1,3,5,7].filter((i) => s[i] === "U");
    const corners = [0,2,6,8].filter((i) => s[i] === "U").length;
    const g = c.group;
    if (g === "Dot" && edges.length !== 0) { fail(`${c.name}: dot case should have 0 oriented edges, has ${edges.length}`); good = false; }
    if (g.startsWith("OCLL") && edges.length !== 4) { fail(`${c.name}: OCLL should have 4 oriented edges`); good = false; }
    if (g === "Corners Oriented" && (corners !== 4 || edges.length === 4)) { fail(`${c.name}: should have all corners oriented`); good = false; }
    const opposite = edges.length === 2 && ((edges.includes(1) && edges.includes(7)) || (edges.includes(3) && edges.includes(5)));
    if (g === "Line" && !opposite) { fail(`${c.name}: line case should have opposite edges oriented`); good = false; }
    if ((g === "Square" || g === "P Shape") && (edges.length !== 2 || opposite)) { fail(`${c.name}: should have adjacent edges oriented`); good = false; }
    if (alg === c.alg) {
      const k = canonicalCaseKey(alg, true);
      ollKeys.set(k, [...(ollKeys.get(k) ?? []), n]);
      if (good) ok.oll++;
    }
  }
}
for (const [, ns] of ollKeys) if (ns.length > 1) fail(`OLL cases ${ns.join(",")} are the same case`);
console.log(`OLL: ${ok.oll}/${OLL.length} verified; ${ollKeys.size} distinct orientation cases`);

// PLL
const pllKeys = new Map<string, string[]>();
for (const c of PLL) {
  let primaryKey = "";
  for (const alg of [c.alg, ...(c.alts ?? [])]) {
    try { parseAlg(alg); } catch (e) { fail(`${c.name} parse: ${e}`); continue; }
    const s = caseState(alg);
    let good = true;
    if (!f2lSolved(s)) { fail(`${c.name}: does not preserve F2L (${alg})`); good = false; }
    if (![0,1,2,3,4,5,6,7,8].every((i) => s[i] === "U")) { fail(`${c.name}: changes LL orientation (${alg})`); good = false; }
    if (!isSolved(applyAlg(s, alg))) { fail(`${c.name}: does not solve`); good = false; }
    if (anyAuf(alg, isSolved)) { fail(`${c.name}: is only an AUF`); good = false; }
    const cornerIdx = [9, 11, 18, 20, 36, 38, 45, 47];
    const edgeIdx = [10, 19, 37, 46];
    const solvedAt = (idx: number[]) => (s2: string) => idx.every((i) => s2[i] === "URFDLB"[Math.floor(i / 9)]);
    if (c.group === "Edges only" && !anyAuf(alg, solvedAt(cornerIdx))) { fail(`${c.name}: should only move edges`); good = false; }
    if (c.group === "Corners only" && !anyAuf(alg, solvedAt(edgeIdx))) { fail(`${c.name}: should only move corners`); good = false; }
    const k = canonicalCaseKey(alg, false);
    if (alg === c.alg) { primaryKey = k; pllKeys.set(k, [...(pllKeys.get(k) ?? []), c.id]); if (good) ok.pll++; }
    else if (k !== primaryKey) fail(`${c.name}: alternative alg ${alg} solves a different case`);
  }
}
for (const [, ids] of pllKeys) if (ids.length > 1) fail(`PLL ${ids.join(",")} are the same case`);
console.log(`PLL: ${ok.pll}/${PLL.length} verified; ${pllKeys.size} distinct permutation cases`);

// F2L
for (const c of F2L) {
  const s = caseState(c.alg);
  const slots = slotsSolved(s);
  if (!crossSolved(s)) fail(`${c.name}: breaks cross`);
  else if (slots.length !== 3) fail(`${c.name}: should affect exactly one slot (intact: ${slots})`);
  else if (!isSolved(applyAlg(s, c.alg))) fail(`${c.name}: does not solve`);
  else ok.f2l++;
}
console.log(`F2L: ${ok.f2l}/${F2L.length} verified (cross kept, exactly one slot solved by the alg)`);
console.log(fails ? `${fails} FAILURES` : "ALL ALGORITHMS VERIFIED");
process.exit(fails ? 1 : 0);
