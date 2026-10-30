import { notFound } from "next/navigation";
import { CHESS_LESSONS } from "@/data/chess-lessons";
import { LessonView } from "@/components/lesson/lesson-view";

export function generateStaticParams() { return CHESS_LESSONS.map((l) => ({ slug: l.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: CHESS_LESSONS.find((l) => l.slug === slug)?.title ?? "Lesson" };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = CHESS_LESSONS.findIndex((l) => l.slug === slug);
  if (i < 0) notFound();
  return <LessonView lesson={CHESS_LESSONS[i]} kind="chess" prev={CHESS_LESSONS[i - 1]} next={CHESS_LESSONS[i + 1]} />;
}
