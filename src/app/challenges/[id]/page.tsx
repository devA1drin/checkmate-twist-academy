import { ChallengeView } from "./challenge-view";
export const metadata = { title: "Challenge" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-12"><ChallengeView id={id} /></div>;
}
