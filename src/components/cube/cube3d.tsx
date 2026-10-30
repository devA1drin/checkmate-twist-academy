"use client";
/**
 * Realistic, directly manipulable 3D twisty cube (2x2 … 7x7), written for this site.
 *
 * - Look: black plastic cubies (rounded boxes) with slightly raised, bevelled rounded stickers,
 *   lit by a procedural room environment plus a key light, with a soft contact shadow.
 *   Bodies and stickers are two instanced meshes, rendered on demand (no frames while idle).
 * - Interaction: drag a sticker (or the plastic around it) to turn that layer in the drag
 *   direction, including inner slices; drag the background to spin the whole cube. Mouse and
 *   touch use the same pointer path. Releasing snaps to the nearest quarter turn with easing.
 * - Moves from buttons, keys and playback are queued and animated; a long queue speeds up.
 * - The visible state comes from CubeEngine (lib/cube/engine.ts), which tests prove matches
 *   the cube model after any mix of moves and drags.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CubeEngine } from "@/lib/cube/engine";
import { dragTurn, parseNxn, solvedState, turnToText, type Axis, type Turn, type Vec3 } from "@/lib/cube/nxn";

/** Standard scheme: white top, green front, red right (yellow, blue, orange opposite). */
export const CUBE_COLORS: Record<string, string> = {
  U: "#f3f3f0", R: "#c8102e", F: "#009b48", D: "#ffd500", L: "#ff5800", B: "#0046ad", X: "#3b3f47",
};

export type MoveSource = "queue" | "drag";
export interface CubeHandle {
  /** Queue moves (each needs `.text` in standard notation) for animation. */
  enqueue: (moves: { text: string }[]) => void;
  /** Jump to a state instantly (cancels the queue). */
  reset: (state: string) => void;
  /** Drop queued moves; returns 1 if a turn is still finishing. */
  clearQueue: () => number;
  busy: () => boolean;
  /** Reset the viewing angle. */
  resetView: () => void;
}
interface Props {
  size?: number;
  initialState?: string;
  speed?: number; // quarter turns per second
  onMoveDone?: (m: { text: string }, source: MoveSource) => void;
  onIdle?: () => void;
  className?: string;
  /** Allow turning layers by dragging stickers (orbiting always works). */
  turnable?: boolean;
  /** When set, a tap on a sticker calls this with its facelet index instead of turning. */
  onPaint?: (facelet: number) => void;
  label?: string;
}

const HALF_PI = Math.PI / 2;
const AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
const HOME_VIEW = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.52, -0.68, 0, "XYZ"));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

interface Anim { turn: Turn; from: number; to: number; t: number; dur: number; item: { text: string } | null }
interface Ctl {
  queue: { item: { text: string }; turn: Turn }[];
  anim: Anim | null;
  live: { axis: Axis; layers: number[]; angle: number } | null; // finger-following turn
  speed: number;
  reduce: boolean;
  wait: number;
}

function roundedRect(w: number, r: number) {
  const s = new THREE.Shape(), h = w / 2;
  s.moveTo(-h + r, -h); s.lineTo(h - r, -h); s.quadraticCurveTo(h, -h, h, -h + r);
  s.lineTo(h, h - r); s.quadraticCurveTo(h, h, h - r, h); s.lineTo(-h + r, h);
  s.quadraticCurveTo(-h, h, -h, h - r); s.lineTo(-h, -h + r); s.quadraticCurveTo(-h, -h, -h + r, -h);
  return s;
}
function shadowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d")!; const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(0,0,0,0.42)"); grd.addColorStop(0.55, "rgba(0,0,0,0.16)"); grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Keep the whole cube in view for any canvas shape (narrow phones included). */
function CameraFit({ n }: { n: number }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const r = n * 0.87 * 1.32; // half-diagonal of the cube plus breathing room
    const t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    cam.position.set(0, 0, r / (t * Math.min(1, aspect)));
    cam.updateProjectionMatrix(); invalidate();
  }, [camera, size.width, size.height, n, invalidate]);
  return null;
}

function Scene({ n, engine, ctl, onMoveDone, onIdle, turnable, onPaint, register }: {
  n: number; engine: CubeEngine; ctl: React.MutableRefObject<Ctl>; onMoveDone?: Props["onMoveDone"]; onIdle?: () => void;
  turnable: boolean; onPaint?: (i: number) => void; register: (api: { refresh: () => void; resetView: () => void }) => void;
}) {
  const { gl, camera, scene, invalidate } = useThree();
  const root = useRef<THREE.Group>(null!);
  const bodies = useRef<THREE.InstancedMesh>(null!);
  const stickers = useRef<THREE.InstancedMesh>(null!);
  const cb = useRef({ onMoveDone, onIdle, onPaint, turnable });
  cb.current = { onMoveDone, onIdle, onPaint, turnable };

  const bodyGeo = useMemo(() => new RoundedBoxGeometry(0.97, 0.97, 0.97, 4, 0.11), []);
  const stickerGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRect(0.8, 0.12), { depth: 0.006, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.018, bevelSegments: 3, curveSegments: 8 });
    g.computeVertexNormals(); return g;
  }, []);
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0d0d0f", roughness: 0.42, metalness: 0.05 }), []);
  const stickerMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.5, envMapIntensity: 0.35 }), []);
  const shadow = useMemo(() => shadowTexture(), []);

  // procedural environment for soft reflections (no downloaded assets)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env; scene.environmentIntensity = 0.55; invalidate();
    return () => { scene.environment = null; env.dispose(); pmrem.dispose(); };
  }, [gl, scene, invalidate]);

  // per-sticker local transform inside its cubie
  const stickerLocal = useMemo(() => engine.stickers.map((s) => {
    const nrm = new THREE.Vector3(...s.normal);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), nrm);
    return new THREE.Matrix4().compose(nrm.clone().multiplyScalar(0.478), q, new THREE.Vector3(1, 1, 1));
  }), [engine]);

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), r: new THREE.Matrix4(), a: new THREE.Matrix4(), c: new THREE.Color() }), []);
  const cubieMatrix = (i: number, out: THREE.Matrix4) => {
    const c = engine.cubies[i];
    const e = c.rot;
    out.set(e[0], e[1], e[2], c.pos[0] / 2, e[3], e[4], e[5], c.pos[1] / 2, e[6], e[7], e[8], c.pos[2] / 2, 0, 0, 0, 1);
    const k = ctl.current;
    const spin = k.anim ? { axis: k.anim.turn.axis, layers: k.anim.turn.layers, angle: k.anim.from + (k.anim.to - k.anim.from) * ease(k.anim.t) } : k.live;
    if (spin && spin.layers.includes(c.pos[spin.axis])) out.premultiply(tmp.a.makeRotationAxis(AXES[spin.axis], spin.angle));
    return out;
  };
  const refreshMatrices = () => {
    const cm: THREE.Matrix4[] = engine.cubies.map((_, i) => cubieMatrix(i, new THREE.Matrix4()));
    cm.forEach((m, i) => bodies.current.setMatrixAt(i, m));
    engine.stickers.forEach((s, i) => stickers.current.setMatrixAt(i, tmp.m.multiplyMatrices(cm[s.cubie], stickerLocal[i])));
    bodies.current.instanceMatrix.needsUpdate = true; stickers.current.instanceMatrix.needsUpdate = true;
  };
  const refreshColors = () => {
    engine.stickers.forEach((s, i) => stickers.current.setColorAt(i, tmp.c.set(CUBE_COLORS[s.color] ?? CUBE_COLORS.X)));
    if (stickers.current.instanceColor) stickers.current.instanceColor.needsUpdate = true;
  };
  const refresh = () => { refreshMatrices(); refreshColors(); invalidate(); };
  const resetView = () => { root.current.quaternion.copy(HOME_VIEW); invalidate(); };
  useEffect(() => { root.current.quaternion.copy(HOME_VIEW); refresh(); register({ refresh, resetView }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- animation loop ----
  useFrame((_, delta) => {
    const k = ctl.current;
    let changed = false;
    if (k.reduce && !k.anim && !k.live && k.queue.length) {
      // reduced motion: no turning animation; each move is applied at once, paced by the speed setting
      k.wait -= delta;
      if (k.wait <= 0) {
        const next = k.queue.shift()!;
        if (((next.turn.q % 4) + 4) % 4) engine.turn(next.turn);
        cb.current.onMoveDone?.(next.item, "queue");
        k.wait = 1 / Math.max(0.5, k.speed);
        if (!k.queue.length) { k.wait = 0; cb.current.onIdle?.(); }
        changed = true;
      }
    }
    if (!k.reduce && !k.anim && k.queue.length && !k.live) {
      const next = k.queue.shift()!;
      const quarters = Math.abs(next.turn.q);
      const sp = k.speed * (1 + Math.min(k.queue.length, 8) * 0.35);
      k.anim = { turn: next.turn, from: 0, to: next.turn.q * HALF_PI, t: 0, dur: (quarters === 2 ? 1.5 : 1) / Math.max(0.5, sp), item: next.item };
    }
    if (k.anim) {
      const a = k.anim;
      a.t = Math.min(1, a.t + delta / a.dur);
      changed = true;
      if (a.t >= 1) {
        k.anim = null;
        const q = Math.round(a.to / HALF_PI);
        if (((q % 4) + 4) % 4) {
          const turn = { ...a.turn, q };
          engine.turn(turn);
          cb.current.onMoveDone?.(a.item ?? { text: turnToText(n, turn) }, a.item ? "queue" : "drag");
        }
        if (!k.queue.length) cb.current.onIdle?.();
      }
    }
    if (changed || k.live) refreshMatrices();
    if (k.anim || k.queue.length) invalidate();
  });

  // ---- pointer interaction ----
  useEffect(() => {
    const el = gl.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const inv = new THREE.Matrix4();
    type Drag =
      | { kind: "orbit"; x: number; y: number; id: number }
      | { kind: "turn"; id: number; p0: THREE.Vector3; normal: Vec3; cubie: Vec3; lock: null | { axis: Axis; layer: number; sign: number; tangent: THREE.Vector3 }; x: number; y: number };
    let drag: Drag | null = null;

    const setRay = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
    };
    const localRay = () => {
      inv.copy(root.current.matrixWorld).invert();
      return ray.ray.clone().applyMatrix4(inv);
    };
    const finishAll = () => {
      const k = ctl.current;
      const pending = k.anim ? [{ turn: { ...k.anim.turn, q: Math.round(k.anim.to / HALF_PI) }, item: k.anim.item }] : [];
      pending.push(...k.queue); k.queue = []; k.anim = null;
      for (const p of pending) {
        if (!(((p.turn.q % 4) + 4) % 4)) continue;
        engine.turn(p.turn);
        cb.current.onMoveDone?.(p.item ?? { text: turnToText(n, p.turn) }, p.item ? "queue" : "drag");
      }
      if (pending.length) cb.current.onIdle?.();
    };

    const down = (e: PointerEvent) => {
      if (drag || e.button > 0) return;
      setRay(e);
      root.current.updateMatrixWorld();
      const hits = ray.intersectObjects([stickers.current, bodies.current], false);
      el.setPointerCapture(e.pointerId);
      if (!hits.length) { drag = { kind: "orbit", x: e.clientX, y: e.clientY, id: e.pointerId }; return; }
      const k = ctl.current;
      if (cb.current.onPaint) {
        const h = hits.find((x) => x.object === stickers.current);
        if (h && h.instanceId !== undefined && !k.anim && !k.queue.length) cb.current.onPaint(engine.faceletOf(engine.stickers[h.instanceId]));
        drag = { kind: "orbit", x: e.clientX, y: e.clientY, id: e.pointerId };
        return;
      }
      if (!cb.current.turnable) { drag = { kind: "orbit", x: e.clientX, y: e.clientY, id: e.pointerId }; return; }
      if (k.anim || k.queue.length) finishAll();
      const p = root.current.worldToLocal(hits[0].point.clone()).multiplyScalar(2); // doubled cube coordinates
      const ax = [0, 1, 2].reduce((b, a) => (Math.abs(p.getComponent(a)) > Math.abs(p.getComponent(b)) ? a : b), 0);
      const normal: Vec3 = [0, 0, 0]; normal[ax] = Math.sign(p.getComponent(ax)) || 1;
      const m = n - 1;
      const cubie = [0, 1, 2].map((a) => a === ax ? normal[a] * m : Math.max(-m, Math.min(m, Math.round((p.getComponent(a) + m) / 2) * 2 - m))) as Vec3;
      const p0 = root.current.worldToLocal(hits[0].point.clone());
      drag = { kind: "turn", id: e.pointerId, p0, normal, cubie, lock: null, x: e.clientX, y: e.clientY };
      e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.kind === "orbit") {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        drag.x = e.clientX; drag.y = e.clientY;
        const s = 0.0085;
        const q = new THREE.Quaternion().setFromAxisAngle(AXES[1], dx * s).multiply(new THREE.Quaternion().setFromAxisAngle(AXES[0], dy * s));
        root.current.quaternion.premultiply(q).normalize();
        invalidate();
        return;
      }
      setRay(e);
      root.current.updateMatrixWorld();
      const lr = localRay();
      const N = new THREE.Vector3(...drag.normal);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(N, drag.p0);
      const hit = lr.intersectPlane(plane, new THREE.Vector3());
      let delta: THREE.Vector3;
      if (hit) delta = hit.sub(drag.p0);
      else return;
      if (!drag.lock) {
        if (delta.length() < 0.14) return;
        const d = dragTurn(drag.normal, drag.cubie, [delta.x, delta.y, delta.z]);
        drag.lock = { axis: d.axis, layer: d.layer, sign: d.sign, tangent: new THREE.Vector3(...d.tangent) };
      }
      const L = drag.lock;
      const angle = L.sign * delta.dot(L.tangent) * (HALF_PI / 1.5);
      ctl.current.live = { axis: L.axis, layers: [L.layer], angle };
      invalidate();
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      const k = ctl.current;
      if (d.kind !== "turn" || !d.lock || !k.live) { k.live = null; return; }
      const angle = k.live.angle;
      let q = Math.round(angle / HALF_PI);
      if (q === 0 && Math.abs(angle) > 0.32) q = Math.sign(angle);
      const turn: Turn = { axis: k.live.axis, layers: k.live.layers, q };
      k.live = null;
      const remaining = Math.abs(q * HALF_PI - angle) / HALF_PI;
      k.anim = { turn, from: angle, to: q * HALF_PI, t: 0, dur: k.reduce ? 0.01 : Math.max(0.06, remaining / Math.max(3, k.speed * 1.5)), item: null };
      invalidate();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
    };
  }, [gl, camera, engine, n, ctl, invalidate]);

  return (
    <>
      <group ref={root}>
        <instancedMesh ref={bodies} args={[bodyGeo, bodyMat, engine.cubies.length]} frustumCulled={false} />
        <instancedMesh ref={stickers} args={[stickerGeo, stickerMat, engine.stickers.length]} frustumCulled={false} />
      </group>
      <mesh position={[0, -n * 0.92, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
        <planeGeometry args={[n * 2.1, n * 2.1]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}

export const Cube3D = forwardRef<CubeHandle, Props>(function Cube3D(
  { size = 3, initialState, speed = 4, onMoveDone, onIdle, className, turnable = true, onPaint, label }, ref,
) {
  const n = size;
  const engine = useMemo(() => { const e = new CubeEngine(n); e.reset(initialState ?? solvedState(n)); return e; }, [n]); // eslint-disable-line react-hooks/exhaustive-deps
  const ctl = useRef<Ctl>({ queue: [], anim: null, live: null, speed, reduce: false, wait: 0 });
  const api = useRef<{ refresh: () => void; resetView: () => void } | null>(null);
  const invalidateRef = useRef<() => void>(() => {});
  ctl.current.speed = speed;
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches); ctl.current.reduce = mq.matches;
    const on = (e: MediaQueryListEvent) => { setReduce(e.matches); ctl.current.reduce = e.matches; };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  void reduce;

  useImperativeHandle(ref, () => ({
    enqueue: (moves) => {
      for (const item of moves) for (const m of parseNxn(n, item.text)) ctl.current.queue.push({ item, turn: m.turn });
      invalidateRef.current();
    },
    reset: (state) => {
      ctl.current.queue = []; ctl.current.anim = null; ctl.current.live = null;
      engine.reset(state); api.current?.refresh();
    },
    clearQueue: () => { ctl.current.queue = []; return ctl.current.anim ? 1 : 0; },
    busy: () => !!ctl.current.anim || ctl.current.queue.length > 0,
    resetView: () => api.current?.resetView(),
  }), [engine, n]);

  return (
    <div className={className ?? "h-[420px] w-full"} style={{ touchAction: "none" }} role="img"
      aria-label={label ?? `${n}×${n} cube in 3D. Drag a sticker to turn its layer; drag the background to rotate the cube.`}>
      <Canvas frameloop="demand" camera={{ position: [0, 0, n * 4.4 + 1.2], fov: 30, near: 0.5, far: 100 }} dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={(s) => { invalidateRef.current = s.invalidate; s.gl.domElement.style.cursor = "grab"; }}
        fallback={<div className="p-6 text-sm text-muted">WebGL is not available in this browser, so the 3D cube cannot be shown.</div>}>
        <ambientLight intensity={0.25} />
        <directionalLight position={[-4, 7, 9]} intensity={1.5} />
        <directionalLight position={[6, -3, -4]} intensity={0.35} />
        <CameraFit n={n} />
        <Scene n={n} engine={engine} ctl={ctl} onMoveDone={onMoveDone} onIdle={onIdle} turnable={turnable} onPaint={onPaint}
          register={(a) => { api.current = a; }} />
      </Canvas>
    </div>
  );
});
