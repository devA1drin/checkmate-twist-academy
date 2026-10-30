"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { BackendRequired } from "@/components/backend-required";
import { formatTime } from "@/lib/progress-types";

const BOARDS = {
  cube: { label: "Cube · best single", fn: "leaderboard_cube", cols: [["best_ms", "Best"], ["solves", "Solves"]] },
  puzzles: { label: "Puzzles solved", fn: "leaderboard_puzzles", cols: [["solved", "Solved"], ["best_rating", "Hardest"]] },
  lessons: { label: "Lessons completed", fn: "leaderboard_lessons", cols: [["lessons", "Lessons"]] },
} as const;
type K = keyof typeof BOARDS;

export function Leaderboard() {
  const { configured } = useAuth();
  const [tab, setTab] = useState<K>("cube");
  const [rows, setRows] = useState<Record<string, string | number>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const sb = getSupabase(); if (!sb) return;
    setRows(null); setError(null);
    sb.rpc(BOARDS[tab].fn, { lim: 50 }).then(({ data, error }) => { if (error) setError(error.message); else setRows(data ?? []); });
  }, [tab]);
  if (!configured) return <BackendRequired feature="Leaderboards" />;
  const b = BOARDS[tab];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">{(Object.keys(BOARDS) as K[]).map((k) => <button key={k} onClick={() => setTab(k)} className={`btn ${tab === k ? "btn-primary" : "btn-ghost"}`}>{BOARDS[k].label}</button>)}</div>
      <div className="card overflow-hidden">
        {error ? <p className="p-4 text-bad text-sm">Could not load leaderboard: {error}. Did you run the SQL migration?</p>
          : rows === null ? <p className="p-4 text-muted flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Loading…</p>
          : rows.length === 0 ? <p className="p-4 text-muted">No entries yet.</p>
          : (
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-muted text-left"><tr><th className="p-3 w-12">#</th><th className="p-3">Student</th>{b.cols.map(([, l]) => <th key={l} className="p-3 text-right">{l}</th>)}</tr></thead>
              <tbody>{rows.map((r, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="p-3 font-mono">{i + 1}</td>
                  <td className="p-3 font-medium">{r.display_name}</td>
                  {b.cols.map(([k]) => <td key={k} className="p-3 text-right font-mono">{k === "best_ms" ? formatTime(Number(r[k])) : r[k] ?? "—"}</td>)}
                </tr>
              ))}</tbody>
            </table>
          )}
      </div>
    </div>
  );
}
