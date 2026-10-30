"use client";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-context";

export type Interest = "chess" | "cube" | "both";
export type Skill = "new" | "beginner" | "intermediate" | "advanced";
export interface Prefs { interests: Interest; level: Skill }
const KEY = "ct-onboarding";

export function readLocalPrefs(): Prefs | null {
  if (typeof window === "undefined") return null;
  try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && v.interests && v.level ? v : null; } catch { return null; }
}
export function writeLocalPrefs(p: Prefs) { localStorage.setItem(KEY, JSON.stringify(p)); }

/** Preferences from the account when signed in, otherwise from this browser. `null` means not onboarded yet. */
export function usePrefs(): { prefs: Prefs | null; ready: boolean } {
  const { profile, user, loading } = useAuth();
  const [local, setLocal] = useState<Prefs | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setLocal(readLocalPrefs()); setMounted(true); }, []);
  if (user && profile?.onboarded && profile.interests && profile.skill_level) return { prefs: { interests: profile.interests, level: profile.skill_level }, ready: true };
  return { prefs: local, ready: mounted && !loading };
}
