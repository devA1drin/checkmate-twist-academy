"use client";
import { getSupabase } from "./supabase/client";
import { submit } from "./sync-queue";
import { notifyActivity } from "./stats-context";

/** Leitner boxes: a line moves up one box when played without a mistake, back to box 1 on a mistake. */
export const INTERVAL_DAYS = [0, 1, 2, 4, 8, 16, 32];
export interface Review { box: number; due: number }
export type Reviews = Record<string, Review>;
const KEY = "ct-kit-reviews-v1";

function readLocal(): Reviews { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } }

export async function loadReviews(kit: string, uid: string | undefined): Promise<Reviews> {
  const local = readLocal();
  const sb = getSupabase();
  if (!sb || !uid) return local;
  const { data, error } = await sb.from("kit_reviews").select("line_id, box, due_at").eq("kit", kit);
  if (error || !data) return local;
  const out: Reviews = { ...local };
  for (const r of data as { line_id: string; box: number; due_at: string }[]) out[r.line_id] = { box: r.box, due: Date.parse(r.due_at) };
  return out;
}

export function nextReview(prev: Review | undefined, correct: boolean): Review {
  const box = correct ? Math.min((prev?.box ?? 0) + 1, 6) : 1;
  return { box, due: Date.now() + INTERVAL_DAYS[correct ? box : 0] * 86400000 };
}

export async function recordDrill(kit: string, lineId: string, correct: boolean, prev: Review | undefined, uid: string | undefined): Promise<Review> {
  const r = nextReview(prev, correct);
  const all = readLocal(); all[lineId] = r;
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* ignore */ }
  if (uid) {
    await submit({ uid, kind: "insert", table: "kit_drills", values: { user_id: uid, kit, line_id: lineId, correct } });
    await submit({ uid, kind: "upsert", table: "kit_reviews", values: { user_id: uid, kit, line_id: lineId, box: r.box, due_at: new Date(r.due).toISOString(), updated_at: new Date().toISOString() }, onConflict: "user_id,line_id" });
    notifyActivity();
  }
  return r;
}

export const isDue = (r: Review | undefined) => !r || r.due <= Date.now();
export function dueLabel(r: Review | undefined) {
  if (!r) return "New";
  const d = Math.ceil((r.due - Date.now()) / 86400000);
  return d <= 0 ? "Due now" : d === 1 ? "Due tomorrow" : `Due in ${d} days`;
}
