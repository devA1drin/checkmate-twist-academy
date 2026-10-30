"use client";
/**
 * Progress store. Guests: localStorage only (never leaves the browser).
 * Signed-in users (Supabase configured): loaded from and written to Supabase tables.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { EMPTY_PROGRESS, ProgressData, Solve, QuizResult, PuzzleAttempt, EngineGame } from "./progress-types";
import { useAuth } from "./auth-context";
import { getSupabase } from "./supabase/client";

const KEY = "cta-progress-v1";

interface ProgressCtx {
  data: ProgressData;
  ready: boolean;
  mode: "guest" | "account";
  syncError: string | null;
  completeLesson: (id: string) => void;
  uncompleteLesson: (id: string) => void;
  addSolve: (s: Solve) => void;
  updateSolve: (id: string, patch: Partial<Solve>) => void;
  deleteSolve: (id: string) => void;
  addQuizResult: (r: QuizResult) => void;
  addPuzzleAttempt: (a: PuzzleAttempt) => void;
  addGame: (g: EngineGame) => void;
  addScan: () => void;
  resetLocal: () => void;
  importGuestToAccount: () => Promise<string>;
  guestHasData: boolean;
}
const Ctx = createContext<ProgressCtx | null>(null);

function readLocal(): ProgressData {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY_PROGRESS, ...JSON.parse(raw) } : EMPTY_PROGRESS;
  } catch { return EMPTY_PROGRESS; }
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [guestHasData, setGuestHasData] = useState(false);
  const mode: "guest" | "account" = user ? "account" : "guest";
  const uid = user?.id;
  const scansRef = useRef(0);

  // load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = readLocal();
      setGuestHasData(local.completedLessons.length + local.solves.length + local.quizResults.length + local.puzzles.length > 0);
      const sb = getSupabase();
      if (!uid || !sb) { if (!cancelled) { setData(local); setReady(true); } return; }
      try {
        const [lp, so, qr, pa, eg, pr] = await Promise.all([
          sb.from("lesson_progress").select("lesson_id").eq("user_id", uid),
          sb.from("solves").select("id, time_ms, penalty, scramble, created_at").eq("user_id", uid).order("created_at"),
          sb.from("quiz_results").select("quiz_id, score, total, created_at").eq("user_id", uid).order("created_at"),
          sb.from("puzzle_attempts").select("puzzle_id, solved, rating, created_at").eq("user_id", uid).order("created_at"),
          sb.from("engine_games").select("result, level, created_at").eq("user_id", uid).order("created_at"),
          sb.from("profiles").select("scans").eq("id", uid).maybeSingle(),
        ]);
        const err = [lp, so, qr, pa, eg].find((r) => r.error)?.error;
        if (err) throw err;
        scansRef.current = (pr.data as { scans?: number } | null)?.scans ?? 0;
        if (cancelled) return;
        setData({
          completedLessons: (lp.data ?? []).map((r) => r.lesson_id as string),
          solves: (so.data ?? []).map((r) => ({ id: r.id, timeMs: r.time_ms, penalty: r.penalty, scramble: r.scramble, at: r.created_at })),
          quizResults: (qr.data ?? []).map((r) => ({ quizId: r.quiz_id, score: r.score, total: r.total, at: r.created_at })),
          puzzles: (pa.data ?? []).map((r) => ({ puzzleId: r.puzzle_id, solved: r.solved, rating: r.rating, at: r.created_at })),
          games: (eg.data ?? []).map((r) => ({ result: r.result, level: r.level, at: r.created_at })),
          scans: scansRef.current,
        });
        setSyncError(null);
      } catch (e) {
        setSyncError(`Could not load your progress from the server: ${(e as Error).message}`);
        setData(EMPTY_PROGRESS);
      } finally { if (!cancelled) setReady(true); }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  // persist guest data
  useEffect(() => {
    if (ready && mode === "guest") {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage full or blocked */ }
    }
  }, [data, ready, mode]);

  // Achievements for signed-in users are awarded by the database (see migration 0003), never by the client.

  const remote = useCallback(async (fn: (sb: NonNullable<ReturnType<typeof getSupabase>>, uid: string) => PromiseLike<{ error: { message: string } | null }>) => {
    const sb = getSupabase();
    if (!sb || !uid) return;
    const { error } = await fn(sb, uid);
    setSyncError(error ? `Sync failed: ${error.message}` : null);
  }, [uid]);

  const value: ProgressCtx = {
    data, ready, mode, syncError, guestHasData,
    completeLesson: (id) => {
      setData((d) => (d.completedLessons.includes(id) ? d : { ...d, completedLessons: [...d.completedLessons, id] }));
      remote((sb, u) => sb.from("lesson_progress").upsert({ user_id: u, lesson_id: id }, { onConflict: "user_id,lesson_id" }));
    },
    uncompleteLesson: (id) => {
      setData((d) => ({ ...d, completedLessons: d.completedLessons.filter((x) => x !== id) }));
      remote((sb, u) => sb.from("lesson_progress").delete().eq("user_id", u).eq("lesson_id", id));
    },
    addSolve: (s) => {
      setData((d) => ({ ...d, solves: [...d.solves, s] }));
      remote((sb, u) => sb.from("solves").insert({ id: s.id, user_id: u, time_ms: s.timeMs, penalty: s.penalty, scramble: s.scramble }));
    },
    updateSolve: (id, patch) => {
      setData((d) => ({ ...d, solves: d.solves.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
      if ("penalty" in patch) remote((sb, u) => sb.from("solves").update({ penalty: patch.penalty }).eq("id", id).eq("user_id", u));
    },
    deleteSolve: (id) => {
      setData((d) => ({ ...d, solves: d.solves.filter((s) => s.id !== id) }));
      remote((sb, u) => sb.from("solves").delete().eq("id", id).eq("user_id", u));
    },
    addQuizResult: (r) => {
      setData((d) => ({ ...d, quizResults: [...d.quizResults, r] }));
      remote((sb, u) => sb.from("quiz_results").insert({ user_id: u, quiz_id: r.quizId, score: r.score, total: r.total }));
    },
    addPuzzleAttempt: (a) => {
      setData((d) => ({ ...d, puzzles: [...d.puzzles, a] }));
      remote((sb, u) => sb.from("puzzle_attempts").insert({ user_id: u, puzzle_id: a.puzzleId, solved: a.solved, rating: a.rating }));
    },
    addGame: (g) => {
      setData((d) => ({ ...d, games: [...d.games, g] }));
      remote((sb, u) => sb.from("engine_games").insert({ user_id: u, result: g.result, level: g.level }));
    },
    addScan: () => {
      setData((d) => ({ ...d, scans: d.scans + 1 }));
      remote((sb, u) => sb.from("profiles").update({ scans: scansRef.current + 1 }).eq("id", u).then((r) => { scansRef.current += 1; return r; }));
    },
    resetLocal: () => { localStorage.removeItem(KEY); if (mode === "guest") setData(EMPTY_PROGRESS); setGuestHasData(false); },
    importGuestToAccount: async () => {
      const sb = getSupabase();
      if (!sb || !uid) return "Not signed in.";
      const g = readLocal();
      const ops = [
        g.completedLessons.length ? sb.from("lesson_progress").upsert(g.completedLessons.map((lesson_id) => ({ user_id: uid, lesson_id })), { onConflict: "user_id,lesson_id" }) : null,
        g.solves.length ? sb.from("solves").upsert(g.solves.map((s) => ({ id: s.id, user_id: uid, time_ms: s.timeMs, penalty: s.penalty, scramble: s.scramble, created_at: s.at }))) : null,
        g.quizResults.length ? sb.from("quiz_results").insert(g.quizResults.map((r) => ({ user_id: uid, quiz_id: r.quizId, score: r.score, total: r.total, created_at: r.at }))) : null,
        g.puzzles.length ? sb.from("puzzle_attempts").insert(g.puzzles.map((a) => ({ user_id: uid, puzzle_id: a.puzzleId, solved: a.solved, rating: a.rating, created_at: a.at }))) : null,
      ].filter(Boolean);
      const res = await Promise.all(ops);
      const err = res.find((r) => r && r.error);
      if (err && err.error) return `Import failed: ${err.error.message}`;
      localStorage.removeItem(KEY);
      setGuestHasData(false);
      return "Guest progress imported. Reload to see it.";
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useProgress outside provider");
  return c;
}
