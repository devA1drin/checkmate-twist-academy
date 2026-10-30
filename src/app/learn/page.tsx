import Link from "next/link";
import { Hub } from "@/components/layout/hub";
import { CHESS_LESSONS } from "@/data/chess-lessons";
import { CUBE_LESSONS } from "@/data/cube-lessons";
import { KITS } from "@/data/openings/kits";
export const metadata = { title: "Learn" };
export default function Page() {
  return (
    <Hub section="Learn" title="Learn" desc="Courses you read in order, opening kits you study and drill, and videos from teachers we trust. Start with whichever you came for.">
      <div className="grid sm:grid-cols-3 gap-px bg-line border border-line mb-10">
        {[[`${CHESS_LESSONS.length} chess lessons`, "From how the pieces move to rook endgames.", "/chess", "Start chess"], [`${KITS.length} opening kits`, "Ideas, main lines, traps, model games, and a memory drill.", "/openings", "Browse kits"], [`${CUBE_LESSONS.length} cube lessons`, "From your first solve to full CFOP.", "/cube", "Start cube"]].map(([t, d, h, c]) => (
          <div key={h} className="bg-surface p-5">
            <h2 className="font-semibold text-lg">{t}</h2>
            <p className="text-sm text-muted mt-1 mb-4">{d}</p>
            <Link href={h} className="link text-sm">{c}</Link>
          </div>
        ))}
      </div>
    </Hub>
  );
}
