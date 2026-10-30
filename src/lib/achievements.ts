import { ProgressData, effectiveTime, averageOf } from "./progress-types";

export interface Achievement { id: string; title: string; description: string; icon: string; test: (p: ProgressData) => boolean }

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-lesson", title: "First Step", description: "Complete your first lesson.", icon: "📘", test: (p) => p.completedLessons.length >= 1 },
  { id: "scholar", title: "Scholar", description: "Complete 10 lessons.", icon: "🎓", test: (p) => p.completedLessons.length >= 10 },
  { id: "chess-foundations", title: "Foundations Laid", description: "Finish every beginner chess lesson.", icon: "♟️", test: (p) => ["chess:rules-and-pieces", "chess:special-moves", "chess:checkmate-basics", "chess:opening-principles"].every((l) => p.completedLessons.includes(l)) },
  { id: "first-solve", title: "Twist Off", description: "Record your first timed solve.", icon: "⏱️", test: (p) => p.solves.length >= 1 },
  { id: "sub-60", title: "Sub-Minute", description: "Single solve under 60 seconds.", icon: "⚡", test: (p) => p.solves.some((s) => effectiveTime(s) < 60000) },
  { id: "sub-30", title: "Sub-30 Club", description: "Single solve under 30 seconds.", icon: "🚀", test: (p) => p.solves.some((s) => effectiveTime(s) < 30000) },
  { id: "ao5", title: "Consistent", description: "Complete an average of 5.", icon: "📈", test: (p) => averageOf(p.solves, 5) !== null },
  { id: "century", title: "Century", description: "Record 100 solves.", icon: "💯", test: (p) => p.solves.length >= 100 },
  { id: "tactician", title: "Tactician", description: "Solve 10 tactics puzzles.", icon: "🧩", test: (p) => p.puzzles.filter((x) => x.solved).length >= 10 },
  { id: "sharp-eye", title: "Sharp Eye", description: "Solve a puzzle rated 1800+.", icon: "🦅", test: (p) => p.puzzles.some((x) => x.solved && x.rating >= 1800) },
  { id: "quiz-ace", title: "Quiz Ace", description: "Score 100% on any quiz.", icon: "🏅", test: (p) => p.quizResults.some((q) => q.score === q.total && q.total > 0) },
  { id: "engine-draw", title: "Held the Machine", description: "Draw or beat Stockfish at level 5+.", icon: "🤖", test: (p) => p.games.some((g) => g.level >= 5 && g.result !== "loss") },
  { id: "scanner", title: "Real-World Cube", description: "Scan and validate a physical cube.", icon: "📷", test: (p) => p.scans >= 1 },
];

export function unlocked(p: ProgressData) {
  return ACHIEVEMENTS.filter((a) => a.test(p));
}
