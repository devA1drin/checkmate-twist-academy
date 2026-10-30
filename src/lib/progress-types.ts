export type Penalty = null | "+2" | "DNF";
export interface Solve { id: string; timeMs: number; penalty: Penalty; scramble: string; at: string }
export interface QuizResult { quizId: string; score: number; total: number; at: string }
export interface PuzzleAttempt { puzzleId: string; solved: boolean; rating: number; at: string }
export interface EngineGame { result: "win" | "loss" | "draw"; level: number; at: string }
export interface ProgressData {
  completedLessons: string[];
  solves: Solve[];
  quizResults: QuizResult[];
  puzzles: PuzzleAttempt[];
  games: EngineGame[];
  scans: number;
}
export const EMPTY_PROGRESS: ProgressData = { completedLessons: [], solves: [], quizResults: [], puzzles: [], games: [], scans: 0 };

export function effectiveTime(s: Solve): number {
  if (s.penalty === "DNF") return Infinity;
  return s.timeMs + (s.penalty === "+2" ? 2000 : 0);
}

/** WCA average of N: drop best and worst (one DNF allowed), mean of the rest. */
export function averageOf(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null;
  const last = solves.slice(-n).map(effectiveTime).sort((a, b) => a - b);
  const trim = Math.ceil(n * 0.05) || 1;
  const mid = last.slice(trim, n - trim);
  if (mid.some((t) => !isFinite(t))) return Infinity;
  return mid.reduce((a, b) => a + b, 0) / mid.length;
}

export function formatTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (!isFinite(ms)) return "DNF";
  const total = ms / 1000;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return m > 0 ? `${m}:${s.toFixed(2).padStart(5, "0")}` : s.toFixed(2);
}
