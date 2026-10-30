"use client";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { errMsg } from "@/lib/online";

export type Relation = "none" | "sent" | "received" | "friend" | "blocked" | "self";

/** The one button (or pair) that fits the current relationship. Calls the friendship RPCs from migration 0003. */
export function RelationButton({ id, relation, onChange }: { id: string; relation: Relation; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const call = async (fn: string, args: Record<string, unknown>) => {
    const sb = getSupabase(); if (!sb) return;
    setBusy(true); setErr(null);
    const { error } = await sb.rpc(fn, args);
    setBusy(false);
    if (error) setErr(await errMsg(error)); else onChange();
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {relation === "none" && <button className="btn btn-primary" disabled={busy} onClick={() => call("send_friend_request", { target: id })}>Add friend</button>}
      {relation === "sent" && <button className="btn btn-ghost" disabled={busy} onClick={() => call("remove_friend", { other: id })}>Cancel request</button>}
      {relation === "received" && <>
        <button className="btn btn-primary" disabled={busy} onClick={() => call("respond_friend_request", { other: id, accept: true })}>Accept</button>
        <button className="btn btn-ghost" disabled={busy} onClick={() => call("respond_friend_request", { other: id, accept: false })}>Decline</button>
      </>}
      {relation === "blocked" && <button className="btn btn-ghost" disabled={busy} onClick={() => call("unblock_user", { other: id })}>Unblock</button>}
      {err && <span role="alert" className="text-sm text-bad w-full">{err}</span>}
    </span>
  );
}

export function useRelationActions() {
  return {
    remove: async (id: string) => getSupabase()?.rpc("remove_friend", { other: id }),
    block: async (id: string) => getSupabase()?.rpc("block_user", { other: id }),
  };
}
