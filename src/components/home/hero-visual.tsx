"use client";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import type { CubeHandle } from "@/components/cube/cube3d";
import { applyAlg, parseAlg, SOLVED } from "@/lib/cube/model";

const Cube3D = dynamic(() => import("@/components/cube/cube3d").then((m) => m.Cube3D), { ssr: false, loading: () => <div className="h-full" /> });
const DEMO = "R U R' U' R' F R2 U' R' U' R U R' F'"; // T-perm loops forever: applying twice returns to start

export function HeroVisual() {
  const cube = useRef<CubeHandle>(null);
  useEffect(() => {
    const id = setInterval(() => { if (cube.current && !cube.current.busy()) cube.current.enqueue(parseAlg(DEMO)); }, 900);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative h-[420px] sm:h-[480px]">
      <div className="absolute inset-0 card glow overflow-hidden">
        <Cube3D ref={cube} initialState={applyAlg(SOLVED, "")} speed={5} autoRotate className="h-full w-full" />
      </div>
      <motion.div className="absolute -bottom-6 -left-4 sm:left-[-28px] w-[180px] sm:w-[210px] card glow p-2 floaty" aria-hidden>
        <Chessboard options={{ id: "hero", position: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", allowDragging: false, showNotation: false, darkSquareStyle: { backgroundColor: "#3b4f8f" }, lightSquareStyle: { backgroundColor: "#c9d6ff" } }} />
        <div className="text-[11px] text-center mt-1.5 text-muted">White to play: Qxf7# (Scholar&apos;s mate)</div>
      </motion.div>
    </motion.div>
  );
}
