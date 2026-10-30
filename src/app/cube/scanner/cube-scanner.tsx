"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import { useCamera, cameraUnavailableReason } from "@/lib/camera/use-camera";
import { PrivacyNote } from "@/components/privacy-note";
import { CubeNet } from "@/components/cube/cube-net";
import { CubeSimulator } from "@/components/cube/cube-simulator";
import { STICKER_COLORS_2D, COLOR_NAMES } from "@/components/cube/colors";
import { classifyStickers, nearestReference, type RGB } from "@/lib/cube/color-classify";
import { validateColors } from "@/lib/cube/validate";
import { solveFacelets } from "@/lib/cube/solver-client";
import { applyAlg, isSolved, parseAlg } from "@/lib/cube/model";
import { useProgress } from "@/lib/progress-context";

const FACES = "URFDLB";
const GUIDE: Record<string, string> = {
  U: "White center facing the camera, green side at the BOTTOM edge of the picture.",
  R: "Red center facing the camera, white side on TOP.",
  F: "Green center facing the camera, white side on TOP.",
  D: "Yellow center facing the camera, green side at the TOP edge of the picture.",
  L: "Orange center facing the camera, white side on TOP.",
  B: "Blue center facing the camera, white side on TOP.",
};

/** Average color of the central part of each of the 9 grid cells. */
function sampleFace(canvas: HTMLCanvasElement): RGB[] {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const { width: w, height: h } = canvas;
  const side = Math.min(w, h) * 0.6, x0 = (w - side) / 2, y0 = (h - side) / 2, cell = side / 3, patch = cell * 0.36;
  const out: RGB[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const px = Math.round(x0 + c * cell + (cell - patch) / 2), py = Math.round(y0 + r * cell + (cell - patch) / 2), ps = Math.max(1, Math.round(patch));
    const d = ctx.getImageData(px, py, ps, ps).data;
    // trimmed mean: ignore the darkest/brightest 15% (glare, sticker edges)
    const px3: RGB[] = [];
    for (let i = 0; i < d.length; i += 4) px3.push([d[i], d[i + 1], d[i + 2]]);
    px3.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
    const lo = Math.floor(px3.length * 0.15), hi = Math.ceil(px3.length * 0.85);
    const sel = px3.slice(lo, Math.max(lo + 1, hi));
    out.push([0, 1, 2].map((k) => sel.reduce((s, p) => s + p[k], 0) / sel.length) as RGB);
  }
  return out;
}

export function CubeScanner() {
  const cam = useCamera();
  const { addScan } = useProgress();
  const [reason, setReason] = useState<string | null>(null);
  const [step, setStep] = useState(0); // face index being scanned; 6 = review
  const [samples, setSamples] = useState<(RGB[] | null)[]>(Array(6).fill(null));
  const [live, setLive] = useState<string[]>([]);
  const [tokens, setTokens] = useState<string[] | null>(null);
  const [lowConf, setLowConf] = useState<number[]>([]);
  const [brush, setBrush] = useState("U");
  const [errors, setErrors] = useState<string[]>([]);
  const [solving, setSolving] = useState(false);
  const [result, setResult] = useState<{ facelets: string; solution: string } | null>(null);
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dims, setDims] = useState({ w: 1280, h: 720 });
  useEffect(() => setReason(cameraUnavailableReason()), []);

  const grab = useCallback((): HTMLCanvasElement | null => {
    const v = cam.videoRef.current;
    if (!v || !v.videoWidth) return null;
    const c = canvasRef.current ?? (canvasRef.current = document.createElement("canvas"));
    if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; setDims({ w: v.videoWidth, h: v.videoHeight }); }
    c.getContext("2d", { willReadFrequently: true })!.drawImage(v, 0, 0);
    return c;
  }, [cam.videoRef]);

  // live preview of detected colors (reference palette) while the camera runs
  useEffect(() => {
    if (cam.state !== "live" || step > 5) return;
    const id = setInterval(() => { const c = grab(); if (c) setLive(sampleFace(c).map(nearestReference)); }, 250);
    return () => clearInterval(id);
  }, [cam.state, step, grab]);

  const capture = () => {
    const c = grab();
    if (!c) return;
    const s = sampleFace(c);
    const next = samples.slice(); next[step] = s; setSamples(next);
    if (step < 5) { setStep(step + 1); return; }
    // all six faces captured → classify with the cube's own centers
    const all = next.flat() as RGB[];
    const r = classifyStickers(all);
    setTokens(r.tokens);
    setLowConf(r.confidence.map((v, i) => (v < 0.25 && i % 9 !== 4 ? i : -1)).filter((i) => i >= 0));
    setStep(6); cam.stop();
  };

  const startManual = () => {
    cam.stop(); setMode("manual");
    setTokens(FACES.split("").flatMap((f) => Array.from({ length: 9 }, (_, k) => (k === 4 ? f : "?"))));
    setLowConf([]); setStep(6);
  };
  const restart = () => { setSamples(Array(6).fill(null)); setTokens(null); setStep(0); setErrors([]); setResult(null); setLowConf([]); setMode("camera"); };

  const paint = (i: number) => {
    if (!tokens || i % 9 === 4) return; // centers define the faces
    const t = tokens.slice(); t[i] = brush; setTokens(t); setErrors([]); setResult(null);
    setLowConf((l) => l.filter((x) => x !== i));
  };

  const validateAndSolve = async () => {
    if (!tokens) return;
    if (tokens.includes("?")) { setErrors([`${tokens.filter((t) => t === "?").length} stickers are still unset.`]); return; }
    const v = validateColors(tokens);
    if (!v.ok || !v.facelets) { setErrors(v.errors); return; }
    setErrors([]); setSolving(true);
    try {
      const solution = await solveFacelets(v.facelets);
      if (!isSolved(applyAlg(v.facelets, solution))) throw new Error("Solver returned a sequence that does not solve this cube.");
      setResult({ facelets: v.facelets, solution });
      addScan();
    } catch (e) { setErrors([`Solver error: ${(e as Error).message}`]); }
    finally { setSolving(false); }
  };

  const face = FACES[step];
  const side = Math.min(dims.w, dims.h) * 0.6, x0 = (dims.w - side) / 2, y0 = (dims.h - side) / 2;

  return (
    <div className="space-y-6">
      <div className="max-w-3xl border-l-2 border-ink pl-4 text-sm leading-relaxed">
        <div><strong className="font-medium">How detection works.</strong> It is deliberately simple: it averages the pixels inside each grid cell and groups them by your cube&apos;s six center colors. Glare, dim light, and similar red/orange stickers can fool it, so <strong>always review the result</strong> — low-confidence stickers are outlined, and impossible cubes are rejected before solving. Assumes the standard color scheme (white opposite yellow, green opposite blue, red opposite orange).</div>
      </div>

      {step <= 5 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-3">
            <div className="relative card overflow-hidden bg-black min-h-[260px]">
              <video ref={cam.videoRef} playsInline muted className={`w-full block ${cam.state === "live" ? "" : "invisible absolute"}`} />
              {cam.state === "live" && (
                <svg viewBox={`0 0 ${dims.w} ${dims.h}`} className="absolute inset-0 w-full h-full pointer-events-none">
                  <rect x={x0} y={y0} width={side} height={side} fill="none" stroke="#22d3ee" strokeWidth={Math.max(3, side / 120)} rx={side / 30} />
                  {Array.from({ length: 9 }, (_, k) => {
                    const r = Math.floor(k / 3), c = k % 3, cell = side / 3;
                    return <g key={k}>
                      <rect x={x0 + c * cell} y={y0 + r * cell} width={cell} height={cell} fill="none" stroke="#22d3ee88" strokeWidth={side / 200} />
                      {live[k] && <circle cx={x0 + c * cell + cell / 2} cy={y0 + r * cell + cell / 2} r={cell * 0.14} fill={STICKER_COLORS_2D[live[k]]} stroke="#000" strokeWidth={side / 250} />}
                    </g>;
                  })}
                </svg>
              )}
              {cam.state !== "live" && (
                <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted">
                  {cam.state === "starting" ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Waiting for camera permission…</span> : <div>Start the camera to scan, or enter the colours by hand.</div>}
                </div>
              )}
            </div>
            {reason && <p className="border-l-2 border-warn pl-3 text-sm">{reason}</p>}
            {cam.error && <p className="border-l-2 border-bad pl-3 text-sm text-bad">{cam.error}</p>}
            <div className="flex flex-wrap gap-2">
              {cam.state !== "live" ? <button className="btn btn-primary" disabled={!!reason || cam.state === "starting"} onClick={cam.start}><Camera size={15} /> {cam.state === "error" ? "Try camera again" : "Start camera"}</button>
                : <><button className="btn btn-primary" onClick={capture}>Capture {COLOR_NAMES[face]} face ({step + 1}/6)</button><button className="btn btn-ghost" onClick={cam.stop}>Stop camera</button></>}
              {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Re-scan previous face</button>}
              <button className="btn btn-ghost" onClick={startManual}>Enter colours by hand</button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="card p-4">
              <div className="eyebrow">Face {step + 1} of 6</div>
              <div className="mt-1 font-semibold flex items-center gap-2"><span className="h-4 w-4 rounded-sm border border-line" style={{ background: STICKER_COLORS_2D[face] }} /> {COLOR_NAMES[face]} center</div>
              <p className="text-sm text-muted mt-2">{GUIDE[face]}</p>
              <p className="text-xs text-muted mt-2">Fill the cyan square with the face, keep it flat to the camera and avoid glare. The dots show what the camera currently sees.</p>
              {live[4] && live[4] !== face && cam.state === "live" && <p className="text-xs text-warn mt-2">The center looks {COLOR_NAMES[live[4]].toLowerCase()} — expected {COLOR_NAMES[face].toLowerCase()}. Check which face you are showing.</p>}
            </div>
            <div className="card p-4 flex gap-2 justify-center">
              {FACES.split("").map((f, i) => <div key={f} className={`h-9 w-9 rounded-sm grid place-items-center text-xs font-bold border ${i === step ? "outline-2 outline-offset-2 outline-fg outline border-line" : "border-line"}`} style={{ background: STICKER_COLORS_2D[f], color: f === "U" || f === "D" ? "#000" : "#fff", opacity: samples[i] ? 1 : 0.35 }}>{samples[i] ? <CheckCircle2 size={16} /> : i + 1}</div>)}
            </div>
          </div>
        </div>
      )}

      {step === 6 && tokens && !result && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="card p-4">
            <div className="font-display text-xl font-semibold mb-1">{mode === "manual" ? "Paint each sticker" : "Review and correct"}</div>
            <p className="text-sm text-muted mb-3">Pick a color, then click stickers to fix them. Layout: white face on top, green in front. {lowConf.length > 0 && <span className="text-warn">{lowConf.length} low-confidence stickers are outlined in cyan.</span>}</p>
            <div className="flex justify-center"><CubeNet state={tokens.join("")} size={30} onSticker={paint} highlight={lowConf} /></div>
          </div>
          <div className="space-y-4">
            <div className="card p-4">
              <div className="eyebrow mb-2">Colour</div>
              <div className="grid grid-cols-6 gap-2">{FACES.split("").map((f) => <button key={f} onClick={() => setBrush(f)} aria-label={COLOR_NAMES[f]} title={COLOR_NAMES[f]} className={`aspect-square rounded-sm border ${brush === f ? "outline-2 outline-offset-2 outline-fg outline border-line" : "border-line"}`} style={{ background: STICKER_COLORS_2D[f] }} />)}</div>
            </div>
            <div className="card p-4 space-y-3">
              <button className="btn btn-primary w-full" onClick={validateAndSolve} disabled={solving}>{solving ? <><Loader2 size={15} className="animate-spin" /> Solving…</> : "Check and solve"}</button>
              <button className="btn btn-ghost w-full" onClick={restart}><RotateCcw size={15} /> Start over</button>
              {errors.length > 0 && <div className="border-l-2 border-bad pl-3 text-sm space-y-1"><div className="font-semibold text-bad">This cube can&apos;t be solved as entered</div>{errors.map((e) => <div key={e} className="text-muted">• {e}</div>)}<div className="text-xs text-muted pt-1">Usually one or two stickers were misread. Compare with your real cube.</div></div>}
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="border-l-2 border-ok pl-4 text-sm flex flex-wrap items-center gap-3">
            <span>{result.solution ? <>Valid cube. Solution in <strong>{parseAlg(result.solution).length}</strong> moves (verified with our cube model). Hold the cube with <strong>white on top and green in front</strong>, then follow along.</> : "This cube is already solved."}</span>
            <button className="btn btn-ghost ml-auto" onClick={restart}>Scan another</button>
          </div>
          {result.solution && <div className="font-mono text-sm card p-3 break-words">{result.solution}</div>}
          <CubeSimulator key={result.facelets} initialState={result.facelets} initialSequence={result.solution ? { label: "Scanned cube solution", moves: parseAlg(result.solution), startState: result.facelets } : null} />
        </div>
      )}
      <PrivacyNote />
    </div>
  );
}
