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

    const caption = overlay.querySelector(".v8-caption") as HTMLElement | null;
    const V8_PHRASES = [
      "Стекло меняет всё вокруг.",
      "Прозрачность, которая создаёт глубину.",
    ];

    let v8Cancel = { cancelled: false };

    const showCaption = () => {
      if (!caption) return;
      v8Cancel = { cancelled: false };
      const cancel = v8Cancel;
      caption.style.display = "block";
      caption.style.opacity = "0";
      const FADE_MS = 350;
      const VISIBLE_MS = 1600;
      const lines = caption.querySelectorAll(".v8-cap-line");

      const showLine = (idx: number) => {
        if (cancel.cancelled || idx >= lines.length) return;
        const el = lines[idx] as HTMLElement;
        el.style.opacity = "0";
        el.style.display = "block";
        caption.style.opacity = "1";
        const t0 = performance.now();
        const fadeIn = (now: number) => {
          if (cancel.cancelled) return;
          const p = Math.min(1, (now - t0) / FADE_MS);
          el.style.opacity = (p * p * (3 - 2 * p)).toFixed(3);
          if (p < 1) { requestAnimationFrame(fadeIn); return; }
          setTimeout(() => {
            if (cancel.cancelled) return;
            const t1 = performance.now();
            const fadeOut = (now2: number) => {
              if (cancel.cancelled) return;
              const p2 = Math.min(1, (now2 - t1) / FADE_MS);
              el.style.opacity = (1 - p2 * p2 * (3 - 2 * p2)).toFixed(3);
              if (p2 < 1) { requestAnimationFrame(fadeOut); return; }
              el.style.display = "none";
              setTimeout(() => showLine(idx + 1), 100);
            };
            requestAnimationFrame(fadeOut);
          }, VISIBLE_MS);
        };
        requestAnimationFrame(fadeIn);
      };
      showLine(0);
    };

    const hideCaption = () => {
      v8Cancel.cancelled = true;
      if (!caption) return;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 300);
        caption.style.opacity = (1 - p * p * (3 - 2 * p)).toFixed(3);
        if (p < 1) { requestAnimationFrame(tick); return; }
        caption.style.display = "none";
      };
      requestAnimationFrame(tick);
    };

    const onStart = () => {
      const startTime = performance.now();

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
        showCaption();
        video.play().catch(() => { unblock(); fadeOut(); });
      };
      requestAnimationFrame(fadeIn);

      const fadeOut = () => {
        hideCaption();
        // Snap to slide2 happens 720ms after event; lights-on CTA needs 2900ms after that.
        // Delay unblock until that animation is guaranteed complete.
        const SNAP_MS = 720;
        const SETTLE_MS = 2900; // 1.3s CTA delay + 1.6s CTA animation
        const targetTime = startTime + SNAP_MS + SETTLE_MS;
        const delay = Math.max(0, targetTime - performance.now());
        window.setTimeout(unblock, delay);

        // Force lights-on on slide2 regardless of scroll-event timing.
        // On production (Vercel SSR), data-version is set after hydration so
        // prod-init.ts check() may run before the layout shift and never fire again.
        const slide2El = document.getElementById("slide2");
        if (slide2El) slide2El.classList.add("lights-on");

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
      <div
        className="v8-caption"
        style={{
          position: "absolute",
          bottom: "clamp(36px, 5vh, 64px)",
          left: "50%",
          transform: "translateX(-50%)",
          display: "none",
          opacity: 0,
          textAlign: "center",
          pointerEvents: "none",
          fontFamily: "'Manrope', sans-serif",
        }}
        aria-hidden="true"
      >
        {["Стекло меняет всё вокруг.", "Прозрачность, которая создаёт глубину."].map((phrase) => (
          <div
            key={phrase}
            className="v8-cap-line"
            style={{
              display: "none",
              fontSize: "clamp(16px, 1.8vw, 26px)",
              color: "rgba(244,241,236,0.88)",
              fontWeight: 300,
              letterSpacing: ".04em",
              lineHeight: 1.45,
              textShadow: "0 2px 20px rgba(0,0,0,0.7)",
              whiteSpace: "nowrap",
            }}
          >
            {phrase}
          </div>
        ))}
      </div>
    </div>
  );
}
