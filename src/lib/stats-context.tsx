"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getSupabase } from "./supabase/client";
import { useAuth } from "./auth-context";

export interface MyStats { xp: number; streak_current: number; streak_best: number; freezes: number; week_xp: number; today_xp: number; last_active_date: string | null }
interface Ctx { stats: MyStats | null; badges: string[]; refresh: () => void }
const C = createContext<Ctx>({ stats: null, badges: [], refresh: () => {} });

/** Server-recorded XP, streak and badges for the signed-in user. Refreshes on focus and every minute. */
export function StatsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<MyStats | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const refresh = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !user) { setStats(null); setBadges([]); return; }
    const [s, b] = await Promise.all([sb.rpc("my_stats"), sb.from("user_achievements").select("achievement_id")]);
    if (s.data) setStats(s.data as MyStats);
    if (b.data) setBadges(b.data.map((x: { achievement_id: string }) => x.achievement_id));
  }, [user]);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    window.addEventListener("ct:activity", refresh);
    return () => { clearInterval(t); window.removeEventListener("focus", refresh); window.removeEventListener("ct:activity", refresh); };
  }, [refresh]);
  return <C.Provider value={{ stats, badges, refresh }}>{children}</C.Provider>;
}
export const useStats = () => useContext(C);
/** Call after any action that may earn XP so the header updates. */
export const notifyActivity = () => { if (typeof window !== "undefined") setTimeout(() => window.dispatchEvent(new Event("ct:activity")), 600); };
