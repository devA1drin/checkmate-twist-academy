import type { LucideIcon } from "lucide-react";
import { BookOpen, GraduationCap, Crown, Timer, Zap, Gauge, BarChart3, Hash, Puzzle, Eye, Award, Cpu, Camera, Globe, Trophy, UserPlus, MessageSquare, Repeat, Swords, Flag, CalendarCheck, Flame, Star } from "lucide-react";
import { ProgressData, effectiveTime, averageOf } from "./progress-types";

/**
 * Badges. For signed-in users the database awards them (migration 0003: private.check_achievements),
 * so they cannot be self-awarded. `test` is only used to show guest progress kept in this browser;
 * badges that need online features have no guest test.
 */
export interface Achievement { id: string; title: string; description: string; icon: LucideIcon; test?: (p: ProgressData) => boolean }

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-lesson", title: "First step", description: "Finish your first lesson.", icon: BookOpen, test: (p) => p.completedLessons.length >= 1 },
  { id: "scholar", title: "Scholar", description: "Finish 10 lessons.", icon: GraduationCap, test: (p) => p.completedLessons.length >= 10 },
  { id: "chess-foundations", title: "Foundations", description: "Finish every beginner chess lesson.", icon: Crown, test: (p) => ["chess:rules-and-pieces", "chess:special-moves", "chess:checkmate-basics", "chess:opening-principles"].every((l) => p.completedLessons.includes(l)) },
  { id: "first-solve", title: "First solve", description: "Time your first cube solve.", icon: Timer, test: (p) => p.solves.length >= 1 },
  { id: "sub-60", title: "Under a minute", description: "One solve under 60 seconds.", icon: Zap, test: (p) => p.solves.some((s) => effectiveTime(s) < 60000) },
  { id: "sub-30", title: "Under 30 seconds", description: "One solve under 30 seconds.", icon: Gauge, test: (p) => p.solves.some((s) => effectiveTime(s) < 30000) },
  { id: "ao5", title: "Consistent", description: "Complete an average of 5.", icon: BarChart3, test: (p) => averageOf(p.solves, 5) !== null },
  { id: "century", title: "Hundred solves", description: "Time 100 solves.", icon: Hash, test: (p) => p.solves.length >= 100 },
  { id: "tactician", title: "Tactician", description: "Solve 10 chess puzzles.", icon: Puzzle, test: (p) => p.puzzles.filter((x) => x.solved).length >= 10 },
  { id: "sharp-eye", title: "Sharp eye", description: "Solve a puzzle rated 1800 or more.", icon: Eye, test: (p) => p.puzzles.some((x) => x.solved && x.rating >= 1800) },
  { id: "quiz-ace", title: "Full marks", description: "Score 100% on a quiz.", icon: Award, test: (p) => p.quizResults.some((q) => q.score === q.total && q.total > 0) },
  { id: "engine-draw", title: "Held the engine", description: "Draw or beat the computer at level 5 or higher.", icon: Cpu, test: (p) => p.games.some((g) => g.level >= 5 && g.result !== "loss") },
  { id: "scanner", title: "Real cube", description: "Scan and check a physical cube.", icon: Camera, test: (p) => p.scans >= 1 },
  { id: "online-first", title: "First online game", description: "Finish a live game against a person.", icon: Globe },
  { id: "online-win", title: "First online win", description: "Win a live game.", icon: Trophy },
  { id: "first-friend", title: "First friend", description: "Add a friend.", icon: UserPlus },
  { id: "forum-first", title: "First post", description: "Start a forum thread.", icon: MessageSquare },
  { id: "drill-10", title: "Opening memory", description: "Play 10 different opening lines correctly in drills.", icon: Repeat },
  { id: "battle-first", title: "First battle", description: "Submit a time in a cube battle.", icon: Swords },
  { id: "challenge-done", title: "Challenge complete", description: "Finish a custom challenge.", icon: Flag },
  { id: "daily-first", title: "Daily habit", description: "Solve a daily puzzle or scramble.", icon: CalendarCheck },
  { id: "streak-7", title: "7-day streak", description: "Practise 7 days in a row.", icon: Flame },
  { id: "streak-30", title: "30-day streak", description: "Practise 30 days in a row.", icon: Flame },
  { id: "level-5", title: "Level 5", description: "Reach 1,000 XP.", icon: Star },
];

export function unlocked(p: ProgressData) {
  return ACHIEVEMENTS.filter((a) => a.test?.(p));
}
