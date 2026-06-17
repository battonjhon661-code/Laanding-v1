"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Preloader from "./Preloader";

const DRAG_SENSITIVITY = 1400;
const AUTO_DELAY = 5000;
const MIN_PRELOADER_MS = 4600; // один полный цикл анимации прелоадера

const INK    = "#f4f1ec";
const DIM    = "rgba(244,241,236,0.46)";
const DIMMER = "rgba(244,241,236,0.30)";
const LINE   = "rgba(244,241,236,0.22)";

const ZONES = [
  { label: "Спальня",   imageSrc: "/locations/bedroom.webp"       },
  { label: "Балкон",    imageSrc: "/locations/balcony.webp"       },
  { label: "Спортзал",  imageSrc: "/locations/gym.webp"           },
  { label: "Бассейн",   imageSrc: "/locations/swimming-pool.webp" },
  { label: "Душевая",   imageSrc: "/locations/shower.webp"        },
  { label: "Кухня",     imageSrc: "/locations/kitchen.webp"       },
  { label: "Прихожая",  imageSrc: "/locations/foeroom.webp"       },
  { label: "Холл",      imageSrc: "/locations/hall.webp"          },
  { label: "Детская",   imageSrc: "/locations/children.webp"      },
  { label: "Ванная",    imageSrc: "/locations/bathroom.webp"      },
];

// transitions[i] = pre-rendered frame sequence between zone[i] and zone[i+1]; null = no transition
const TRANSITIONS: ({ folder: string; frames: number; reversed: boolean } | null)[] = [
  { folder: "balcony-bedroom", frames: 32, reversed: true  }, // Спальня → Балкон
  { folder: "balcony-gym",     frames: 33, reversed: false }, // Балкон → Спортзал
  { folder: "gym-swim",        frames: 32, reversed: false }, // Спортзал → Бассейн
  { folder: "swim-shower",     frames: 32, reversed: false }, // Бассейн → Душевая
  { folder: "shower-kitchen",  frames: 32, reversed: false }, // Душевая → Кухня
  { folder: "kitchen-foeroom", frames: 32, reversed: false }, // Кухня → Прихожая
  { folder: "foeroom-hall",    frames: 32, reversed: false }, // Прихожая → Холл
  { folder: "hall-children",   frames: 32, reversed: false }, // Холл → Детская
  null, // Детская → Ванная
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
  // 5 Кухня
  [
    { left: "54%", top: "48%", label: "Стеклянный фасад" },
    { left: "76%", top: "28%", label: "Полки", tipLeft: true },
  ],
  // 6 Прихожая
  [
    { left: "56%", top: "40%", label: "Зеркало" },
    { left: "76%", top: "62%", label: "Подсветка", tipLeft: true },
  ],
  // 7 Холл
  [
    { left: "30%", top: "42%", label: "Стеклянное ограждение" },
    { left: "82%", top: "56%", label: "Зеркало", tipLeft: true },
  ],
  // 8 Детская
  [
    { left: "56%", top: "44%", label: "Перегородка" },
    { left: "80%", top: "64%", label: "Стекло", tipLeft: true },
  ],
  // 9 Ванная
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

async function bitmapToBlob(bm: ImageBitmap): Promise<Blob> {
  const off = new OffscreenCanvas(bm.width, bm.height);
  (off.getContext("2d") as OffscreenCanvasRenderingContext2D).drawImage(bm, 0, 0);
  return off.convertToBlob({ type: "image/webp", quality: 0.88 });
}

function openFrameDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("vipglass-hero", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("frames");
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<Blob[] | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction("frames").objectStore("frames").get(key);
    req.onsuccess = () => resolve(req.result as Blob[] | undefined);
    req.onerror   = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, key: string, blobs: Blob[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("frames", "readwrite");
    tx.objectStore("frames").put(blobs, key);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

export default function ScrollVideoHero() {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const zoneBitmapsRef  = useRef<(ImageBitmap | null)[]>(Array(N).fill(null));
  const videoFramesRef  = useRef<(ImageBitmap[] | null)[]>(Array(N - 1).fill(null));

  const virtualPosRef      = useRef(0);
  const isDraggingRef      = useRef(false);
  const dragStartXRef      = useRef(0);
  const dragStartYRef      = useRef(0);
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
      const loadStart = performance.now();
      const dpr     = window.devicePixelRatio || 1;
      const targetW = window.innerWidth  * dpr;
      const targetH = window.innerHeight * dpr;

      let db: IDBDatabase | null = null;
      try { db = await openFrameDB(); } catch { /* IDB недоступен */ }

      // Phase 1: fetch all blobs in parallel (fast, network-bound)
      const blobs = await Promise.all(
        ZONES.map(async (zone) => {
          try {
            const resp = await fetch(zone.imageSrc);
            return await resp.blob();
          } catch {
            console.warn("Could not fetch:", zone.imageSrc);
            return null;
          }
        })
      );

      // Phase 2: decode + scale bitmaps (IDB cache → fallback to decode)
      // blob.size входит в ключ кэша, чтобы замена файла на диске сама
      // инвалидировала старый закэшированный кадр.
      let imagesLoaded = 0;
      for (let i = 0; i < N; i++) {
        if (cancelled) return;
        const blob   = blobs[i];
        const imgKey = `img_${ZONES[i].imageSrc}_${blob?.size ?? 0}_${targetW}x${targetH}`;

        if (db) {
          try {
            const cached = await idbGet(db, imgKey);
            if (cached) {
              zoneBitmapsRef.current[i] = await createImageBitmap(cached[0]);
              imagesLoaded++;
              setLoadPct(Math.round((imagesLoaded / N) * 65));
              continue;
            }
          } catch { /* fall through to decode */ }
        }

        if (blob) {
          try {
            const raw = await createImageBitmap(blob);
            const bm  = await makeBitmap(raw, raw.width, raw.height, targetW, targetH);
            raw.close();
            zoneBitmapsRef.current[i] = bm;
            if (db) {
              const dbRef = db;
              bitmapToBlob(bm).then(b => idbPut(dbRef, imgKey, [b])).catch(() => {});
            }
          } catch {
            console.warn("Could not decode:", ZONES[i].imageSrc);
          }
        }
        imagesLoaded++;
        setLoadPct(Math.round((imagesLoaded / N) * 65));
      }

      // Загружает кадры одного перехода: кеш IDB → иначе fetch готовых
      // .webp-кадров (нарезаны заранее ffmpeg'ом в public/hero-frames/).
      const loadTransitionFrames = async (ti: number) => {
        const t = TRANSITIONS[ti];
        if (!t) return;

        const cacheKey = `${t.folder}_${t.frames}_${targetW}x${targetH}`;

        if (db) {
          try {
            const cached = await idbGet(db, cacheKey);
            if (cached) {
              videoFramesRef.current[ti] = await Promise.all(cached.map(b => createImageBitmap(b)));
              return;
            }
          } catch { /* ошибка чтения — извлекаем заново */ }
        }

        const urls = Array.from({ length: t.frames }, (_, f) =>
          `/hero-frames/${t.folder}/f${String(f + 1).padStart(3, "0")}.webp`
        );

        const blobs = await Promise.all(urls.map(async (url) => {
          const resp = await fetch(url);
          return resp.blob();
        }));
        if (cancelled) return;

        const frames = await Promise.all(blobs.map(async (blob) => {
          const raw = await createImageBitmap(blob);
          const bm  = await makeBitmap(raw, raw.width, raw.height, targetW, targetH);
          raw.close();
          return bm;
        }));
        if (cancelled) return;

        if (t.reversed) frames.reverse();
        videoFramesRef.current[ti] = frames;

        // Сохраняем в кеш асинхронно, не блокируя рендер
        if (db) {
          const dbRef = db;
          Promise.all(frames.map(bitmapToBlob))
            .then(blobs => idbPut(dbRef, cacheKey, blobs))
            .catch(() => {});
        }
      };

      // Все переходы нарезаются параллельно во время прелоада — ничего
      // не остаётся на фон, чтобы не конкурировать с пользователем за
      // главный поток сразу после показа сайта.
      const total = TRANSITIONS.length;

      let doneCount = 0;
      await Promise.all(
        Array.from({ length: total }, (_, ti) =>
          loadTransitionFrames(ti).then(() => {
            if (cancelled) return;
            doneCount++;
            setLoadPct(65 + Math.round((doneCount / total) * 35));
          })
        )
      );
      if (cancelled) return;

      const remaining = MIN_PRELOADER_MS - (performance.now() - loadStart);
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
      if (cancelled) return;
      setPhase("ready");
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

    const onTouchStart = (e: TouchEvent) => {
      cancelJump();
      cancelAutoAdvance();
      clearHotspots();
      isDraggingRef.current   = true;
      dragStartXRef.current   = e.touches[0].clientX;
      dragStartYRef.current   = e.touches[0].clientY;
      dragStartPosRef.current = virtualPosRef.current;
      setIsDragging(true);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const dx = dragStartXRef.current - e.touches[0].clientX;
      const dy = dragStartYRef.current - e.touches[0].clientY;
      // Let vertical scroll pass through; only handle clearly horizontal swipes
      if (Math.abs(dy) > Math.abs(dx) * 0.8) return;
      if (Math.abs(dx) < 6) return;
      e.preventDefault();
      virtualPosRef.current = Math.max(0, Math.min(N - 1,
        dragStartPosRef.current + dx / DRAG_SENSITIVITY
      ));
      setActiveZone(Math.round(virtualPosRef.current));
    };

    const onTouchEnd = () => {
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
    wrap.addEventListener("touchstart", onTouchStart, { passive: true });
    wrap.addEventListener("touchmove", onTouchMove, { passive: false });
    wrap.addEventListener("touchend", onTouchEnd);
    return () => {
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      wrap.removeEventListener("touchstart", onTouchStart);
      wrap.removeEventListener("touchmove", onTouchMove);
      wrap.removeEventListener("touchend", onTouchEnd);
      if (wheelEndTimerRef.current) { clearTimeout(wheelEndTimerRef.current); wheelEndTimerRef.current = null; }
    };
  }, [cancelAutoAdvance, clearHotspots]);

  // ── RAF: draw frame — pauses automatically when hero is off-screen ──────────
  useEffect(() => {
    if (phase !== "ready") return;

    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr     = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    const ctx     = canvas.getContext("2d")!;

    let prevBitmap: ImageBitmap | null = null;
    let raf: number | null = null;
    let visible = true;

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

      raf = visible ? requestAnimationFrame(tick) : null;
    };

    const startTick = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) startTick();
    }, { threshold: 0 });
    observer.observe(wrap);
    startTick();

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      observer.disconnect();
    };
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
      {/* LCP placeholder — visible immediately before canvas loads */}
      <img
        src="/locations/bedroom.webp"
        alt=""
        fetchPriority="high"
        style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          objectFit: "cover", zIndex: 1,
          opacity: phase === "ready" ? 0 : 1,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
        }}
      />

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

      <Preloader visible={phase === "loading"} />

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
