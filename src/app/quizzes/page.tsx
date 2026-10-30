import { PageHeader } from "@/components/ui/page-header";
import { QuizCenter } from "./quiz-center";
export const metadata = { title: "Quizzes" };
export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="Practice" title="Quizzes" desc="Check your understanding. Chess answers are verified with chess.js, cube facts with our cube model, and endgame verdicts with Stockfish (npm run verify:content)." />
      <QuizCenter />
    </div>
  );
}
