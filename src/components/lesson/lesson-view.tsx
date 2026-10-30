"use client";
import Link from "next/link";
import { Check } from "lucide-react";
import type { Lesson } from "@/data/lesson-types";
import { useProgress } from "@/lib/progress-context";
import { Rich } from "./rich";
import { LessonBoard } from "./lesson-board";
import { CaseDiagram } from "@/components/cube/case-diagram";
import videos from "@/data/videos.json";
import { YouTubeLite } from "@/components/video/youtube-lite";

export function LessonView({ lesson, kind, prev, next, index, total }: { lesson: Lesson; kind: "chess" | "cube"; prev?: Lesson; next?: Lesson; index?: number; total?: number }) {
  const { data: progress, completeLesson, uncompleteLesson } = useProgress();
  const lid = `${kind}:${lesson.slug}`;
  const done = progress.completedLessons.includes(lid);
  const vids = (lesson.videos ?? []).map((id) => (videos as { id: string; title: string; channel: string }[]).find((v) => v.id === id)).filter(Boolean) as { id: string; title: string; channel: string }[];
  let b = 0;
  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <nav className="eyebrow flex items-center gap-2" aria-label="Breadcrumb">
        <span className={`h-2.5 w-2.5 ${kind === "chess" ? "bg-chess" : "bg-cube"}`} aria-hidden />
        <Link href={`/${kind}`} className="hover:text-fg underline-offset-4 hover:underline">{kind === "chess" ? "Chess" : "Rubik's Cube"}</Link>
        <span aria-hidden>/</span><span>{lesson.module}</span>
      </nav>
      <header className="mt-5 mb-10 pb-8 border-b border-line">
        <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.05]">{lesson.title}</h1>
        <p className="mt-4 text-lg text-muted max-w-2xl leading-relaxed">{lesson.summary}</p>
        <p className="mt-5 text-xs font-mono text-muted">
          {index !== undefined && total ? `Lesson ${index + 1} of ${total} · ` : ""}{lesson.level} · {lesson.minutes} min{done && <span className="text-ok"> · completed</span>}
        </p>
      </header>
      <div className="prose-academy !max-w-none">
        {lesson.sections.map((s, i) => (
          <section key={i}>
            {s.heading && <h2>{s.heading}</h2>}
            <div className="max-w-[68ch]">
              {s.p?.map((t, j) => <p key={j}><Rich text={t} /></p>)}
              {s.list && <ul>{s.list.map((t, j) => <li key={j}><Rich text={t} /></li>)}</ul>}
              {s.ordered && <ol>{s.ordered.map((t, j) => <li key={j}><Rich text={t} /></li>)}</ol>}
            </div>
            {[...(s.board ? [s.board] : []), ...(s.boards ?? [])].map((bb) => <div key={b} className="my-6"><LessonBoard id={`lb-${lesson.slug}-${b++}`} block={bb} /></div>)}
            {s.algs && (
              <ul className="my-6 border-t border-ink not-prose">
                {s.algs.map((a) => (
                  <li key={a.alg} className="border-b border-line py-3 grid grid-cols-[auto_1fr] gap-x-5 items-center">
                    {a.diagram ? <CaseDiagram alg={a.alg} mode={a.diagram} size={72} /> : <span />}
                    <div className="min-w-0">
                      <div className="font-mono text-[15px] break-words">{a.alg}</div>
                      <div className="text-sm text-muted mt-1"><Rich text={a.label} /></div>
                      <Link className="link text-sm mt-1 inline-block" href={a.diagram ? `/cube/simulator?alg=${encodeURIComponent(a.alg)}` : `/cube/simulator?mode=apply&alg=${encodeURIComponent(a.alg)}`}>{a.diagram ? "Set up this case on the 3D cube" : "Apply on the 3D cube"}</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {s.tip && <aside className="my-6 border-l-2 border-ink pl-4 max-w-[68ch] text-[15px]"><span className="eyebrow block mb-1">Tip</span><Rich text={s.tip} /></aside>}
            {s.links && <div className="flex flex-wrap gap-x-5 gap-y-2 my-4">{s.links.map((l) => <Link key={l.href} href={l.href} className="link text-sm">{l.label}</Link>)}</div>}
          </section>
        ))}
        {vids.length > 0 && (
          <section>
            <h2>Videos for this lesson</h2>
            <div className="grid gap-6 sm:grid-cols-2 not-prose">{vids.map((v) => <YouTubeLite key={v.id} id={v.id} title={v.title} channel={v.channel} />)}</div>
          </section>
        )}
      </div>
      <div className="mt-14 border-t border-ink pt-6 flex flex-wrap items-center gap-4">
        <button className={done ? "btn btn-ghost" : "btn btn-primary"} onClick={() => (done ? uncompleteLesson(lid) : completeLesson(lid))} aria-pressed={done}>
          {done ? <><Check size={16} className="text-ok" aria-hidden /> Completed (undo)</> : "Mark as complete"}
        </button>
        <span className="text-sm text-muted">Saved to your dashboard.</span>
      </div>
      <nav className="mt-10 grid sm:grid-cols-2 gap-6" aria-label="Lesson navigation">
        {prev ? <Link href={`/${kind}/lessons/${prev.slug}`} className="group border-t border-line pt-3"><span className="eyebrow">Previous</span><span className="block font-display text-xl mt-1 group-hover:underline underline-offset-4 decoration-1">{prev.title}</span></Link> : <span />}
        {next && <Link href={`/${kind}/lessons/${next.slug}`} className="group border-t border-line pt-3 sm:text-right"><span className="eyebrow">Next</span><span className="block font-display text-xl mt-1 group-hover:underline underline-offset-4 decoration-1">{next.title}</span></Link>}
      </nav>
    </article>
  );
}
