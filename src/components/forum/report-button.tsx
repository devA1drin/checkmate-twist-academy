"use client";
import { useState } from "react";
import { Flag } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { REPORT_REASONS } from "@/lib/forum";

type Target = "post" | "comment" | "user" | "game" | "battle_result";

/** Small inline report form. One report per person per item (enforced by the database). */
export function ReportButton({ type, id, label = "Report", reasons }: { type: Target; id: string; label?: string; reasons?: string[] }) {
  const [open, setOpen] = useState(false);
  const list = REPORT_REASONS.filter((r) => !reasons || reasons.includes(r.id));
  const [reason, setReason] = useState<string>(list[0].id);
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase(); if (!sb) return;
    const { error } = await sb.from("reports").insert({ target_type: type, target_id: id, reason, details: details.trim() || null });
    if (!error || error.code === "23505") { setState("sent"); setOpen(false); }
    else { setState("error"); setMsg(error.message); }
  };
  if (state === "sent") return <span className="text-sm text-muted">Reported. Thanks, a moderator will look at it.</span>;
  return (
    <span className="inline-block">
      <button type="button" className="text-sm text-muted hover:text-fg inline-flex items-center gap-1 min-h-11 px-1" aria-expanded={open} onClick={() => setOpen((o) => !o)}><Flag size={14} aria-hidden /> {label}</button>
      {open && (
        <form onSubmit={send} className="mt-2 border border-line rounded p-3 space-y-2 max-w-sm">
          <label className="block text-sm"><span className="label">Reason</span>
            <select className="input mt-1" value={reason} onChange={(e) => setReason(e.target.value)}>{list.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
          <label className="block text-sm"><span className="label">Details (optional)</span><textarea className="input mt-1" maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} /></label>
          {state === "error" && <p role="alert" className="text-sm text-bad">{msg}</p>}
          <div className="flex gap-2"><button className="btn btn-primary">Send report</button><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button></div>
        </form>
      )}
    </span>
  );
}
