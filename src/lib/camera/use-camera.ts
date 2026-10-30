"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type CameraState = "idle" | "starting" | "live" | "error";

/** Explain getUserMedia failures in plain language. */
export function cameraErrorMessage(e: unknown): string {
  const name = (e as { name?: string })?.name ?? "";
  switch (name) {
    case "NotAllowedError": case "PermissionDeniedError":
      return "Camera permission was denied. Allow camera access in your browser's site settings (the camera icon in the address bar) and try again — or upload a photo instead.";
    case "NotFoundError": case "DevicesNotFoundError": case "OverconstrainedError":
      return "No camera was found on this device. You can upload a photo instead.";
    case "NotReadableError": case "TrackStartError":
      return "The camera is in use by another application or could not be started. Close other apps using the camera and try again.";
    case "SecurityError":
      return "Camera access is blocked by a browser security policy.";
    case "AbortError":
      return "Starting the camera was interrupted. Please try again.";
    default:
      return `Could not start the camera${(e as Error)?.message ? `: ${(e as Error).message}` : "."}`;
  }
}

/** Why the camera cannot be used at all in this context, or null. */
export function cameraUnavailableReason(): string | null {
  if (typeof window === "undefined") return null;
  if (!window.isSecureContext) return "Camera access requires a secure connection (HTTPS or localhost). Open this site over HTTPS, or upload a photo instead.";
  if (!navigator.mediaDevices?.getUserMedia) return "This browser does not support camera access (getUserMedia). Try a current version of Chrome, Edge, Firefox or Safari, or upload a photo.";
  return null;
}

/** getUserMedia wrapper. Video frames stay on this device; nothing is uploaded. */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
  }, []);

  const start = useCallback(async () => {
    const reason = cameraUnavailableReason();
    if (reason) { setError(reason); setState("error"); return; }
    setState("starting"); setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => undefined); }
      setState("live");
    } catch (e) { setError(cameraErrorMessage(e)); setState("error"); }
  }, []);

  /** Draw the current frame onto a canvas (local only). */
  const snapshot = useCallback((): HTMLCanvasElement | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    return c;
  }, []);

  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);
  return { videoRef, state, error, start, stop, snapshot, setError };
}
