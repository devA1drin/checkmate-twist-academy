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

export type Facing = "environment" | "user";
type TorchCaps = MediaTrackCapabilities & { torch?: boolean };

/**
 * getUserMedia wrapper. Video frames stay on this device; nothing is uploaded.
 * Supports switching between the rear and front camera and, where the browser exposes it
 * (mostly Chrome on Android), the torch.
 */
export function useCamera(initialFacing: Facing = "environment") {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<Facing>(initialFacing);
  const facingRef = useRef<Facing>(initialFacing);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torch, setTorchState] = useState(false);
  const [cameraCount, setCameraCount] = useState(0);

  const release = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorchSupported(false); setTorchState(false);
  };
  const stop = useCallback(() => { release(); setState("idle"); }, []);

  const start = useCallback(async (want?: Facing) => {
    const reason = cameraUnavailableReason();
    if (reason) { setError(reason); setState("error"); return; }
    const f = want ?? facingRef.current;
    release();
    setState("starting"); setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: f }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      facingRef.current = f; setFacing(f);
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => undefined); }
      const track = stream.getVideoTracks()[0];
      const caps = (track?.getCapabilities?.() ?? {}) as TorchCaps;
      setTorchSupported(!!caps.torch);
      navigator.mediaDevices.enumerateDevices?.().then((d) => setCameraCount(d.filter((x) => x.kind === "videoinput").length)).catch(() => undefined);
      setState("live");
    } catch (e) { setError(cameraErrorMessage(e)); setState("error"); }
  }, []);

  /** Restart with the other camera. */
  const switchFacing = useCallback(() => start(facingRef.current === "user" ? "environment" : "user"), [start]);

  const setTorch = useCallback(async (on: boolean) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try { await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] }); setTorchState(on); }
    catch { setTorchSupported(false); }
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
  return { videoRef, state, error, start, stop, snapshot, setError, facing, switchFacing, torchSupported, torch, setTorch, cameraCount };
}
