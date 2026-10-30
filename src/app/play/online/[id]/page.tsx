import { OnlineGame } from "./online-game";
export const metadata = { title: "Online game" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8"><OnlineGame id={id} /></div>;
}
