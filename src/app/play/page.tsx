import Link from "next/link";
import { Hub } from "@/components/layout/hub";
export const metadata = { title: "Play" };
export default function Page() {
  return (
    <Hub section="Play" title="Play" desc="Live chess against people, games against the computer, and cube races where everyone gets the same scramble.">
      <div className="flex flex-wrap gap-3 mb-10">
        <Link href="/play/online" className="btn btn-primary">Play chess online</Link>
        <Link href="/chess/play" className="btn btn-ghost">Play the computer</Link>
        <Link href="/battle" className="btn btn-ghost">Start a cube battle</Link>
      </div>
    </Hub>
  );
}
