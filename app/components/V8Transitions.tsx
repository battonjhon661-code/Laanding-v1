"use client";
import { useEffect, useRef } from "react";
import { useSiteVersion, useIsMobile } from "./useFlatLayout";

export default function V8Transitions() {
  const version = useSiteVersion();
  const isMobile = useIsMobile();
  const active = version === "8" && !isMobile;

  const overlayRef = useRef<HTMLDivElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!active) return;

    const overlay = overlayRef.current;
    const video   = videoRef.current;
    if (!overlay || !video) return;

    const ss = (v: number) => v * v * (3 - 2 * v);

    const blockWheel = (e: WheelEvent) => e.preventDefault();
    const blockTouch = (e: TouchEvent) => e.preventDefault();
    const blockKey   = (e: KeyboardEvent) => {
      if (["ArrowDown","ArrowUp","PageDown","PageUp"," ","Spacebar","End","Home"].includes(e.key))
        e.preventDefault();
    };
    const unblock = () => {
      window.removeEventListener("wheel",     blockWheel, { capture: true } as EventListenerOptions);
      window.removeEventListener("touchmove", blockTouch, { capture: true } as EventListenerOptions);
      window.removeEventListener("keydown",   blockKey,   { capture: true } as EventListenerOptions);
    };

    const onStart = () => {
      // Block user scroll input for the duration of the video
      window.addEventListener("wheel",     blockWheel, { passive: false, capture: true });
      window.addEventListener("touchmove", blockTouch, { passive: false, capture: true });
      window.addEventListener("keydown",   blockKey,   { capture: true });

      // Show overlay + play video
      video.currentTime = 0;
      overlay.style.display = "block";
      overlay.style.opacity = "0";
      video.style.opacity = "1";

      // Fade in overlay, then play
      const FADE_IN_MS = 250;
      const t0 = performance.now();
      const fadeIn = (now: number) => {
        const p = Math.min(1, (now - t0) / FADE_IN_MS);
        overlay.style.opacity = ss(p).toFixed(3);
        if (p < 1) { requestAnimationFrame(fadeIn); return; }
        video.play().catch(() => { unblock(); fadeOut(); });
      };
      requestAnimationFrame(fadeIn);

      const fadeOut = () => {
        unblock();
        const t1 = performance.now();
        const FADE_OUT_MS = 600;
        const doFade = (now: number) => {
          const p = Math.min(1, (now - t1) / FADE_OUT_MS);
          overlay.style.opacity = (1 - ss(p)).toFixed(3);
          if (p < 1) { requestAnimationFrame(doFade); return; }
          overlay.style.display = "none";
          overlay.style.opacity = "0";
        };
        requestAnimationFrame(doFade);
      };

      video.addEventListener("ended", fadeOut, { once: true });
    };

    window.addEventListener("vg:v8-third-start", onStart as EventListener);
    return () => {
      window.removeEventListener("vg:v8-third-start", onStart as EventListener);
      unblock();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9500,
        display: "none",
        background: "#000",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        src="/assets/third.mp4"
        muted
        playsInline
        preload="auto"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}
