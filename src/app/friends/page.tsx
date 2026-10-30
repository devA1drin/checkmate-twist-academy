import { PageHeader } from "@/components/ui/page-header";
import { Friends } from "./friends";
export const metadata = { title: "Friends" };
export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-12">
      <PageHeader eyebrow="Community" section="none" title="Friends" desc="Find people by name or username, see who is online, and challenge them to a game or a cube race." />
      <Friends />
    </div>
  );
}
