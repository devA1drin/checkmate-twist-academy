import Link from "next/link";
import { ArrowRight, Box, Brain, Camera, Crown, Cpu, Library, Medal, PlayCircle, ShieldCheck, Timer, Trophy, Users, Zap, ScanLine, GraduationCap } from "lucide-react";
import { HeroVisual } from "@/components/home/hero-visual";
import { Reveal } from "@/components/ui/reveal";
import puzzles from "@/data/puzzles.json";
import videos from "@/data/videos.json";
import { CHESS_LESSONS } from "@/data/chess-lessons";
import { CUBE_LESSONS } from "@/data/cube-lessons";

const features = [
  { icon: Crown, title: "Chess Academy", desc: "Rules to rook endgames: openings with real move orders, middlegame plans, Lucena, Philidor and opposition — on interactive boards.", href: "/chess", color: "from-electric to-violet" },
  { icon: Box, title: "Cube Academy", desc: "Beginner layer-by-layer, full CFOP, Roux, ZZ, Petrus and other puzzles, taught step by step.", href: "/cube", color: "from-violet to-aqua" },
  { icon: Cpu, title: "Stockfish 19 in your browser", desc: "Play at 8 strength levels or analyse any FEN/PGN with live evaluation and best lines. Runs locally in a Web Worker.", href: "/chess/analysis", color: "from-aqua to-electric" },
  { icon: Box, title: "3D Cube Simulator", desc: "A real cube model with face, slice and wide moves, random-state scrambles and a verified two-phase solver.", href: "/cube/simulator", color: "from-electric to-aqua" },
  { icon: Library, title: "Algorithm Library", desc: "57 OLL + 21 PLL + F2L, each machine-verified, with diagrams generated from cube state and one-click playback.", href: "/cube/algorithms", color: "from-violet to-electric" },
  { icon: Brain, title: "Tactics Trainer", desc: `${puzzles.length} real puzzles from the Lichess database (CC0), every line validated move-by-move.`, href: "/chess/puzzles", color: "from-electric to-violet" },
  { icon: Timer, title: "Speed Timer", desc: "WCA-style scrambles, 15s inspection, +2/DNF, ao5/ao12 and session stats.", href: "/cube/timer", color: "from-aqua to-violet" },
  { icon: ScanLine, title: "Cube Camera Scanner", desc: "Show each face to your camera, correct any sticker, validate the cube and watch it solve in 3D.", href: "/cube/scanner", color: "from-violet to-aqua" },
  { icon: Camera, title: "Board Photo → Analysis", desc: "Load a photo of a chessboard, set the pieces with an editor over the image, then analyse with Stockfish.", href: "/chess/scanner", color: "from-electric to-aqua" },
  { icon: PlayCircle, title: "Video Center", desc: `${videos.length} hand-picked tutorials from J Perm, GothamChess, Naroditsky and more — every link verified.`, href: "/videos", color: "from-aqua to-electric" },
  { icon: Medal, title: "Quizzes & Achievements", desc: "Check your knowledge, collect badges and track everything on your dashboard.", href: "/quizzes", color: "from-violet to-electric" },
  { icon: Users, title: "Leaderboards & Community", desc: "Compete on real solve times and discuss with other learners (requires the backend).", href: "/community", color: "from-electric to-violet" },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="relative bg-grid">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-electric/25 blur-[120px]" />
          <div className="absolute top-20 right-0 h-[420px] w-[420px] rounded-full bg-violet/25 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-aqua/15 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-20 grid lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <span className="chip !text-aqua"><Zap size={12} /> Chess × Speedcubing learning platform</span>
            <h1 className="font-[family-name:var(--font-display)] mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Master the board.<br /><span className="text-gradient">Solve the cube.</span>
            </h1>
            <p className="mt-5 text-lg text-muted max-w-xl">Structured beginner-to-advanced courses for chess and Rubik&apos;s Cube, powered by a real chess engine, a verified cube solver, and tools that run privately in your browser.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/chess" className="btn btn-primary !px-5 !py-3"><Crown size={18} /> Start Chess Academy</Link>
              <Link href="/cube" className="btn btn-ghost !px-5 !py-3"><Box size={18} /> Start Cube Academy</Link>
            </div>
            <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[[`${CHESS_LESSONS.length + CUBE_LESSONS.length}`, "lessons"], ["78", "OLL + PLL cases"], [`${puzzles.length}`, "real puzzles"], ["SF 19", "in-browser engine"]].map(([n, l]) => (
                <div key={l} className="card p-3"><dt className="text-2xl font-bold text-gradient">{n}</dt><dd className="text-xs text-muted">{l}</dd></div>
              ))}
            </dl>
          </Reveal>
          <HeroVisual />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <Reveal><h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">Everything you need to improve</h2>
          <p className="text-muted mt-2">Every tool below is functional — no mockups, no fake AI.</p></Reveal>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.05}>
              <Link href={f.href} className="card p-5 block h-full group hover:-translate-y-1 hover:border-electric/60 transition">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${f.color} grid place-items-center text-white`}><f.icon size={20} /></div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted mt-1">{f.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm text-electric opacity-0 group-hover:opacity-100 transition">Open <ArrowRight size={14} /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 grid lg:grid-cols-2 gap-6">
        {[
          { title: "Chess learning path", icon: Crown, href: "/chess", steps: ["Rules, piece values & special moves", "Opening principles & main openings", "Tactics motifs: forks, pins, skewers", "Middlegame plans & pawn structure", "Essential endgames: Lucena, Philidor"] },
          { title: "Cube learning path", icon: Box, href: "/cube", steps: ["Notation & beginner layer-by-layer", "CFOP: cross & intuitive F2L", "2-look then full OLL / PLL", "Alternative methods: Roux, ZZ, Petrus", "Other puzzles: 2x2, Pyraminx, 4x4"] },
        ].map((p) => (
          <Reveal key={p.title}>
            <div className="card p-6 h-full">
              <div className="flex items-center gap-2 font-semibold text-lg"><p.icon size={20} className="text-aqua" /> {p.title}</div>
              <ol className="mt-4 space-y-3">
                {p.steps.map((s, i) => (
                  <li key={s} className="flex items-center gap-3"><span className="h-7 w-7 shrink-0 rounded-full border border-line grid place-items-center text-xs font-bold text-electric">{i + 1}</span><span className="text-sm">{s}</span></li>
                ))}
              </ol>
              <Link href={p.href} className="btn btn-ghost mt-6"><GraduationCap size={16} /> View curriculum</Link>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <Reveal>
          <div className="card glow p-8 grid md:grid-cols-[auto_1fr] gap-6 items-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-electric to-violet grid place-items-center text-white"><ShieldCheck size={28} /></div>
            <div>
              <h2 className="text-2xl font-bold">Honest AI, private by design</h2>
              <p className="text-muted mt-2">The cube scanner measures real sticker colors from your camera and always lets you correct them before an impossible cube is rejected. The chessboard tool does <strong>not</strong> claim automatic piece recognition — you confirm the position in an editor overlaid on your photo. Camera frames and photos are processed on your device and never uploaded.</p>
              <div className="mt-4 flex flex-wrap gap-2"><Link href="/privacy" className="btn btn-ghost">Privacy details</Link><Link href="/cube/scanner" className="btn btn-primary"><ScanLine size={16} /> Try the scanner</Link></div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6">
        <Reveal>
          <div className="rounded-3xl p-10 text-center bg-gradient-to-br from-electric/20 via-violet/20 to-aqua/20 border border-line">
            <Trophy className="mx-auto text-aqua" size={36} />
            <h2 className="mt-3 text-3xl font-bold">Ready for your first lesson?</h2>
            <p className="text-muted mt-2">Your progress is saved automatically — in this browser as a guest, or to your account when sign-in is enabled.</p>
            <div className="mt-6 flex justify-center gap-3 flex-wrap"><Link href="/dashboard" className="btn btn-primary">Open dashboard</Link><Link href="/quizzes" className="btn btn-ghost">Take a quiz</Link></div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
