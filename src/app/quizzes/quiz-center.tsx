"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { QUIZZES, type Quiz } from "@/data/quizzes";
import { Board } from "@/components/chess/board";
import { useProgress } from "@/lib/progress-context";

export function QuizCenter() {
  const { data, addQuizResult } = useProgress();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const best = (id: string) => { const r = data.quizResults.filter((q) => q.quizId === id); return r.length ? Math.max(...r.map((x) => Math.round((x.score / x.total) * 100))) : null; };
  const begin = (q: Quiz) => { setQuiz(q); setI(0); setPicked(null); setScore(0); setDone(false); };

  if (!quiz) return (
    <ol className="border-t border-ink">
      {QUIZZES.map((q, n) => (
        <li key={q.id} className="border-b border-line">
          <button onClick={() => begin(q)} className="group w-full text-left grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_120px_110px_auto] gap-x-4 gap-y-1 py-4 items-baseline">
            <span className="font-mono text-sm text-muted">{String(n + 1).padStart(2, "0")}</span>
            <span>
              <span className="font-display text-xl group-hover:underline underline-offset-4 decoration-1">{q.title}</span>
              <span className="flex items-center gap-2 text-xs text-muted mt-1"><span className={`h-2 w-2 ${q.topic === "chess" ? "bg-chess" : "bg-cube"}`} aria-hidden />{q.topic === "chess" ? "Chess" : "Cube"} · {q.level}</span>
            </span>
            <span className="hidden sm:block text-sm text-muted font-mono">{q.questions.length} questions</span>
            <span className="hidden sm:block text-sm font-mono">{best(q.id) !== null ? `best ${best(q.id)}%` : <span className="text-muted">not taken</span>}</span>
            <span className="text-sm text-electric inline-flex items-center gap-1">Start <ArrowRight size={14} aria-hidden /></span>
          </button>
        </li>
      ))}
    </ol>
  );

  if (done) {
    const pct = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="max-w-xl border-t border-ink pt-6">
        <div className="eyebrow">{quiz.title}</div>
        <div className="font-display text-6xl font-medium mt-3 tabular-nums">{score}<span className="text-muted text-3xl"> / {quiz.questions.length}</span></div>
        <p className="mt-3">{pct === 100 ? "Every answer right." : pct >= 70 ? `${pct}%. A solid result.` : `${pct}%. Re-read the lessons for this topic and try again.`}</p>
        <div className="flex gap-2 mt-6"><button className="btn btn-primary" onClick={() => begin(quiz)}>Take it again</button><button className="btn btn-ghost" onClick={() => setQuiz(null)}>All quizzes</button></div>
      </div>
    );
  }

  const q = quiz.questions[i];
  const answer = (k: number) => { if (picked !== null) return; setPicked(k); if (k === q.answer) setScore((s) => s + 1); };
  const next = () => {
    if (i + 1 < quiz.questions.length) { setI(i + 1); setPicked(null); return; }
    addQuizResult({ quizId: quiz.id, score, total: quiz.questions.length, at: new Date().toISOString() });
    setDone(true);
  };
  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between text-sm text-muted"><button className="underline underline-offset-4" onClick={() => setQuiz(null)}>All quizzes</button><span className="font-mono">{i + 1} / {quiz.questions.length}</span></div>
      <div className="h-px bg-line mt-3 relative"><div className="absolute left-0 -top-px h-[3px] bg-fg" style={{ width: `${((i + (picked !== null ? 1 : 0)) / quiz.questions.length) * 100}%` }} /></div>
      <h2 className="font-display text-2xl sm:text-3xl font-medium mt-8 leading-snug">{q.q}</h2>
      {q.fen && <div className="max-w-[340px] mt-5"><Board id={`quiz-${quiz.id}-${i}`} fen={q.fen} /></div>}
      <div className="mt-6 border-t border-line">
        {q.options.map((o, k) => {
          const st = picked === null ? "hover:bg-surface-2" : k === q.answer ? "bg-ok/10 text-ok" : k === picked ? "bg-bad/10 text-bad" : "text-muted";
          return (
            <button key={k} onClick={() => answer(k)} disabled={picked !== null} aria-pressed={picked === k}
              className={`w-full text-left flex gap-4 items-baseline border-b border-line px-2 py-3 ${st}`}>
              <span className="font-mono text-xs text-muted w-4">{"ABCD"[k]}</span><span className="font-mono text-[15px]">{o}</span>
              {picked !== null && k === q.answer && <span className="ml-auto text-xs font-mono">correct</span>}
              {picked === k && k !== q.answer && <span className="ml-auto text-xs font-mono">your answer</span>}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-6 grid sm:grid-cols-[1fr_auto] gap-4 items-start">
          <p className="text-sm leading-relaxed"><strong className={picked === q.answer ? "text-ok" : "text-bad"}>{picked === q.answer ? "Correct. " : "Not quite. "}</strong>{q.explain}</p>
          <button className="btn btn-primary" onClick={next} autoFocus>{i + 1 < quiz.questions.length ? <>Next question <ArrowRight size={15} aria-hidden /></> : "See result"}</button>
        </div>
      )}
    </div>
  );
}
