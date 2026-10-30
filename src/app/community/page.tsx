import Link from "next/link";
import { Hub } from "@/components/layout/hub";
export const metadata = { title: "Community" };
export default function Page() {
  return (
    <Hub section="Community" title="Community" desc="Ask for help, share a game or a solve, add friends and challenge them. You need a free account to post or add friends.">
      <div className="flex flex-wrap gap-3 mb-10">
        <Link href="/forum" className="btn btn-primary">Open the forum</Link>
        <Link href="/friends" className="btn btn-ghost">Find friends</Link>
      </div>
    </Hub>
  );
}
