"use client";
import { useEffect, useState } from "react";
import { CloudOff, WifiOff } from "lucide-react";
import { pending } from "@/lib/sync-queue";

/** A thin bar while offline, or while saved changes are still waiting to reach the server. */
export function NetworkStatus() {
  const [online, setOnline] = useState(true);
  const [waiting, setWaiting] = useState(0);
  useEffect(() => {
    const sync = () => { setOnline(navigator.onLine); setWaiting(pending().length); };
    sync();
    window.addEventListener("online", sync); window.addEventListener("offline", sync); window.addEventListener("ct:queue", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); window.removeEventListener("ct:queue", sync); };
  }, []);
  if (online && waiting === 0) return null;
  return (
    <div role="status" className="border-b border-line bg-surface-2 text-sm px-4 py-2 flex items-center gap-2 justify-center text-center">
      {online ? <CloudOff size={15} aria-hidden className="shrink-0" /> : <WifiOff size={15} aria-hidden className="shrink-0" />}
      {online ? `Sending ${waiting} saved change${waiting === 1 ? "" : "s"}…`
        : `You're offline. Lessons, opening kits, the timer, the 3D cube and the engine still work.${waiting ? ` ${waiting} change${waiting === 1 ? "" : "s"} will sync when you reconnect.` : ""}`}
    </div>
  );
}
