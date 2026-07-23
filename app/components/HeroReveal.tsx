"use client";
import { useEffect, useRef, ReactNode } from "react";
import { useFlatLayout, useSiteVersion } from "./useFlatLayout";

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

export default function HeroReveal({
  hero,
  children,
}: {
  hero: ReactNode;
  children: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const underRef = useRef<HTMLDivElement>(null);
  const isFlat = useFlatLayout();
  const version = useSiteVersion();
  // Вариант 2: шкаф лежит ПОД хиро, хиро уезжает вверх как крышка.
  const isLid = version === "2";
  const isPlainBeforeSlide2 = version === "4";

  useEffect(() => {
    if (isFlat || isPlainBeforeSlide2) return;
    const heroEl = heroRef.current;
    const underEl = underRef.current;
    const stageEl = stageRef.current;
    if (!heroEl || !underEl || !stageEl) return;

    let rafId: number;
    let resizeObserver: ResizeObserver | null = null;
    let revealDistance = window.innerHeight;
    const syncStageHeight = () => {
      if (isLid) {
        const underHeight = underEl!.offsetHeight;
        const bottomOffset = Math.max(0, window.innerHeight - underHeight);
        revealDistance = Math.max(1, Math.min(window.innerHeight, underHeight));
        stageEl!.style.setProperty("--hr-under-y", `${bottomOffset}px`);
        stageEl!.style.height = `${window.innerHeight + bottomOffset + underHeight}px`;
      } else {
        revealDistance = window.innerHeight;
        stageEl!.style.removeProperty("--hr-under-y");
        stageEl!.style.height = "";
      }
    };

    syncStageHeight();
    window.addEventListener("resize", syncStageHeight, { passive: true });
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(syncStageHeight);
      resizeObserver.observe(underEl);
    }

    function tick() {
      if (isLid) {
        const rect = stageEl!.getBoundingClientRect();
        const progress = clamp(-rect.top / revealDistance, 0, 1);
        heroEl!.style.transform = `translate3d(0, ${(-progress * revealDistance).toFixed(1)}px, 0)`;
      } else {
        const rect = heroEl!.getBoundingClientRect();
        const progress = clamp(-rect.top / window.innerHeight, 0, 1);
        heroEl!.style.transform = `translate3d(0, ${(-progress * 30).toFixed(1)}px, 0)`;
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", syncStageHeight);
      resizeObserver?.disconnect();
      stageEl.style.removeProperty("--hr-under-y");
      stageEl.style.height = "";
      heroEl.style.transform = "";
      heroEl.style.opacity = "";
      heroEl.style.filter = "";
      underEl.style.transform = "";
      underEl.style.opacity = "";
      underEl.style.filter = "";
    };
  }, [isFlat, isLid, isPlainBeforeSlide2]);

  if (isFlat || isPlainBeforeSlide2) {
    return (
      <>
        {hero}
        {children}
      </>
    );
  }

  return (
    <div
      key="hr-stage"
      ref={stageRef}
      className={isLid ? "hr-stage hr-stage--lid" : "hr-stage"}
    >
      <div ref={heroRef} className="hr-sticky">
        {hero}
      </div>
      <div ref={underRef} className="hr-under">
        {children}
      </div>
    </div>
  );
}
