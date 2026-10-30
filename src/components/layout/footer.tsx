import Link from "next/link";
import { NAV } from "./nav-data";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="border-t border-line mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <div className="flex items-center gap-2.5 text-lg font-semibold"><Logo /><span>Checkmate &amp; Twist Academy</span></div>
          <p className="text-sm text-muted mt-3 max-w-xs leading-relaxed">Free lessons and practice tools for chess and the Rubik&apos;s Cube. The engine, the solver and the camera tools all run on your device.</p>
        </div>
        {NAV.map((g) => (
          <div key={g.label}>
            <div className="eyebrow mb-2">{g.label}</div>
            {g.items.map((i) => <Link key={i.href} href={i.href} className="block text-sm py-1.5 hover:underline underline-offset-4">{i.label}</Link>)}
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 text-xs text-muted flex flex-wrap gap-x-6 gap-y-2">
          <span>Puzzles from the <a className="underline" href="https://database.lichess.org/#puzzles" target="_blank" rel="noreferrer">Lichess database</a> (CC0)</span>
          <span>Engine: <a className="underline" href="https://github.com/nmrugg/stockfish.js" target="_blank" rel="noreferrer">Stockfish.js</a> (GPLv3)</span>
          <span>Solver: <a className="underline" href="https://github.com/ldez/cubejs" target="_blank" rel="noreferrer">cubejs</a> (MIT)</span>
          <Link href="/privacy" className="underline sm:ml-auto">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
