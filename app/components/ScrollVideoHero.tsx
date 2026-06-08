"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FPS = 30;
const DRAG_SENSITIVITY = 1400;
const AUTO_DELAY = 5000;

const INK    = "#f4f1ec";
const DIM    = "rgba(244,241,236,0.46)";
const DIMMER = "rgba(244,241,236,0.30)";
const LINE   = "rgba(244,241,236,0.22)";

const ZONES = [
  { label: "Спальня",   imageSrc: "/locations/bedroom.png"       },
  { label: "Балкон",    imageSrc: "/locations/balcony.png"       },
  { label: "Спортзал",  imageSrc: "/locations/gym.png"           },
  { label: "Бассейн",   imageSrc: "/locations/swimming-pool.png" },
  { label: "Душевая",   imageSrc: "/locations/shower.png"        },
  { label: "Прихожая",  imageSrc: "/locations/foeroom.png"       },
  { label: "Кухня",     imageSrc: "/locations/kitchen.png"       },
  { label: "Детская",   imageSrc: "/locations/children.png"      },
  { label: "Ванная",    imageSrc: "/locations/bathroom.png"      },
];

// transitions[i] = video between zone[i] and zone[i+1]; null = no video
const TRANSITIONS: ({ src: string; reversed: boolean } | null)[] = [
  { src: "/balcony-bedroom.mp4", reversed: true  }, // Спальня → Балкон
  { src: "/balcony-gym.mp4",     reversed: false }, // Балкон → Спортзал
  null, null, null, null, null, null,
];

const N = ZONES.length;

interface Hotspot { left: string; top: string; label: string; tipLeft?: boolean; }

const ZONE_HOTSPOTS: Hotspot[][] = [
  // 0 Спальня
  [
    { left: "63%", top: "36%", label: "Зеркало" },
    { left: "80%", top: "64%", label: "Подсветка", tipLeft: true },
  ],
  // 1 Балкон
  [
    { left: "56%", top: "52%", label: "Ограждение" },
    { left: "76%", top: "30%", label: "Стекло", tipLeft: true },
  ],
  // 2 Спортзал
  [
    { left: "50%", top: "44%", label: "Зеркальная панель" },
    { left: "78%", top: "64%", label: "Крепления", tipLeft: true },
  ],
  // 3 Бассейн
  [
    { left: "54%", top: "50%", label: "Стеклянный барьер" },
    { left: "74%", top: "28%", label: "Перегородка", tipLeft: true },
  ],
  // 4 Душевая
  [
    { left: "58%", top: "44%", label: "Душевой экран" },
    { left: "78%", top: "68%", label: "Стекло", tipLeft: true },
  ],
  // 5 Прихожая
  [
    { left: "56%", top: "40%", label: "Зеркало" },
    { left: "76%", top: "62%", label: "Подсветка", tipLeft: true },
  ],
  // 6 Кухня
  [
    { left: "54%", top: "48%", label: "Стеклянный фасад" },
    { left: "76%", top: "28%", label: "Полки", tipLeft: true },
  ],
  // 7 Детская
  [
    { left: "56%", top: "44%", label: "Перегородка" },
    { left: "80%", top: "64%", label: "Стекло", tipLeft: true },
  ],
  // 8 Ванная
  [
    { left: "55%", top: "46%", label: "Душевой экран" },
    { left: "74%", top: "26%", label: "Зеркало с подсветкой", tipLeft: true },
  ],
];

async function makeBitmap(
  source: CanvasImageSource,
  srcW: number, srcH: number,
  targetW: number, targetH: number
): Promise<ImageBitmap> {
  const sc = Math.max(targetW / srcW, targetH / srcH);
  const bw = Math.round(srcW * sc);
  const bh = Math.round(srcH * sc);
  const ox = Math.round((bw - targetW) / 2);
  const oy = Math.round((bh - targetH) / 2);
  const off = new OffscreenCanvas(targetW, targetH);
  const ctx = off.getContext("2d") as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(source, -ox, -oy, bw, bh);
  return createImageBitmap(off);
}

export default function ScrollVideoHero() {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const zoneBitmapsRef  = useRef<(ImageBitmap | null)[]>(Array(N).fill(null));
  const videoFramesRef  = useRef<(ImageBitmap[] | null)[]>(Array(N - 1).fill(null));

  const virtualPosRef      = useRef(0);
  const isDraggingRef      = useRef(false);
  const dragStartXRef      = useRef(0);
  const dragStartPosRef    = useRef(0);
  const jumpRafRef         = useRef<number | null>(null);
  const autoTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleAutoRef    = useRef<() => void>(() => {});
  const wheelEndTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hotspotTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleHsRef      = useRef<() => void>(() => {});

  const [isDragging, setIsDragging]   = useState(false);
  const [phase, setPhase]             = useState<"loading" | "ready">("loading");
  const [loadPct, setLoadPct]         = useState(0);
  const [activeZone, setActiveZone]   = useState(0);
  const [hotspotZone, setHotspotZone] = useState<number | null>(null);

  // ── Animate virtualPos to a zone index ──────────────────────────────────────
  const animateToPos = useCallback((target: number, duration = 1200, onDone?: () => void) => {
    if (jumpRafRef.current !== null) { cancelAnimationFrame(jumpRafRef.current); jumpRafRef.current = null; }
    const start = virtualPosRef.current;
    const dist  = target - start;
    if (Math.abs(dist) < 0.001) {
      virtualPosRef.current = target;
      setActiveZone(Math.round(target));
      onDone?.();
      return;
    }
    const t0   = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      virtualPosRef.current = start + dist * ease(p);
      setActiveZone(Math.round(virtualPosRef.current));
      if (p < 1) {
        jumpRafRef.current = requestAnimationFrame(step);
      } else {
        jumpRafRef.current = null;
        virtualPosRef.current = target;
        setActiveZone(Math.round(target));
        onDone?.();
      }
    };
    jumpRafRef.current = requestAnimationFrame(step);
  }, []);

  // ── Hotspot settle/clear ────────────────────────────────────────────────────
  const clearHotspots = useCallback(() => {
    if (hotspotTimerRef.current) { clearTimeout(hotspotTimerRef.current); hotspotTimerRef.current = null; }
    setHotspotZone(null);
  }, []);

  const scheduleHotspots = useCallback(() => {
    if (hotspotTimerRef.current) { clearTimeout(hotspotTimerRef.current); hotspotTimerRef.current = null; }
    hotspotTimerRef.current = setTimeout(() => {
      const v = virtualPosRef.current;
      const r = Math.round(v);
      if (Math.abs(v - r) < 0.05) setHotspotZone(r);
    }, 500);
  }, []);

  useEffect(() => { scheduleHsRef.current = scheduleHotspots; }, [scheduleHotspots]);

  // ── Auto-advance every AUTO_DELAY ms of inactivity ──────────────────────────
  const cancelAutoAdvance = useCallback(() => {
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
  }, []);

  const scheduleAutoAdvance = useCallback(() => {
    cancelAutoAdvance();
    autoTimerRef.current = setTimeout(() => {
      const curZone  = Math.round(virtualPosRef.current);
      const nextZone = (curZone + 1) % N;
      if (nextZone === 0) {
        virtualPosRef.current = 0;
        setActiveZone(0);
        scheduleAutoRef.current();
        scheduleHsRef.current();
      } else {
        animateToPos(nextZone, 1200, () => { scheduleAutoRef.current(); scheduleHsRef.current(); });
      }
    }, AUTO_DELAY);
  }, [cancelAutoAdvance, animateToPos]);

  useEffect(() => { scheduleAutoRef.current = scheduleAutoAdvance; }, [scheduleAutoAdvance]);

  // ── Loading: images then video transitions ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const dpr     = window.devicePixelRatio || 1;
      const targetW = window.innerWidth  * dpr;
      const targetH = window.innerHeight * dpr;

      let imagesLoaded = 0;
      await Promise.all(
        ZONES.map(async (zone, i) => {
          if (cancelled) return;
          try {
            const resp = await fetch(zone.imageSrc);
            const blob = await resp.blob();
            const img  = await createImageBitmap(blob);
            zoneBitmapsRef.current[i] = await makeBitmap(img, img.width, img.height, targetW, targetH);
          } catch {
            console.warn("Could not load:", zone.imageSrc);
          }
          imagesLoaded++;
          setLoadPct(Math.round((imagesLoaded / N) * 65));
        })
      );

      const videoCount = TRANSITIONS.filter(Boolean).length;
      let videosDone   = 0;

      for (let ti = 0; ti < TRANSITIONS.length; ti++) {
        if (cancelled) return;
        const t = TRANSITIONS[ti];
        if (!t) continue;

        const video       = document.createElement("video");
        video.src         = t.src;
        video.muted       = true;
        video.playsInline = true;
        video.preload     = "auto";

        await new Promise<void>(r =>
          video.addEventListener("loadedmetadata", () => r(), { once: true })
        );

        const { duration, videoWidth, videoHeight } = video;
        const totalFrames = Math.round(duration * FPS);
        const frames: ImageBitmap[] = [];

        for (let f = 0; f < totalFrames; f++) {
          if (cancelled) return;
          video.currentTime =
            (f / Math.max(totalFrames - 1, 1)) * duration * (1 - 0.5 / totalFrames);
          await new Promise<void>(r => {
            video.addEventListener("seeked", () => r(), { once: true });
            setTimeout(r, 400);
          });
          frames.push(await makeBitmap(video, videoWidth, videoHeight, targetW, targetH));

          const vProg = (videosDone + f / Math.max(totalFrames - 1, 1)) / videoCount;
          setLoadPct(65 + Math.round(vProg * 35));
        }

        if (t.reversed) frames.reverse();
        videoFramesRef.current[ti] = frames;
        videosDone++;
      }

      if (!cancelled) setPhase("ready");
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // Start auto-advance once loaded
  useEffect(() => {
    if (phase === "ready") { scheduleAutoAdvance(); scheduleHsRef.current(); }
    return cancelAutoAdvance;
  }, [phase, scheduleAutoAdvance, cancelAutoAdvance]);


  // ── Interaction: wheel + drag ────────────────────────────────────────────────
  useEffect(() => {
    const cancelJump = () => {
      if (jumpRafRef.current !== null) { cancelAnimationFrame(jumpRafRef.current); jumpRafRef.current = null; }
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < 3 && Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 0.4) return;
      e.preventDefault();
      cancelJump();
      cancelAutoAdvance();
      clearHotspots();
      virtualPosRef.current = Math.max(0, Math.min(N - 1,
        virtualPosRef.current + e.deltaX / DRAG_SENSITIVITY
      ));
      setActiveZone(Math.round(virtualPosRef.current));
      if (wheelEndTimerRef.current) clearTimeout(wheelEndTimerRef.current);
      wheelEndTimerRef.current = setTimeout(() => { scheduleAutoRef.current(); scheduleHsRef.current(); }, 200);
    };

    const onMouseDown = (e: MouseEvent) => {
      cancelJump();
      cancelAutoAdvance();
      clearHotspots();
      isDraggingRef.current   = true;
      dragStartXRef.current   = e.clientX;
      dragStartPosRef.current = virtualPosRef.current;
      setIsDragging(true);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      virtualPosRef.current = Math.max(0, Math.min(N - 1,
        dragStartPosRef.current + (dragStartXRef.current - e.clientX) / DRAG_SENSITIVITY
      ));
      setActiveZone(Math.round(virtualPosRef.current));
    };

    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      scheduleAutoRef.current();
      scheduleHsRef.current();
    };

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
      if (wheelEndTimerRef.current) { clearTimeout(wheelEndTimerRef.current); wheelEndTimerRef.current = null; }
    };
  }, [cancelAutoAdvance, clearHotspots]);

  // ── RAF: draw frame ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "ready") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr     = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    const ctx     = canvas.getContext("2d")!;

    let prevBitmap: ImageBitmap | null = null;
    let raf: number;

    const tick = () => {
      const pos       = virtualPosRef.current;
      const zoneFloor = Math.min(Math.floor(pos), N - 2);
      const frac      = pos - Math.floor(pos);

      let bitmap: ImageBitmap | null = null;

      if (pos >= N - 1) {
        bitmap = zoneBitmapsRef.current[N - 1];
      } else if (frac > 0 && TRANSITIONS[zoneFloor] !== null) {
        const frames = videoFramesRef.current[zoneFloor];
        if (frames && frames.length > 0) {
          const fi = Math.min(Math.round(frac * (frames.length - 1)), frames.length - 1);
          bitmap = frames[fi];
        } else {
          bitmap = zoneBitmapsRef.current[zoneFloor];
        }
      } else {
        const snapIdx = frac >= 0.5 ? zoneFloor + 1 : zoneFloor;
        bitmap = zoneBitmapsRef.current[Math.min(snapIdx, N - 1)];
      }

      if (bitmap && bitmap !== prevBitmap) {
        ctx.drawImage(bitmap, 0, 0);
        prevBitmap = bitmap;
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
        overflow: "hidden", background: "#0d0e0d",
        cursor: isDragging ? "grabbing" : "ew-resize",
        userSelect: "none",
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      {/* canvas */}
      <canvas ref={canvasRef} style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        zIndex: 2,
        opacity: phase === "ready" ? 1 : 0,
        transition: "opacity 0.5s ease",
      }} />

      {/* legibility veils */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
        background: "linear-gradient(100deg, rgba(10,11,10,0.55) 0%, rgba(10,11,10,0.30) 26%, rgba(10,11,10,0) 52%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
        background: "linear-gradient(to top, rgba(10,11,10,0.55) 0%, rgba(10,11,10,0) 38%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(10,11,10,0.40) 0%, rgba(10,11,10,0) 16%)",
      }} />

      {phase === "ready" && (
        <>
          <Chapters
            activeZone={activeZone}
            onJump={(i) => {
              cancelAutoAdvance();
              clearHotspots();
              animateToPos(i, 1200, () => { scheduleAutoRef.current(); scheduleHsRef.current(); });
            }}
          />

          <HeroText />

          {/* zone hotspots */}
          {hotspotZone !== null && (
            <ZoneHotspots key={hotspotZone} zone={hotspotZone} />
          )}

          {/* pager */}
          <div style={{
            position: "absolute",
            right: "clamp(28px, 3.2vw, 58px)",
            bottom: "clamp(26px, 3vh, 40px)",
            fontSize: "clamp(13px, 1vw, 17px)" as string,
            fontWeight: 500,
            letterSpacing: ".18em",
            color: DIMMER,
            zIndex: 30,
          } as React.CSSProperties}>
            <b style={{ fontWeight: 600, color: INK }}>
              {String(activeZone + 1).padStart(2, "0")}
            </b>
            {" "}
            <span style={{ opacity: 0.6 }}>/ {String(N).padStart(2, "0")}</span>
          </div>
        </>
      )}

      {/* loading bar */}
      {phase === "loading" && (
        <>
          <div style={{
            position: "absolute", bottom: 0, left: 0, width: "100%", height: "2px",
            zIndex: 10, background: "rgba(255,255,255,0.08)",
          }}>
            <div style={{
              height: "100%", width: `${loadPct}%`,
              background: "rgba(255,255,255,0.45)", transition: "width 0.15s linear",
            }} />
          </div>
          <div style={{
            position: "absolute", bottom: 12, right: 14, zIndex: 11,
            color: "rgba(255,255,255,0.35)", fontSize: "11px", fontFamily: "monospace",
          }}>
            {loadPct}%
          </div>
        </>
      )}
    </div>
  );
}

// ── Chapters: thumbnail card navigation ───────────────────────────────────────
const THUMB_EASE = "cubic-bezier(.2,.8,.2,1)";

function Chapters({
  activeZone,
  onJump,
}: {
  activeZone: number;
  onJump: (i: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{
      position: "absolute",
      right: "clamp(20px, 2.2vw, 38px)" as string,
      top: "50%",
      transform: "translateY(-50%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "clamp(5px, 0.65vh, 8px)" as string,
      padding: "10px",
      zIndex: 30,
    } as React.CSSProperties}>

      {/* backdrop */}
      <div style={{
        position: "absolute",
        inset: "-18px -14px",
        borderRadius: 32,
        background: "rgba(5,7,9,0.12)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
        zIndex: -1,
        pointerEvents: "none",
      } as React.CSSProperties} />

      {ZONES.map((zone, i) => {
        const active = activeZone === i;
        const hot    = hovered === i;
        return (
          <button
            key={i}
            onClick={() => onJump(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "relative",
              width: "clamp(90px, 8vw, 124px)" as string,
              aspectRatio: "16/9",
              flexShrink: 0,
              border: "none",
              padding: 0,
              borderRadius: 10,
              overflow: "hidden",
              cursor: "pointer",
              background: "#111",
              boxShadow: active
                ? "0 0 0 2px rgba(244,241,236,0.88), 0 16px 40px rgba(0,0,0,.6)"
                : "0 6px 20px rgba(0,0,0,.4)",
              opacity: active ? 1 : hot ? 0.85 : 0.44,
              transform: active ? "scale(1.1)" : hot ? "scale(0.93)" : "scale(0.82)",
              filter: active
                ? "saturate(1.1) brightness(1.05)"
                : hot ? "saturate(0.95) brightness(0.9)" : "saturate(0.6) brightness(0.65)",
              transition: `opacity .35s ${THUMB_EASE}, transform .35s ${THUMB_EASE}, filter .35s ${THUMB_EASE}, box-shadow .35s ${THUMB_EASE}`,
              fontFamily: "inherit",
            } as React.CSSProperties}
          >
            <img
              src={zone.imageSrc}
              alt={zone.label}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <span style={{
              position: "absolute",
              left: 0, right: 0, bottom: 0,
              padding: "14px 3px 4px",
              color: "#fff",
              fontSize: "7px",
              lineHeight: 1.1,
              letterSpacing: ".05em",
              textAlign: "center",
              textTransform: "uppercase",
              background: "linear-gradient(transparent, rgba(0,0,0,.8))",
              opacity: active || hot ? 1 : 0,
              transform: active || hot ? "translateY(0)" : "translateY(5px)",
              transition: `.22s ${THUMB_EASE}`,
              pointerEvents: "none",
            } as React.CSSProperties}>
              {zone.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── HeroText: overline + h1 + paragraph + CTA ────────────────────────────────
function HeroText() {
  return (
    <div style={{
      position: "absolute",
      left:   "clamp(28px, 3.2vw, 58px)" as string,
      bottom: "clamp(74px, 10vh, 108px)" as string,
      maxWidth: "min(56vw, 740px)" as string,
      zIndex: 30,
    } as React.CSSProperties}>

      <div style={{
        fontSize: "clamp(10px, .74vw, 12.5px)" as string,
        fontWeight: 500,
        letterSpacing: ".34em",
        textTransform: "uppercase",
        color: DIM,
        marginBottom: "clamp(16px, 2vh, 26px)" as string,
      } as React.CSSProperties}>
        Стекло в архитектуре
      </div>

      <h1 style={{
        margin: 0,
        fontSize: "clamp(26px, 2.55vw, 43px)" as string,
        fontWeight: 400,
        lineHeight: 1.16,
        letterSpacing: ".005em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        color: INK,
      } as React.CSSProperties}>
        Прозрачность,<br />которая создаёт пространство
      </h1>

      <p style={{
        margin: 0,
        marginTop: "clamp(16px, 2vh, 24px)" as string,
        fontSize: "clamp(13px, 1vw, 16px)" as string,
        fontWeight: 300,
        lineHeight: 1.6,
        color: "rgba(244,241,236,0.74)",
        maxWidth: "30em",
      } as React.CSSProperties}>
        Интерьерное стекло премиум-качества для архитектуры,<br />в которой важна каждая деталь.
      </p>

      <button style={{
        marginTop: "clamp(22px, 3vh, 36px)" as string,
        display: "inline-flex",
        alignItems: "center",
        gap: "clamp(28px, 3vw, 48px)" as string,
        padding: "clamp(13px, 1.5vh, 18px) clamp(22px, 2vw, 30px)" as string,
        border: `1px solid ${LINE}`,
        borderRadius: 100,
        background: "rgba(244,241,236,0.02)",
        backdropFilter: "blur(2px)",
        color: INK,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "clamp(10px, .74vw, 12.5px)" as string,
        fontWeight: 500,
        letterSpacing: ".22em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      } as React.CSSProperties}>
        Смотреть проекты
        <svg width="26" height="10" viewBox="0 0 26 10" fill="none">
          <path d="M0 5h24M20 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </div>
  );
}

// ── Zone hotspot overlay ───────────────────────────────────────────────────────
function ZoneHotspots({ zone }: { zone: number }) {
  const hotspots = ZONE_HOTSPOTS[zone] ?? [];
  return (
    <>
      <style>{`
        @keyframes hsPopIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.15); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes hsPing {
          0%   { transform: scale(0.9); opacity: 0.75; }
          100% { transform: scale(1.65); opacity: 0; }
        }
      `}</style>
      <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
        {hotspots.map((hs, i) => (
          <HotspotDot key={i} hotspot={hs} index={i} />
        ))}
      </div>
    </>
  );
}

function HotspotDot({ hotspot, index }: { hotspot: Hotspot; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: hotspot.left,
        top: hotspot.top,
        width: 34,
        height: 34,
        borderRadius: "50%",
        border: `1px solid ${hovered ? "oklch(0.78 0.06 70)" : "rgba(233,230,224,.55)"}`,
        background: hovered ? "rgba(255,238,210,.08)" : "rgba(255,255,255,.04)",
        pointerEvents: "auto",
        cursor: "pointer",
        animation: `hsPopIn 0.45s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.18}s both`,
        transition: "border-color .25s ease, background .25s ease",
        zIndex: 10,
      } as React.CSSProperties}
    >
      {/* inner dot */}
      <div style={{
        position: "absolute",
        width: 10, height: 10,
        borderRadius: "50%",
        background: "#e9e6e0",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }} />

      {/* ping ring on hover */}
      {hovered && (
        <div style={{
          position: "absolute",
          inset: -6,
          borderRadius: "50%",
          border: "1px solid oklch(0.78 0.06 70 / .35)",
          animation: "hsPing 1.6s ease-out infinite",
          pointerEvents: "none",
        }} />
      )}

      {/* label */}
      <span style={{
        position: "absolute",
        ...(hotspot.tipLeft
          ? { right: 32, left: "auto", padding: "0 8px 0 0" }
          : { left: 32,  right: "auto", padding: "0 0 0 8px" }),
        top: "50%",
        transform: "translateY(-50%)",
        whiteSpace: "nowrap",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: ".22em",
        color: "#e9e6e0",
        textTransform: "uppercase",
        pointerEvents: "none",
      } as React.CSSProperties}>
        {hotspot.label}
      </span>
    </div>
  );
}
