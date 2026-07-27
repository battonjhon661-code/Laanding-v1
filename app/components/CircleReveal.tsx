"use client";
import { useEffect, useRef, ReactNode } from "react";
import { useFlatLayout, useSiteVersion } from "./useFlatLayout";
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
  const isFlat = useFlatLayout();
  const version = useSiteVersion();
  // Вариант 2: следующий слайд открывается кругом из центра, а не полосой.
  const isCircle = version === "4";
  const isShutter = version === "3";
  // Вариант 5: «наше стекло» → «примеры» через параллакс + размытие.
  const isParallax = version === "1";
  // Вариант 0: «наше стекло» затемняется в чёрный экран, из него проявляются «Примеры работ».
  const isFade = version === "2";

  // ── Обычный переход (clip / круг) — варианты 1,3,4 ──────────────
  useEffect(() => {
    if (isFlat || isFade || isParallax || isCircle) return;
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
      // Вход элементов «примеров» запускаем только когда «наше стекло» уже ушло —
      // сначала приземляемся на слайд, потом проигрывается появление элементов.
      if (pA > 0.85) revealExamples();
      dark!.style.transform = `scale(${(1 + eA * 0.4).toFixed(4)})`;
      dark!.style.filter = `blur(${(eA * 8).toFixed(2)}px)`;
      dark!.style.opacity = clamp(1 - pA / 0.85, 0, 1).toFixed(3);
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
