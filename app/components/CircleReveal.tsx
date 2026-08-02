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
  children,
}: {
  darkHtml: string;
  mirrorHtml?: string;
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
  // true после того как разрез slide2→примеры завершился; sunburst ждёт этого флага
  const splitCompletedRef = useRef(false);
  const isFlat = useFlatLayout();
  const isMobile = useIsMobile();
  const version = useSiteVersion();
  // Вариант 2: следующий слайд открывается кругом из центра, а не полосой.
  const isCircle = version === "4";
  const isShutter = version === "3";
  // Вариант 5: «наше стекло» → «примеры» через параллакс + размытие.
  const isParallax = version === "1";
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

  // ── Вариант 5: зум+растворение «наше стекло»→«примеры», затем морф фона
  //    «примеры»→«зеркала» прямо на блоке примеров (контент тает, в конце
  //    проявляется заголовок «Наши работы вписываются…»).
  useEffect(() => {
    if (isFlat || !isParallax) return;
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
    dark.style.opacity = "0"; // fades in after hero scrolls off

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
      // Entry: hero is 100vh, covers cr-stage while rect.top > -vh.
      // Fade cr-dark in over 0.4vh after the hero finishes scrolling off.
      const entryT = clamp((-rect.top - vh) / (vh * 0.4), 0, 1);
      const entryOpacity = easeOutCubic(entryT);

      const pA = clamp(t / 0.35, 0, 1);
      const eA = easeOutCubic(pA);
      // Вход элементов «примеров» запускаем только когда «наше стекло» уже ушло —
      // сначала приземляемся на слайд, потом проигрывается появление элементов.
      if (pA > 0.85) revealExamples();
      dark!.style.transform = `scale(${(1 + eA * 0.4).toFixed(4)})`;
      dark!.style.filter = `blur(${(eA * 8).toFixed(2)}px)`;
      dark!.style.opacity = (entryOpacity * clamp(1 - pA / 0.85, 0, 1)).toFixed(3);
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
  }, [isFlat, isParallax]);

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

    const exSection = exContent.querySelector(".exs-prod-section");
    if (exSection) exSection.dispatchEvent(new CustomEvent("vg:examples-reveal"));

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

        // Анимация завершена: снимаем блок, прокручиваем за конец стейджа.
        // getBoundingClientRect + scrollY = документная позиция (offsetTop не подходит).
        unblock();
        state = "done";
        exContent!.style.pointerEvents = "none";
        const stageEnd = stage!.getBoundingClientRect().top + window.scrollY + stage!.offsetHeight - window.innerHeight;
        window.scrollTo({ top: Math.max(0, stageEnd), behavior: "auto" });
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
      if (stage!.getBoundingClientRect().top > 4 && state !== "idle") {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        state = "idle";
        resetVisuals();
      }
      // Когда пользователь ушёл выше slide2, сбрасываем флаг разреза
      if (stage!.getBoundingClientRect().top > 4) {
        splitCompletedRef.current = false;
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

  // ── Вариант 6: slide2 → примеры через «разрез» ───────────────────
  // Сам блок slide2 разрезается пополам: левая половина улетает влево,
  // правая — вправо, открывая блок примеров, который всегда был «снизу».
  useEffect(() => {
    if (!isV6) return;
    const splitL   = v6SplitLRef.current;
    const splitR   = v6SplitRRef.current;
    const crack    = v6CrackRef.current;
    const slide2El = v6Slide2Ref.current;
    if (!splitL || !splitR) return;

    type SplitState = "idle" | "animating";
    let state: SplitState = "idle";
    let rafId = 0;

    // Easing: мягкий старт → быстрое расхождение
    const easeInOut = (v: number) =>
      v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;

    const playSplit = () => {
      if (state !== "idle") return;
      state = "animating";

      // Показываем половины — они перекрывают экран
      splitL.style.display = "block";
      splitR.style.display = "block";
      splitL.style.transform = "translateX(0)";
      splitR.style.transform = "translateX(0)";

      // Форсируем «lights-on» состояние внутри клонов через CSS-класс и инлайн-оверрайды
      [splitL, splitR].forEach(half => {
        const s2 = half.querySelector("[id='slide2']") as HTMLElement | null;
        if (s2) s2.classList.add("lights-on");
        const text = half.querySelector("[id='slide2-text']") as HTMLElement | null;
        if (text) {
          text.style.cssText += ";transition:none!important;opacity:1!important;transform:translateY(0)!important";
        }
      });

      // Линия разреза
      if (crack) { crack.style.display = "block"; crack.style.opacity = "1"; }

      // Примеры лежат физически ЗА slide2 (margin-top: -110vh, z-index: 1 < 2).
      // Пока клоны закрывают экран, убираем slide2 — после разлёта клонов
      // примеры откроются без единого пикселя скролла.
      if (slide2El) {
        slide2El.style.opacity = "0";
        slide2El.style.pointerEvents = "none";
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

        // Линия разреза гаснет с открытием зазора
        if (crack) crack.style.opacity = Math.max(0, 1 - p / 0.15).toFixed(3);

        if (p < 1) { rafId = requestAnimationFrame(tick); return; }

        unblock();
        splitL.style.display = "none";
        splitR.style.display = "none";
        if (crack) crack.style.display = "none";
        state = "idle";

        // Устанавливаем флаг: разрез завершён, sunburst может срабатывать.
        splitCompletedRef.current = true;
        // Прокручиваем чуть дальше slide2, чтобы inSlide2Zone() вернула false
        // и sunburst не боролся со split при следующем скролле вниз.
        // getBoundingClientRect даёт позицию в viewport — прибавляем scrollY для
        // перевода в координаты документа (offsetTop не подходит: он считается
        // относительно offsetParent slide-from-under, а не от начала страницы).
        const slide2El2 = document.getElementById("v6-slide2-anchor");
        if (slide2El2) {
          window.scrollTo({
            top: slide2El2.getBoundingClientRect().top + window.scrollY + slide2El2.offsetHeight,
            behavior: "auto",
          });
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    // Пользователь находится на slide2 (flat div, не sticky) и тянет вниз.
    // Триггер — жест, а не scroll: иначе window.scrollTo из IceFractureTransition
    // тоже вызывал бы разрез (v6-examples-anchor оказывается точно на нижнем краю).
    const inSlide2Zone = () => {
      const slide2 = document.getElementById("v6-slide2-anchor");
      if (!slide2) return false;
      const r = slide2.getBoundingClientRect();
      return r.top <= 4 && r.bottom > window.innerHeight * 0.3;
    };

    const onWheel = (e: WheelEvent) => {
      if (state !== "idle") return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.deltaY <= 0) return;
      if (!inSlide2Zone()) return;
      e.preventDefault();
      playSplit();
    };

    const onKey = (e: KeyboardEvent) => {
      if (state !== "idle") return;
      if (!["ArrowDown", "PageDown", " ", "Spacebar", "End"].includes(e.key)) return;
      if (!inSlide2Zone()) return;
      e.preventDefault();
      playSplit();
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? 0; };
    const onTouchMove = (e: TouchEvent) => {
      if (state !== "idle") return;
      if ((touchY - (e.touches[0]?.clientY ?? 0)) <= 0) return;
      if (!inSlide2Zone()) return;
      e.preventDefault();
      playSplit();
    };

    // Когда пользователь скроллит назад выше slide2 — сбрасываем флаг и slide2
    const onScrollReset = () => {
      if (!splitCompletedRef.current) return;
      const s2 = document.getElementById("v6-slide2-anchor");
      if (!s2) return;
      // slide2 снова виден сверху (значит вернулись к нему) → сбрасываем
      if (s2.getBoundingClientRect().top > window.innerHeight * 0.5) {
        splitCompletedRef.current = false;
        s2.style.opacity = "";
        s2.style.pointerEvents = "";
      }
    };

    window.addEventListener("wheel",      onWheel,     { passive: false, capture: true });
    window.addEventListener("keydown",    onKey,        { capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false, capture: true });
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
              <canvas ref={canvasRef} className="cr-morph-canvas" />
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
