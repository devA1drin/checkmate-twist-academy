import { notFound } from "next/navigation";
import { CUBE_LESSONS } from "@/data/cube-lessons";
import { LessonView } from "@/components/lesson/lesson-view";

export function generateStaticParams() { return CUBE_LESSONS.map((l) => ({ slug: l.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: CUBE_LESSONS.find((l) => l.slug === slug)?.title ?? "Lesson" };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = CUBE_LESSONS.findIndex((l) => l.slug === slug);
  if (i < 0) notFound();
  return <LessonView lesson={CUBE_LESSONS[i]} kind="cube" prev={CUBE_LESSONS[i - 1]} next={CUBE_LESSONS[i + 1]} index={i} total={CUBE_LESSONS.length} />;
}
