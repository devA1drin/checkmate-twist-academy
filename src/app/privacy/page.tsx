import { PageHeader } from "@/components/ui/page-header";
export const metadata = { title: "Privacy" };
export default function Page() {
  const items: [string, string][] = [
    ["Camera and photos", "The cube scanner and chessboard tool process camera frames and photos entirely in your browser. Images are never uploaded, stored or sent anywhere. The camera stops when you press Stop, finish scanning, or leave the page. You can always use manual entry or upload instead of granting camera access."],
    ["Chess engine and cube solver", "Stockfish 19 and the two-phase cube solver run locally in Web Workers (WebAssembly/JavaScript). Positions you analyse are not sent to a server."],
    ["Guest mode", "Without an account, progress (lessons, solves, quiz scores, puzzle attempts) is stored only in your browser's localStorage. Clear it any time from the dashboard."],
    ["Accounts", "If the site owner has connected a Supabase backend and you sign in, your email, display name and learning progress are stored in that Supabase project, protected by row-level security so other users cannot read your raw data. Leaderboards show only your display name and aggregate results, and you can opt out in account settings."],
    ["Videos", "Videos are embedded from youtube-nocookie.com and only load after you press play. YouTube's own privacy policy applies once a video loads."],
    ["No tracking", "This app includes no analytics, advertising or third-party tracking scripts."],
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader eyebrow="Trust" title="Privacy" desc="Plain-language notes on what happens to your data." />
      <div className="space-y-4">{items.map(([h, p]) => <section key={h} className="card p-5"><h2 className="font-semibold">{h}</h2><p className="text-sm text-muted mt-1.5 leading-relaxed">{p}</p></section>)}</div>
    </div>
  );
}
