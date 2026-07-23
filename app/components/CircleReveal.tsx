"use client";
import { useEffect, useRef, ReactNode } from "react";
import { useFlatLayout, useSiteVersion } from "./useFlatLayout";

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
  children,
}: {
  darkHtml: string;
  children: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const isFlat = useFlatLayout();
  const version = useSiteVersion();
  // Вариант 2: следующий слайд открывается кругом из центра, а не полосой.
  const isCircle = version === "2";
  const isShutter = version === "4";
  // Вариант 0: «наше стекло» затемняется в чёрный экран, из него проявляются «Примеры работ».
  const isFade = version === "0";

  // ── Обычный переход (clip / круг) — варианты 1,2,3 ──────────────
  useEffect(() => {
    if (isFlat || isFade) return;
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
  }, [isFlat, isCircle, isFade, isShutter]);

  // ── Переход через затемнение в чёрный — вариант 0 ──────────────
  useEffect(() => {
    if (isFlat || !isFade) return;
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
      const offsetPx = window.innerHeight * 2;
      const scrollable = stage!.offsetHeight - window.innerHeight - offsetPx;
      if (scrollable <= 0) return;
      const scrolled = Math.max(0, -rect.top - offsetPx);
      const p = clamp(scrolled / scrollable, 0, 1);

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
  }, [isFlat, isFade]);

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
    <div key="cr-stage" ref={stageRef} className={`cr-stage${isFade ? " cr-stage--fade" : ""}${isShutter ? " cr-stage--shutter" : ""}`}>
      <div className="cr-sticky">
        <div
          ref={darkRef}
          className="cr-dark"
          dangerouslySetInnerHTML={{ __html: darkHtml }}
        />
        {isFade && <div ref={blackRef} className="cr-black" aria-hidden="true" />}
        <div ref={lightRef} className="cr-light">
          {children}
        </div>
      </div>
    </div>
  );
}
