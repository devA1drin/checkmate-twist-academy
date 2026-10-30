import PUZZLES from "@/data/puzzles.json";
import { randomMoveScramble } from "@/lib/cube/model";

export interface DailyPuzzle { id: string; fen: string; moves: string[]; rating: number; themes: string[]; primary: string; gameUrl: string }

/** Today's date in UTC (YYYY-MM-DD). Everyone in the world gets the same daily on the same UTC day. */
export const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function mulberry32(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Deterministic: picks from puzzles.json by the UTC date, preferring 900–1900 rated puzzles. */
export function dailyPuzzle(day = utcDay()): DailyPuzzle {
  const all = PUZZLES as DailyPuzzle[];
  const pool = all.filter((p) => p.rating >= 900 && p.rating <= 1900);
  const list = pool.length ? pool : all;
  return list[hash(`puzzle:${day}`) % list.length];
}

/** Deterministic 25-turn random-move scramble seeded by the UTC date (not a WCA random-state scramble). */
export function dailyScramble(day = utcDay()) { return randomMoveScramble(25, mulberry32(hash(`scramble:${day}`))); }

/** Hours and minutes until the next UTC midnight. */
export function untilNext(now = Date.now()) {
  const next = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate() + 1);
  const m = Math.max(0, Math.round((next - now) / 60000));
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}
