import { BookOpen, Swords, Target, Users, Home, type LucideIcon } from "lucide-react";

export interface NavItem { href: string; label: string; desc?: string }
export interface NavGroup { label: string; href: string; icon: LucideIcon; items: NavItem[] }

/** Four plain-language sections. Every page in the app belongs to exactly one. */
export const NAV: NavGroup[] = [
  { label: "Learn", href: "/learn", icon: BookOpen, items: [
    { href: "/chess", label: "Chess lessons", desc: "Step-by-step course, from the rules up" },
    { href: "/openings", label: "Opening kits", desc: "Italian, London, Sicilian, King's Indian and more" },
    { href: "/cube", label: "Cube lessons", desc: "Beginner method, CFOP, Roux, ZZ" },
    { href: "/cube/algorithms", label: "Algorithms", desc: "All OLL, PLL and F2L cases" },
    { href: "/videos", label: "Videos", desc: "Hand-picked lessons from top YouTube teachers" },
  ] },
  { label: "Play", href: "/play", icon: Swords, items: [
    { href: "/play/online", label: "Play online", desc: "Live games against people" },
    { href: "/chess/play", label: "Play the computer", desc: "Stockfish, 8 levels" },
    { href: "/battle", label: "Cube battle", desc: "Race 2 to 4 people on the same scramble" },
    { href: "/chess/analysis", label: "Analysis board", desc: "Check any position with the engine" },
  ] },
  { label: "Practice", href: "/practice", icon: Target, items: [
    { href: "/daily", label: "Daily puzzle & scramble", desc: "One of each, every day" },
    { href: "/chess/puzzles", label: "Chess puzzles", desc: "Real positions from Lichess" },
    { href: "/cube/timer", label: "Cube timer", desc: "Scrambles, averages, history" },
    { href: "/cube/simulator", label: "3D cube", desc: "Turn and solve a virtual cube" },
    { href: "/quizzes", label: "Quizzes", desc: "Short knowledge checks" },
    { href: "/challenges", label: "Challenges", desc: "Set a goal, invite friends" },
    { href: "/chess/scanner", label: "Board scanner", desc: "Photo of a board to analysis" },
    { href: "/cube/scanner", label: "Cube scanner", desc: "Camera to solution" },
  ] },
  { label: "Community", href: "/community", icon: Users, items: [
    { href: "/forum", label: "Forum", desc: "Ask questions, share games and solves" },
    { href: "/friends", label: "Friends", desc: "Add friends, see who is online, challenge" },
    { href: "/league", label: "Weekly league", desc: "XP ranking for this week" },
    { href: "/leaderboard", label: "Leaderboards", desc: "Fastest solves, most puzzles" },
  ] },
];

export const BOTTOM_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: Home },
  ...NAV.map((g) => ({ href: g.href, label: g.label, icon: g.icon })),
];

/** Which section a path belongs to (for highlighting). */
export function sectionOf(path: string): string | null {
  if (path === "/") return "/";
  for (const g of NAV) {
    if (path === g.href || path.startsWith(g.href + "/")) return g.href;
    if (g.items.some((i) => path === i.href || path.startsWith(i.href + "/"))) return g.href;
  }
  if (path.startsWith("/u/")) return "/community";
  return null;
}
