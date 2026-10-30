"use client";
import { useEffect } from "react";

/** Registers the offline service worker in production builds. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const v = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
    const reg = () => navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(v)}`, { scope: "/" }).catch(() => {});
    if (document.readyState === "complete") reg(); else window.addEventListener("load", reg, { once: true });
  }, []);
  return null;
}
