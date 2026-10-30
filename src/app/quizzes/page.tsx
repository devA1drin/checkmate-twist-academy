import { PageHeader } from "@/components/ui/page-header";
import { QuizCenter } from "./quiz-center";
export const metadata = { title: "Quizzes" };
export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Practice" title="Quizzes" desc="Five short quizzes, 28 questions in all. A script checks every chess answer with chess.js and every cube answer on the cube model." />
      <QuizCenter />
    </div>
  );
}
