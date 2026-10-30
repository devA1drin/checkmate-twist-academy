"use client";
/**
 * Offline-safe writes. Every write is a plain, serialisable description so it can wait in
 * localStorage while the device is offline and be replayed when the connection returns.
 * Row-level security still applies on replay, so a queued write can never do more than a live one.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase/client";

export interface Op {
  uid: string;
  kind: "insert" | "upsert" | "delete" | "update";
  table: string;
  values?: Record<string, unknown> | Record<string, unknown>[];
  match?: Record<string, string | number | boolean>;
  onConflict?: string;
  at?: number;
}
const KEY = "ct-sync-queue-v1";
const MAX = 500;

export function pending(): Op[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(q: Op[]) {
  try { localStorage.setItem(KEY, JSON.stringify(q.slice(-MAX))); } catch { /* storage full */ }
  window.dispatchEvent(new Event("ct:queue"));
}
const enqueue = (op: Op) => save([...pending(), { ...op, at: Date.now() }]);
const isNetwork = (msg: string) => /failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(msg);

function run(sb: SupabaseClient, op: Op) {
  const t = sb.from(op.table);
  const withMatch = <T extends { eq: (c: string, v: string | number | boolean) => T }>(q: T) => Object.entries(op.match ?? {}).reduce((acc, [c, v]) => acc.eq(c, v), q);
  switch (op.kind) {
    case "insert": return t.insert(op.values!);
    case "upsert": return t.upsert(op.values!, op.onConflict ? { onConflict: op.onConflict } : undefined);
    case "update": return withMatch(t.update(op.values as Record<string, unknown>));
    case "delete": return withMatch(t.delete());
  }
}

/** Run a write now, or queue it if the device is offline. Returns an error message only for real (non-network) failures. */
export async function submit(op: Op): Promise<{ queued: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { queued: false };
  if (typeof navigator !== "undefined" && !navigator.onLine) { enqueue(op); return { queued: true }; }
  try {
    const { error } = await run(sb, op);
    if (!error) return { queued: false };
    if (isNetwork(error.message)) { enqueue(op); return { queued: true }; }
    return { queued: false, error: error.message };
  } catch (e) {
    enqueue(op); return { queued: true, error: isNetwork(String(e)) ? undefined : String(e) };
  }
}

let flushing = false;
/** Replay queued writes for this user, oldest first. Writes that the server rejects are dropped (they would never succeed). */
export async function flush(uid: string): Promise<{ sent: number; dropped: number; left: number }> {
  const sb = getSupabase();
  if (!sb || flushing || (typeof navigator !== "undefined" && !navigator.onLine)) return { sent: 0, dropped: 0, left: pending().length };
  flushing = true;
  let sent = 0, dropped = 0;
  try {
    const q = pending();
    const keep: Op[] = [];
    for (let i = 0; i < q.length; i++) {
      const op = q[i];
      if (op.uid !== uid) { keep.push(op); continue; }
      try {
        const { error } = await run(sb, op);
        if (!error) sent++;
        else if (isNetwork(error.message)) { keep.push(...q.slice(i)); break; }
        else dropped++;
      } catch { keep.push(...q.slice(i)); break; }
    }
    save(keep);
    return { sent, dropped, left: keep.length };
  } finally { flushing = false; }
}
