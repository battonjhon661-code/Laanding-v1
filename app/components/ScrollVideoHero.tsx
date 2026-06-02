"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FPS = 30;

const SEGMENTS = [
  { src: "/balcony-gym.mp4",     reversed: true  },
  { src: "/balcony-bedroom.mp4", reversed: false },
];

const NUM_SEGMENTS     = SEGMENTS.length;
const DRAG_SENSITIVITY = 1400;

export default function ScrollVideoHero() {
  const wrapRef        = useRef<HTMLDivElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const bitmapsRef    = useRef<ImageBitmap[][]>([]);
  const currentSegRef = useRef(-1);
  const currentIdxRef = useRef(-1);
  const targetSegRef  = useRef(0);
  const targetIdxRef  = useRef(0);

  const virtualPosRef   = useRef(0);
  const isDraggingRef   = useRef(false);
  const dragStartXRef   = useRef(0);
  const dragStartPosRef = useRef(0);
  const jumpRafRef      = useRef<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase]           = useState<"loading" | "ready">("loading");
  const [loadPct, setLoadPct]       = useState(0);

  // ── Pos → target frame ────────────────────────────────────────────────────
  const applyPos = useCallback(() => {
    const bitmaps = bitmapsRef.current;
    if (!bitmaps.length) return;
    const p      = virtualPosRef.current;
    const rawSeg = p * NUM_SEGMENTS;
    const segIdx = Math.min(Math.floor(rawSeg), NUM_SEGMENTS - 1);
    const segP   = Math.min(rawSeg - segIdx, 1);
    const seg    = bitmaps[segIdx];
    if (!seg) return;
    targetSegRef.current = segIdx;
    targetIdxRef.current = Math.round(segP * (seg.length - 1));
  }, []);

  // ── Animated jump to position ─────────────────────────────────────────────
  const animateToPos = useCallback((targetP: number, duration = 1200) => {
    if (jumpRafRef.current !== null) cancelAnimationFrame(jumpRafRef.current);
    const startP    = virtualPosRef.current;
    const dist      = targetP - startP;
    const startTime = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      virtualPosRef.current = startP + dist * ease(progress);
      applyPos();
      if (progress < 1) jumpRafRef.current = requestAnimationFrame(step);
      else jumpRafRef.current = null;
    };
    jumpRafRef.current = requestAnimationFrame(step);
  }, [applyPos]);

  // ── Extract video frames ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const extract = async () => {
      const dpr     = window.devicePixelRatio || 1;
      const targetW = window.innerWidth  * dpr;
      const targetH = window.innerHeight * dpr;

      const makeBitmap = async (
        source: CanvasImageSource,
        srcW: number,
        srcH: number
      ): Promise<ImageBitmap> => {
        const sc = Math.max(targetW / srcW, targetH / srcH);
        const bw = Math.round(srcW * sc);
        const bh = Math.round(srcH * sc);
        const ox = Math.round((bw - targetW) / 2);
        const oy = Math.round((bh - targetH) / 2);
        const off = new OffscreenCanvas(targetW, targetH);
        const ctx = off.getContext("2d") as OffscreenCanvasRenderingContext2D;
        ctx.drawImage(source, -ox, -oy, bw, bh);
        return createImageBitmap(off);
      };

      // extract video frames
      const allBitmaps: ImageBitmap[][] = [];
      for (let s = 0; s < NUM_SEGMENTS; s++) {
        if (cancelled) return;

        const video       = document.createElement("video");
        video.src         = SEGMENTS[s].src;
        video.muted       = true;
        video.playsInline = true;
        video.preload     = "auto";

        await new Promise<void>(r =>
          video.addEventListener("loadedmetadata", () => r(), { once: true })
        );

        const { duration, videoWidth, videoHeight } = video;
        const totalFrames = Math.round(duration * FPS);
        const bitmaps: ImageBitmap[] = [];

        for (let i = 0; i < totalFrames; i++) {
          if (cancelled) return;
          // use i/(totalFrames-1) so first frame=0 and last frame stays
          // just short of duration — avoids the black-frame seek-to-end bug
          video.currentTime = (i / Math.max(totalFrames - 1, 1)) * duration * (1 - 0.5 / totalFrames);
          await new Promise<void>(r => {
            video.addEventListener("seeked", () => r(), { once: true });
            setTimeout(r, 400);
          });
          bitmaps.push(await makeBitmap(video, videoWidth, videoHeight));
          setLoadPct(Math.round(((s + i / (totalFrames - 1)) / NUM_SEGMENTS) * 100));
        }

        if (SEGMENTS[s].reversed) bitmaps.reverse();
        allBitmaps.push(bitmaps);
      }

      bitmapsRef.current = allBitmaps;
      setPhase("ready");
    };

    extract();
    return () => { cancelled = true; };
  }, []);

  // ── Horizontal gestures ───────────────────────────────────────────────────
  useEffect(() => {
    const cancelJump = () => {
      if (jumpRafRef.current !== null) { cancelAnimationFrame(jumpRafRef.current); jumpRafRef.current = null; }
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < 3 && Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 0.4) return;
      e.preventDefault();
      cancelJump();
      virtualPosRef.current = Math.max(0, Math.min(1, virtualPosRef.current + e.deltaX / DRAG_SENSITIVITY));
      applyPos();
    };

    const onMouseDown = (e: MouseEvent) => {
      cancelJump();
      isDraggingRef.current   = true;
      dragStartXRef.current   = e.clientX;
      dragStartPosRef.current = virtualPosRef.current;
      setIsDragging(true);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      virtualPosRef.current = Math.max(0, Math.min(1,
        dragStartPosRef.current + (dragStartXRef.current - e.clientX) / DRAG_SENSITIVITY
      ));
      applyPos();
    };

    const onMouseUp = () => { isDraggingRef.current = false; setIsDragging(false); };

    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.addEventListener("wheel", onWheel, { passive: false });
    wrap.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [applyPos]);

  // ── RAF: draw video frame ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "ready") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr     = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    const ctx     = canvas.getContext("2d")!;

    currentSegRef.current = -1;
    currentIdxRef.current = -1;

    let raf: number;

    const tick = () => {
      const bitmaps = bitmapsRef.current;
      const seg     = targetSegRef.current;
      const idx     = targetIdxRef.current;

      const segChanged = seg !== currentSegRef.current || idx !== currentIdxRef.current;

      if (segChanged) {
        const bitmap = bitmaps[seg]?.[idx];
        if (bitmap) ctx.drawImage(bitmap, 0, 0);

        currentSegRef.current = seg;
        currentIdxRef.current = idx;

        if (progressBarRef.current)
          progressBarRef.current.style.width = `${virtualPosRef.current * 100}%`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        height: "100vh", width: "100%",
        overflow: "hidden", background: "#000",
        cursor: isDragging ? "grabbing" : "ew-resize",
        userSelect: "none",
      }}
    >
      <canvas ref={canvasRef} style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        zIndex: 2,
        opacity: phase === "ready" ? 1 : 0,
        transition: "opacity 0.5s ease",
      }} />

      {phase === "ready" && (
        <NavButtons onJump={animateToPos} />
      )}

      {phase === "loading" && (
        <>
          <div style={{
            position: "absolute", bottom: 0, left: 0, width: "100%", height: "2px",
            zIndex: 10, background: "rgba(255,255,255,0.08)",
          }}>
            <div style={{
              height: "100%", width: `${loadPct}%`,
              background: "rgba(255,255,255,0.55)", transition: "width 0.15s linear",
            }} />
          </div>
          <div style={{
            position: "absolute", bottom: 12, right: 14, zIndex: 11,
            color: "rgba(255,255,255,0.4)", fontSize: "11px", fontFamily: "monospace",
          }}>
            loading {loadPct}%
          </div>
        </>
      )}

      <div style={{
        position: "absolute", bottom: 0, left: 0, width: "100%", height: "2px",
        background: "rgba(255,255,255,0.08)", zIndex: 10,
        opacity: phase === "ready" ? 1 : 0,
      }}>
        <div ref={progressBarRef} style={{ height: "100%", width: "0%", background: "rgba(255,255,255,0.45)" }} />
      </div>
    </div>
  );
}

// ── NavButtons ────────────────────────────────────────────────────────────────
const ZONES = [
  { label: "Спортзал", icon: "/icons/gym.png"     },
  { label: "Балкон",   icon: "/icons/balcony.png" },
  { label: "Спальня",  icon: "/icons/bedroom.png" },
];

function NavButtons({ onJump }: { onJump: (p: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{
      position: "absolute", bottom: 28, left: 28, zIndex: 30,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      {ZONES.map((zone, i) => (
        <div key={i} style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <button
            style={{
              width: 90, height: 90, borderRadius: "50%",
              border: `2px solid ${hovered === i ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)"}`,
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "border-color 0.2s, transform 0.15s",
              transform: hovered === i ? "scale(1.08)" : "scale(1)",
              userSelect: "none", flexShrink: 0, padding: 0, overflow: "hidden",
            }}
            onClick={() => onJump(i / NUM_SEGMENTS)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <img src={zone.icon} alt={zone.label}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </button>
          <span style={{
            position: "absolute", left: 100, top: "50%", transform: "translateY(-50%)",
            whiteSpace: "nowrap",
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)",
            fontSize: 12, fontFamily: "sans-serif", fontWeight: 400,
            letterSpacing: "0.04em", padding: "4px 10px", borderRadius: 6,
            pointerEvents: "none",
            opacity: hovered === i ? 1 : 0, transition: "opacity 0.15s ease",
          }}>{zone.label}</span>
        </div>
      ))}
    </div>
  );
}
