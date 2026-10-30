import { BattleRoom } from "./battle-room";
export const metadata = { title: "Cube battle room" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10"><BattleRoom id={id} /></div>;
}
