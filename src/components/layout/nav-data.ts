export interface NavItem { href: string; label: string; desc?: string }
export interface NavGroup { label: string; items: NavItem[] }
export const NAV: NavGroup[] = [
  { label: "Chess", items: [
    { href: "/chess", label: "Chess Academy", desc: "Beginner → advanced curriculum" },
    { href: "/chess/puzzles", label: "Tactics Trainer", desc: "Real Lichess puzzles" },
    { href: "/chess/play", label: "Play Stockfish", desc: "Adjustable strength" },
    { href: "/chess/analysis", label: "Analysis Board", desc: "FEN/PGN + live engine" },
    { href: "/chess/scanner", label: "Board Scanner", desc: "Photo → board editor → analysis" },
  ] },
  { label: "Cube", items: [
    { href: "/cube", label: "Cube Academy", desc: "LBL, CFOP, Roux, ZZ, Petrus" },
    { href: "/cube/simulator", label: "3D Simulator", desc: "Turn, scramble, solve" },
    { href: "/cube/algorithms", label: "Algorithm Library", desc: "57 OLL · 21 PLL · F2L" },
    { href: "/cube/timer", label: "Speed Timer", desc: "WCA scrambles, ao5/ao12" },
    { href: "/cube/scanner", label: "Cube Scanner", desc: "Camera → validate → solve" },
  ] },
  { label: "Practice", items: [
    { href: "/quizzes", label: "Quizzes", desc: "Chess & cube knowledge checks" },
    { href: "/videos", label: "Video Center", desc: "Curated tutorials" },
    { href: "/dashboard", label: "Dashboard", desc: "Progress & achievements" },
  ] },
  { label: "Community", items: [
    { href: "/leaderboard", label: "Leaderboards", desc: "Fastest solvers" },
    { href: "/community", label: "Community", desc: "Discussions" },
  ] },
];
