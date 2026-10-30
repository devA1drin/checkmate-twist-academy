export type Level = "Beginner" | "Intermediate" | "Advanced";
export interface BoardBlock {
  fen?: string; // starting position (default: initial position)
  moves?: string[]; // SAN moves to step through
  caption: string;
  orientation?: "white" | "black";
  practice?: { label: string; level: number }; // offer "play this position vs Stockfish"
}
export interface AlgBlock { alg: string; label: string; diagram?: "OLL" | "PLL" | "F2L" }
export interface Section {
  heading?: string;
  p?: string[];
  list?: string[];
  ordered?: string[];
  board?: BoardBlock;
  boards?: BoardBlock[];
  algs?: AlgBlock[];
  tip?: string;
  links?: { href: string; label: string }[];
}
export interface Lesson {
  slug: string;
  title: string;
  level: Level;
  module: string;
  summary: string;
  minutes: number;
  sections: Section[];
  videos?: string[]; // YouTube IDs present in videos.json
}
