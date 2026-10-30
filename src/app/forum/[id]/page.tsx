import { Thread } from "./thread";
export const metadata = { title: "Forum thread" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-12"><Thread id={id} /></div>;
}
