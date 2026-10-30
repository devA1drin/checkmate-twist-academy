import Link from "next/link";
import { ArrowRight } from "lucide-react";
import puzzles from "@/data/puzzles.json";
import videos from "@/data/videos.json";
import { CHESS_LESSONS } from "@/data/chess-lessons";
import { CUBE_LESSONS } from "@/data/cube-lessons";
import { OLL, PLL, F2L } from "@/data/algorithms";
import { CaseDiagram } from "@/components/cube/case-diagram";
import { MateBoard } from "@/components/home/mate-board";
import { TPermCube } from "@/components/home/tperm-cube";

const EXCERPT = ["pll-t", "pll-ua", "pll-ub", "pll-h", "pll-z", "pll-jb"];

const TOOLS: [string, string, string][] = [
  ["/chess/analysis", "Analysis board", "Paste a FEN or PGN and read Stockfish 19's top lines, up to five at once."],
  ["/chess/play", "Play Stockfish", "Eight levels, from one that hangs pieces to full strength. Start from any position."],
  ["/chess/puzzles", "Tactics trainer", `${puzzles.length} puzzles from the Lichess database, filtered by theme and rating.`],
  ["/cube/simulator", "Cube simulator", "Turn with the keyboard, scramble from a random state, and step through a computed solution."],
  ["/cube/timer", "Timer", "WCA-style inspection, +2 and DNF, best single, ao5 and ao12."],
  ["/cube/algorithms", "Algorithm library", `${OLL.length} OLL, ${PLL.length} PLL and ${F2L.length} F2L cases with diagrams drawn from the cube state.`],
  ["/quizzes", "Quizzes", "Five short quizzes on rules, openings, endgames, notation and CFOP."],
  ["/videos", "Videos", `${videos.length} tutorials we found useful, from J Perm, GothamChess, Daniel Naroditsky and others.`],
];

export default function Home() {
  const excerpt = EXCERPT.map((id) => PLL.find((a) => a.id === id)!).filter(Boolean);
  return (
    <div>
      {/* Opening: copy on the left, a real position to solve on the right */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16 pb-16 grid lg:grid-cols-[1.15fr_1fr] gap-x-16 gap-y-12 items-start">
        <div>
          <p className="eyebrow">Chess &middot; Rubik&apos;s Cube &middot; free to use</p>
          <h1 className="font-display mt-5 text-[2.6rem] sm:text-6xl leading-[1.02] font-semibold">
            A study room for chess players and cubers.
          </h1>
          <p className="mt-6 text-lg leading-relaxed max-w-xl">
            {CHESS_LESSONS.length} chess lessons that run from the rules to rook endgames, and {CUBE_LESSONS.length} cube lessons that run from your first solve to full CFOP.
            Stockfish and a two-phase cube solver run in your browser, so you can check any idea as you read.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/chess" className="btn btn-primary !px-4 !py-2.5">Start the chess course <ArrowRight size={16} aria-hidden /></Link>
            <Link href="/cube" className="btn btn-ghost !px-4 !py-2.5">Start the cube course</Link>
          </div>
          <dl className="mt-12 grid grid-cols-2 sm:grid-cols-4 border-t border-ink">
            {[[String(puzzles.length), "Lichess puzzles"], [String(OLL.length), "OLL cases"], [String(PLL.length), "PLL cases"], [String(videos.length), "video lessons"]].map(([n, l]) => (
              <div key={l} className="pt-3 pb-1 pr-4">
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-3xl font-medium">{n}</dd>
                <dd className="text-xs text-muted mt-0.5">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="lg:pt-2 max-w-[440px] w-full lg:justify-self-end">
          <MateBoard />
        </div>
      </section>

      {/* Two syllabi side by side, straight from the lesson data */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold max-w-2xl">Two courses, taught in order.</h2>
          <p className="text-muted mt-3 max-w-2xl">Each lesson builds on the one before it. Mark lessons complete as you go and the dashboard keeps track.</p>
          <div className="mt-10 grid md:grid-cols-2 gap-x-16 gap-y-12">
            {([["chess", "Chess", CHESS_LESSONS], ["cube", "Rubik's Cube", CUBE_LESSONS]] as const).map(([k, label, ls]) => (
              <div key={k}>
                <div className="flex items-center gap-2 eyebrow mb-3"><span className={`h-2.5 w-2.5 ${k === "chess" ? "bg-chess" : "bg-cube"}`} aria-hidden />{label} &middot; {ls.length} lessons</div>
                <ol className="border-t border-ink">
                  {ls.map((l, i) => (
                    <li key={l.slug} className="border-b border-line">
                      <Link href={`/${k}/lessons/${l.slug}`} className="group grid grid-cols-[2rem_1fr_auto] gap-3 py-2.5 items-baseline">
                        <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                        <span className="group-hover:underline underline-offset-4">{l.title}</span>
                        <span className="text-xs text-muted">{l.level}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The cube: the real 3D component and a real excerpt of the algorithm table */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid lg:grid-cols-[1fr_1.1fr] gap-x-16 gap-y-12">
          <div>
            <p className="eyebrow flex items-center gap-2"><span className="h-2.5 w-2.5 bg-cube" aria-hidden />Cube simulator</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-3">Watch an algorithm do its work.</h2>
            <p className="text-muted mt-3 mb-6 max-w-lg">This cube is set to the T-perm case: two corners and two edges on the top layer have swapped places. Press play and follow the moves underneath.</p>
            <TPermCube />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-2xl font-semibold">From the algorithm library</h3>
              <Link href="/cube/algorithms" className="link text-sm whitespace-nowrap">All {OLL.length + PLL.length + F2L.length} cases</Link>
            </div>
            <p className="text-sm text-muted mt-2 mb-5">{OLL.length} OLL and {PLL.length} PLL cases, each verified on a virtual cube. Diagrams are drawn from the state each algorithm solves, viewed from above.</p>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Case</th><th className="hidden sm:table-cell">Diagram</th><th>Algorithm</th><th className="text-right">Odds</th></tr></thead>
                <tbody>
                  {excerpt.map((a) => (
                    <tr key={a.id}>
                      <td className="font-medium whitespace-nowrap">{a.name}</td>
                      <td className="hidden sm:table-cell"><CaseDiagram alg={a.alg} mode="PLL" size={52} /></td>
                      <td><Link href={`/cube/simulator?case=${a.id}`} className="font-mono text-[13px] hover:underline underline-offset-4">{a.alg}</Link></td>
                      <td className="text-right font-mono text-xs text-muted">{a.probability}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Tools as a plain index */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid lg:grid-cols-[280px_1fr] gap-x-16 gap-y-6">
        <div>
          <h2 className="font-display text-3xl font-semibold">Practice tools</h2>
          <p className="text-muted mt-3 text-sm">All of them work without an account. Your results are saved in this browser.</p>
        </div>
        <ul className="border-t border-ink">
          {TOOLS.map(([href, name, desc]) => (
            <li key={href} className="border-b border-line">
              <Link href={href} className="group grid sm:grid-cols-[200px_1fr_auto] gap-x-6 gap-y-1 py-4 items-baseline">
                <span className="font-medium group-hover:underline underline-offset-4">{name}</span>
                <span className="text-sm text-muted">{desc}</span>
                <ArrowRight size={15} className="hidden sm:block text-muted group-hover:text-fg self-center" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Cameras: plain statement of what they do and don't do */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid lg:grid-cols-[280px_1fr_1fr] gap-x-16 gap-y-8">
          <h2 className="font-display text-3xl font-semibold">About the camera tools</h2>
          <div>
            <h3 className="font-medium flex items-center gap-2"><span className="h-2.5 w-2.5 bg-cube" aria-hidden />Cube scanner</h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">Reads the colour of each sticker from your camera and groups them around the six centre colours. You check and correct every face, the app rejects cubes that can&apos;t exist, and then it solves the one you scanned.</p>
            <Link href="/cube/scanner" className="link text-sm mt-3 inline-block">Open the cube scanner</Link>
          </div>
          <div>
            <h3 className="font-medium flex items-center gap-2"><span className="h-2.5 w-2.5 bg-chess" aria-hidden />Board from a photo</h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">Does <em>not</em> recognise pieces automatically. You line up a grid on your photo and place the pieces yourself, then send the position to the analysis board. Images never leave your device.</p>
            <Link href="/chess/scanner" className="link text-sm mt-3 inline-block">Open the board tool</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
