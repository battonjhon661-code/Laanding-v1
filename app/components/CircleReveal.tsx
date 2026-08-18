"use client";
import { useEffect, useRef, ReactNode } from "react";
import { useFlatLayout, useSiteVersion, useIsMobile } from "./useFlatLayout";
import { createGLMorph, GLMorph } from "./glMorph";

const TEX_EXAMPLES = "/background-examples.png";
const TEX_MIRROR = "/assets/background-5.webp";

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
function easeOutCubic(v: number) {
  return 1 - Math.pow(1 - v, 3);
}
function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export default function CircleReveal({
  darkHtml,
  mirrorHtml,
  wardrobeContent,
  footerHtml = "",
  children,
}: {
  darkHtml: string;
  mirrorHtml?: string;
  wardrobeContent?: ReactNode;
  footerHtml?: string;
  children: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const exContentRef = useRef<HTMLDivElement>(null);
  const mirrorTitleRef = useRef<HTMLDivElement>(null);
  const mirrorWipeRef = useRef<HTMLDivElement>(null);
  // v6 sunburst refs
  const v6WhiteRef  = useRef<HTMLDivElement>(null);
  const v6MirrorRef = useRef<HTMLDivElement>(null);
  // v6 split refs (slide2 → examples)
  const v6SplitLRef  = useRef<HTMLDivElement>(null);
  const v6SplitRRef  = useRef<HTMLDivElement>(null);
  const v6CrackRef   = useRef<HTMLDivElement>(null);
  const v6Slide2Ref  = useRef<HTMLDivElement>(null);
  const v6VideoRef   = useRef<HTMLVideoElement>(null);
  // true после того как разрез slide2→примеры завершился; sunburst ждёт этого флага
  const splitCompletedRef = useRef(false);
  // v7 refs (old — kept to avoid null errors, replaced by new refs below)
  const v7WhiteRef     = useRef<HTMLDivElement>(null);
  const v7VideoRef     = useRef<HTMLVideoElement>(null);
  const v7ExContentRef = useRef<HTMLDivElement>(null);
  // v7 refs (new promo-reel)
  const v7WardrobeRef   = useRef<HTMLDivElement>(null);
  const v7Video1Ref     = useRef<HTMLVideoElement>(null);
  const v7Video2Ref     = useRef<HTMLVideoElement>(null);
  const v7MirrorBgRef   = useRef<HTMLDivElement>(null);
  const v7ProjectsRef   = useRef<HTMLDivElement>(null);
  const v7ExRef         = useRef<HTMLDivElement>(null);
  const v7FooterZoneRef = useRef<HTMLDivElement>(null);
  const isFlat = useFlatLayout();
  const isMobile = useIsMobile();
  const version = useSiteVersion();
  // Вариант 2: следующий слайд открывается кругом из центра, а не полосой.
  const isCircle = version === "4";
  const isShutter = version === "3";
  // Вариант 1: «наше стекло» → «примеры» через параллакс + размытие + WebGL-морф.
  const isParallax = version === "1" || version === "7" || version === "8";
  // Вариант 7/8: «наше стекло» → «примеры» через видео-переход (v7-1.mp4).
  const isV7 = (version === "7" || version === "8") && !isMobile;
  // Вариант 0: «наше стекло» затемняется в чёрный экран, из него проявляются «Примеры работ».
  const isFade = version === "2";
  // Вариант 6: примеры исчезают → фон кроссфейдит в noglass → белый круг из солнца → зеркало.
  const isV6 = version === "6" && !isMobile;

  // ── Обычный переход (clip / круг) — варианты 1,3,4 ──────────────
  useEffect(() => {
    if (isFlat || isFade || isParallax || isCircle || isV6) return;
    const stage = stageRef.current;
    const light = lightRef.current;
    const dark = darkRef.current;
    if (!stage || !light || !dark) return;

    let ticking = false;

    function update() {
      const rect = stage!.getBoundingClientRect();
      const offsetPx = window.innerHeight * 2;
      const totalScroll = stage!.offsetHeight - window.innerHeight;
      const scrollable = isShutter ? window.innerHeight * 1.6 : totalScroll - offsetPx;
      if (scrollable <= 0) { ticking = false; return; }

      const scrolled = Math.max(0, -rect.top - offsetPx);
      const raw = clamp(scrolled / scrollable, 0, 1);
      const eased = easeOutCubic(raw);

      if (isShutter) {
        const panelLines = smoothstep(0.035, 0.2, raw) * (1 - eased) * 0.56;
        stage!.style.setProperty("--cr-shutter-p", eased.toFixed(4));
        stage!.style.setProperty("--cr-panel-visible", `${((1 - eased) * 12.5).toFixed(3)}vw`);
        stage!.style.setProperty("--cr-panel-lines", panelLines.toFixed(4));
        light!.style.clipPath = "none";
        light!.style.opacity = smoothstep(0.05, 0.42, raw).toFixed(3);
        light!.style.transform = `scale(${(0.985 + eased * 0.015).toFixed(4)})`;
        dark!.style.opacity = (1 - raw * 0.38).toFixed(4);
        dark!.style.transform = `translate3d(0, ${(-eased * 18).toFixed(1)}px, 0) scale(${(1 + eased * 0.025).toFixed(4)})`;
      } else if (isCircle) {
        // Круг разрастается из центра. 72% радиуса хватает, чтобы накрыть углы
        // (в CSS процент считается от диагонали, поделённой на √2).
        light!.style.clipPath = `circle(${(eased * 72).toFixed(2)}% at 50% 50%)`;
      } else {
        const topInset = (1 - eased) * 100;
        light!.style.clipPath = `inset(${topInset.toFixed(2)}% 0 0 0)`;
      }
      light!.style.pointerEvents = raw > 0.85 ? "auto" : "none";
      if (!isShutter) dark!.style.opacity = (1 - raw * 0.5).toFixed(4);
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      stage.style.removeProperty("--cr-shutter-p");
      stage.style.removeProperty("--cr-panel-visible");
      stage.style.removeProperty("--cr-panel-lines");
      light.style.opacity = "";
      light.style.transform = "";
      light.style.clipPath = "";
      dark.style.opacity = "";
      dark.style.transform = "";
    };
  }, [isFlat, isCircle, isFade, isShutter, isParallax]);

  // ── Вариант 2: круг «наше стекло»→«примеры», затем «примеры»→«зеркала»
  //    вертикальной шторой снизу (тот же inset-переход, что «наше стекло»→
  //    «примеры» в варианте 1).
  useEffect(() => {
    if (isFlat || !isCircle) return;
    const stage = stageRef.current;
    const dark = darkRef.current;
    const light = lightRef.current;
    const mirrorWipe = mirrorWipeRef.current;
    if (!stage || !dark || !light) return;

    // Заголовок/фон зеркал уже «раскрыты» внутри оверлея; шторим сам оверлей.
    mirrorWipe?.querySelector(".mirror-section")?.classList.add("mirror-visible");

    let ticking = false;
    function update() {
      ticking = false;
      const rect = stage!.getBoundingClientRect();
      const vh = window.innerHeight;
      const offsetPx = vh * 1.0;
      const totalScroll = stage!.offsetHeight - vh;
      const range = totalScroll - offsetPx - vh * 0.5;
      if (range <= 0) return;
      const scrolled = Math.max(0, -rect.top - offsetPx);
      const t = clamp(scrolled / range, 0, 1);

      // Фаза 1 (t 0→0.4): «наше стекло» → «примеры» кругом из центра.
      const p1 = clamp(t / 0.4, 0, 1);
      const e1 = easeOutCubic(p1);
      light!.style.clipPath = p1 >= 1 ? "none" : `circle(${(e1 * 72).toFixed(2)}% at 50% 50%)`;
      dark!.style.opacity = (1 - p1 * 0.5).toFixed(4);

      // Фаза 2 (t 0.5→0.9): «примеры» → «зеркала» шторой снизу (inset).
      const p2 = clamp((t - 0.5) / 0.4, 0, 1);
      const e2 = easeOutCubic(p2);
      if (mirrorWipe) {
        mirrorWipe.style.clipPath = `inset(${((1 - e2) * 100).toFixed(2)}% 0 0 0)`;
        mirrorWipe.style.pointerEvents = p2 > 0.9 ? "auto" : "none";
      }
      light!.style.pointerEvents = p1 > 0.85 && p2 < 0.05 ? "auto" : "none";
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      light.style.clipPath = "";
      light.style.pointerEvents = "";
      dark.style.opacity = "";
      if (mirrorWipe) { mirrorWipe.style.clipPath = ""; mirrorWipe.style.pointerEvents = ""; }
    };
  }, [isFlat, isCircle]);

  // ── Вариант 7: видео-переходы «наше стекло»→«примеры» (v7-1.mp4) и
  //    «примеры»→«зеркало» (v7-2.mp4).
  // Первый скролл вниз: v7-1.mp4 → примеры.
  // Второй скролл вниз (после примеров): v7-2.mp4 → зеркало.
  useEffect(() => {
    if (isFlat || !isV7) return;
    const stage  = stageRef.current;
    const dark   = darkRef.current;
    const light  = lightRef.current;
    const video  = v7Video1Ref.current;
    const video2  = v7Video2Ref.current;
    const mirrorBg = v7MirrorBgRef.current;
    if (!stage || !dark || !light) return;

    light.style.clipPath      = "none";
    light.style.transform     = "none"; // override cr-stage--parallax scale(1.06)
    light.style.opacity       = "0";
    light.style.pointerEvents = "none";
    dark.style.opacity        = "1";

    let revealed        = false;
    let animating       = false;
    let mirrorRevealed  = false;
    let phase2Animating = false;
    let settling        = false;
    let settleTimer     = 0;

    const ss = (v: number) => v * v * (3 - 2 * v);

    const revealExamples = () => {
      if (revealed) return;
      revealed = true;
      light!.querySelector(".exs-prod-section")?.dispatchEvent(new CustomEvent("vg:examples-reveal"));

      const FADE_MS = 500;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / FADE_MS);
        const e = ss(p);
        light!.style.opacity = e.toFixed(3);
        if (video) video.style.opacity = (1 - e).toFixed(3);
        if (p < 1) { requestAnimationFrame(tick); return; }
        light!.style.pointerEvents = "auto";
        if (video) { video.pause(); video.style.display = "none"; video.style.opacity = ""; }
      };
      requestAnimationFrame(tick);
    };

    const revealMirror = () => {
      if (mirrorRevealed) return;
      mirrorRevealed = true;
      const mirrorTitleEl = mirrorTitleRef.current;
      const exContent = exContentRef.current;

      const mirSection = mirrorTitleEl?.querySelector(".mirror-section") as HTMLElement | null;
      if (mirSection) mirSection.classList.add("mirror-visible", "vg-mirror-bg-instant");

      const FADE_MS = 600;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / FADE_MS);
        const e = ss(p);
        if (exContent) exContent.style.opacity = (1 - e).toFixed(3);
        if (video2) video2.style.opacity = (1 - e).toFixed(3);
        if (mirrorTitleEl) mirrorTitleEl.style.opacity = e.toFixed(3);
        if (p < 1) { requestAnimationFrame(tick); return; }
        if (video2) { video2.pause(); video2.style.display = "none"; video2.style.opacity = ""; }
        if (mirrorBg) mirrorBg.style.display = "none";
      };
      requestAnimationFrame(tick);
    };

    const makeBlockers = () => {
      const blockWheel = (e: WheelEvent) => e.preventDefault();
      const blockTouch = (e: TouchEvent) => e.preventDefault();
      const blockKey   = (e: KeyboardEvent) => {
        if (["ArrowDown","ArrowUp","PageDown","PageUp"," ","Spacebar","End","Home"].includes(e.key)) e.preventDefault();
      };
      window.addEventListener("wheel",     blockWheel, { passive: false, capture: true });
      window.addEventListener("touchmove", blockTouch, { passive: false, capture: true });
      window.addEventListener("keydown",   blockKey,   { capture: true });
      return () => {
        window.removeEventListener("wheel",     blockWheel, { capture: true } as EventListenerOptions);
        window.removeEventListener("touchmove", blockTouch, { capture: true } as EventListenerOptions);
        window.removeEventListener("keydown",   blockKey,   { capture: true } as EventListenerOptions);
      };
    };

    const playVideo = (
      vid: HTMLVideoElement,
      onFadeIn: (p: number) => void,
      onEnd: () => void,
    ) => {
      vid.style.display    = "block";
      vid.style.opacity    = "0";
      vid.currentTime      = 0;

      const MAX_MS = 15000;
      const fallback = window.setTimeout(() => {
        vid.removeEventListener("ended", wrapped);
        onEnd();
      }, MAX_MS);
      const wrapped = () => { window.clearTimeout(fallback); onEnd(); };

      vid.play().catch(() => { window.clearTimeout(fallback); onEnd(); });

      const FADEIN_MS = 300;
      const t0 = performance.now();
      const fadeIn = (now: number) => {
        const p = Math.min(1, (now - t0) / FADEIN_MS);
        onFadeIn(p);
        vid.style.opacity = ss(p).toFixed(3);
        if (p < 1) requestAnimationFrame(fadeIn);
      };
      requestAnimationFrame(fadeIn);
      vid.addEventListener("ended", wrapped, { once: true });
    };

    const playTransition = () => {
      if (animating || revealed) return;
      animating = true;
      const unblock = makeBlockers();

      if (video) {
        playVideo(
          video,
          (p) => { dark!.style.opacity = (1 - ss(p)).toFixed(3); },
          () => {
            animating = false; settling = true; revealExamples();
            window.clearTimeout(settleTimer);
            settleTimer = window.setTimeout(() => { settling = false; unblock(); }, 2000);
          },
        );
      } else {
        animating = false; settling = true; dark.style.opacity = "0"; revealExamples();
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => { settling = false; unblock(); }, 2000);
      }
    };

    const playTransition2 = () => {
      if (phase2Animating || mirrorRevealed) return;
      phase2Animating = true;
      light!.style.pointerEvents = "none";
      if (mirrorBg) mirrorBg.style.display = "block";
      const unblock = makeBlockers();

      if (video2) {
        playVideo(
          video2,
          () => {},
          () => {
            phase2Animating = false; settling = true; revealMirror();
            window.clearTimeout(settleTimer);
            settleTimer = window.setTimeout(() => { settling = false; unblock(); }, 1600);
          },
        );
      } else {
        phase2Animating = false; settling = true; revealMirror();
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => { settling = false; unblock(); }, 1600);
      }
    };

    const inStickyZone = () => {
      const r = stage!.getBoundingClientRect();
      if (r.top > 4 || r.bottom <= window.innerHeight) return false;
      // cr-stage starts at y=0 (margin-top:-100vh on slide-from-under), so
      // r.top <= 4 is true even while the hero covers the page. Only treat
      // slide2 as "pinned and visible" once the hero-lid has scrolled away.
      const heroBottom = (document.querySelector(".hero-lid") as HTMLElement | null)
        ?.getBoundingClientRect().bottom ?? -1;
      return heroBottom <= 0;
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.deltaY <= 0) return;
      if (!inStickyZone()) return;
      if (!revealed && !animating && !settling) {
        e.preventDefault();
        playTransition();
      } else if (revealed && !mirrorRevealed && !phase2Animating && !settling) {
        e.preventDefault();
        playTransition2();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (!["ArrowDown","PageDown"," ","Spacebar","End"].includes(e.key)) return;
      if (!inStickyZone()) return;
      if (!revealed && !animating && !settling) {
        e.preventDefault();
        playTransition();
      } else if (revealed && !mirrorRevealed && !phase2Animating && !settling) {
        e.preventDefault();
        playTransition2();
      }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? 0; };
    const onTouchMove  = (e: TouchEvent) => {
      if ((touchY - (e.touches[0]?.clientY ?? 0)) <= 0) return;
      if (!inStickyZone()) return;
      if (!revealed && !animating && !settling) {
        e.preventDefault();
        playTransition();
      } else if (revealed && !mirrorRevealed && !phase2Animating && !settling) {
        e.preventDefault();
        playTransition2();
      }
    };
    const onScroll = () => {
      if (!(revealed || animating || mirrorRevealed || phase2Animating || settling)) return;
      // Reset when user scrolls back up to hero area (hero-lid re-enters viewport).
      const heroBottom = (document.querySelector(".hero-lid") as HTMLElement | null)
        ?.getBoundingClientRect().bottom ?? -1;
      if (heroBottom > 0) {
        revealed = false;
        animating = false;
        mirrorRevealed = false;
        phase2Animating = false;
        settling = false;
        window.clearTimeout(settleTimer);
        dark!.style.opacity        = "1";
        light!.style.opacity       = "0";
        light!.style.pointerEvents = "none";
        const mirrorTitleEl = mirrorTitleRef.current;
        const exContent     = exContentRef.current;
        if (mirrorTitleEl) { mirrorTitleEl.style.opacity = ""; }
        if (exContent)     { exContent.style.opacity     = ""; }
        if (video)  { video.pause();  video.currentTime  = 0; video.style.display  = "none"; video.style.opacity  = "0"; }
        if (video2) { video2.pause(); video2.currentTime = 0; video2.style.display = "none"; video2.style.opacity = "0"; }
      }
    };

    window.addEventListener("wheel",      onWheel,      { passive: false, capture: true });
    window.addEventListener("keydown",    onKey,         { capture: true });
    window.addEventListener("touchstart", onTouchStart,  { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false });
    window.addEventListener("scroll",     onScroll,     { passive: true });

    return () => {
      window.clearTimeout(settleTimer);
      window.removeEventListener("wheel",      onWheel,     { capture: true } as EventListenerOptions);
      window.removeEventListener("keydown",    onKey,       { capture: true } as EventListenerOptions);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("scroll",     onScroll);
      dark.style.opacity        = "";
      light.style.opacity       = "";
      light.style.clipPath      = "";
      light.style.transform     = "";
      light.style.pointerEvents = "";
      if (video)  { video.pause();  video.style.display  = "none"; video.style.opacity  = ""; }
      if (video2) { video2.pause(); video2.style.display = "none"; video2.style.opacity = ""; }
    };
  }, [isFlat, isV7]);

  // ── Вариант 5: зум+растворение «наше стекло»→«примеры», затем морф фона
  //    «примеры»→«зеркала» прямо на блоке примеров (контент тает, в конце
  //    проявляется заголовок «Наши работы вписываются…»).
  useEffect(() => {
    if (isFlat || !isParallax || isV7) return;
    const stage = stageRef.current;
    const dark = darkRef.current;
    const light = lightRef.current;
    const canvas = canvasRef.current;
    const exContent = exContentRef.current;
    const mirrorTitle = mirrorTitleRef.current;
    if (!stage || !dark || !light) return;

    light.style.clipPath = "none";
    light.style.willChange = "transform";
    light.style.transformOrigin = "50% 50%";
    dark.style.willChange = "transform, filter, opacity";
    dark.style.transformOrigin = "50% 50%";

    let morph: GLMorph | null = null;
    if (canvas) morph = createGLMorph(canvas, TEX_EXAMPLES, TEX_MIRROR, 0.3);
    // Заголовок зеркал уже «раскрыт» внутри (mirror-visible), фейдим весь оверлей.
    mirrorTitle?.querySelector(".mirror-section")?.classList.add("mirror-visible");

    let examplesRevealed = false;
    const revealExamples = () => {
      if (examplesRevealed) return;
      examplesRevealed = true;
      light!.querySelector(".exs-prod-section")?.dispatchEvent(new CustomEvent("vg:examples-reveal"));
    };

    let ticking = false;
    function update() {
      ticking = false;
      const rect = stage!.getBoundingClientRect();
      const vh = window.innerHeight;
      // Держим полностью открытое «наше стекло» ≈2 экрана (1 на подъём хиро +
      // 1 просто показать), и только потом запускаем зум-переход в «примеры».
      const offsetPx = vh * 2.0;
      const totalScroll = stage!.offsetHeight - vh;
      const range = totalScroll - offsetPx - vh * 0.5; // хвост: заголовок зеркал стоит
      if (range <= 0) return;
      const scrolled = Math.max(0, -rect.top - offsetPx);
      const t = clamp(scrolled / range, 0, 1);

      // Фаза A (t 0→0.35): зум в «наше стекло» + растворение.
      const pA = clamp(t / 0.35, 0, 1);
      const eA = easeOutCubic(pA);
      if (pA > 0.85) revealExamples();
      dark!.style.transform = `scale(${(1 + eA * 0.4).toFixed(4)})`;
      dark!.style.filter = `blur(${(eA * 8).toFixed(2)}px)`;
      dark!.style.opacity = clamp(1 - pA / 0.85, 0, 1).toFixed(3);
      // «Наше стекло» лежит ПОВЕРХ примеров, и прозрачный элемент всё равно ловит
      // клики — без этого в примерах не нажимаются ни категории, ни стрелки, ни
      // кнопки. Отдаём клики примерам, как только слайд заметно растворился.
      dark!.style.pointerEvents = pA > 0.35 ? "none" : "auto";
      light!.style.transform = `scale(${(1.06 - eA * 0.06).toFixed(4)})`;

      // Пауза t 0.35→0.6: «примеры» стоят, элементы въезжают, можно рассмотреть.
      // Фаза B (t 0.6→0.95): фон «примеры»→«зеркала» (морф), контент примеров
      // тает, к концу проявляется заголовок зеркал.
      const pB = clamp((t - 0.6) / 0.35, 0, 1);
      morph?.setProgress(pB);
      if (exContent) exContent.style.opacity = clamp(1 - pB / 0.7, 0, 1).toFixed(3);
      if (mirrorTitle) {
        mirrorTitle.style.opacity = smoothstep(0.75, 1, pB).toFixed(3);
        mirrorTitle.style.pointerEvents = pB > 0.9 ? "auto" : "none";
      }
      light!.style.pointerEvents = pA > 0.99 && pB < 0.05 ? "auto" : "none";
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    const onResize = () => { morph?.resize(); onScroll(); };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      morph?.dispose();
      dark.style.cssText = "";
      light.style.cssText = "";
      if (exContent) exContent.style.opacity = "";
      if (mirrorTitle) { mirrorTitle.style.opacity = ""; mirrorTitle.style.pointerEvents = ""; }
    };
  }, [isFlat, isParallax, isV7]);

  // ── Переход через затемнение в чёрный — вариант 0 ──────────────
  useEffect(() => {
    if (isFlat || isParallax || !isFade) return;
    const stage = stageRef.current;
    const light = lightRef.current;
    const black = blackRef.current;
    if (!stage || !light || !black) return;

    // Стили задаём инлайн (CSS-класс .cr-stage--fade не применяется — Tailwind v4 его режет).
    black.style.position = "absolute";
    black.style.inset = "0";
    black.style.background = "#000";
    black.style.zIndex = "2";
    black.style.opacity = "0";
    black.style.pointerEvents = "none";
    light.style.zIndex = "3";
    light.style.clipPath = "none";
    light.style.background = "#000";
    light.style.opacity = "0";

    let examplesEntranceRequested = false;
    const requestExamplesEntrance = () => {
      if (examplesEntranceRequested) return;
      const section = light.querySelector(".exs-prod-section") as HTMLElement | null;
      const wrap = light.querySelector(".exd-wrap") as HTMLElement | null;
      if (!section || !wrap) return;
      examplesEntranceRequested = true;
      wrap.dataset.vgRevealRequested = "1";
      section.dispatchEvent(new CustomEvent("vg:examples-reveal"));
    };

    let ticking = false;

    function update() {
      ticking = false;
      const rect = stage!.getBoundingClientRect();
      const vh = window.innerHeight;
      // Фазы фиксированной длины: 2 экрана держим «наше стекло», 1.6 экрана —
      // фейд через чёрный в «примеры». Остаток закреплённой высоты (пауза +
      // стеклянный переход в зеркало) отдан VariantZeroTransition — он гасит
      // .cr-sticky, пока примеры стоят на месте.
      const offsetPx = vh * 2;
      const fadePx = vh * 1.6;
      const scrolled = Math.max(0, -rect.top - offsetPx);
      const p = clamp(scrolled / fadePx, 0, 1);

      // 1-я половина: «наше стекло» уходит в чёрный. 2-я: из чёрного проявляются «Примеры».
      black!.style.opacity = smoothstep(0, 0.5, p).toFixed(3);
      light!.style.opacity = smoothstep(0.5, 1, p).toFixed(3);
      light!.style.pointerEvents = p > 0.9 ? "auto" : "none";
      if (p >= 0.66) requestExamplesEntrance();
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      black.style.opacity = "";
      light.style.opacity = "";
      light.style.zIndex = "";
      light.style.clipPath = "";
      light.style.background = "";
    };
  }, [isFlat, isFade, isParallax]);

  // ── Вариант 6: примеры → зеркала через sunburst ─────────────────
  // Любой скролл вниз из sticky-зоны запускает автоматическую анимацию.
  useEffect(() => {
    if (!isV6) return;
    const stage = stageRef.current;
    const exContent = exContentRef.current;
    const white = v6WhiteRef.current;
    const mirrorReveal = v6MirrorRef.current;
    if (!stage || !exContent || !white) return;

    // vg:examples-reveal диспатчится из split-эффекта после окончания видео
    const mirSection = mirrorReveal?.querySelector(".mirror-section") as HTMLElement | null;
    if (mirSection) mirSection.classList.add("v6-pre-reveal");

    type State = "idle" | "animating" | "done";
    let state: State = "idle";
    let rafId = 0;

    const ss = (v: number) => v * v * (3 - 2 * v);

    const resetVisuals = () => {
      exContent!.style.opacity = "1";
      exContent!.style.pointerEvents = "";
      white!.style.clipPath = "circle(0% at 50% 50%)";
      if (mirrorReveal) { mirrorReveal.style.opacity = "0"; mirrorReveal.style.pointerEvents = "none"; }
      if (mirSection) { mirSection.classList.add("v6-pre-reveal"); mirSection.classList.remove("mirror-visible"); }
    };

    const playTransition = () => {
      if (state !== "idle") return;
      state = "animating";

      // Длительность: fade+круг 900ms, зеркало начинается через 600ms и длится 550ms
      const FADE_MS = 900;
      const MIR_DELAY = 600;
      const MIR_MS = 550;
      const TOTAL_MS = MIR_DELAY + MIR_MS;

      const blockWheel = (e: WheelEvent) => e.preventDefault();
      const blockTouch = (e: TouchEvent) => e.preventDefault();
      const blockKey = (e: KeyboardEvent) => {
        if (["ArrowDown","ArrowUp","PageDown","PageUp"," ","Spacebar","End","Home"].includes(e.key)) e.preventDefault();
      };
      window.addEventListener("wheel",     blockWheel, { passive: false, capture: true });
      window.addEventListener("touchmove", blockTouch, { passive: false, capture: true });
      window.addEventListener("keydown",   blockKey,   { capture: true });
      const unblock = () => {
        window.removeEventListener("wheel",     blockWheel, { capture: true } as EventListenerOptions);
        window.removeEventListener("touchmove", blockTouch, { capture: true } as EventListenerOptions);
        window.removeEventListener("keydown",   blockKey,   { capture: true } as EventListenerOptions);
      };

      const t0 = performance.now();
      let mirSection_revealed = false;

      const tick = (now: number) => {
        const ms = now - t0;

        // Fade примеров + белый круг — одновременно
        const fadeP = ss(Math.min(1, ms / FADE_MS));
        exContent!.style.opacity = (1 - fadeP).toFixed(3);
        white!.style.clipPath = `circle(${(fadeP * 145).toFixed(2)}% at 50% 50%)`;

        // Зеркало проявляется с задержкой
        const mirRaw = Math.max(0, Math.min(1, (ms - MIR_DELAY) / MIR_MS));
        const mirP = ss(mirRaw);
        if (mirrorReveal) {
          mirrorReveal.style.opacity = mirP.toFixed(3);
          mirrorReveal.style.pointerEvents = mirRaw > 0.05 ? "auto" : "none";
        }
        if (!mirSection_revealed && mirRaw > 0.05 && mirSection) {
          mirSection_revealed = true;
          mirSection.classList.remove("v6-pre-reveal");
          if (!mirSection.classList.contains("mirror-visible")) mirSection.classList.add("mirror-visible");
        }

        if (ms < TOTAL_MS) { rafId = requestAnimationFrame(tick); return; }

        // Анимация завершена: снимаем блок, прокручиваем к началу mr-stage
        // (= конец cr-stage--v6 полностью покинул вьюпорт, mr-sticky сразу пинится).
        unblock();
        state = "done";
        exContent!.style.pointerEvents = "none";
        const mrStart = stage!.getBoundingClientRect().top + window.scrollY + stage!.offsetHeight;
        const html = document.documentElement;
        html.style.scrollBehavior = "auto";
        window.scrollTo({ top: Math.max(0, mrStart) });
        html.style.scrollBehavior = "";
      };

      rafId = requestAnimationFrame(tick);
    };

    // Перехватываем скролл вниз пока находимся в sticky-зоне
    const inStickyZone = () => {
      const r = stage!.getBoundingClientRect();
      return r.top <= 4 && r.bottom > window.innerHeight;
    };

    const onWheel = (e: WheelEvent) => {
      if (state !== "idle") return;
      if (!splitCompletedRef.current) return; // ждём завершения разреза slide2
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.deltaY <= 0) return;
      if (!inStickyZone()) return;
      e.preventDefault();
      playTransition();
    };

    const onKey = (e: KeyboardEvent) => {
      if (state !== "idle") return;
      if (!splitCompletedRef.current) return;
      if (!["ArrowDown","PageDown"," ","Spacebar","End"].includes(e.key)) return;
      if (!inStickyZone()) return;
      e.preventDefault();
      playTransition();
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? 0; };
    const onTouchMove = (e: TouchEvent) => {
      if (state !== "idle") return;
      if (!splitCompletedRef.current) return;
      if ((touchY - (e.touches[0]?.clientY ?? 0)) <= 0) return;
      if (!inStickyZone()) return;
      e.preventDefault();
      playTransition();
    };

    // Сброс если пользователь проскроллил назад выше стейджа
    const onScroll = () => {
      const r = stage!.getBoundingClientRect();
      if (r.top > 4 && state !== "idle") {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        state = "idle";
        resetVisuals();
      }
      if (r.top > 4) {
        splitCompletedRef.current = false;
      }
      // Если sunburst завершился и пользователь вернулся в sticky-зону снизу —
      // сбрасываем зеркало и белый круг, чтобы они не торчали поверх обратного разреза.
      if (state === "done" && r.top <= 4 && r.bottom > window.innerHeight) {
        state = "idle";
        resetVisuals();
      }
    };

    window.addEventListener("wheel",      onWheel,     { passive: false, capture: true });
    window.addEventListener("keydown",     onKey,       { capture: true });
    window.addEventListener("touchstart",  onTouchStart, { passive: true });
    window.addEventListener("touchmove",   onTouchMove, { passive: false, capture: true });
    window.addEventListener("scroll",      onScroll,    { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("wheel",     onWheel,      { capture: true } as EventListenerOptions);
      window.removeEventListener("keydown",    onKey,        { capture: true } as EventListenerOptions);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove,  { capture: true } as EventListenerOptions);
      window.removeEventListener("scroll",     onScroll);
      if (exContent) { exContent.style.opacity = ""; exContent.style.pointerEvents = ""; }
      if (white) white.style.clipPath = "";
      if (mirrorReveal) { mirrorReveal.style.opacity = ""; mirrorReveal.style.pointerEvents = "none"; }
      if (mirSection) mirSection.classList.remove("v6-pre-reveal");
    };
  }, [isV6]);

  // ── Вариант 6: slide2 → примеры через «разрез» + видео ────────────
  // Сам блок slide2 разрезается пополам: левая половина улетает влево,
  // правая — вправо; одновременно под ним играет видео. После окончания
  // видео появляются фон и контент примеров.
  useEffect(() => {
    if (!isV6) return;
    const splitL    = v6SplitLRef.current;
    const splitR    = v6SplitRRef.current;
    const crack     = v6CrackRef.current;
    const slide2El  = v6Slide2Ref.current;
    const videoEl   = v6VideoRef.current;
    const exContent = exContentRef.current;
    if (!splitL || !splitR) return;

    type SplitState = "idle" | "animating";
    let state: SplitState = "idle";
    let rafId = 0;

    const easeInOut = (v: number) =>
      v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;

    const playSplit = () => {
      if (state !== "idle") return;
      state = "animating";

      splitL.style.display = "block";
      splitR.style.display = "block";
      splitL.style.transform = "translateX(0)";
      splitR.style.transform = "translateX(0)";

      [splitL, splitR].forEach(half => {
        const s2 = half.querySelector("[id='slide2']") as HTMLElement | null;
        if (s2) s2.classList.add("lights-on");
        const text = half.querySelector("[id='slide2-text']") as HTMLElement | null;
        if (text) {
          text.style.cssText += ";transition:none!important;opacity:1!important;transform:translateY(0)!important";
        }
      });

      if (crack) { crack.style.display = "block"; crack.style.opacity = "1"; }

      if (slide2El) {
        slide2El.style.opacity = "0";
        slide2El.style.pointerEvents = "none";
      }

      // Прячем контент примеров — появится после видео
      if (exContent) {
        exContent.style.opacity = "0";
        exContent.style.pointerEvents = "none";
      }

      // Стартуем видео одновременно с разрезом
      if (videoEl) {
        videoEl.currentTime = 0;
        videoEl.style.opacity = "1";
        videoEl.play().catch(() => {});
      }

      const blockWheel = (e: WheelEvent) => e.preventDefault();
      const blockTouch = (e: TouchEvent) => e.preventDefault();
      const blockKey   = (e: KeyboardEvent) => {
        if (["ArrowDown","ArrowUp","PageDown","PageUp"," ","Spacebar","End","Home"].includes(e.key))
          e.preventDefault();
      };
      window.addEventListener("wheel",     blockWheel, { passive: false, capture: true });
      window.addEventListener("touchmove", blockTouch, { passive: false, capture: true });
      window.addEventListener("keydown",   blockKey,   { capture: true });
      const unblock = () => {
        window.removeEventListener("wheel",     blockWheel, { capture: true } as EventListenerOptions);
        window.removeEventListener("touchmove", blockTouch, { capture: true } as EventListenerOptions);
        window.removeEventListener("keydown",   blockKey,   { capture: true } as EventListenerOptions);
      };

      const SPLIT_MS = 880;
      const t0 = performance.now();

      const tick = (now: number) => {
        const ms = now - t0;
        const p  = Math.min(1, ms / SPLIT_MS);
        const ep = easeInOut(p);

        splitL.style.transform = `translateX(${(-ep * 100).toFixed(2)}%)`;
        splitR.style.transform = `translateX(${(ep * 100).toFixed(2)}%)`;

        if (crack) crack.style.opacity = Math.max(0, 1 - p / 0.15).toFixed(3);

        if (p < 1) { rafId = requestAnimationFrame(tick); return; }

        // Разрез завершён — скрываем половины
        splitL.style.display = "none";
        splitR.style.display = "none";
        if (crack) crack.style.display = "none";

        // Прокручиваем за slide2, чтобы примеры оказались в sticky-зоне
        const slide2El2 = document.getElementById("v6-slide2-anchor");
        if (slide2El2) {
          const html2 = document.documentElement;
          html2.style.scrollBehavior = "auto";
          window.scrollTo({ top: slide2El2.getBoundingClientRect().top + window.scrollY + slide2El2.offsetHeight });
          html2.style.scrollBehavior = "";
        }

        // Ждём конца видео, затем показываем контент
        const onVideoEnd = () => {
          unblock();
          state = "idle";
          splitCompletedRef.current = true;

          // Запускаем анимацию элементов примеров
          const exSection = exContent?.querySelector(".exs-prod-section");
          if (exSection) exSection.dispatchEvent(new CustomEvent("vg:examples-reveal"));

          // Видео замирает на последнем кадре — плавно фейдим контент поверх
          const FADE_MS = 500;
          const ft0 = performance.now();
          const fadeTick = (fnow: number) => {
            const fp = Math.min(1, (fnow - ft0) / FADE_MS);
            const fe = fp * fp * (3 - 2 * fp);
            if (exContent) exContent.style.opacity = fe.toFixed(3);
            if (videoEl)   videoEl.style.opacity   = (1 - fe).toFixed(3);
            if (fp < 1) { requestAnimationFrame(fadeTick); return; }
            if (exContent) exContent.style.pointerEvents = "";
            if (videoEl) { videoEl.style.opacity = "0"; videoEl.pause(); }
          };
          requestAnimationFrame(fadeTick);
        };

        if (videoEl) {
          if (videoEl.ended || videoEl.paused) {
            onVideoEnd();
          } else {
            videoEl.addEventListener("ended", onVideoEnd, { once: true });
          }
        } else {
          unblock();
          state = "idle";
          splitCompletedRef.current = true;
          if (exContent) { exContent.style.opacity = ""; exContent.style.pointerEvents = ""; }
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    // Пользователь находится на slide2 (flat div, не sticky) и тянет вниз.
    const inSlide2Zone = () => {
      const slide2 = document.getElementById("v6-slide2-anchor");
      if (!slide2) return false;
      const r = slide2.getBoundingClientRect();
      return r.top <= 4 && r.bottom > window.innerHeight * 0.3;
    };

    // Пользователь в sticky-зоне примеров (после разреза)
    const inExamplesZone = () => {
      const stage = document.getElementById("v6-examples-anchor");
      if (!stage) return false;
      const r = stage.getBoundingClientRect();
      return r.top <= 4 && r.bottom > window.innerHeight;
    };

    // Реверсный разрез: половины съезжаются обратно → открывается slide2
    const playReverseSplit = () => {
      if (state !== "idle") return;
      if (!splitCompletedRef.current) return;
      state = "animating";

      // Страховка: сбрасываем sunburst-состояние (зеркало и белый круг)
      // на случай если onScroll не успел сделать это до начала анимации.
      const mirRevealEl = v6MirrorRef.current;
      const whiteCircleEl = v6WhiteRef.current;
      if (mirRevealEl) { mirRevealEl.style.opacity = "0"; mirRevealEl.style.pointerEvents = "none"; }
      if (whiteCircleEl) whiteCircleEl.style.clipPath = "circle(0% at 50% 50%)";

      // Прячем контент примеров
      if (exContent) { exContent.style.opacity = "0"; exContent.style.pointerEvents = "none"; }

      // Половины появляются в полностью раздвинутом положении
      splitL.style.display = "block";
      splitR.style.display = "block";
      splitL.style.transform = "translateX(-100%)";
      splitR.style.transform = "translateX(100%)";

      [splitL, splitR].forEach(half => {
        const s2 = half.querySelector("[id='slide2']") as HTMLElement | null;
        if (s2) s2.classList.add("lights-on");
        const text = half.querySelector("[id='slide2-text']") as HTMLElement | null;
        if (text) {
          text.style.cssText += ";transition:none!important;opacity:1!important;transform:translateY(0)!important";
        }
      });

      const blockWheel = (e: WheelEvent) => e.preventDefault();
      const blockTouch = (e: TouchEvent) => e.preventDefault();
      const blockKey   = (e: KeyboardEvent) => {
        if (["ArrowDown","ArrowUp","PageDown","PageUp"," ","Spacebar","End","Home"].includes(e.key))
          e.preventDefault();
      };
      window.addEventListener("wheel",     blockWheel, { passive: false, capture: true });
      window.addEventListener("touchmove", blockTouch, { passive: false, capture: true });
      window.addEventListener("keydown",   blockKey,   { capture: true });
      const unblock = () => {
        window.removeEventListener("wheel",     blockWheel, { capture: true } as EventListenerOptions);
        window.removeEventListener("touchmove", blockTouch, { capture: true } as EventListenerOptions);
        window.removeEventListener("keydown",   blockKey,   { capture: true } as EventListenerOptions);
      };

      const SPLIT_MS = 880;
      const t0 = performance.now();

      const tick = (now: number) => {
        const ms = now - t0;
        const p  = Math.min(1, ms / SPLIT_MS);
        const ep = easeInOut(p);

        // Съезжаются: от ±100% → 0%
        splitL.style.transform = `translateX(${(-(1 - ep) * 100).toFixed(2)}%)`;
        splitR.style.transform = `translateX(${((1 - ep) * 100).toFixed(2)}%)`;

        // Линия разреза появляется ближе к концу (когда половины почти сошлись)
        if (crack) {
          crack.style.display = "block";
          crack.style.opacity = Math.max(0, (p - 0.7) / 0.3).toFixed(3);
        }

        if (p < 1) { rafId = requestAnimationFrame(tick); return; }

        // Половины сошлись — скрываем их и показываем slide2
        unblock();
        splitL.style.display = "none";
        splitR.style.display = "none";
        if (crack) { crack.style.opacity = "0"; crack.style.display = "none"; }
        state = "idle";
        splitCompletedRef.current = false;

        // Восстанавливаем slide2
        if (slide2El) { slide2El.style.opacity = ""; slide2El.style.pointerEvents = ""; }

        // Прокручиваем назад к slide2 (мгновенно — scroll-behavior:smooth глобально на html)
        const s2 = document.getElementById("v6-slide2-anchor");
        if (s2) {
          const html3 = document.documentElement;
          html3.style.scrollBehavior = "auto";
          window.scrollTo({ top: s2.getBoundingClientRect().top + window.scrollY });
          html3.style.scrollBehavior = "";
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      if (state !== "idle") return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY > 0 && inSlide2Zone()) {
        e.preventDefault();
        playSplit();
      } else if (e.deltaY < 0 && inExamplesZone() && splitCompletedRef.current) {
        e.preventDefault();
        playReverseSplit();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (state !== "idle") return;
      if (["ArrowDown", "PageDown", " ", "Spacebar", "End"].includes(e.key) && inSlide2Zone()) {
        e.preventDefault();
        playSplit();
      } else if (["ArrowUp", "PageUp", "Home"].includes(e.key) && inExamplesZone() && splitCompletedRef.current) {
        e.preventDefault();
        playReverseSplit();
      }
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? 0; };
    const onTouchMove = (e: TouchEvent) => {
      if (state !== "idle") return;
      const dy = touchY - (e.touches[0]?.clientY ?? 0);
      if (dy > 0 && inSlide2Zone()) {
        e.preventDefault();
        playSplit();
      } else if (dy < 0 && inExamplesZone() && splitCompletedRef.current) {
        e.preventDefault();
        playReverseSplit();
      }
    };

    // Страховка: если пользователь каким-то образом ушёл выше slide2 без анимации
    const onScrollReset = () => {
      if (!splitCompletedRef.current) return;
      const s2 = document.getElementById("v6-slide2-anchor");
      if (!s2) return;
      if (s2.getBoundingClientRect().top > window.innerHeight * 0.5) {
        splitCompletedRef.current = false;
        s2.style.opacity = "";
        s2.style.pointerEvents = "";
      }
    };

    window.addEventListener("wheel",      onWheel,      { passive: false, capture: true });
    window.addEventListener("keydown",    onKey,         { capture: true });
    window.addEventListener("touchstart", onTouchStart,  { passive: true });
    window.addEventListener("touchmove",  onTouchMove,   { passive: false, capture: true });
    window.addEventListener("scroll",     onScrollReset, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("wheel",      onWheel,     { capture: true } as EventListenerOptions);
      window.removeEventListener("keydown",    onKey,       { capture: true } as EventListenerOptions);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove, { capture: true } as EventListenerOptions);
      window.removeEventListener("scroll",     onScrollReset);
      splitL.style.display = "none";
      splitR.style.display = "none";
      if (crack) crack.style.display = "none";
      if (slide2El) { slide2El.style.opacity = ""; slide2El.style.pointerEvents = ""; }
      if (videoEl) { videoEl.pause(); videoEl.currentTime = 0; videoEl.style.opacity = "0"; }
      if (exContent) { exContent.style.opacity = ""; exContent.style.pointerEvents = ""; }
      splitCompletedRef.current = false;
    };
  }, [isV6]);


  if (isFlat) {
    // Ключи не дают React переиспользовать узлы, на которых остались
    // инлайн-стили от десктопного эффекта.
    return (
      <>
        <div key="cr-dark-flat" dangerouslySetInnerHTML={{ __html: darkHtml }} />
        {children}
      </>
    );
  }

  if (isV6) {
    return (
      <>
        {/* Slide2 прокручивается плоско; якорь нужен IceFractureTransition */}
        <div ref={v6Slide2Ref} id="v6-slide2-anchor" key="v6-dark-flat" dangerouslySetInnerHTML={{ __html: darkHtml }} />

        {/* Разрез: клоны slide2 с реальным контентом, улетают влево/вправо */}
        <div ref={v6SplitLRef} className="v6-split-half v6-split-half--left" aria-hidden="true">
          <div className="v6-split-content" dangerouslySetInnerHTML={{ __html: darkHtml }} />
        </div>
        <div ref={v6SplitRRef} className="v6-split-half v6-split-half--right" aria-hidden="true">
          <div className="v6-split-content" dangerouslySetInnerHTML={{ __html: darkHtml }} />
        </div>
        {/* Линия разреза — мелькает в момент старта анимации */}
        <div ref={v6CrackRef} className="v6-split-crack" aria-hidden="true" />

        {/* Sticky-стейдж: примеры → sunburst → зеркало */}
        <div id="v6-examples-anchor" key="v6-stage" ref={stageRef} className="cr-stage cr-stage--v6">
          <div className="cr-sticky">
            <div className="v6-bg v6-bg--examples" aria-hidden="true" />

            {/* Видео-переход: играет во время разреза, финальный кадр = фон примеров */}
            <video
              ref={v6VideoRef}
              className="v6-bg-video"
              src="/examples-bg.webm"
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
            >
              <source src="/examples-bg.mp4" type="video/mp4" />
            </video>

            <div ref={exContentRef} className="v6-ex-content">
              {children}
            </div>

            <div ref={v6WhiteRef} className="v6-white" aria-hidden="true" />

            {mirrorHtml && (
              <div
                ref={v6MirrorRef}
                className="v6-mirror-reveal"
                dangerouslySetInnerHTML={{ __html: mirrorHtml }}
              />
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div key="cr-stage" ref={stageRef} className={`cr-stage${isFade ? " cr-stage--fade" : ""}${isShutter ? " cr-stage--shutter" : ""}${isParallax ? " cr-stage--parallax" : ""}${isCircle ? " cr-stage--circle" : ""}`}>
      {/* v7 video overlays sit OUTSIDE cr-sticky so they don't inherit
          cr-light's opacity:0 or transform:scale(). */}
      {isV7 && (
        <>
          <video
            ref={v7Video1Ref}
            className="v7-vid-overlay"
            src="/v7-1.mp4"
            muted
            playsInline
            preload="auto"
          />
          <div
            ref={v7MirrorBgRef}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9989,
              background: "url('/assets/background-5.webp') center center / cover no-repeat",
              display: "none",
              pointerEvents: "none",
            }}
            aria-hidden="true"
          />
          <video
            ref={v7Video2Ref}
            className="v7-vid-overlay"
            src={version === "8" ? "/assets/last.mp4" : "/v7-2.mp4"}
            muted
            playsInline
            preload="auto"
          />
        </>
      )}
      <div className="cr-sticky">
        <div
          ref={darkRef}
          className="cr-dark"
          dangerouslySetInnerHTML={{ __html: darkHtml }}
        />
        {isFade && <div ref={blackRef} className="cr-black" aria-hidden="true" />}
        <div ref={lightRef} className="cr-light">
          {isParallax ? (
            <>
              {!isV7 && <canvas ref={canvasRef} className="cr-morph-canvas" />}
              <div ref={exContentRef} className="cr-ex-content">
                {children}
              </div>
              {mirrorHtml && (
                <div
                  ref={mirrorTitleRef}
                  className="cr-mirror-title"
                  dangerouslySetInnerHTML={{ __html: mirrorHtml }}
                />
              )}
            </>
          ) : (
            children
          )}
        </div>
        {/* Вариант 2: «зеркала» выезжают шторой снизу поверх «примеров». */}
        {isCircle && mirrorHtml && (
          <div
            ref={mirrorWipeRef}
            className="cr-mirror-wipe"
            dangerouslySetInnerHTML={{ __html: mirrorHtml }}
          />
        )}
      </div>
    </div>
  );
}
