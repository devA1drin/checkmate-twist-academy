/**
 * Scanner tests: orientation rule, synthetic camera images under varied lighting through the real
 * sampler + classifier, plain-language validation, beginner guide, and scan → solve end to end.
 */
import { applyAlg, isSolved, randomMoveScramble, SOLVED } from "../src/lib/cube/model";
import { classifyStickers, REFERENCE, type RGB } from "../src/lib/cube/color-classify";
import { classifyScan, describeMove, diagnose, gridRegion, sampleGrid, SCAN_STEPS, FACE_ORDER } from "../src/lib/cube/scan";
import { beginnerGuide } from "../src/lib/cube/beginner";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Cube = require("cubejs");

let fails = 0, checks = 0;
const check = (c: boolean, m: string) => { checks++; if (!c) { fails++; if (fails < 15) console.log("FAIL", m); } };
let seed = 99; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += rnd(); return (s - 2) * 1.7; };
const face = (s: string, f: string) => s.slice(FACE_ORDER.indexOf(f) * 9, FACE_ORDER.indexOf(f) * 9 + 9);

// 1. orientation rule: the face in front after each rotation is the scanned face, in standard order
for (let t = 0; t < 50; t++) {
  const s = applyAlg(SOLVED, randomMoveScramble(25, rnd));
  for (const st of SCAN_STEPS) {
    const r = st.rot ? applyAlg(s, st.rot) : s;
    check(face(r, "F") === face(s, st.face), `picture of ${st.face} matches layout`);
    check(applyAlg(SOLVED, st.rot || "x x'")[4] === st.top && applyAlg(SOLVED, st.rot || "x x'")[22] === st.face, `grip for ${st.face}`);
  }
}
// the step-by-step hints chain to the same grips
{ let cum = ""; for (const st of SCAN_STEPS) { cum = (cum + " " + st.step).trim(); check(applyAlg(SOLVED, cum || "x x'") === applyAlg(SOLVED, st.rot || "x x'"), `hint chain reaches ${st.face}`); } }

// 2. synthetic images → sampler → classifier
type Light = { name: string; tint: [number, number, number] };
const LIGHTS: Light[] = [{ name: "daylight", tint: [1, 1, 1] }, { name: "warm bulb", tint: [1.18, 1.0, 0.68] }, { name: "cool LED", tint: [0.88, 1.0, 1.18] }, { name: "dim", tint: [0.55, 0.55, 0.55] }];
function renderFace(cols: string[], palette: Record<string, RGB>, light: Light, W = 320, H = 240) {
  const data = new Uint8ClampedArray(W * H * 4);
  const reg = gridRegion(W, H);
  const exposure = 0.7 + rnd() * 0.55, gx = (rnd() - 0.5) * 0.5, gy = (rnd() - 0.5) * 0.5; // per-face exposure + light gradient
  const jx = (rnd() - 0.5) * reg.size * 0.06, jy = (rnd() - 0.5) * reg.size * 0.06; // hand not perfectly aligned
  const glare = { k: Math.floor(rnd() * 9), x: rnd(), y: rnd() };
  const bg: RGB = [60 + rnd() * 120, 60 + rnd() * 120, 60 + rnd() * 120];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = (x - reg.x - jx) / reg.size, v = (y - reg.y - jy) / reg.size;
    let c: RGB = bg;
    if (u >= -0.02 && u < 1.02 && v >= -0.02 && v < 1.02) {
      c = [18, 18, 20]; // black plastic
      const col = Math.floor(u * 3), row = Math.floor(v * 3), fu = u * 3 - col, fv = v * 3 - row;
      if (col >= 0 && col < 3 && row >= 0 && row < 3 && fu > 0.07 && fu < 0.93 && fv > 0.07 && fv < 0.93) {
        const k = row * 3 + col; c = palette[cols[k]];
        if (k === glare.k && Math.hypot(fu - glare.x, fv - glare.y) < 0.18) c = [250, 250, 250];
      }
    }
    const shade = exposure * (1 + gx * (u - 0.5) + gy * (v - 0.5));
    const i = (y * W + x) * 4;
    for (let ch = 0; ch < 3; ch++) data[i + ch] = Math.max(0, Math.min(255, c[ch] * light.tint[ch] * shade + gauss() * 9));
    data[i + 3] = 255;
  }
  return { data, W, H };
}
const perLight: Record<string, [number, number, number]> = {};
for (let t = 0; t < 160; t++) {
  const light = LIGHTS[t % LIGHTS.length];
  const state = applyAlg(SOLVED, randomMoveScramble(25, rnd));
  // each physical cube's stickers differ a little from the typical colours
  const pal = Object.fromEntries(Object.entries(REFERENCE).map(([f, c]) => [f, c.map((v) => Math.max(0, Math.min(255, v + (rnd() - 0.5) * 24))) as RGB]));
  const samples: RGB[] = [];
  for (const f of FACE_ORDER) { const img = renderFace([...face(state, f)], pal, light); samples.push(...sampleGrid(img.data, img.W, img.H, gridRegion(img.W, img.H)).rgb); }
  const got = classifyScan(samples); const ok = got.tokens.join("") === state; if (!ok && process.env.DBG) console.log(light.name, [...state].map((c, i) => (got.tokens[i] !== c ? `${i}:${c}->${got.tokens[i]} conf ${got.confidence[i].toFixed(2)} rgb ${samples[i].map(Math.round)}` : "")).filter(Boolean).join("; "));
  const old = classifyStickers(samples).tokens.join("") === state;
  const p = (perLight[light.name] ??= [0, 0, 0]); p[0]++; if (ok) p[1]++; if (old) p[2]++;
}
const total = Object.values(perLight).reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]);
for (const [k, p] of Object.entries(perLight)) console.log(`  synthetic ${k}: ${p[1]}/${p[0]} exact (without white balance: ${p[2]}/${p[0]})`);
check(total[1] / total[0] >= 0.97, `synthetic images recovered ${total[1]}/${total[0]}`);

// 3. plain-language validation
for (let t = 0; t < 100; t++) {
  const s = applyAlg(SOLVED, randomMoveScramble(25, rnd));
  check(diagnose([...s]).ok, "valid scramble accepted");
  const a = [...s]; const i = [0, 1, 2, 3, 5, 6, 7, 8].find((k) => a[k] !== a[9 + k] && a[9 + k] !== undefined) ?? 0; a[i] = a[i] === "R" ? "L" : "R";
  const d = diagnose(a); check(!d.ok && d.problems.length > 0 && d.problems[0].text.length > 20, "wrong count explained");
}
{ const d = diagnose([..."UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"].map((c, i) => (i === 8 ? "R" : i === 9 ? "F" : i === 20 ? "U" : c))); check(!d.ok && /twisted/.test(d.problems[0].text), "twisted corner explained: " + d.problems[0]?.text); }
{ const a = [...SOLVED]; [a[5], a[10]] = [a[10], a[5]]; const d = diagnose(a); check(!d.ok && /flipped/.test(d.problems[0].text), "flipped edge explained: " + d.problems[0]?.text); }
{ const a = [...SOLVED]; [a[5], a[7]] = [a[7], a[5]]; [a[10], a[19]] = [a[19], a[10]]; const d = diagnose(a); check(!d.ok && /swapped/.test(d.problems[0].text), "swap explained: " + d.problems[0]?.text); }
{ const d = diagnose([...SOLVED].map((c, i) => (i === 5 ? "R" : i === 12 ? "U" : c))); check(!d.ok && /no real edge/.test(d.problems.map((p) => p.text).join()), "impossible piece explained: " + d.problems.map((p) => p.text).join(" | ")); }

// 4. beginner guide and fastest solution, end to end from synthetic scans
Cube.initSolver();
let bg = 0;
for (let t = 0; t < 40; t++) {
  const state = applyAlg(SOLVED, randomMoveScramble(30, rnd));
  const samples: RGB[] = [];
  for (const f of FACE_ORDER) { const img = renderFace([...face(state, f)], REFERENCE, LIGHTS[t % 4]); samples.push(...sampleGrid(img.data, img.W, img.H, gridRegion(img.W, img.H)).rgb); }
  const d = diagnose(classifyScan(samples).tokens);
  if (!d.ok) { check(false, "e2e scan valid: " + d.problems.map((p) => p.text).join(" | ")); continue; }
  const sol: string = Cube.fromString(d.facelets).solve();
  check(isSolved(applyAlg(d.facelets!, sol)), "e2e Kociemba solution solves scanned cube");
  const g = beginnerGuide(d.facelets!);
  if (g) { bg++; check(isSolved(applyAlg(d.facelets!, g.flatMap((s) => s.moves).join(" "))), "beginner guide solves"); }
}
check(bg === 40, `beginner guide generated ${bg}/40`);
for (let t = 0; t < 60; t++) { const s = applyAlg(SOLVED, randomMoveScramble(30, rnd)); const g = beginnerGuide(s); check(!!g && isSolved(applyAlg(s, g!.flatMap((x) => x.moves).join(" "))), "beginner guide random"); }
for (const m of ["R", "U'", "F2", "L", "D'", "B2", "M", "E'", "S2", "x", "y'", "z2"]) check(describeMove(m).length > 15 && !describeMove(m).includes("undefined"), "describe " + m);
console.log(fails ? `${fails}/${checks} scanner checks FAILED` : `scanner OK: ${checks} checks (orientation rule, ${total[1]}/${total[0]} synthetic camera images exact, validation messages, 40 scan→solve end-to-end, 100 beginner guides verified)`);
process.exit(fails ? 1 : 0);
