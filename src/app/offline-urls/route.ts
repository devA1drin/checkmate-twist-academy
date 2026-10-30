import { CHESS_LESSONS } from "@/data/chess-lessons";
import { CUBE_LESSONS } from "@/data/cube-lessons";
import { KITS } from "@/data/openings/kits";

export const dynamic = "force-static";

/** Pages and files the service worker saves on install so they work offline. */
export function GET() {
  const pages = [
    "/", "/offline", "/learn", "/dashboard", "/practice", "/quizzes", "/daily",
    "/chess", "/chess/play", "/chess/analysis", "/chess/puzzles",
    "/cube", "/cube/timer", "/cube/simulator", "/cube/algorithms",
    "/openings",
    ...CHESS_LESSONS.map((l) => `/chess/lessons/${l.slug}`),
    ...CUBE_LESSONS.map((l) => `/cube/lessons/${l.slug}`),
    ...KITS.map((k) => `/openings/${k.slug}`),
  ];
  const files = [
    "/stockfish/stockfish-19-lite-single.js", "/stockfish/stockfish-19-lite-single.wasm",
    "/workers/cube-solver.js", "/vendor/cubejs/cube.js", "/vendor/cubejs/solve.js",
    "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png",
  ];
  return Response.json({ build: process.env.NEXT_PUBLIC_BUILD_ID ?? "dev", pages, files });
}
