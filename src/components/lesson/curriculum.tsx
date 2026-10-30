"use client";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import type { Lesson } from "@/data/lesson-types";
import { useProgress } from "@/lib/progress-context";

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export function Curriculum({ lessons, kind }: { lessons: Lesson[]; kind: "chess" | "cube" }) {
  const { data: progress } = useProgress();
  const done = (l: Lesson) => progress.completedLessons.includes(`${kind}:${l.slug}`);
  const total = lessons.length, n = lessons.filter(done).length;
  return (
    <div className="space-y-10">
      <div className="card p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="text-sm font-semibold">Your progress</div>
          <div className="mt-2 h-2 rounded-full bg-surface-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-electric via-violet to-aqua transition-all" style={{ width: `${(n / total) * 100}%` }} /></div>
        </div>
        <div className="text-sm text-muted">{n}/{total} lessons</div>
      </div>
      {LEVELS.map((lv) => {
        const ls = lessons.filter((l) => l.level === lv);
        if (!ls.length) return null;
        return (
          <section key={lv}>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-4">{lv}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ls.map((l) => (
                <Link key={l.slug} href={`/${kind}/lessons/${l.slug}`} className="card p-4 hover:border-electric transition group">
                  <div className="flex items-center justify-between text-xs text-muted"><span>{l.module}</span>{done(l) ? <CheckCircle2 size={16} className="text-emerald-400" /> : <span className="inline-flex items-center gap-1"><Clock size={12} /> {l.minutes}m</span>}</div>
                  <div className="mt-2 font-semibold group-hover:text-electric">{l.title}</div>
                  <p className="text-sm text-muted mt-1">{l.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
