"use client";
import Link from "next/link";
import { Check } from "lucide-react";
import type { Lesson } from "@/data/lesson-types";
import { useProgress } from "@/lib/progress-context";

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
/** Numbered syllabus, grouped by level, with completion ticks. */
export function Curriculum({ lessons, kind }: { lessons: Lesson[]; kind: "chess" | "cube" }) {
  const { data: progress } = useProgress();
  const done = (l: Lesson) => progress.completedLessons.includes(`${kind}:${l.slug}`);
  const total = lessons.length, n = lessons.filter(done).length;
  let num = 0;
  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-2">
        <h2 className="font-display text-3xl font-semibold">Syllabus</h2>
        <div className="text-sm text-muted font-mono">{n} of {total} complete</div>
      </div>
      <div className="h-1 bg-surface-2 mb-8" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={n} aria-label="Lessons completed">
        <div className={`h-full ${kind === "chess" ? "bg-chess" : "bg-cube"}`} style={{ width: `${(n / total) * 100}%` }} />
      </div>
      {LEVELS.map((lv) => {
        const ls = lessons.filter((l) => l.level === lv);
        if (!ls.length) return null;
        return (
          <div key={lv} className="grid md:grid-cols-[180px_1fr] gap-x-8 mb-10">
            <h3 className="eyebrow pt-4 mb-2 md:mb-0">{lv}</h3>
            <ol className="border-t border-ink">
              {ls.map((l) => {
                num++;
                return (
                  <li key={l.slug} className="border-b border-line">
                    <Link href={`/${kind}/lessons/${l.slug}`} className="group grid grid-cols-[2.5rem_1fr_auto] gap-x-3 py-4 items-baseline">
                      <span className="font-mono text-sm text-muted">{String(num).padStart(2, "0")}</span>
                      <span>
                        <span className="font-display text-xl font-medium group-hover:underline underline-offset-4 decoration-1">{l.title}</span>
                        <span className="block text-sm text-muted mt-1 max-w-2xl">{l.summary}</span>
                      </span>
                      <span className="text-xs text-muted font-mono whitespace-nowrap flex items-center gap-1.5">
                        {done(l) ? <><Check size={14} className="text-ok" aria-hidden /><span className="text-ok">Done</span></> : `${l.minutes} min`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </section>
  );
}
