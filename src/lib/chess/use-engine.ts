"use client";
import { useEffect, useRef, useState } from "react";
import { StockfishEngine } from "./engine";

export type EngineStatus = "loading" | "ready" | "error";
/** One Stockfish worker per component; terminated on unmount. */
export function useEngine() {
  const ref = useRef<StockfishEngine | null>(null);
  const [status, setStatus] = useState<EngineStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const e = new StockfishEngine();
    ref.current = e;
    e.init().then(() => setStatus("ready")).catch((err) => { setStatus("error"); setError(String(err?.message ?? err)); });
    return () => { e.terminate(); ref.current = null; };
  }, []);
  return { engine: ref, status, error };
}
