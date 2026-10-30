import PUZZLES from "@/data/puzzles.json";
import { CHESS_LESSONS } from "@/data/chess-lessons";
import { CUBE_LESSONS } from "@/data/cube-lessons";
import { KITS, KIT_BY_SLUG } from "@/data/openings/kits";
import { formatTime } from "@/lib/progress-types";

export type ChallengeKind = "puzzles" | "cube_ao5" | "lessons" | "kit" | "solves" | "online_wins";
export interface Challenge { id: string; created_by: string; title: string; description: string | null; kind: ChallengeKind; params: { items?: string[]; kit?: string; target_ms?: number; band?: string }; target: number; visibility: "public" | "link"; starts_at: string; ends_at: string; created_at: string }
export const CHALLENGE_COLUMNS = "id, created_by, title, description, kind, params, target, visibility, starts_at, ends_at, created_at";

export const KINDS: { id: ChallengeKind; label: string; help: string }[] = [
  { id: "puzzles", label: "Puzzle set", help: "Solve a fixed set of puzzles (picked by rating)." },
  { id: "kit", label: "Opening drill", help: "Drill different lines of one opening kit correctly." },
  { id: "lessons", label: "Lessons", help: "Finish a list of lessons." },
  { id: "solves", label: "Cube solves", help: "Do a number of timed solves." },
  { id: "cube_ao5", label: "Cube average", help: "Reach an average of 5 under a target time." },
  { id: "online_wins", label: "Online wins", help: "Win a number of online chess games." },
];

export const LESSON_OPTIONS = [
  ...CHESS_LESSONS.map((l) => ({ id: `chess:${l.slug}`, label: `Chess: ${l.title}`, href: `/chess/lessons/${l.slug}` })),
  ...CUBE_LESSONS.map((l) => ({ id: `cube:${l.slug}`, label: `Cube: ${l.title}`, href: `/cube/lessons/${l.slug}` })),
];
export const KIT_OPTIONS = KITS.map((k) => ({ id: k.slug, label: k.name, lines: k.lines.length }));

const P = PUZZLES as { id: string; rating: number; primary: string }[];
export const PUZZLE_BANDS = [{ id: "easy", label: "Under 1200", min: 0, max: 1199 }, { id: "mid", label: "1200–1699", min: 1200, max: 1699 }, { id: "hard", label: "1700+", min: 1700, max: 9999 }];
export function pickPuzzles(band: string, n: number) {
  const b = PUZZLE_BANDS.find((x) => x.id === band) ?? PUZZLE_BANDS[1];
  const pool = P.filter((p) => p.rating >= b.min && p.rating <= b.max).map((p) => p.id);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, n);
}
export const puzzleRating = (id: string) => P.find((p) => p.id === id)?.rating;

/** One-line description of the goal. */
export function goal(c: Pick<Challenge, "kind" | "target" | "params">) {
  switch (c.kind) {
    case "puzzles": return `Solve ${c.target} of ${c.params.items?.length ?? c.target} set puzzles`;
    case "lessons": return `Finish ${c.target} lesson${c.target === 1 ? "" : "s"}`;
    case "kit": return `Drill ${c.target} different line${c.target === 1 ? "" : "s"} of the ${KIT_BY_SLUG[c.params.kit ?? ""]?.name ?? "opening"} kit`;
    case "solves": return `Do ${c.target} timed cube solves`;
    case "cube_ao5": return `Get an average of 5 under ${formatTime(c.params.target_ms ?? 0)}`;
    case "online_wins": return `Win ${c.target} online game${c.target === 1 ? "" : "s"}`;
  }
}
/** Where to go to make progress. */
export function whereTo(c: Pick<Challenge, "kind" | "params">): { href: string; label: string } {
  switch (c.kind) {
    case "kit": return { href: `/openings/${c.params.kit}#drill`, label: "Open the drill" };
    case "solves": case "cube_ao5": return { href: "/cube/timer", label: "Open the cube timer" };
    case "online_wins": return { href: "/play/online", label: "Play online" };
    case "lessons": return { href: "/learn", label: "Go to lessons" };
    default: return { href: "/chess/puzzles", label: "Open puzzles" };
  }
}
export function timeLeft(end: string, now = Date.now()) {
  const ms = Date.parse(end) - now;
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3600000);
  return h >= 48 ? `${Math.floor(h / 24)} days left` : h >= 1 ? `${h} h left` : `${Math.max(1, Math.round(ms / 60000))} min left`;
}
