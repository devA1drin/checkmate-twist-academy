"use client";
/**
 * Interactive 3D Rubik's Cube (React Three Fiber).
 * Cubies are real objects: each turn attaches the affected cubies to a pivot, animates the
 * pivot, then re-parents them — so the rendered cube physically follows the move sequence.
 * The logical state lives in the parent (see lib/cube/model.ts); `reset(state)` re-colors a
 * solved-geometry cube from any 54-facelet string.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { faceletGeometry, MOVE_DEFS, ParsedMove, SOLVED } from "@/lib/cube/model";

export const STICKER_COLORS: Record<string, string> = {
  U: "#f5f7ff", R: "#e8283c", F: "#16c060", D: "#ffd51a", L: "#ff7a14", B: "#2a6bff", X: "#3a4466",
};

export interface CubeHandle {
  enqueue: (moves: ParsedMove[]) => void;
  reset: (state: string) => void;
  clearQueue: () => number;
  busy: () => boolean;
}
interface Props {
  initialState?: string;
  speed?: number; // quarter turns per second
  onMoveDone?: (m: ParsedMove) => void;
  onIdle?: () => void;
  className?: string;
  autoRotate?: boolean;
}

const AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];

interface Engine {
  queue: ParsedMove[];
  current: { move: ParsedMove; t: number; cubies: THREE.Object3D[]; target: number } | null;
  pendingReset: string | null;
}

function CubeScene({ engine, speed, onMoveDone, onIdle, initialState }: { engine: React.MutableRefObject<Engine>; speed: number; onMoveDone?: (m: ParsedMove) => void; onIdle?: () => void; initialState: string }) {
  const root = useRef<THREE.Group>(null!);
  const pivot = useRef<THREE.Group>(null!);
  const cubieRefs = useRef<THREE.Group[]>([]);
  const positions = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) if (x || y || z) out.push([x, y, z]);
    return out;
  }, []);
  // sticker slots per cubie: [cubieIndex, normal, faceletIndex]
  const stickers = useMemo(() => {
    const list: { cubie: number; normal: [number, number, number]; facelet: number }[] = [];
    for (let i = 0; i < 54; i++) {
      const g = faceletGeometry(i);
      const ci = positions.findIndex((p) => p[0] === g.pos[0] && p[1] === g.pos[1] && p[2] === g.pos[2]);
      list.push({ cubie: ci, normal: g.normal, facelet: i });
    }
    return list;
  }, [positions]);
  const materials = useMemo(() => stickers.map(() => new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.05 })), [stickers]);
  const { invalidate } = useThree();

  const applyColors = (state: string) => {
    stickers.forEach((s, k) => materials[k].color.set(STICKER_COLORS[state[s.facelet]] ?? STICKER_COLORS.X));
  };
  const resetGeometry = () => {
    cubieRefs.current.forEach((c, i) => {
      if (!c) return;
      root.current.attach(c);
      c.position.set(...positions[i]);
      c.quaternion.identity();
    });
    pivot.current.quaternion.identity();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { applyColors(initialState); }, []);

  useFrame((_, delta) => {
    const e = engine.current;
    if (e.pendingReset !== null) {
      e.current = null;
      resetGeometry();
      applyColors(e.pendingReset);
      e.pendingReset = null;
      invalidate();
    }
    if (!e.current && e.queue.length) {
      const move = e.queue.shift()!;
      const def = MOVE_DEFS[move.base];
      const cubies = cubieRefs.current.filter((c) => {
        const v = new THREE.Vector3();
        c.getWorldPosition(v);
        root.current.worldToLocal(v);
        return def.layers.includes(Math.round(v.getComponent(def.axis)));
      });
      pivot.current.quaternion.identity();
      cubies.forEach((c) => pivot.current.attach(c));
      const quarters = move.amount === 3 ? -1 : move.amount;
      e.current = { move, t: 0, cubies, target: def.dir * quarters * (Math.PI / 2) };
    }
    if (e.current) {
      const cur = e.current;
      const def = MOVE_DEFS[cur.move.base];
      const dur = (Math.abs(cur.target) / (Math.PI / 2)) / Math.max(0.5, speed);
      cur.t = Math.min(1, cur.t + delta / dur);
      const eased = cur.t < 0.5 ? 2 * cur.t * cur.t : 1 - Math.pow(-2 * cur.t + 2, 2) / 2;
      pivot.current.quaternion.setFromAxisAngle(AXES[def.axis], cur.target * eased);
      if (cur.t >= 1) {
        cur.cubies.forEach((c) => {
          root.current.attach(c);
          c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z));
          const m = new THREE.Matrix4().makeRotationFromQuaternion(c.quaternion);
          const el = m.elements.map((v) => Math.round(v));
          m.fromArray(el);
          c.quaternion.setFromRotationMatrix(m);
        });
        pivot.current.quaternion.identity();
        e.current = null;
        onMoveDone?.(cur.move);
        if (!e.queue.length) onIdle?.();
      }
    }
  });

  const rotFor = (n: [number, number, number]): [number, number, number] => {
    if (n[0] === 1) return [0, Math.PI / 2, 0];
    if (n[0] === -1) return [0, -Math.PI / 2, 0];
    if (n[1] === 1) return [-Math.PI / 2, 0, 0];
    if (n[1] === -1) return [Math.PI / 2, 0, 0];
    if (n[2] === -1) return [0, Math.PI, 0];
    return [0, 0, 0];
  };

  return (
    <group ref={root}>
      <group ref={pivot} />
      {positions.map((p, i) => (
        <group key={i} position={p} ref={(el) => { if (el) cubieRefs.current[i] = el; }}>
          <RoundedBox args={[0.96, 0.96, 0.96]} radius={0.08} smoothness={3}>
            <meshStandardMaterial color="#0a0f1f" roughness={0.6} />
          </RoundedBox>
          {stickers.map((s, k) => s.cubie === i && (
            <mesh key={k} position={[s.normal[0] * 0.485, s.normal[1] * 0.485, s.normal[2] * 0.485]} rotation={rotFor(s.normal)} material={materials[k]}>
              <planeGeometry args={[0.8, 0.8]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export const Cube3D = forwardRef<CubeHandle, Props>(function Cube3D({ initialState = SOLVED, speed = 4, onMoveDone, onIdle, className, autoRotate }, ref) {
  const engine = useRef<Engine>({ queue: [], current: null, pendingReset: null });
  // Respect prefers-reduced-motion: turns become near-instant and the camera does not drift.
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useImperativeHandle(ref, () => ({
    enqueue: (moves) => { engine.current.queue.push(...moves); },
    reset: (state) => { engine.current.queue = []; engine.current.pendingReset = state; },
    clearQueue: () => { engine.current.queue = []; return engine.current.current ? 1 : 0; },
    busy: () => engine.current.current !== null || engine.current.queue.length > 0,
  }), []);
  return (
    <div className={className ?? "h-[420px] w-full"}>
      <Canvas camera={{ position: [4.2, 3.6, 5.2], fov: 38 }} dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }}
        fallback={<div className="p-6 text-sm text-muted">WebGL is not available in this browser, so the 3D cube cannot be shown.</div>}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[5, 8, 6]} intensity={1.2} />
        <directionalLight position={[-6, -4, -5]} intensity={0.45} />
        <CubeScene engine={engine} speed={reduce ? 40 : speed} onMoveDone={onMoveDone} onIdle={onIdle} initialState={initialState} />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={12} autoRotate={autoRotate && !reduce} autoRotateSpeed={1.2} />
      </Canvas>
    </div>
  );
});
