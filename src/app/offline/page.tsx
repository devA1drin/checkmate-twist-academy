import Link from "next/link";
import { WifiOff } from "lucide-react";
export const metadata = { title: "Offline" };

const WORKS = [
  { href: "/learn", label: "Chess and cube lessons" },
  { href: "/openings", label: "Opening kits and reviews" },
  { href: "/cube/algorithms", label: "Algorithm sheets" },
  { href: "/cube/timer", label: "Cube timer" },
  { href: "/cube/simulator", label: "3D cube and solver" },
  { href: "/chess/play", label: "Play the computer (Stockfish)" },
  { href: "/chess/analysis", label: "Analysis board" },
  { href: "/chess/puzzles", label: "Puzzles" },
  { href: "/dashboard", label: "Your progress" },
];

export default function Offline() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
      <WifiOff size={28} aria-hidden className="text-muted" />
      <h1 className="text-3xl font-semibold mt-4">You&apos;re offline</h1>
      <p className="text-muted mt-3 text-lg">This page hasn&apos;t been saved on this device yet. These parts of the academy work without a connection. Progress you make is saved here and syncs when you&apos;re back online.</p>
      <ul className="mt-8 border-t border-ink">
        {WORKS.map((w) => <li key={w.href}><Link href={w.href} className="list-row hover:underline">{w.label}</Link></li>)}
      </ul>
      <p className="text-sm text-muted mt-8">Online games, battles, the forum, friends and videos need a connection.</p>
    </div>
  );
}
