"use client";
import { useState } from "react";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy } from "lucide-react";
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
    <div className="grid gap-4 sm:grid-cols-2">
      {QUIZZES.map((q) => (
        <button key={q.id} onClick={() => begin(q)} className="card p-5 text-left hover:border-electric transition">
          <div className="flex gap-2"><span className="chip">{q.topic === "chess" ? "Chess" : "Cube"}</span><span className="chip">{q.level}</span></div>
          <div className="font-semibold mt-2 text-lg">{q.title}</div>
          <div className="text-sm text-muted mt-1">{q.questions.length} questions{best(q.id) !== null && ` · best ${best(q.id)}%`}</div>
        </button>
      ))}
    </div>
  );

  if (done) {
    const pct = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="card p-8 text-center space-y-4">
        <Trophy className="mx-auto text-aqua" size={40} />
        <div className="text-3xl font-bold">{score} / {quiz.questions.length}</div>
        <p className="text-muted">{pct === 100 ? "Perfect score!" : pct >= 70 ? "Great work." : "Review the lessons and try again."}</p>
        <div className="flex justify-center gap-2"><button className="btn btn-primary" onClick={() => begin(quiz)}><RotateCcw size={15} /> Retry</button><button className="btn btn-ghost" onClick={() => setQuiz(null)}>All quizzes</button></div>
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
    <div className="card p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between text-sm text-muted"><span>{quiz.title}</span><span>Question {i + 1} / {quiz.questions.length}</span></div>
      <div className="h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-gradient-to-r from-electric to-aqua" style={{ width: `${(i / quiz.questions.length) * 100}%` }} /></div>
      <h2 className="text-lg font-semibold">{q.q}</h2>
      {q.fen && <div className="max-w-[320px]"><Board id={`quiz-${quiz.id}-${i}`} fen={q.fen} /></div>}
      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((o, k) => {
          const state = picked === null ? "" : k === q.answer ? "border-emerald-400 bg-emerald-400/10" : k === picked ? "border-red-400 bg-red-400/10" : "opacity-60";
          return <button key={k} onClick={() => answer(k)} className={`text-left rounded-xl border border-line bg-surface-2 p-3 transition hover:border-electric ${state}`}><span className="font-mono">{o}</span></button>;
        })}
      </div>
      {picked !== null && (
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-1.5 text-sm ${picked === q.answer ? "text-emerald-400" : "text-red-400"}`}>{picked === q.answer ? <CheckCircle2 size={16} /> : <XCircle size={16} />}{picked === q.answer ? "Correct." : "Not quite."}</div>
          <p className="text-sm text-muted flex-1">{q.explain}</p>
          <button className="btn btn-primary" onClick={next}>{i + 1 < quiz.questions.length ? <>Next <ArrowRight size={15} /></> : "Finish"}</button>
        </div>
      )}
    </div>
  );
}
