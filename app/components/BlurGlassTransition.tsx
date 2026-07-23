"use client";
import { useEffect } from "react";
import { useSiteVersion, useIsMobile } from "./useFlatLayout";

/**
 * Clean blur transition for variant 0.
 * При скролле вниз связка хиро+витрина блюрится и отблюривается в блок
 * «наше Стекло создаёт пространство и уют» (#slide2).
 * Никаких fixed backdrop-filter слоёв: они давали полосы/артефакты поверх sticky-блоков.
 */
function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export default function BlurGlassTransition() {
  const version = useSiteVersion();
  const isMobile = useIsMobile();
  const active = version === "0" && !isMobile;

  useEffect(() => {
    if (!active) return;
    const heroLid = document.querySelector(".hero-lid") as HTMLElement | null;
    const slide2 = document.querySelector("#slide2") as HTMLElement | null;
    if (!heroLid || !slide2) return;

    const prevHeroFilter = heroLid.style.filter;
    const prevHeroWebkitFilter = heroLid.style.getPropertyValue("-webkit-filter");
    const prevHeroOpacity = heroLid.style.opacity;
    const prevHeroPointerEvents = heroLid.style.pointerEvents;
    const prevHeroWillChange = heroLid.style.willChange;
    const prevSlideFilter = slide2.style.filter;
    const prevSlideWebkitFilter = slide2.style.getPropertyValue("-webkit-filter");
    const prevSlideWillChange = slide2.style.willChange;

    heroLid.style.willChange = "filter, opacity";
    slide2.style.willChange = "filter";

    let raf = 0;

    function setBlur(el: HTMLElement, px: number) {
      const value = px > 0.05 ? `blur(${px.toFixed(1)}px)` : "";
      el.style.filter = value;
      if (value) el.style.setProperty("-webkit-filter", value);
      else el.style.removeProperty("-webkit-filter");
    }

    function update() {
      raf = 0;
      const vh = window.innerHeight;
      const heroRect = heroLid!.getBoundingClientRect();
      // Progress follows the real handoff: 0 while the hero+showcase lid still
      // fills the viewport, 1 when that lid has fully left and #slide2 owns it.
      const p = clamp(1 - heroRect.bottom / vh, 0, 1);

      const heroBlur = smoothstep(0.05, 1.0, p) * 18;
      const slideBlur = (1 - smoothstep(0.0, 0.92, p)) * 24;
      const heroOpacity = 1 - smoothstep(0.28, 1.0, p);

      setBlur(heroLid!, heroBlur);
      setBlur(slide2!, slideBlur);
      heroLid!.style.opacity = heroOpacity < 0.999 ? heroOpacity.toFixed(3) : "";
      heroLid!.style.pointerEvents = heroOpacity < 0.05 ? "none" : prevHeroPointerEvents;
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      heroLid.style.filter = prevHeroFilter;
      if (prevHeroWebkitFilter) heroLid.style.setProperty("-webkit-filter", prevHeroWebkitFilter);
      else heroLid.style.removeProperty("-webkit-filter");
      heroLid.style.opacity = prevHeroOpacity;
      heroLid.style.pointerEvents = prevHeroPointerEvents;
      heroLid.style.willChange = prevHeroWillChange;
      slide2.style.filter = prevSlideFilter;
      if (prevSlideWebkitFilter) slide2.style.setProperty("-webkit-filter", prevSlideWebkitFilter);
      else slide2.style.removeProperty("-webkit-filter");
      slide2.style.willChange = prevSlideWillChange;
    };
  }, [active]);

  return null;
}
