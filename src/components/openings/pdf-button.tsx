"use client";
import { useState } from "react";
import { FileDown } from "lucide-react";
import { downloadKitsPdf } from "@/lib/openings/pdf-client";

export function PdfButton({ slugs, filename, title, owner, label = "Download PDF guide", className = "btn btn-ghost", disabled }: { slugs: string[]; filename: string; title?: string; owner?: string; label?: string; className?: string; disabled?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const go = async () => {
    setState("busy");
    try { await downloadKitsPdf(slugs, { filename, title, owner }); setState("idle"); } catch { setState("error"); }
  };
  return (
    <span className="inline-flex flex-col">
      <button className={className} onClick={go} disabled={disabled || state === "busy"} aria-busy={state === "busy"}>
        <FileDown size={17} aria-hidden />{state === "busy" ? "Making PDF…" : label}
      </button>
      {state === "error" && <span role="alert" className="text-sm mt-1 text-[color:var(--bad,#b42318)]">The PDF could not be made. Try again.</span>}
    </span>
  );
}
