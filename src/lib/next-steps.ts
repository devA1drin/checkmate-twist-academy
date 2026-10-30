import { CHESS_LESSONS } from "@/data/chess-lessons";
import { CUBE_LESSONS } from "@/data/cube-lessons";
import type { ProgressData } from "./progress-types";
import type { Prefs } from "./onboarding";

export interface Step { title: string; why: string; href: string; cta: string; kind: "chess" | "cube" | "any" }

const LEVEL_ORDER = { new: 0, beginner: 0, intermediate: 1, advanced: 2 } as const;
const LESSON_LEVEL = { Beginner: 0, Intermediate: 1, Advanced: 2 } as const;

/** A short, ordered "what to do next" list, built from the learner's goals and what they have already done. */
export function nextSteps(p: ProgressData, prefs: Prefs | null, opts: { signedIn: boolean; dailyDone?: { puzzle: boolean; scramble: boolean } }): Step[] {
  const want = prefs?.interests ?? "both";
  const lvl = LEVEL_ORDER[prefs?.level ?? "new"];
  const out: Step[] = [];
  const chess = want !== "cube", cube = want !== "chess";

  if (opts.dailyDone && !(opts.dailyDone.puzzle && opts.dailyDone.scramble)) {
    out.push({ title: "Today's daily", why: "One puzzle and one scramble, the same for everyone. Keeps your streak going.", href: "/daily", cta: "Open daily", kind: "any" });
  }
  if (chess) {
    const pool = CHESS_LESSONS.filter((l) => LESSON_LEVEL[l.level as keyof typeof LESSON_LEVEL] >= Math.min(lvl, 1));
    const next = pool.find((l) => !p.completedLessons.includes(`chess:${l.slug}`)) ?? CHESS_LESSONS.find((l) => !p.completedLessons.includes(`chess:${l.slug}`));
    if (next) out.push({ title: next.title, why: `Next chess lesson · ${next.level} · about ${next.minutes} min`, href: `/chess/lessons/${next.slug}`, cta: "Continue", kind: "chess" });
    if (lvl >= 1 || p.completedLessons.includes("chess:opening-principles")) out.push({ title: "Pick an opening kit", why: "Learn one opening for White and one for Black, then drill the lines until they stick.", href: "/openings", cta: "Browse kits", kind: "chess" });
    const solved = p.puzzles.filter((x) => x.solved).length;
    if (lvl >= 1 || p.completedLessons.length >= 3) out.push({ title: solved ? "Puzzles: keep your eye sharp" : "Try your first puzzles", why: solved ? `${solved} solved so far.` : "Real positions from Lichess games, sorted by rating.", href: "/chess/puzzles", cta: "Solve", kind: "chess" });
  }
  if (cube) {
    const start = lvl >= 1 ? CUBE_LESSONS.filter((l) => l.level !== "Beginner") : CUBE_LESSONS;
    const next = start.find((l) => !p.completedLessons.includes(`cube:${l.slug}`));
    if (next) out.push({ title: next.title, why: `Next cube lesson · ${next.level} · about ${next.minutes} min`, href: `/cube/lessons/${next.slug}`, cta: "Continue", kind: "cube" });
    if (lvl >= 1 || p.solves.length > 0) out.push({ title: p.solves.length >= 5 ? "Beat your average of 5" : "Time five solves", why: p.solves.length >= 5 ? "Five more solves give you a fresh ao5 to compare." : "Five solves give you your first average.", href: "/cube/timer", cta: "Open timer", kind: "cube" });
  }
  if (opts.signedIn && lvl >= 1) out.push(chess ? { title: "Play a live game", why: "Quick match pairs you with someone waiting, or send a link to a friend.", href: "/play/online", cta: "Play", kind: "chess" } : { title: "Race a friend", why: "Same scramble for both of you, best of 3 or 5.", href: "/battle", cta: "Start", kind: "cube" });
  if (!opts.signedIn) out.push({ title: "Create a free account", why: "Keeps progress on every device and unlocks live games, friends, the forum and XP.", href: "/auth", cta: "Sign up", kind: "any" });
  return out.slice(0, 4);
}
