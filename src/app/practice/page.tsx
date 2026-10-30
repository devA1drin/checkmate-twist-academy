import Link from "next/link";
import { Hub } from "@/components/layout/hub";
export const metadata = { title: "Practice" };
export default function Page() {
  return (
    <Hub section="Practice" title="Practice" desc="Short, repeatable training. Ten minutes a day keeps your streak going and earns XP.">
      <div className="notice mb-10 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span><strong>Today:</strong> one chess puzzle and one cube scramble, the same for everyone.</span>
        <Link href="/daily" className="link">Open today&apos;s daily</Link>
      </div>
    </Hub>
  );
}
