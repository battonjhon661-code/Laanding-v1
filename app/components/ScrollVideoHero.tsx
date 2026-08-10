"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Preloader from "./Preloader";
import { scrollToFooterAndPulse } from "./scrollToFooter";

const SWIPE_THRESHOLD_WHEEL = 60;  // px of accumulated wheel deltaX before a zone change triggers
const SWIPE_THRESHOLD_DRAG  = 80;  // px of horizontal drag before release triggers a zone change
const WHEEL_IDLE_RESET_MS   = 220; // reset wheel accumulator after this much silence
const AUTO_DELAY            = 5000;
const MIN_PRELOADER_MS      = 300; // just enough to avoid a flash-of-loader on instant/cached loads
const INTRO_DELAY_MS        = 200;  // pause after preloader before off→bedroom reveal starts
const INTRO_FADE_MS         = 800;  // crossfade duration
const TRANSITION_MS         = 950;  // целевая длительность одиночного перехода (как раньше у animateToPos)
const SNAP_FADE_MS          = 150;  // half-duration of the cross-fade used for distant (2+ zone) jumps — no video
// Source clips run ~4s each. At the old budget (250/260) a 9-room jump squeezed
// each leg to ~330ms, forcing ~12x playbackRate — the decoder can't keep up at
// that speed and it reads as jerky/dropped frames. Raised so even the longest
// chain stays closer to ~7x, which decodes smoothly.
const STEP_INCREMENT_MS     = 500;  // доп. бюджет времени на каждую следующую комнату в цепочке прыжка
const MIN_LEG_MS            = 380;  // пол длительности одного звена цепочки, чтобы не было совсем рывками
const SCRUB_FALLBACK_S      = 1.2;  // assumed duration if video.duration isn't known yet
const PREFETCH_CONCURRENCY  = 2;    // cap on simultaneous background fetch() warm-ups, so a
                                     // long multi-leg jump doesn't flood bandwidth and starve
                                     // the video that's actually loading right now

function easeInOutCubic(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

// ── Chain-wide easing: one accelerate/cruise/decelerate envelope spread
// across the *whole* multi-leg jump, not one per leg — otherwise every leg
// boundary dips back down to a slow speed and reads as a stop at each room.
const FLOOR_V = 0.35; // velocity never drops below this fraction of cruise speed
const SOLO_NORM = 1 / (FLOOR_V + (1 - FLOOR_V) * (2 / Math.PI));

interface LegShape { kind: "solo" | "cruise" | "ease-in" | "ease-out"; rangeStart: number; rangeEnd: number; norm: number }

// Average of `FLOOR_V + (1-FLOOR_V)*sin(p*pi/2)` over p in [a,b] — used so a
// leg covering only part of the ease-in ramp still finishes its own clip
// exactly on time despite running slower than cruise speed.
function avgEaseInVelocity(a: number, b: number): number {
  if (b - a < 1e-6) return FLOOR_V + (1 - FLOOR_V) * Math.sin(a * Math.PI / 2);
  const k = (b - a) * Math.PI / 2;
  const avgSin = (Math.cos(a * Math.PI / 2) - Math.cos(b * Math.PI / 2)) / k;
  return FLOOR_V + (1 - FLOOR_V) * avgSin;
}
function avgEaseOutVelocity(a: number, b: number): number {
  if (b - a < 1e-6) return FLOOR_V + (1 - FLOOR_V) * Math.cos(a * Math.PI / 2);
  const k = (b - a) * Math.PI / 2;
  const avgCos = (Math.sin(b * Math.PI / 2) - Math.sin(a * Math.PI / 2)) / k;
  return FLOOR_V + (1 - FLOOR_V) * avgCos;
}

// Assigns each leg of a `steps`-leg move a role: the first/last legs (up to
// 2 at each end, fewer for short chains) ramp in/out of cruise speed: every
// leg in between holds flat cruise speed with zero internal deceleration —
// so the chain feels like one continuous shot, not N separate clips.
function computeLegShapes(steps: number): LegShape[] {
  if (steps <= 1) return [{ kind: "solo", rangeStart: 0, rangeEnd: 1, norm: SOLO_NORM }];
  const easeLegs = Math.min(2, Math.floor(steps / 2));
  const shapes: LegShape[] = [];
  for (let i = 0; i < steps; i++) {
    if (i < easeLegs) {
      const a = i / easeLegs, b = (i + 1) / easeLegs;
      shapes.push({ kind: "ease-in", rangeStart: a, rangeEnd: b, norm: 1 / avgEaseInVelocity(a, b) });
    } else if (i >= steps - easeLegs) {
      const j = i - (steps - easeLegs);
      const a = j / easeLegs, b = (j + 1) / easeLegs;
      shapes.push({ kind: "ease-out", rangeStart: a, rangeEnd: b, norm: 1 / avgEaseOutVelocity(a, b) });
    } else {
      shapes.push({ kind: "cruise", rangeStart: 0, rangeEnd: 1, norm: 1 });
    }
  }
  return shapes;
}

function legVelocity(shape: LegShape, progress: number): number {
  switch (shape.kind) {
    case "cruise": return 1;
    case "solo": return FLOOR_V + (1 - FLOOR_V) * Math.sin(Math.PI * progress);
    case "ease-in": {
      const g = shape.rangeStart + progress * (shape.rangeEnd - shape.rangeStart);
      return FLOOR_V + (1 - FLOOR_V) * Math.sin(g * Math.PI / 2);
    }
    case "ease-out": {
      const g = shape.rangeStart + progress * (shape.rangeEnd - shape.rangeStart);
      return FLOOR_V + (1 - FLOOR_V) * Math.cos(g * Math.PI / 2);
    }
  }
}

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

// transitions[i] = video between zone[i] and zone[i+1]; null = no video.
// `reversed: true` means the source file's natural playback direction is
// zone[i+1] → zone[i] (so the i → i+1 direction needs the generated
// `-rev.webm` file instead). webm is the primary format (both directions
// available natively); mp4 only exists in the source's natural direction
// and falls back to a manual reverse time-scrub for the other direction.
interface TransitionDef { folder: string; reversed: boolean }
const TRANSITIONS: (TransitionDef | null)[] = [
  { folder: "balcony-bedroom", reversed: true  }, // Спальня ↔ Балкон
  { folder: "balcony-gym",     reversed: false }, // Балкон ↔ Спортзал
  { folder: "gym-swim",        reversed: false }, // Спортзал ↔ Бассейн
  { folder: "swim-shower",     reversed: false }, // Бассейн ↔ Душевая
  { folder: "shower-kitchen",  reversed: false }, // Душевая ↔ Кухня
  { folder: "kitchen-foeroom", reversed: false }, // Кухня ↔ Прихожая
  { folder: "foeroom-hall",    reversed: false }, // Прихожая ↔ Холл
  { folder: "hall-children",   reversed: false }, // Холл ↔ Детская
  { folder: "children-bathroom", reversed: false }, // Детская ↔ Ванная
  { folder: "bathroom-bedroom",  reversed: false }, // Ванная ↔ Спальня (circular)
];

const N = ZONES.length;

interface Hotspot { left: string; top: string; label: string; tipLeft?: boolean; }

const ZONE_HOTSPOTS: Hotspot[][] = [
  // 0 Спальня
  [
    { left: "53%", top: "42%", label: "Неподвижная перегородка" },
    { left: "5%",  top: "38%", label: "Прикроватные зеркала" },
  ],
  // 1 Балкон
  [
    { left: "64%", top: "39%", label: "Стеклянное ограждение" },
    { left: "52%", top: "60%", label: "Стеклянные перила", tipLeft: true },
    { left: "71%", top: "55%", label: "Стеклянные полы", tipLeft: true },
  ],
  // 2 Спортзал
  [
    { left: "38%", top: "40%", label: "Зеркальная стена" },
    { left: "83%", top: "46%", label: "Цельностеклянная перегородка", tipLeft: true },
    { left: "62%", top: "34%", label: "Панорамное остекление", tipLeft: true },
  ],
  // 3 Бассейн
  [
    { left: "14%", top: "35%", label: "Цельностеклянная перегородка" },
    { left: "62%", top: "50%", label: "Остекление сауны", tipLeft: true },
  ],
  // 4 Душевая
  [
    { left: "51%", top: "50%", label: "Душевые двери" },
    { left: "85%", top: "42%", label: "Зеркало с подсветкой в раме", tipLeft: true },
  ],
  // 5 Кухня
  [
    { left: "13%", top: "44%", label: "Витрина" },
    { left: "62%", top: "24%", label: "Стеклянные фасады", tipLeft: true },
    { left: "55%", top: "44%", label: "Кухонный фартук" },
    { left: "83%", top: "76%", label: "Стеклянные столешницы", tipLeft: true },
  ],
  // 6 Прихожая
  [
    { left: "27%", top: "42%", label: "Зеркальное панно" },
    { left: "54%", top: "54%", label: "Loft Ширмы из стекла и зеркал", tipLeft: true },
  ],
  // 7 Холл
  [
    { left: "26%", top: "50%", label: "Стеклянные лестницы" },
    { left: "62%", top: "54%", label: "Loft перегородки из стекла", tipLeft: true },
    { left: "74%", top: "42%", label: "Зеркала в рамах", tipLeft: true },
  ],
  // 8 Детская
  [
    { left: "44%", top: "40%", label: "Рифлёное стекло" },
    { left: "68%", top: "52%", label: "Состаренное зеркало", tipLeft: true },
    { left: "83%", top: "34%", label: "Декоративные зеркала", tipLeft: true },
  ],
  // 9 Ванная
  [
    { left: "39%", top: "37%", label: "Зеркало с подсветкой" },
    { left: "60%", top: "48%", label: "Душевые перегородки", tipLeft: true },
  ],
];

type Direction = "forward" | "backward";

function detectWebmSupport(): boolean {
  if (typeof document === "undefined") return false;
  const v = document.createElement("video");
  return v.canPlayType('video/webm; codecs="vp9"') !== "";
}

// Chapters/HeroText are positioned with inline styles (no CSS classes), so
// the mobile layout switch (thumbnails to a bottom row instead of a right
// column) is driven by this matchMedia hook rather than a media query.
const MOBILE_BREAKPOINT = 768;
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

// Every leg is driven by manually scrubbing `currentTime` (never native
// `.play()`) so we get a precise, non-linear ease-in-out feel and a single
// uniform completion mechanism. `scrubForward` says whether to walk the
// chosen file from 0→duration or duration→0.
interface PlayPlan { src: string; scrubForward: boolean }

// Wait a couple of animation frames after a seek before revealing — one to
// let the seek's frame actually decode and composite, one more as a safety
// margin. `requestVideoFrameCallback` would be the precise tool for this,
// but it proved unreliable for a `video` element sitting at `opacity: 0`
// (registered callbacks would just never fire), so a double rAF — tied to
// the page's regular render loop rather than the video's own compositing
// state — is the more robust choice here.
function onNextPaintedFrame(cb: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(cb));
}

function resolvePlayPlan(t: TransitionDef, direction: Direction, webmOk: boolean): PlayPlan {
  const nativeDirection: Direction = t.reversed ? "backward" : "forward";
  const isNative = direction === nativeDirection;
  if (webmOk) {
    // Both directions have a real forward-recorded file (native + generated
    // `-rev`) — always scrub forward through whichever one matches, which
    // decodes more cheaply than scrubbing backward through either.
    return { src: isNative ? `/${t.folder}.webm` : `/${t.folder}-rev.webm`, scrubForward: true };
  }
  // mp4: only the source's natural direction exists as a real file — the
  // other direction has to scrub backward through it.
  return { src: `/${t.folder}.mp4`, scrubForward: isNative };
}

type BufKey = "A" | "B";

export default function ScrollVideoHero() {
  const isMobile  = useIsMobile();
  const wrapRef   = useRef<HTMLDivElement>(null);
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);

  const mountedRef        = useRef(true);
  const webmOkRef         = useRef(true);
  const activeZoneRef     = useRef(0);
  const transitioningRef  = useRef(false);
  const prefetchedRef     = useRef<Set<string>>(new Set());
  const prefetchQueueRef  = useRef<string[]>([]);
  const prefetchActiveRef = useRef(0);

  const wheelAccumRef     = useRef(0);
  const wheelResetTiRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef     = useRef(false);
  const dragStartXRef     = useRef(0);
  const dragStartYRef     = useRef(0);
  const dragLastXRef      = useRef(0);
  const dragIsHorizRef    = useRef(false);

  const scrubRafRef       = useRef<number | null>(null);
  const autoTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleAutoRef   = useRef<() => void>(() => {});
  const hotspotTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleHsRef     = useRef<() => void>(() => {});
  const finalTargetRef    = useRef<number | null>(null); // ultimate destination of a multi-step chain
  // The legs of the move in progress: `legStepsRef[i]` is the zone arrived
  // at after leg i (leg 0 starts from `startZoneRef`, leg i>0 starts from
  // `legStepsRef[i-1]`). `legShapesRef` is the parallel chain-wide easing
  // role per leg (see computeLegShapes). `legIdxRef` is the leg currently
  // on screen; `armedRef` holds the *next* leg once it's already loaded and
  // quietly playing in the background buffer, ready for an instant handoff.
  const startZoneRef      = useRef(0);
  const legStepsRef       = useRef<number[]>([]);
  const legShapesRef      = useRef<LegShape[]>([]);
  const legIdxRef         = useRef(0);
  const legMsRef          = useRef(TRANSITION_MS); // uniform per-leg duration budget for this move
  const armedRef          = useRef<{ buf: BufKey; video: HTMLVideoElement; legIdx: number } | null>(null);
  // The buffer currently on top (or about to be, mid-reveal). Two <video>
  // elements ping-pong so a multi-leg chain crossfades video→video without
  // ever dropping back to the still image between legs — re-assigning
  // `.src` on a single shared element blacked it out for the buffering gap.
  const activeBufRef      = useRef<BufKey>("B");

  const [isDragging, setIsDragging]     = useState(false);
  const [phase, setPhase]               = useState<"loading" | "ready">("loading");
  const [loadPct, setLoadPct]           = useState(0);
  const [introRevealed, setIntroRevealed] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [activeZone, setActiveZone]     = useState(0);
  // `displayZone` is what the still-image layer actually shows. It's set to
  // the move's *final* destination up front, while that image is still
  // hidden behind the video — so it has the whole move's duration to decode
  // invisibly, and is already correct the instant the video is removed.
  // `activeZone` (above) still updates per-leg for the pager/chapters/hotspots.
  const [displayZone, setDisplayZone]   = useState(0);
  const [videoVisible, setVideoVisible] = useState(false);
  const [activeBuf, setActiveBuf]       = useState<BufKey>("B");
  const [hotspotZone, setHotspotZone]   = useState<number | null>(null);
  // Distant jumps (2+ zones, e.g. clicking a far chapter thumbnail) skip the
  // video chain entirely and just cross-fade the still image straight to the
  // destination — see snapToZone. `snapFading` only enables the CSS
  // transition while a snap is in flight, so it never affects the normal
  // video-reveal hard-cut (see setBufOpacity above).
  const [snapOpacity, setSnapOpacity]   = useState(1);
  const [snapFading, setSnapFading]     = useState(false);

  // v7: when promo overlay signals done, reset hero to zone 0 and replay the
  // intro reveal (off.png → bedroom crossfade + HeroText/Chapters entrance).
  // The intro would have played silently under the promo, so we replay it here
  // so the user actually sees it after the overlay fades.
  useEffect(() => {
    const onPromoDone = () => {
      if (scrubRafRef.current !== null) {
        cancelAnimationFrame(scrubRafRef.current);
        scrubRafRef.current = null;
      }
      if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
      transitioningRef.current = false;
      activeZoneRef.current = 0;
      setActiveZone(0);
      setDisplayZone(0);
      setVideoVisible(false);
      setHotspotZone(null);
      // Reset intro states → triggers re-play of the off.png → bedroom reveal
      // and the HeroText/Chapters fade-in. Auto-advance + hotspot timers will
      // restart automatically via the introComplete effect once the reveal ends.
      setIntroRevealed(false);
      setIntroComplete(false);
    };
    window.addEventListener("vg:v7-promo-done", onPromoDone, { once: true });
    return () => window.removeEventListener("vg:v7-promo-done", onPromoDone);
  }, []);

  const getVideo = useCallback((key: BufKey) => (key === "A" ? videoARef.current : videoBRef.current), []);

  // Writes opacity straight to the DOM, bypassing React's render cycle.
  // Needed because revealAndRun calls prepareLeg() synchronously right after
  // swapping the active buffer — prepareLeg immediately reassigns the
  // *outgoing* buffer's `src`, but React's setState batching means the
  // opacity:0 style for that buffer hasn't actually committed to the DOM
  // yet at that point. Resetting `.src` while the element is still visibly
  // opacity:1 makes the browser flash/reset its decode — the blink during
  // chained legs. Setting it imperatively here closes that race; the
  // subsequent React render then just confirms the same value.
  const setBufOpacity = useCallback((buf: BufKey, opacity: number) => {
    const el = getVideo(buf);
    if (el) el.style.opacity = String(opacity);
  }, [getVideo]);

  // ── Prefetch (HTTP cache warm-up only, no decoding) for the transitions
  // adjacent to a zone, so a real navigation finds the bytes already cached ──
  // Queued with a concurrency cap: firing every leg of a long jump's fetch()
  // at once (the old behavior) competed for bandwidth with the leg that's
  // actually loading right now, which is exactly what made long jumps stutter.
  const pumpPrefetchQueue = useCallback(() => {
    while (prefetchActiveRef.current < PREFETCH_CONCURRENCY && prefetchQueueRef.current.length > 0) {
      const url = prefetchQueueRef.current.shift()!;
      prefetchActiveRef.current++;
      fetch(url).catch(() => {}).finally(() => {
        prefetchActiveRef.current--;
        pumpPrefetchQueue();
      });
    }
  }, []);

  const prefetchUrl = useCallback((url: string) => {
    if (prefetchedRef.current.has(url)) return;
    prefetchedRef.current.add(url);
    prefetchQueueRef.current.push(url);
    pumpPrefetchQueue();
  }, [pumpPrefetchQueue]);

  const prefetchNeighbors = useCallback((zone: number) => {
    const webmOk = webmOkRef.current;
    const tPrev = TRANSITIONS[(zone - 1 + N) % N];
    if (tPrev) prefetchUrl(resolvePlayPlan(tPrev, "backward", webmOk).src);
    const tNext = TRANSITIONS[zone];
    if (tNext) prefetchUrl(resolvePlayPlan(tNext, "forward", webmOk).src);
  }, [prefetchUrl]);

  // ── Hotspot settle/clear ────────────────────────────────────────────────────
  const clearHotspots = useCallback(() => {
    if (hotspotTimerRef.current) { clearTimeout(hotspotTimerRef.current); hotspotTimerRef.current = null; }
    setHotspotZone(null);
  }, []);

  const scheduleHotspots = useCallback(() => {
    if (hotspotTimerRef.current) { clearTimeout(hotspotTimerRef.current); hotspotTimerRef.current = null; }
    hotspotTimerRef.current = setTimeout(() => {
      setHotspotZone(activeZoneRef.current);
    }, 500);
  }, []);

  useEffect(() => { scheduleHsRef.current = scheduleHotspots; }, [scheduleHotspots]);

  // ── Auto-advance every AUTO_DELAY ms of inactivity ──────────────────────────
  const cancelAutoAdvance = useCallback(() => {
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
  }, []);

  // ── Settle on a zone with no transition playing (snap) ──────────────────────
  // `schedule: false` is used for the intermediate legs of a chained
  // multi-step jump — only the leg that actually finishes the chain should
  // restart the auto-advance/hotspot timers.
  const settleAt = useCallback((target: number, schedule = true) => {
    const actual = ((target % N) + N) % N;
    activeZoneRef.current = actual;
    setActiveZone(actual);
    prefetchNeighbors(actual);
    if (schedule) {
      scheduleAutoRef.current();
      scheduleHsRef.current();
    }
  }, [prefetchNeighbors]);

  // ── Distant jump (2+ zones away): no transition video at all, just a quick
  // cross-fade of the still image straight to the destination. Used instead
  // of the per-leg video chain below for far chapter-thumbnail clicks.
  const snapToZone = useCallback((target: number) => {
    cancelAutoAdvance();
    clearHotspots();
    transitioningRef.current = true;
    setSnapFading(true);
    setSnapOpacity(0);
    window.setTimeout(() => {
      if (!mountedRef.current) return;
      setDisplayZone(target);
      setSnapOpacity(1);
      window.setTimeout(() => {
        if (!mountedRef.current) return;
        setSnapFading(false);
        transitioningRef.current = false;
        settleAt(target);
      }, SNAP_FADE_MS);
    }, SNAP_FADE_MS);
  }, [cancelAutoAdvance, clearHotspots, settleAt]);

  const startFreshLegRef = useRef<(idx: number) => void>(() => {});
  const revealAndRunRef  = useRef<(idx: number, stepTarget: number, video: HTMLVideoElement, buf: BufKey) => void>(() => {});

  // ── Finish leg `idx` (which just settled at `justFinishedTarget`) and move
  // the chain on. If the next leg is already armed (loaded + quietly playing
  // in the background, see prepareLeg), hand off to it instantly with zero
  // gap; otherwise fall back to loading it fresh now.
  const advanceChain = useCallback((idx: number, justFinishedTarget: number) => {
    const isLast = idx + 1 >= legStepsRef.current.length;
    settleAt(justFinishedTarget, isLast);

    if (isLast) {
      transitioningRef.current = false;
      finalTargetRef.current = null;
      armedRef.current = null;
      setVideoVisible(false);
      return;
    }

    const nextIdx = idx + 1;
    legIdxRef.current = nextIdx;
    const nextStepTarget = legStepsRef.current[nextIdx];
    const armed = armedRef.current;
    if (armed && armed.legIdx === nextIdx) {
      armedRef.current = null;
      revealAndRunRef.current(nextIdx, nextStepTarget, armed.video, armed.buf);
    } else {
      startFreshLegRef.current(nextIdx);
    }
  }, [settleAt]);

  // ── Quietly load + start playing the *next* leg in the background buffer,
  // well before the current leg needs it, so advanceChain can hard-cut to it
  // with no loading gap. Only for the common native-play path — the rare
  // mp4-backward fallback and no-video legs just load on demand as before.
  const prepareLeg = useCallback((idx: number) => {
    if (idx >= legStepsRef.current.length) return;
    if (armedRef.current && armedRef.current.legIdx === idx) return;
    const current = idx === 0 ? startZoneRef.current : legStepsRef.current[idx - 1];
    const stepTarget = legStepsRef.current[idx];
    const direction: Direction = stepTarget > current ? "forward" : "backward";
    const ti = ((direction === "forward" ? current : stepTarget) + N * N) % N;
    const t = TRANSITIONS[ti];
    if (!t) return;

    const plan = resolvePlayPlan(t, direction, webmOkRef.current);
    if (!plan.scrubForward) return;

    const backBuf = activeBufRef.current === "A" ? "B" : "A";
    const video = getVideo(backBuf);
    if (!video) return;

    video.onended = null;
    video.onloadedmetadata = null;
    video.onplaying = null;
    video.onseeked = null;
    video.onerror = null;
    video.pause();
    video.src = plan.src;

    const start = () => {
      video.currentTime = 0;
      video.playbackRate = 1; // overwritten by revealAndRun's rate loop once it takes over
      video.onplaying = () => {
        video.onplaying = null;
        onNextPaintedFrame(() => {
          if (!mountedRef.current) return;
          armedRef.current = { buf: backBuf, video, legIdx: idx };
        });
      };
      video.play().catch(() => {});
    };
    if (video.readyState >= 1) start();
    else video.onloadedmetadata = start;
  }, [getVideo]);

  // ── Reveal a leg's video (already playing — either just started, or
  // handed off from prepareLeg) and drive its playbackRate for the rest of
  // its duration, following this leg's chain-wide easing role.
  const revealAndRun = useCallback((idx: number, stepTarget: number, video: HTMLVideoElement, buf: BufKey) => {
    if (!mountedRef.current) return;
    // Only safe to touch now — the video already covers the screen, so
    // swapping the still image underneath it is invisible.
    setDisplayZone(finalTargetRef.current ?? (((stepTarget % N) + N) % N));
    activeBufRef.current = buf;
    setActiveBuf(buf);
    setVideoVisible(true);
    setBufOpacity(buf, 1);
    setBufOpacity(buf === "A" ? "B" : "A", 0);

    if (idx + 1 < legStepsRef.current.length) prepareLeg(idx + 1);

    const shape = legShapesRef.current[idx] ?? { kind: "cruise" as const, rangeStart: 0, rangeEnd: 1, norm: 1 };
    const transitionS = legMsRef.current / 1000;
    const duration = video.duration > 0 ? video.duration : SCRUB_FALLBACK_S;
    const baseRate = duration / transitionS;
    const t0 = performance.now();

    const rateStep = (now: number) => {
      if (!mountedRef.current) return;
      const elapsed = (now - t0) / 1000;
      const progress = Math.min(elapsed / transitionS, 1);
      if (progress >= 1) {
        scrubRafRef.current = null;
        advanceChain(idx, stepTarget);
        return;
      }
      const v = legVelocity(shape, progress);
      video.playbackRate = Math.min(Math.max(baseRate * v * shape.norm, 0.05), 16);
      scrubRafRef.current = requestAnimationFrame(rateStep);
    };
    scrubRafRef.current = requestAnimationFrame(rateStep);
  }, [advanceChain, prepareLeg, setBufOpacity]);

  useEffect(() => { revealAndRunRef.current = revealAndRun; }, [revealAndRun]);

  // ── Load leg `idx` completely from scratch (no pre-arming) and reveal it
  // once ready. Used for the first leg of any move, and as a fallback if a
  // later leg's background preparation hasn't finished in time.
  const startFreshLeg = useCallback((idx: number) => {
    const current = idx === 0 ? startZoneRef.current : legStepsRef.current[idx - 1];
    const stepTarget = legStepsRef.current[idx];
    const direction: Direction = stepTarget > current ? "forward" : "backward";
    const ti = ((direction === "forward" ? current : stepTarget) + N * N) % N;
    const t  = TRANSITIONS[ti];

    if (!t) {
      // No video for this hop — snap. If nothing has been revealed yet this
      // move (e.g. this is the very first leg), the image needs to update
      // immediately since there's no video covering it.
      setDisplayZone(finalTargetRef.current ?? (((stepTarget % N) + N) % N));
      advanceChain(idx, stepTarget);
      return;
    }

    const backBuf = activeBufRef.current === "A" ? "B" : "A";
    const video = getVideo(backBuf);
    if (!video) { advanceChain(idx, stepTarget); return; }

    const plan = resolvePlayPlan(t, direction, webmOkRef.current);
    transitioningRef.current = true; // lock interactions right away

    const onError = () => advanceChain(idx, stepTarget);
    video.onended = null;
    video.onloadedmetadata = null;
    video.onloadeddata = null;
    video.onplaying = null;
    video.onseeked = null;
    video.onerror = onError;
    video.pause();
    video.src = plan.src;

    if (plan.scrubForward) {
      const startPlayback = () => {
        video.currentTime = 0;
        video.playbackRate = 1; // overwritten by revealAndRun's rate loop
        video.onplaying = () => {
          video.onplaying = null;
          onNextPaintedFrame(() => revealAndRun(idx, stepTarget, video, backBuf));
        };
        video.play().catch(onError);
      };
      if (video.readyState >= 1) startPlayback();
      else video.onloadedmetadata = startPlayback;
    } else {
      // mp4-only fallback for the direction with no generated reverse file —
      // native playback can't run backward, so this still has to manually
      // scrub `currentTime`. Rare path: only non-webm browsers hit it, and
      // only for one of the two directions per transition. Not pre-armable,
      // so it drives its own loop independently rather than via revealAndRun.
      const runScrub = () => {
        const duration = video.duration > 0 ? video.duration : SCRUB_FALLBACK_S;
        const transitionS = legMsRef.current / 1000;
        let seeking = false;
        let started = false;
        let t0 = 0;
        const step = (now: number) => {
          if (!mountedRef.current) return;
          const elapsed = (now - t0) / 1000;
          const rawProgress = Math.min(elapsed / transitionS, 1);
          const eased = easeInOutCubic(rawProgress);
          const ct = duration * (1 - eased);
          if (rawProgress >= 1) {
            scrubRafRef.current = null;
            advanceChain(idx, stepTarget);
            return;
          }
          if (!seeking) { seeking = true; video.currentTime = ct; }
          scrubRafRef.current = requestAnimationFrame(step);
        };
        video.onseeked = () => {
          seeking = false;
          if (started) return;
          started = true;
          onNextPaintedFrame(() => {
            t0 = performance.now();
            setDisplayZone(finalTargetRef.current ?? (((stepTarget % N) + N) % N));
            activeBufRef.current = backBuf;
            setActiveBuf(backBuf);
            setVideoVisible(true);
            scrubRafRef.current = requestAnimationFrame(step);
          });
        };
        seeking = true;
        video.currentTime = duration;
      };
      if (video.readyState >= 1) runScrub();
      else video.onloadedmetadata = runScrub;
    }
  }, [advanceChain, getVideo, revealAndRun]);

  useEffect(() => { startFreshLegRef.current = startFreshLeg; }, [startFreshLeg]);

  const goToZoneRef = useRef<(target: number) => void>(() => {});

  // ── Move to an adjacent (or distant) zone ───────────────────────────────────
  // Adjacent jumps (1 zone) play the real transition video. Distant jumps
  // (2+ zones, e.g. clicking a far chapter thumbnail) skip video entirely —
  // see snapToZone — rather than chaining through every intermediate clip.
  const goToZone = useCallback((target: number) => {
    if (transitioningRef.current) return;
    const actual = ((target % N) + N) % N;
    const current = activeZoneRef.current;
    if (actual === current) return;

    // Circular distance — prefer the shorter path around the loop.
    const fwdDist = ((actual - current) + N) % N;
    const bwdDist = N - fwdDist;
    const steps = Math.min(fwdDist, bwdDist);

    if (steps >= 2) {
      snapToZone(actual);
      return;
    }

    const dir = fwdDist === 1 ? 1 : -1;

    cancelAutoAdvance();
    clearHotspots();

    // Note: the still image's `displayZone` is intentionally *not* touched
    // here — it only gets pre-set to the move's final zone once a video is
    // already covering the screen (see revealAndRun/startFreshLeg), so the
    // swap is always invisible instead of flashing the new photo before the
    // video appears.

    // Virtual target may exceed [0,N-1] for the circular wrap (zone 9→10 or
    // zone 0→-1); startFreshLeg uses the sign to derive direction, and
    // settleAt/setDisplayZone normalise it back to an actual zone index.
    startZoneRef.current = current;
    legStepsRef.current = [current + dir];
    legShapesRef.current = computeLegShapes(1);
    legIdxRef.current = 0;
    armedRef.current = null;
    finalTargetRef.current = null;
    legMsRef.current = TRANSITION_MS;

    startFreshLeg(0);
  }, [cancelAutoAdvance, clearHotspots, startFreshLeg, snapToZone]);

  useEffect(() => { goToZoneRef.current = goToZone; }, [goToZone]);

  const scheduleAutoAdvance = useCallback(() => {
    cancelAutoAdvance();
    autoTimerRef.current = setTimeout(() => {
      const cur  = activeZoneRef.current;
      const next = (cur + 1) % N;
      goToZoneRef.current(next);
    }, AUTO_DELAY);
  }, [cancelAutoAdvance]);

  useEffect(() => { scheduleAutoRef.current = scheduleAutoAdvance; }, [scheduleAutoAdvance]);

  // ── Loading: just the 10 stills, no video bytes fetched upfront ─────────────
  useEffect(() => {
    let cancelled = false;
    mountedRef.current = true;
    const loadStart = performance.now();

    webmOkRef.current = detectWebmSupport();

    let loaded = 0;
    const promises = ZONES.map((zone) => new Promise<void>((resolve) => {
      const img = new window.Image();
      const done = () => {
        loaded++;
        if (!cancelled) setLoadPct(Math.round((loaded / N) * 100));
        resolve();
      };
      img.onload = done;
      img.onerror = done;
      img.src = zone.imageSrc;
    }));

    const introImg = new Promise<void>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = "/locations/off.png";
    });

    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 8000));
    Promise.race([Promise.all([...promises, introImg]), timeout]).then(async () => {
      if (cancelled) return;
      const remaining = MIN_PRELOADER_MS - (performance.now() - loadStart);
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
      if (cancelled) return;
      setPhase("ready");
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, []);

  // Intro reveal: off.png → bedroom crossfade
  useEffect(() => {
    if (phase !== "ready" || introRevealed) return;
    transitioningRef.current = true;
    const t = setTimeout(() => setIntroRevealed(true), INTRO_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase, introRevealed]);

  useEffect(() => {
    if (!introRevealed || introComplete) return;
    const t = setTimeout(() => {
      setIntroComplete(true);
      transitioningRef.current = false;
    }, INTRO_FADE_MS);
    return () => clearTimeout(t);
  }, [introRevealed, introComplete]);

  // Start auto-advance + prefetch neighbors once intro finishes
  useEffect(() => {
    if (phase === "ready" && introComplete) {
      prefetchNeighbors(0);
      scheduleAutoAdvance();
      scheduleHsRef.current();
    }
    return cancelAutoAdvance;
  }, [phase, introComplete, scheduleAutoAdvance, cancelAutoAdvance, prefetchNeighbors]);

  // ── Interaction: wheel + drag, both as swipe triggers (no scrubbing) ────────
  useEffect(() => {
    const resetWheelAccum = () => { wheelAccumRef.current = 0; };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < 3 && Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 0.4) return;
      e.preventDefault();
      if (wheelResetTiRef.current) clearTimeout(wheelResetTiRef.current);
      wheelResetTiRef.current = setTimeout(resetWheelAccum, WHEEL_IDLE_RESET_MS);

      if (transitioningRef.current) return; // ignore new scroll while a transition plays

      wheelAccumRef.current += e.deltaX;
      if (Math.abs(wheelAccumRef.current) >= SWIPE_THRESHOLD_WHEEL) {
        const dir = wheelAccumRef.current > 0 ? 1 : -1;
        wheelAccumRef.current = 0;
        goToZone(activeZoneRef.current + dir);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (transitioningRef.current) return;
      isDraggingRef.current = true;
      dragStartXRef.current = e.clientX;
      dragLastXRef.current  = e.clientX;
      setIsDragging(true);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      dragLastXRef.current = e.clientX;
    };

    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      const delta = dragStartXRef.current - dragLastXRef.current;
      if (Math.abs(delta) >= SWIPE_THRESHOLD_DRAG) {
        goToZone(activeZoneRef.current + (delta > 0 ? 1 : -1));
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (transitioningRef.current) return;
      isDraggingRef.current = true;
      dragIsHorizRef.current = false;
      dragStartXRef.current = e.touches[0].clientX;
      dragStartYRef.current = e.touches[0].clientY;
      dragLastXRef.current  = e.touches[0].clientX;
      setIsDragging(true);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const dx = dragStartXRef.current - e.touches[0].clientX;
      const dy = dragStartYRef.current - e.touches[0].clientY;
      // Let vertical scroll pass through; only claim clearly horizontal swipes
      if (!dragIsHorizRef.current) {
        if (Math.abs(dy) > Math.abs(dx) * 0.8) return;
        if (Math.abs(dx) < 6) return;
        dragIsHorizRef.current = true;
      }
      e.preventDefault();
      dragLastXRef.current = e.touches[0].clientX;
    };

    const onTouchEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      if (!dragIsHorizRef.current) return;
      const delta = dragStartXRef.current - dragLastXRef.current;
      if (Math.abs(delta) >= SWIPE_THRESHOLD_DRAG) {
        goToZone(activeZoneRef.current + (delta > 0 ? 1 : -1));
      }
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
      if (wheelResetTiRef.current) { clearTimeout(wheelResetTiRef.current); wheelResetTiRef.current = null; }
    };
  }, [goToZone]);

  // ── Cleanup rAF on unmount ────────────────────────────────────────────────
  useEffect(() => () => {
    if (scrubRafRef.current !== null) cancelAnimationFrame(scrubRafRef.current);
  }, []);

  // ── Shared image/video layers (reused in both mobile and desktop branches) ──
  const lcpPlaceholder = (
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
  );

  const stillImage = phase === "ready" && (
    <img
      src={ZONES[displayZone].imageSrc}
      alt=""
      style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        objectFit: "cover", zIndex: 2,
        opacity: videoVisible ? 0 : snapOpacity,
        transition: snapFading ? `opacity ${SNAP_FADE_MS}ms ease` : undefined,
        pointerEvents: "none",
      }}
    />
  );

  const introOverlay = phase === "ready" && !introComplete && (
    <img
      src="/locations/off.png"
      alt=""
      style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        objectFit: "cover", zIndex: 3,
        opacity: introRevealed ? 0 : 1,
        transition: `opacity ${INTRO_FADE_MS}ms ease`,
        pointerEvents: "none",
      }}
    />
  );

  const videoBuffers = phase === "ready" && (
    <>
      <video
        ref={videoARef}
        muted playsInline preload="auto"
        style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          objectFit: "cover", zIndex: 3,
          opacity: videoVisible && activeBuf === "A" ? 1 : 0,
          pointerEvents: "none",
        }}
      />
      <video
        ref={videoBRef}
        muted playsInline preload="auto"
        style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          objectFit: "cover", zIndex: 3,
          opacity: videoVisible && activeBuf === "B" ? 1 : 0,
          pointerEvents: "none",
        }}
      />
    </>
  );

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        height: isMobile ? "auto" : "100vh",
        width: "100%",
        overflow: isMobile ? "visible" : "hidden",
        background: isMobile ? "transparent" : "#0d0e0d",
        cursor: isDragging ? "grabbing" : isMobile ? "default" : "ew-resize",
        userSelect: "none",
        fontFamily: "'Manrope', sans-serif",
        zIndex: isMobile ? 2 : 1,
      } as React.CSSProperties}
    >
      {isMobile ? (
        // ── Mobile: 16:9 video at top + white card below in flow ────────────
        <>
          {/* 16:9 video/image area */}
          <div style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16/9",
            overflow: "hidden",
            background: "#0d0e0d",
          }}>
            {lcpPlaceholder}
            {stillImage}
            {videoBuffers}
            {introOverlay}

            {phase === "ready" && hotspotZone !== null && (
              <ZoneHotspots key={hotspotZone} zone={hotspotZone} isMobile />
            )}



            {/* Dark fill at bottom — shows through white card's top border-radius gaps */}
            <div style={{
              position: "absolute",
              bottom: 0, left: 0, right: 0,
              height: 36,
              background: "linear-gradient(to top, #080908 0%, transparent 100%)",
              zIndex: 5,
              pointerEvents: "none",
            }} />
          </div>

          {/* White card — normal flow below video */}
          <div style={{
            background: "#fff",
            borderRadius: "18px 18px 10px 10px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Thumbnail row — stop propagation so it doesn't conflict with zone-swipe */}
            {phase === "ready" && (
              <div
                onTouchStart={e => e.stopPropagation()}
                onTouchMove={e => e.stopPropagation()}
                onTouchEnd={e => e.stopPropagation()}
              >
                <Chapters activeZone={activeZone} onJump={(i) => goToZone(i)} variant="flow" />
              </div>
            )}


            {/* Pagination dots */}
            {phase === "ready" && (
              <div style={{
                display: "flex", justifyContent: "center", alignItems: "center",
                gap: "4px", padding: "0 0 10px",
              }}>
                {ZONES.map((_, i) => (
                  <div key={i} style={{
                    width: activeZone === i ? "14px" : "5px",
                    height: "5px",
                    borderRadius: "3px",
                    background: activeZone === i ? "#1a1917" : "rgba(26,25,23,0.18)",
                    transition: "width 0.3s ease, background 0.3s ease",
                  }} />
                ))}
              </div>
            )}

            {/* Text + CTA */}
            {phase === "ready" && <HeroText variant="block" visible={introRevealed} />}
          </div>
        </>
      ) : (
        // ── Desktop: full-screen overlay ─────────────────────────────────────
        <>
          {lcpPlaceholder}
          {stillImage}
          {videoBuffers}
          {introOverlay}

          {/* legibility veils */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
            background: "linear-gradient(100deg, rgba(10,11,10,0.55) 0%, rgba(10,11,10,0.30) 26%, rgba(10,11,10,0) 52%)",
          }} />
          <div style={{
            position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
            background: "linear-gradient(to top, rgba(10,11,10,0.55) 0%, rgba(10,11,10,0) 38%)",
          }} />
          <div style={{
            position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
            background: "linear-gradient(to bottom, rgba(10,11,10,0.40) 0%, rgba(10,11,10,0) 16%)",
          }} />

          {phase === "ready" && (
            <>
              <Chapters activeZone={activeZone} onJump={(i) => goToZone(i)} appeared={introRevealed} />
              <HeroText visible={introRevealed} />
              {hotspotZone !== null && (
                <ZoneHotspots key={hotspotZone} zone={hotspotZone} />
              )}
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
        </>
      )}

      <Preloader visible={phase === "loading"} loadPct={loadPct} />
    </div>
  );
}

// ── Chapters: thumbnail card navigation ───────────────────────────────────────
const THUMB_EASE = "cubic-bezier(.2,.8,.2,1)";

function Chapters({
  activeZone,
  onJump,
  variant,
  appeared = true,
}: {
  activeZone: number;
  onJump: (i: number) => void;
  variant?: "flow";
  appeared?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [doneEntering, setDoneEntering] = useState(false);
  const isMobile = useIsMobile();
  const rowRef = useRef<HTMLDivElement>(null);
  const isFlow = variant === "flow";

  useEffect(() => {
    if (!appeared || doneEntering || isFlow || isMobile) return;
    const t = setTimeout(() => setDoneEntering(true), N * 80 + 550);
    return () => clearTimeout(t);
  }, [appeared, doneEntering, isFlow, isMobile]);

  useEffect(() => {
    if (!isMobile && !isFlow) return;
    const row = rowRef.current;
    const btn = row?.children[activeZone] as HTMLElement | undefined;
    if (!row || !btn) return;
    const target = (btn as HTMLElement).offsetLeft - (row.offsetWidth - (btn as HTMLElement).offsetWidth) / 2;
    row.scrollTo({ left: target, behavior: "smooth" });
  }, [isMobile, isFlow, activeZone]);

  return (
    <>
      {isFlow && (
        <style>{`.hero-thumb-row::-webkit-scrollbar { display: none; }`}</style>
      )}
      <div
        ref={rowRef}
        className={isFlow ? "hero-thumb-row" : undefined}
        style={(isFlow ? {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "8px",
          padding: "16px 14px 8px",
          overflowX: "auto",
          background: "transparent",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        } : isMobile ? {
          position: "absolute",
          left: 0, right: 0, bottom: 0, top: "auto", transform: "none",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "8px",
          padding: "10px 14px calc(10px + env(safe-area-inset-bottom, 0px))",
          overflowX: "auto",
          background: "linear-gradient(to top, rgba(10,11,10,0.55) 0%, rgba(10,11,10,0) 100%)",
          zIndex: 30,
        } : {
          position: "absolute",
          right: "clamp(20px, 2.2vw, 38px)",
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(5px, 0.65vh, 8px)",
          padding: "10px",
          zIndex: 30,
        }) as React.CSSProperties}
      >
        {ZONES.map((zone, i) => {
          const active = activeZone === i;
          const hot    = hovered === i;
          const thumbWidth = isFlow ? "72px" : isMobile ? "68px" : ("clamp(90px, 8vw, 124px)" as string);
          const entering = !isFlow && !isMobile && !appeared;
          const cascading = !isFlow && !isMobile && appeared && !doneEntering;
          const entranceDelay = `${i * 0.08}s`;
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: "relative",
                width: thumbWidth,
                aspectRatio: isFlow ? "1/1" : "16/9",
                flexShrink: 0,
                border: "none",
                padding: 0,
                borderRadius: 10,
                overflow: "hidden",
                cursor: "pointer",
                background: "#111",
                boxShadow: active
                  ? isFlow
                    ? "0 0 0 2px rgba(26,25,23,0.75), 0 4px 16px rgba(0,0,0,.18)"
                    : "0 0 0 2px rgba(244,241,236,0.88), 0 16px 40px rgba(0,0,0,.6)"
                  : isFlow
                    ? "0 2px 6px rgba(0,0,0,.1)"
                    : "0 6px 20px rgba(0,0,0,.4)",
                opacity: entering ? 0 : (active ? 1 : hot ? 0.85 : 0.44),
                transform: entering
                  ? "translateX(60px) scale(0.82)"
                  : active ? "scale(1.1)" : hot ? "scale(0.93)" : "scale(0.82)",
                filter: active
                  ? "saturate(1.1) brightness(1.05)"
                  : hot ? "saturate(0.95) brightness(0.9)" : "saturate(0.6) brightness(0.65)",
                transition: entering
                  ? "none"
                  : cascading
                    ? `opacity .55s ${THUMB_EASE} ${entranceDelay}, transform .55s ${THUMB_EASE} ${entranceDelay}, filter .35s ${THUMB_EASE}, box-shadow .35s ${THUMB_EASE}`
                    : `opacity .35s ${THUMB_EASE}, transform .35s ${THUMB_EASE}, filter .35s ${THUMB_EASE}, box-shadow .35s ${THUMB_EASE}`,
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
                padding: isFlow ? "18px 4px 5px" : "14px 3px 4px",
                color: "#fff",
                fontSize: isFlow ? "8px" : "7px",
                lineHeight: 1.1,
                letterSpacing: ".08em",
                textAlign: "center",
                textTransform: "uppercase",
                fontWeight: 500,
                background: "linear-gradient(transparent, rgba(0,0,0,.82))",
                opacity: isFlow ? 1 : (active || hot ? 1 : 0),
                transform: !isFlow && !(active || hot) ? "translateY(5px)" : "translateY(0)",
                transition: `.22s ${THUMB_EASE}`,
                pointerEvents: "none",
              } as React.CSSProperties}>
                {zone.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Scroll to footer + flash messenger buttons ────────────────────────────────
function gotoFooterAndFlash() {
  scrollToFooterAndPulse({ mode: "animate" });
}

// ── Minimal Button (CTA) ─────────────────────────────────────────────────────

function MinimalHeroButton({ onAction, isBlock }: { onAction: () => void; isBlock?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <>
      <style>{`
        @keyframes btnSheen {
          0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(320%) skewX(-18deg); opacity: 0; }
        }
      `}</style>
      <button
        onClick={onAction}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setPressed(false); }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        style={{
          position: "relative",
          overflow: "hidden",
          marginTop: isBlock ? "16px" : ("clamp(22px, 3vh, 36px)" as string),
          appearance: "none",
          display: isBlock ? "flex" : "inline-flex",
          width: isBlock ? "100%" : "auto",
          alignItems: "center",
          justifyContent: "center",
          gap: isBlock ? "16px" : ("clamp(28px, 3vw, 48px)" as string),
          padding: isBlock ? "0 20px" : ("0 clamp(36px, 3.5vw, 52px)" as string),
          height: isBlock ? "56px" : "60px",
          border: "1px solid #171717",
          borderRadius: 14,
          background: pressed ? "#171717" : hovered ? "#292929" : "#171717",
          color: "#ffffff",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: isBlock ? "14px" : ("clamp(10px, .74vw, 12.5px)" as string),
          fontWeight: 650,
          letterSpacing: ".02em",
          whiteSpace: "nowrap" as const,
          boxShadow: pressed
            ? "0 3px 8px rgba(0,0,0,.12)"
            : hovered
            ? "0 9px 22px rgba(0,0,0,.15)"
            : "0 6px 16px rgba(0,0,0,.12)",
          transform: pressed ? "translateY(0)" : hovered ? "translateY(-2px)" : "translateY(0)",
          transition: "transform .16s ease, background-color .16s ease, box-shadow .16s ease",
        } as React.CSSProperties}
      >
        <span style={{
          position: "absolute",
          top: 0, bottom: 0,
          left: 0, width: "45%",
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.22), rgba(255,255,255,0.08), transparent)",
          animation: `btnSheen ${hovered ? "1.6s" : "2.8s"} cubic-bezier(.4,0,.6,1) infinite`,
          pointerEvents: "none",
        } as React.CSSProperties} />
        Хочу обсудить проект
        <svg width="26" height="10" viewBox="0 0 26 10" fill="none">
          <path d="M0 5h24M20 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </>
  );
}

// ── HeroText: overline + h1 + paragraph + CTA ────────────────────────────────
function HeroText({ variant, visible = true }: { variant?: "block"; visible?: boolean } = {}) {
  const isMobile = useIsMobile();
  const isBlock = variant === "block";
  const textInk  = isBlock ? "#1a1917"               : INK;
  const textDim  = isBlock ? "rgba(26,25,23,0.52)"   : DIM;
  const textLine = isBlock ? "rgba(26,25,23,0.22)"   : LINE;
  return (
    <div style={{
      ...(isBlock ? {
        padding: "14px 20px calc(env(safe-area-inset-bottom,0px) + 18px)",
        textAlign: "center" as const,
      } : isMobile ? {
        position: "absolute" as const,
        left: "20px", right: "20px",
        top: "clamp(84px, 13vh, 112px)",
        maxWidth: "none",
        zIndex: 30,
      } : {
        position: "absolute" as const,
        left: "clamp(28px, 3.2vw, 58px)",
        bottom: "clamp(74px, 10vh, 108px)",
        maxWidth: "min(56vw, 740px)",
        zIndex: 30,
      }),
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: "opacity 1.6s cubic-bezier(.25,.1,.25,1), transform 1.6s cubic-bezier(.15,.7,.2,1)",
    } as React.CSSProperties}>

      <div style={{
        fontSize: isMobile ? "10.5px" : ("clamp(10px, .74vw, 12.5px)" as string),
        fontWeight: 500,
        letterSpacing: ".34em",
        textTransform: "uppercase",
        color: textDim,
        marginBottom: isMobile ? "14px" : ("clamp(16px, 2vh, 26px)" as string),
      } as React.CSSProperties}>
        Стекло в архитектуре
      </div>

      <h1 style={{
        margin: 0,
        fontSize: isBlock ? "clamp(19px, 5.6vw, 27px)" : isMobile ? "clamp(26px, 8vw, 36px)" : ("clamp(26px, 2.55vw, 43px)" as string),
        fontWeight: 400,
        lineHeight: 1.16,
        letterSpacing: ".005em",
        textTransform: "uppercase",
        whiteSpace: isMobile ? "normal" : "nowrap",
        color: textInk,
      } as React.CSSProperties}>
        {isBlock ? (
          <>наше Стекло создаёт пространство и уют.</>
        ) : (
          <>Стекло и зеркала, которые<br />идеально подходят вашему интерьеру</>
        )}
      </h1>

      <p style={{
        margin: 0,
        marginTop: isMobile ? "12px" : ("clamp(16px, 2vh, 24px)" as string),
        fontSize: isMobile ? "13px" : ("clamp(13px, 1vw, 16px)" as string),
        fontWeight: 300,
        lineHeight: 1.5,
        color: isBlock ? "rgba(26,25,23,0.65)" : "rgba(244,241,236,0.74)",
        maxWidth: isMobile ? "100%" : "30em",
      } as React.CSSProperties}>
        {isBlock ? (
          <>Современные решения из стекла, заполняющие интерьер светом, воздухом и чистотой.</>
        ) : (
          <>Проектируем, изготавливаем и устанавливаем изделия из стекла и зеркал по вашим размерам. Помогаем сделать пространство светлее, удобнее и визуально современнее.</>
        )}
      </p>

      <MinimalHeroButton onAction={gotoFooterAndFlash} isBlock={isBlock} />
    </div>
  );
}

// ── Zone hotspot overlay ───────────────────────────────────────────────────────
function ZoneHotspots({ zone, isMobile }: { zone: number; isMobile?: boolean }) {
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
          <HotspotDot key={i} hotspot={hs} index={i} isMobile={isMobile} />
        ))}
      </div>
    </>
  );
}

function HotspotDot({ hotspot, index, isMobile }: { hotspot: Hotspot; index: number; isMobile?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const size      = isMobile ? 20 : 34;
  const dotSize   = isMobile ? 6  : 10;
  const labelOff  = isMobile ? 18 : 32;
  const fontSize  = isMobile ? 8  : 11;
  const ltrSpacing = isMobile ? ".16em" : ".22em";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: hotspot.left,
        top: hotspot.top,
        width: size,
        height: size,
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
        width: dotSize, height: dotSize,
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
          ? { right: labelOff, left: "auto", padding: "0 6px 0 0" }
          : { left: labelOff,  right: "auto", padding: "0 0 0 6px" }),
        top: "50%",
        transform: "translateY(-50%)",
        whiteSpace: "nowrap",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize,
        letterSpacing: ltrSpacing,
        color: "#e9e6e0",
        textTransform: "uppercase",
        pointerEvents: "none",
      } as React.CSSProperties}>
        {hotspot.label}
      </span>
    </div>
  );
}
