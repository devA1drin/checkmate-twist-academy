"use client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface GameRow {
  id: string; created_by: string; white: string | null; black: string | null; invited: string | null; is_seek: boolean;
  visibility: "public" | "private"; status: "waiting" | "active" | "finished" | "aborted";
  base_ms: number; inc_ms: number; white_ms: number; black_ms: number; fen: string; moves: string[]; sans: string[]; ply: number;
  last_move_at: string | null; draw_offer: string | null; result: "1-0" | "0-1" | "1/2-1/2" | null; end_reason: string | null;
  rematch_of: string | null; rematch_game: string | null; created_at: string; started_at: string | null; ended_at: string | null;
}
export const GAME_COLUMNS = "id, created_by, white, black, invited, is_seek, visibility, status, base_ms, inc_ms, white_ms, black_ms, fen, moves, sans, ply, last_move_at, draw_offer, result, end_reason, rematch_of, rematch_game, created_at, started_at, ended_at";

export const TIME_CONTROLS: { base: number; inc: number; label: string; kind: string }[] = [
  { base: 1, inc: 0, label: "1+0", kind: "Bullet" }, { base: 3, inc: 0, label: "3+0", kind: "Blitz" }, { base: 3, inc: 2, label: "3+2", kind: "Blitz" },
  { base: 5, inc: 0, label: "5+0", kind: "Blitz" }, { base: 10, inc: 0, label: "10+0", kind: "Rapid" }, { base: 10, inc: 5, label: "10+5", kind: "Rapid" },
  { base: 15, inc: 10, label: "15+10", kind: "Rapid" }, { base: 30, inc: 0, label: "30+0", kind: "Classical" },
];
export const tcLabel = (base_ms: number, inc_ms: number) => `${base_ms / 60000}+${inc_ms / 1000}`;

/** Remaining time for each side right now. Clocks only run once both sides have moved (ply ≥ 2). */
export function clocks(g: GameRow, now: number): { w: number; b: number; running: "w" | "b" | null } {
  let w = g.white_ms, b = g.black_ms;
  if (g.status !== "active" || g.ply < 2 || !g.last_move_at) return { w, b, running: null };
  const spent = now - Date.parse(g.last_move_at);
  const side = g.ply % 2 === 0 ? "w" : "b";
  if (side === "w") w = Math.max(0, w - spent); else b = Math.max(0, b - spent);
  return { w, b, running: side };
}
export function fmtClock(ms: number) {
  const s = Math.max(0, ms) / 1000;
  if (s < 10) return `0:0${s.toFixed(1)}`;
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}

/** Offset between the server clock and this device, measured with a single round trip. */
export async function serverOffset(sb: SupabaseClient): Promise<number> {
  const t0 = Date.now();
  const { data } = await sb.rpc("server_now");
  const t1 = Date.now();
  return data ? Date.parse(data as string) - (t0 + t1) / 2 : 0;
}

export const REASONS: Record<string, string> = {
  checkmate: "by checkmate", resign: "by resignation", timeout: "on time", stalemate: "by stalemate", draw_agreed: "by agreement",
  repetition: "by threefold repetition", insufficient: "by insufficient material", fifty_move: "by the 50-move rule", aborted: "Game cancelled",
  timeout_vs_insufficient: "time ran out, but the opponent cannot checkmate",
};
export function resultText(g: GameRow, names: { w: string; b: string }) {
  if (g.status === "aborted") return "Game cancelled before both players moved.";
  if (!g.result) return "";
  const why = REASONS[g.end_reason ?? ""] ?? "";
  if (g.result === "1/2-1/2") return `Draw ${why}.`;
  return `${g.result === "1-0" ? names.w : names.b} won ${why}.`;
}

export function toPgn(g: GameRow, names: { w: string; b: string }, site: string) {
  const d = (g.started_at ?? g.created_at).slice(0, 10).replace(/-/g, ".");
  const head = [["Event", "Checkmate & Twist online game"], ["Site", site], ["Date", d], ["White", names.w], ["Black", names.b], ["Result", g.result ?? "*"], ["TimeControl", `${g.base_ms / 1000}+${g.inc_ms / 1000}`], ["Termination", g.end_reason ?? ""]]
    .map(([k, v]) => `[${k} "${v.replace(/"/g, "'")}"]`).join("\n");
  const body = g.sans.map((s, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${s}` : s)).join(" ");
  return `${head}\n\n${body} ${g.result ?? "*"}`.trim();
}

/** Readable message from a failed Supabase call or Edge Function call. */
export async function errMsg(e: unknown): Promise<string> {
  const err = e as { message?: string; context?: Response };
  if (err?.context && typeof err.context.json === "function") {
    try { const j = await err.context.clone().json(); if (j?.error) return j.error; } catch { /* not json */ }
  }
  const m = err?.message ?? String(e);
  if (/failed to fetch|network/i.test(m)) return "Connection problem. Check your internet and try again.";
  return m.replace(/^.*?: /, "");
}

export async function names(sb: SupabaseClient, ids: (string | null)[]): Promise<Record<string, string>> {
  const list = [...new Set(ids.filter(Boolean) as string[])];
  if (!list.length) return {};
  const { data } = await sb.from("profiles").select("id, display_name, username").in("id", list);
  return Object.fromEntries((data ?? []).map((p: { id: string; display_name: string | null; username: string | null }) => [p.id, p.display_name || p.username || "Member"]));
}
