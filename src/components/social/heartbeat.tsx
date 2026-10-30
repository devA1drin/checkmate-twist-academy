"use client";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";

/** Marks the signed-in user as active once a minute while the tab is visible (used for friends' online status). */
export function Heartbeat() {
  const { user } = useAuth();
  useEffect(() => {
    const sb = getSupabase(); if (!sb || !user) return;
    const beat = () => { if (document.visibilityState === "visible" && navigator.onLine) sb.rpc("heartbeat").then(() => undefined); };
    beat();
    const t = setInterval(beat, 60000);
    document.addEventListener("visibilitychange", beat);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", beat); };
  }, [user]);
  return null;
}
