"use client";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, PlayCircle, ArrowLeft, ArrowRight } from "lucide-react";
import type { Lesson } from "@/data/lesson-types";
import { useProgress } from "@/lib/progress-context";
import { Rich } from "./rich";
import { LessonBoard } from "./lesson-board";
import { CaseDiagram } from "@/components/cube/case-diagram";
import videos from "@/data/videos.json";
import { YouTubeLite } from "@/components/video/youtube-lite";

export function LessonView({ lesson, kind, prev, next }: { lesson: Lesson; kind: "chess" | "cube"; prev?: Lesson; next?: Lesson }) {
  const { data: progress, completeLesson, uncompleteLesson } = useProgress();
  const lid = `${kind}:${lesson.slug}`;
  const done = progress.completedLessons.includes(lid);
  const vids = (lesson.videos ?? []).map((id) => (videos as { id: string; title: string; channel: string }[]).find((v) => v.id === id)).filter(Boolean) as { id: string; title: string; channel: string }[];
  let b = 0;
  return (
    <article className="mx-auto max-w-5xl px-4 py-10">
      <Link href={`/${kind}`} className="text-sm text-muted hover:text-electric inline-flex items-center gap-1"><ArrowLeft size={14} /> {kind === "chess" ? "Chess Academy" : "Cube Academy"}</Link>
      <header className="mt-4 mb-8">
        <div className="flex flex-wrap items-center gap-2 text-xs"><span className="chip">{lesson.level}</span><span className="chip">{lesson.module}</span><span className="text-muted inline-flex items-center gap-1"><Clock size={12} /> {lesson.minutes} min</span></div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold mt-3">{lesson.title}</h1>
        <p className="text-muted mt-2">{lesson.summary}</p>
      </header>
      <div className="space-y-10 prose-academy">
        {lesson.sections.map((s, i) => (
          <section key={i} className="space-y-4">
            {s.heading && <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">{s.heading}</h2>}
            {s.p?.map((t, j) => <p key={j} className="text-muted leading-relaxed"><Rich text={t} /></p>)}
            {s.list && <ul className="list-disc pl-5 space-y-1.5 text-muted">{s.list.map((t, j) => <li key={j}><Rich text={t} /></li>)}</ul>}
            {s.ordered && <ol className="list-decimal pl-5 space-y-1.5 text-muted">{s.ordered.map((t, j) => <li key={j}><Rich text={t} /></li>)}</ol>}
            {[...(s.board ? [s.board] : []), ...(s.boards ?? [])].map((bb) => <LessonBoard key={b} id={`lb-${lesson.slug}-${b++}`} block={bb} />)}
            {s.algs && (
              <div className="grid gap-3 sm:grid-cols-2">
                {s.algs.map((a) => (
                  <div key={a.alg} className="card p-3 flex gap-3 items-center">
                    {a.diagram && <CaseDiagram alg={a.alg} mode={a.diagram} size={84} />}
                    <div className="min-w-0 flex-1">
                      <code className="alg block break-words">{a.alg}</code>
                      <p className="text-xs text-muted mt-1.5"><Rich text={a.label} /></p>
                      <Link className="text-xs text-electric inline-flex items-center gap-1 mt-1.5 hover:underline" href={a.diagram ? `/cube/simulator?alg=${encodeURIComponent(a.alg)}` : `/cube/simulator?mode=apply&alg=${encodeURIComponent(a.alg)}`}><PlayCircle size={13} /> {a.diagram ? "Set up case & play on 3D cube" : "Apply on 3D cube"}</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {s.tip && <div className="rounded-xl border border-aqua/40 bg-aqua/5 p-3 text-sm"><Rich text={s.tip} /></div>}
            {s.links && <div className="flex flex-wrap gap-2">{s.links.map((l) => <Link key={l.href} href={l.href} className="btn btn-ghost">{l.label}</Link>)}</div>}
          </section>
        ))}
        {vids.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Recommended videos</h2>
            <div className="grid gap-4 sm:grid-cols-2">{vids.map((v) => <YouTubeLite key={v.id} id={v.id} title={v.title} channel={v.channel} />)}</div>
          </section>
        )}
      </div>
      <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <button className={done ? "btn btn-ghost" : "btn btn-primary"} onClick={() => (done ? uncompleteLesson(lid) : completeLesson(lid))}>
          {done ? <><CheckCircle2 size={16} className="text-emerald-400" /> Completed — undo</> : <><Circle size={16} /> Mark lesson complete</>}
        </button>
        <div className="flex gap-2">
          {prev && <Link href={`/${kind}/lessons/${prev.slug}`} className="btn btn-ghost"><ArrowLeft size={15} /> {prev.title}</Link>}
          {next && <Link href={`/${kind}/lessons/${next.slug}`} className="btn btn-ghost">{next.title} <ArrowRight size={15} /></Link>}
        </div>
      </footer>
    </article>
  );
}
