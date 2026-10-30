import { ShieldCheck } from "lucide-react";
export function PrivacyNote({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3 text-sm flex gap-2.5">
      <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
      <div><strong>Privacy:</strong> camera frames and photos are processed only in your browser. Nothing is uploaded, stored, or sent to any server, and the camera turns off as soon as you leave this page or press Stop. {children}</div>
    </div>
  );
}
