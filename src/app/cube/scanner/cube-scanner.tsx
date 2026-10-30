"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, Check, ChevronLeft, ChevronRight, Download, FlipHorizontal, ImageUp, Loader2, Pause, Play, Printer, RotateCcw, SwitchCamera, Flashlight, Keyboard } from "lucide-react";
import { useCamera, cameraUnavailableReason } from "@/lib/camera/use-camera";
import { PrivacyNote } from "@/components/privacy-note";
import { CubeNet } from "@/components/cube/cube-net";
import { Cube3D, type CubeHandle } from "@/components/cube/cube3d";
import { shortSolve3 } from "@/components/cube/cube-simulator";
import { STICKER_COLORS_2D } from "@/components/cube/colors";
import type { RGB } from "@/lib/cube/color-classify";
import { classifyScan, COLOR_WORD, describeMove, diagnose, FACE_ORDER, gridRegion, motion, nearest, palette, sampleGrid, SCAN_STEPS, type Problem } from "@/lib/cube/scan";
import { beginnerGuide, type Stage } from "@/lib/cube/beginner";
import { solveFacelets } from "@/lib/cube/solver-client";
import { applyAlg, isSolved, SOLVED } from "@/lib/cube/model";
import { useProgress } from "@/lib/progress-context";

type Phase = "scan" | "review" | "guide";
type Faces = Partial<Record<string, RGB[]>>;
interface Track { name: string; moves: string[]; stageOf: number[]; stages: Stage[] }
const HOLD_MS = 1000;
const STILL = 9; // max ΔE between frames to count as holding still
const WORK = 360; // width of the downscaled frame used for sampling

const swatch = (f: string) => <span aria-hidden className="inline-block h-3.5 w-3.5 rounded-[3px] border border-line align-[-2px]" style={{ background: STICKER_COLORS_2D[f] }} />;

/** Small looping 3D hint showing how to turn the whole cube to reach the next face. */
function RotationHint({ step }: { step: number }) {
  const ref = useRef<CubeHandle>(null);
  const s = SCAN_STEPS[step];
  const prevRot = step > 0 ? SCAN_STEPS[step - 1].rot : "";
  useEffect(() => {
    const from = prevRot ? applyAlg(SOLVED, prevRot) : SOLVED;
    const run = () => { ref.current?.reset(from); if (s.step) setTimeout(() => ref.current?.enqueue(s.step.split(" ").map((text) => ({ text }))), 500); };
    run();
    if (!s.step) return;
    const id = setInterval(run, 3200);
    return () => clearInterval(id);
  }, [step, prevRot, s.step]);
  return <Cube3D ref={ref} size={3} speed={1.4} turnable={false} className="h-36 w-36 shrink-0" label={`Animation: how to hold the cube for the ${COLOR_WORD[s.face]} face`} />;
}

export function CubeScanner() {
  const cam = useCamera("environment");
  const { addScan } = useProgress();
  const [reason, setReason] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("scan");
  const [step, setStep] = useState(0);
  const [faces, setFaces] = useState<Faces>({});
  const [live, setLive] = useState<{ tokens: string[]; still: boolean; centreOk: boolean } | null>(null);
  const [hold, setHold] = useState(0);
  const [auto, setAuto] = useState(true);
  const [mirror, setMirror] = useState(false);
  const [dims, setDims] = useState({ w: 16, h: 9 });
  const [photo, setPhoto] = useState<{ img: HTMLImageElement; url: string } | null>(null);
  const [zoom, setZoom] = useState(0.62);
  const [tokens, setTokens] = useState<string[] | null>(null);
  const [confidence, setConfidence] = useState<number[]>([]);
  const [brush, setBrush] = useState("U");
  const [focus, setFocus] = useState<number[]>([]);
  const [solving, setSolving] = useState(false);
  const [solveErr, setSolveErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ facelets: string; fast: Track; beginner: Track | null } | null>(null);
  const work = useRef<HTMLCanvasElement | null>(null);
  const prevSample = useRef<RGB[] | null>(null);
  const holdStart = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const announce = useRef<HTMLParagraphElement>(null);
  useEffect(() => setReason(cameraUnavailableReason()), []);

  const cur = SCAN_STEPS[step];
  const centres = useMemo(() => Object.fromEntries(Object.entries(faces).map(([f, s]) => [f, s![4]])), [faces]);
  const pal = useMemo(() => palette(centres), [centres]);

  /** Draw the source (camera or photo) downscaled and sample the 3x3 grid. */
  const sample = useCallback((): RGB[] | null => {
    const src: CanvasImageSource | null = photo ? photo.img : cam.videoRef.current;
    const sw = photo ? photo.img.naturalWidth : cam.videoRef.current?.videoWidth ?? 0;
    const sh = photo ? photo.img.naturalHeight : cam.videoRef.current?.videoHeight ?? 0;
    if (!src || !sw || !sh) return null;
    const w = WORK, h = Math.round((WORK * sh) / sw);
    const c = work.current ?? (work.current = document.createElement("canvas"));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    if (dims.w !== sw || dims.h !== sh) setDims({ w: sw, h: sh });
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(src, 0, 0, w, h);
    return sampleGrid(ctx.getImageData(0, 0, w, h).data, w, h, gridRegion(w, h, photo ? zoom : 0.62)).rgb;
  }, [photo, zoom, cam.videoRef, dims.w, dims.h]);

  const say = (t: string) => { if (announce.current) announce.current.textContent = t; };

  const finishFaces = useCallback((next: Faces) => {
    if (!FACE_ORDER.split("").every((f) => next[f])) return false;
    const all = FACE_ORDER.split("").flatMap((f) => next[f]!);
    const r = classifyScan(all);
    setTokens(r.tokens); setConfidence(r.confidence); setFocus([]); setResult(null); setSolveErr(null);
    setPhase("review"); cam.stop(); setPhoto(null);
    say("All six faces captured. Check the colours below.");
    return true;
  }, [cam]);

  const capture = useCallback((rgb?: RGB[] | null) => {
    const s = rgb ?? sample();
    if (!s) return;
    const next = { ...faces, [cur.face]: s };
    setFaces(next); setHold(0); holdStart.current = null; prevSample.current = null;
    say(`${COLOR_WORD[cur.face]} face captured.`);
    if (finishFaces(next)) return;
    // next face not yet captured, in scan order
    const order = SCAN_STEPS.map((x, i) => ({ x, i }));
    const nxt = order.find(({ x, i }) => i > step && !next[x.face]) ?? order.find(({ x }) => !next[x.face]);
    if (nxt) setStep(nxt.i);
  }, [sample, faces, cur.face, step, finishFaces]);

  // live readout + auto capture
  useEffect(() => {
    if (phase !== "scan" || cam.state !== "live" || photo) { setLive(null); return; }
    const id = setInterval(() => {
      const s = sample();
      if (!s) return;
      const toks = s.map((c) => nearest(c, pal).face);
      const still = prevSample.current ? motion(prevSample.current, s) < STILL : false;
      prevSample.current = s;
      const centreOk = toks[4] === cur.face && !Object.entries(faces).some(([f, v]) => f !== cur.face && v && motion([v[4]], [s[4]]) < 6);
      setLive({ tokens: toks, still, centreOk });
      if (auto && still && centreOk) {
        holdStart.current ??= performance.now();
        const p = (performance.now() - holdStart.current) / HOLD_MS;
        setHold(Math.min(1, p));
        if (p >= 1) capture(s);
      } else { holdStart.current = null; setHold(0); }
    }, 120);
    return () => clearInterval(id);
  }, [phase, cam.state, photo, sample, pal, cur.face, faces, auto, capture]);

  // photo sampling (static, refresh on zoom)
  const photoTokens = useMemo(() => {
    if (!photo) return null;
    const s = sample();
    return s ? s.map((c) => nearest(c, pal).face) : null;
  }, [photo, sample, pal]);

  const onFile = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { cam.stop(); setDims({ w: img.naturalWidth, h: img.naturalHeight }); setPhoto({ img, url }); setZoom(0.62); };
    img.onerror = () => cam.setError("That file could not be read as an image.");
    img.src = url;
  };
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  const startManual = () => {
    cam.stop(); setPhoto(null);
    const t = FACE_ORDER.split("").flatMap((f) => (faces[f] ? classifyScan(FACE_ORDER.split("").flatMap((g) => faces[g] ?? Array(9).fill([128, 128, 128]))).tokens.slice(FACE_ORDER.indexOf(f) * 9, FACE_ORDER.indexOf(f) * 9 + 9) : Array.from({ length: 9 }, (_, k) => (k === 4 ? f : "?"))));
    setTokens(t); setConfidence([]); setFocus([]); setResult(null); setPhase("review");
  };
  const retake = (i: number) => { setStep(i); setPhase("scan"); setResult(null); prevSample.current = null; };
  const restart = () => { setFaces({}); setTokens(null); setStep(0); setResult(null); setPhase("scan"); setFocus([]); setSolveErr(null); };

  const diag = useMemo(() => (tokens ? diagnose(tokens, confidence) : null), [tokens, confidence]);
  const lowConf = useMemo(() => confidence.map((c, i) => (c < 0.2 && i % 9 !== 4 ? i : -1)).filter((i) => i >= 0), [confidence]);
  const paint = (i: number) => {
    if (!tokens || i % 9 === 4) return;
    const t = tokens.slice(); t[i] = brush; setTokens(t); setResult(null); setSolveErr(null);
    setConfidence((c) => { const n = c.slice(); n[i] = 1; return n; });
  };

  const solve = async () => {
    if (!diag?.ok || !diag.facelets) return;
    setSolving(true); setSolveErr(null);
    try {
      const f = diag.facelets;
      const sol = isSolved(f) ? "" : shortSolve3(f) ?? (await solveFacelets(f));
      if (!isSolved(applyAlg(f, sol))) throw new Error("the solver returned moves that do not solve this cube, so they are not shown");
      const moves = sol.split(/\s+/).filter(Boolean);
      const fast: Track = { name: "Fastest", moves, stageOf: moves.map(() => 0), stages: [{ id: "all", title: "Fastest solution", goal: `${moves.length} moves found by a two-phase (Kociemba) search, then replayed on a copy of your cube to check it really solves it.`, how: "Follow each move in order.", moves }] };
      await new Promise((r) => setTimeout(r, 30));
      const g = beginnerGuide(f);
      const beginner: Track | null = g ? { name: "Beginner", moves: g.flatMap((s) => s.moves), stageOf: g.flatMap((s, i) => s.moves.map(() => i)), stages: g } : null;
      setResult({ facelets: f, fast, beginner });
      setPhase("guide"); addScan();
    } catch (e) { setSolveErr(`Could not solve: ${(e as Error).message}.`); }
    finally { setSolving(false); }
  };

  const netState = useMemo(() => {
    if (phase !== "scan") return tokens?.join("") ?? "";
    return FACE_ORDER.split("").map((f) => {
      if (f === cur.face && (photoTokens || live?.centreOk)) return (photoTokens ?? live!.tokens).join("");
      return faces[f] ? faces[f]!.map((c) => nearest(c, pal).face).join("") : "????" + f + "????";
    }).join("");
  }, [phase, tokens, faces, cur.face, live, photoTokens, pal]);

  const region = gridRegion(dims.w, dims.h, photo ? zoom : 0.62);
  const showTokens = photo ? photoTokens : live?.tokens;
  const captured = SCAN_STEPS.filter((s) => faces[s.face]).length;

  return (
    <div className="space-y-6">
      <p ref={announce} className="sr-only" aria-live="polite" />
      <ol className="flex flex-wrap gap-x-6 gap-y-1 text-sm print:hidden" aria-label="Progress">
        {(["scan", "review", "guide"] as Phase[]).map((p, i) => (
          <li key={p} className={phase === p ? "font-semibold" : "text-muted"} aria-current={phase === p ? "step" : undefined}>{i + 1}. {p === "scan" ? `Scan faces (${captured}/6)` : p === "review" ? "Check colours" : "Solution guide"}</li>
        ))}
      </ol>

      {phase === "scan" && (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* camera side */}
          <section className="space-y-3" aria-label="Camera">
            <div className="relative overflow-hidden rounded-lg border border-line bg-black" style={{ aspectRatio: `${dims.w} / ${dims.h}`, minHeight: 220 }}>
              <div className="absolute inset-0" style={{ transform: mirror && !photo ? "scaleX(-1)" : undefined }}>
                <video ref={cam.videoRef} playsInline muted className={`h-full w-full object-contain ${cam.state === "live" && !photo ? "" : "invisible"}`} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photo && <img src={photo.url} alt={`Uploaded photo for the ${COLOR_WORD[cur.face]} face`} className="absolute inset-0 h-full w-full object-contain" />}
                {(cam.state === "live" || photo) && (
                  <svg viewBox={`0 0 ${dims.w} ${dims.h}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                    <rect x={region.x} y={region.y} width={region.size} height={region.size} rx={region.size / 30} fill="none" stroke={hold > 0 ? "#22c55e" : "#ffffff"} strokeWidth={Math.max(3, region.size / 110)} />
                    {hold > 0 && <rect x={region.x} y={region.y + region.size + region.size / 30} width={region.size * hold} height={region.size / 40} fill="#22c55e" />}
                    {Array.from({ length: 9 }, (_, k) => {
                      const cell = region.size / 3, x = region.x + (k % 3) * cell, y = region.y + Math.floor(k / 3) * cell;
                      return <g key={k}>
                        <rect x={x} y={y} width={cell} height={cell} fill="none" stroke="#ffffffaa" strokeWidth={region.size / 220} />
                        {showTokens && <circle cx={x + cell / 2} cy={y + cell / 2} r={cell * 0.13} fill={STICKER_COLORS_2D[showTokens[k]]} stroke="#000" strokeWidth={region.size / 160} />}
                      </g>;
                    })}
                  </svg>
                )}
              </div>
              {cam.state !== "live" && !photo && (
                <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white/85">
                  {cam.state === "starting" ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Waiting for camera permission…</span>
                    : <span>Start the camera and hold the cube inside the square,<br />or upload a photo of each face.</span>}
                </div>
              )}
            </div>
            {(cam.state === "live" || photo) && (
              <p className="text-sm" aria-live="off">
                {photo ? "Move the slider until the square fits the face, then use the photo."
                  : !auto ? "Auto-capture is off. Press Capture when the dots match the stickers."
                  : hold > 0 ? `Hold still… ${Math.round(hold * 100)}%`
                  : live && !live.centreOk ? <>Looking for the {swatch(cur.face)} {COLOR_WORD[cur.face]} centre in the middle square.</>
                  : live && !live.still ? "Hold the cube still inside the square." : "Hold steady."}
              </p>
            )}
            {photo && (
              <label className="flex items-center gap-3 text-sm">Square size
                <input type="range" min={0.3} max={0.98} step={0.01} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="h-11 flex-1" />
              </label>
            )}
            {reason && <p className="border-l-2 border-warn pl-3 text-sm">{reason}</p>}
            {cam.error && <p className="border-l-2 border-bad pl-3 text-sm text-bad" role="alert">{cam.error}</p>}
            <div className="flex flex-wrap gap-2">
              {photo ? <>
                <button className="btn btn-primary" onClick={() => { capture(); setPhoto(null); }}><Check size={15} /> Use photo for {COLOR_WORD[cur.face]}</button>
                <button className="btn btn-ghost" onClick={() => setPhoto(null)}>Cancel</button>
              </> : cam.state !== "live" ? (
                <button className="btn btn-primary" disabled={!!reason || cam.state === "starting"} onClick={() => cam.start()}><Camera size={15} /> {cam.state === "error" ? "Try camera again" : "Start camera"}</button>
              ) : <>
                <button className="btn btn-primary" onClick={() => capture()}><Camera size={15} /> Capture {COLOR_WORD[cur.face]}</button>
                <button className="btn btn-ghost" onClick={cam.stop}><CameraOff size={15} /> Stop</button>
                <button className="btn btn-ghost" onClick={() => { const nf = cam.facing === "user" ? "environment" : "user"; setMirror(nf === "user"); cam.switchFacing(); }} aria-label={`Switch to ${cam.facing === "user" ? "rear" : "front"} camera`}><SwitchCamera size={15} /> {cam.facing === "user" ? "Rear" : "Front"} camera</button>
                <button className="btn btn-ghost" aria-pressed={mirror} onClick={() => setMirror((m) => !m)}><FlipHorizontal size={15} /> Mirror</button>
                {cam.torchSupported && <button className="btn btn-ghost" aria-pressed={cam.torch} onClick={() => cam.setTorch(!cam.torch)}><Flashlight size={15} /> Torch</button>}
              </>}
              {!photo && <>
                <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}><ImageUp size={15} /> Upload photo</button>
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
                <button className="btn btn-ghost" onClick={startManual}><Keyboard size={15} /> Enter colours by hand</button>
              </>}
            </div>
            {cam.state === "live" && !photo && (
              <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="h-5 w-5" /> Auto-capture when the cube is held still for 1 second</label>
            )}
          </section>

          {/* guide side */}
          <section className="space-y-4" aria-label="Scanning guide">
            <div className="rounded-lg border border-line p-4">
              <div className="eyebrow">Face {step + 1} of 6</div>
              <div className="mt-3 flex gap-4">
                <RotationHint step={step} />
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">{swatch(cur.face)} Show the {COLOR_WORD[cur.face]} centre</h2>
                  <p className="mt-1 text-sm leading-relaxed">{cur.say}</p>
                  <p className="mt-2 text-xs text-muted">Keep {COLOR_WORD[cur.top]} on top. Fill the square with the face, stickers lined up with the grid.</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-line p-4">
              <div className="mb-2 flex items-baseline justify-between"><span className="eyebrow">Your cube so far</span><span className="text-xs text-muted">dots show the live reading</span></div>
              <CubeNet state={netState} label="Cube net filling in as faces are scanned" />
            </div>
            <div>
              <div className="eyebrow mb-2">Faces · tap to retake</div>
              <div className="flex flex-wrap gap-2">
                {SCAN_STEPS.map((s, i) => (
                  <button key={s.face} onClick={() => retake(i)} aria-current={i === step ? "step" : undefined}
                    className={`flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm ${i === step ? "border-fg font-semibold" : "border-line"}`}>
                    {swatch(s.face)} {COLOR_WORD[s.face]} {faces[s.face] ? <Check size={14} aria-label="captured" /> : null}
                  </button>
                ))}
              </div>
            </div>
            <PrivacyNote />
          </section>
        </div>
      )}

      {phase === "review" && tokens && diag && (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <section className="space-y-3" aria-label="Check the colours">
            <h2 className="text-lg font-semibold">Check every sticker against your cube</h2>
            <p className="text-sm text-muted">Pick a colour, then tap any sticker that is wrong. Hold the cube green-front, white-top while you compare. {lowConf.length > 0 && "Outlined stickers were the least certain readings."}</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Paint colour">
              {FACE_ORDER.split("").map((f) => (
                <button key={f} role="radio" aria-checked={brush === f} onClick={() => setBrush(f)}
                  className={`flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm ${brush === f ? "border-fg font-semibold" : "border-line"}`}>{swatch(f)} {COLOR_WORD[f]}</button>
              ))}
            </div>
            <CubeNet state={tokens.join("")} size={22} onSticker={paint} highlight={focus.length ? focus : lowConf} label="Editable cube net" />
          </section>
          <section className="space-y-4" aria-label="Validation">
            {diag.ok ? (
              <p className="border-l-2 border-good pl-3 text-sm"><strong className="font-medium">This is a valid cube.</strong> Every piece exists once and the corner twists, edge flips and swaps add up the way they must for a real cube.</p>
            ) : (
              <div className="space-y-2" role="alert">
                <p className="text-sm font-medium">This can&apos;t be a real cube yet:</p>
                <ul className="space-y-2">
                  {diag.problems.map((p: Problem, i) => (
                    <li key={i} className="border-l-2 border-bad pl-3 text-sm">
                      {p.text} {p.stickers.length > 0 && <button className="ml-1 underline underline-offset-2" onClick={() => setFocus(p.stickers)}>Show</button>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" disabled={!diag.ok || solving} onClick={solve}>{solving ? <><Loader2 className="animate-spin" size={15} /> Solving…</> : "Solve and show the guide"}</button>
              <button className="btn btn-ghost" onClick={restart}><RotateCcw size={15} /> Start over</button>
            </div>
            {solveErr && <p className="border-l-2 border-bad pl-3 text-sm text-bad">{solveErr}</p>}
            <div>
              <div className="eyebrow mb-2">Retake a face with the camera or a photo</div>
              <div className="flex flex-wrap gap-2">
                {SCAN_STEPS.map((s, i) => <button key={s.face} className="flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm" onClick={() => retake(i)}>{swatch(s.face)} {COLOR_WORD[s.face]}</button>)}
              </div>
            </div>
          </section>
        </div>
      )}

      {phase === "guide" && result && <SolutionGuide result={result} onBack={() => setPhase("review")} onRestart={restart} />}
    </div>
  );
}

function SolutionGuide({ result, onBack, onRestart }: { result: { facelets: string; fast: Track; beginner: Track | null }; onBack: () => void; onRestart: () => void }) {
  const [which, setWhich] = useState<"fast" | "beginner">("fast");
  const track = which === "beginner" && result.beginner ? result.beginner : result.fast;
  const [k, setK] = useState(0); // moves done
  const [playing, setPlaying] = useState(false);
  const cube = useRef<CubeHandle>(null);
  const kRef = useRef(0); kRef.current = k;
  const n = track.moves.length;

  const jump = useCallback((j: number) => { cube.current?.reset(applyAlg(result.facelets, track.moves.slice(0, j).join(" "))); setK(j); }, [result.facelets, track.moves]);
  useEffect(() => { setPlaying(false); jump(0); }, [which]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = useCallback(() => { const j = kRef.current; if (j >= n) { setPlaying(false); return; } if (cube.current?.busy()) return; cube.current?.enqueue([{ text: track.moves[j] }]); setK(j + 1); }, [n, track.moves]);
  const prev = () => { setPlaying(false); if (k > 0) jump(k - 1); };
  useEffect(() => { if (playing) { if (kRef.current >= n) jump(0); next(); } }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps
  const onIdle = () => { if (playing) setTimeout(() => next(), 250); };
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.target as HTMLElement).closest("input,textarea,select")) return; if (e.key === "ArrowRight") { setPlaying(false); next(); } if (e.key === "ArrowLeft") prev(); };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  });

  const stage = track.stages[track.stageOf[Math.min(k, n - 1)] ?? 0];
  const tok = k < n ? track.moves[k] : null;
  const text = () => [
    "Cube solution guide (Checkmate & Twist Academy)",
    "Hold the cube with GREEN facing you and WHITE on top, the way it was scanned.",
    "", `Fastest solution (${result.fast.moves.length} moves): ${result.fast.moves.join(" ")}`,
    ...(result.beginner ? ["", `Beginner method (${result.beginner.moves.length} moves):`, ...result.beginner.stages.map((s, i) => `${i + 1}. ${s.title}: ${s.moves.join(" ") || "(already done)"}`)] : []),
  ].join("\n");
  const save = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text()], { type: "text/plain" })); a.download = "cube-solution.txt"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };

  if (n === 0) return <div className="space-y-3"><p className="border-l-2 border-good pl-3">Your cube is already solved.</p><button className="btn btn-primary" onClick={onRestart}>Scan another cube</button></div>;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <div className="flex rounded-md border border-line p-0.5" role="tablist" aria-label="Solution method">
          <button role="tab" aria-selected={which === "fast"} className={`min-h-11 rounded px-4 text-sm ${which === "fast" ? "bg-fg text-bg font-medium" : ""}`} onClick={() => setWhich("fast")}>Fastest · {result.fast.moves.length} moves</button>
          {result.beginner && <button role="tab" aria-selected={which === "beginner"} className={`min-h-11 rounded px-4 text-sm ${which === "beginner" ? "bg-fg text-bg font-medium" : ""}`} onClick={() => setWhich("beginner")}>Beginner layer by layer · {result.beginner.moves.length} moves</button>}
        </div>
        <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={15} /> Print</button>
        <button className="btn btn-ghost" onClick={save}><Download size={15} /> Save as text</button>
        <button className="btn btn-ghost" onClick={onBack}>Edit colours</button>
        <button className="btn btn-ghost" onClick={onRestart}><RotateCcw size={15} /> Scan another</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start print:hidden">
        <div className="space-y-3">
          <Cube3D ref={cube} size={3} initialState={result.facelets} speed={2.2} turnable={false} onIdle={onIdle} className="aspect-square w-full max-w-[460px] mx-auto" label="Your scanned cube, following the solution" />
          <p className="text-center text-xs text-muted">Hold your cube green-front, white-top, as you scanned it. Drag to look around.</p>
        </div>
        <div className="space-y-4">
          {which === "beginner" && <div className="rounded-lg border border-line p-4"><div className="eyebrow">Stage {track.stageOf[Math.min(k, n - 1)] + 1} of {track.stages.length}</div><h3 className="mt-1 font-semibold">{stage.title}</h3><p className="mt-1 text-sm">{stage.goal}</p><p className="mt-1 text-sm text-muted">{stage.how}</p></div>}
          <div aria-live="polite">
            <div className="eyebrow">{tok ? `Move ${k + 1} of ${n}` : "Done"}</div>
            <div className="mt-1 font-mono text-6xl font-semibold leading-none tracking-tight">{tok ?? "Solved"}</div>
            <p className="mt-3 min-h-[3rem] text-base">{tok ? describeMove(tok) : "Every face is one colour. Well done."}</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={n} aria-valuenow={k} aria-label="Moves done"><div className="h-full bg-fg transition-[width]" style={{ width: `${(k / n) * 100}%` }} /></div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" onClick={prev} disabled={k === 0} aria-label="Previous move"><ChevronLeft size={16} /> Back</button>
            <button className="btn btn-primary" onClick={() => setPlaying((p) => !p)}>{playing ? <><Pause size={15} /> Pause</> : <><Play size={15} /> {k >= n ? "Replay" : "Play"}</>}</button>
            <button className="btn btn-ghost" onClick={() => { setPlaying(false); next(); }} disabled={k >= n} aria-label="Next move">Next <ChevronRight size={16} /></button>
            <button className="btn btn-ghost" onClick={() => { setPlaying(false); jump(0); }}>Restart</button>
          </div>
          <ol className="flex flex-wrap gap-1 font-mono text-sm" aria-label="All moves">
            {track.moves.map((m, i) => (
              <li key={i}><button onClick={() => { setPlaying(false); jump(i); }} aria-label={`Go to move ${i + 1}, ${m}`}
                className={`min-h-11 min-w-11 rounded border px-2 ${i === k ? "border-fg font-semibold" : i < k ? "border-transparent text-muted" : "border-line"} ${which === "beginner" && i > 0 && track.stageOf[i] !== track.stageOf[i - 1] ? "ml-3" : ""}`}>{m}</button></li>
            ))}
          </ol>
        </div>
      </div>

      {/* print version */}
      <div className="hidden print:block text-black">
        <h2 className="text-xl font-semibold">Cube solution guide</h2>
        <p>Hold the cube with green facing you and white on top, the way it was scanned.</p>
        <CubeNet state={result.facelets} size={18} label="Scanned cube" />
        <h3 className="mt-4 font-semibold">Fastest solution · {result.fast.moves.length} moves</h3>
        <ol className="list-decimal pl-6">{result.fast.moves.map((m, i) => <li key={i}><span className="font-mono font-semibold">{m}</span> {describeMove(m)}</li>)}</ol>
        {result.beginner && <><h3 className="mt-4 font-semibold">Beginner method</h3>{result.beginner.stages.map((s, i) => <p key={i}><strong>{i + 1}. {s.title}.</strong> {s.goal} <span className="font-mono">{s.moves.join(" ") || "(already done)"}</span></p>)}</>}
      </div>
    </div>
  );
}
