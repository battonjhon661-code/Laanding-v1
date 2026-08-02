// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";
import { useSiteVersion, useIsMobile } from "./useFlatLayout";

/**
 * Скролл-переход «Примеры работ» → «Наши работы вписываются…» (версия 2).
 *
 * Три фазы:
 * 1. Контент примеров постепенно тает (opacity экрана примеров 1→0).
 * 2. Белый круг вырастает из центра экрана, заполняя его целиком.
 * 3. Блок зеркал плавно проявляется поверх белого.
 *
 * Архитектура: vz-transition-section = нахлёст на нижние 260vh cr-stage
 * (margin-top: -260vh). cr-stage z-index:3 > vz z-index:1, поэтому примеры
 * стоят поверх холста. JS гасит .cr-stage .cr-sticky напрямую (opacity),
 * а под ними уже играет белый круг.
 */

function clamp(v: number, lo = 0, hi = 1) { return Math.min(hi, Math.max(lo, v)); }
function ss(e0: number, e1: number, v: number) {
  const t = clamp((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

function GlassStage({ mirrorHtml, footerHtml }: { mirrorHtml: string; footerHtml: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const mirRef     = useRef<HTMLDivElement>(null);
  const footerRef  = useRef<HTMLDivElement>(null);
  const whiteRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section   = sectionRef.current;
    const mirWrap   = mirRef.current;
    const footerWrap = footerRef.current;
    const whiteEl   = whiteRef.current;
    if (!section || !mirWrap || !footerWrap || !whiteEl) return;

    // Живой закреплённый блок примеров (в cr-stage поверх нас): гасим его opacity.
    const exSticky = document.querySelector(".cr-stage .cr-sticky") as HTMLElement | null;

    // Зеркальный блок внутри vz-mir проявляем сразу в «раскрытом» состоянии.
    const mirSection = mirWrap.querySelector(".mirror-section") as HTMLElement | null;
    if (mirSection) mirSection.classList.add("mirror-visible");

    let mirrorTravelPx      = window.innerHeight * 1.6;
    let footerH             = 400;
    let targetProgress      = 0;
    let easedProgress       = 0;
    let targetFooterProgress = 0;
    let easedFooterProgress  = 0;
    let frameId             = 0;
    let destroyed           = false;

    const resize = () => {
      const footerEl = footerWrap!.querySelector(".site-footer") as HTMLElement | null;
      footerH          = footerEl ? footerEl.offsetHeight : 400;
      mirrorTravelPx   = Math.max(1, window.innerHeight * 1.6);
      section!.style.height = `${window.innerHeight + mirrorTravelPx + footerH}px`;
    };

    const updateTarget = () => {
      const rect   = section!.getBoundingClientRect();
      const scrolled = Math.max(0, -rect.top);
      targetProgress      = clamp(scrolled / mirrorTravelPx);
      targetFooterProgress = clamp((scrolled - mirrorTravelPx) / Math.max(1, footerH));
    };

    const draw = (p: number) => {
      // Фаза 1 (0 → 0.38): примеры постепенно тают
      const fade = ss(0.04, 0.38, p);
      if (exSticky) {
        exSticky.style.opacity      = (1 - fade).toFixed(3);
        exSticky.style.pointerEvents = fade > 0.35 ? "none" : "";
      }

      // Фаза 2 (0.32 → 0.80): белый круг вырастает из центра
      const circleP = ss(0.32, 0.80, p);
      whiteEl!.style.clipPath = `circle(${(circleP * 145).toFixed(2)}% at 50% 50%)`;

      // Фаза 3 (0.74 → 1.0): зеркальный блок проявляется поверх белого
      const mirrorP = ss(0.74, 1.0, p);
      mirWrap!.style.opacity = mirrorP.toFixed(3);
    };

    const tick = () => {
      frameId = 0;
      if (destroyed) return;

      easedProgress += (targetProgress - easedProgress) * 0.105;
      if (Math.abs(targetProgress - easedProgress) < 0.0005) easedProgress = targetProgress;

      const footerPhase  = targetProgress >= 0.999;
      const footerReady  = footerPhase && easedProgress > 0.995;
      const footerTarget = footerReady ? targetFooterProgress : 0;
      section!.classList.toggle("is-footer-phase", footerPhase);

      easedFooterProgress += (footerTarget - easedFooterProgress) * 0.1;
      if (Math.abs(footerTarget - easedFooterProgress) < 0.0005) easedFooterProgress = footerTarget;

      const fp           = easedFooterProgress * easedFooterProgress * (3 - 2 * easedFooterProgress);
      const footerVisible = footerReady && easedFooterProgress > 0.002;
      mirWrap!.style.transform   = `translate3d(0, ${(-fp * footerH).toFixed(1)}px, 0)`;
      footerWrap!.style.transform = `translate3d(0, ${((1 - fp) * 24).toFixed(1)}px, 0)`;
      footerWrap!.style.opacity   = footerVisible ? "1" : "0";
      footerWrap!.style.visibility = footerVisible ? "visible" : "hidden";

      draw(easedProgress);

      if (Math.abs(targetProgress - easedProgress) > 0.0005 ||
          Math.abs(targetFooterProgress - easedFooterProgress) > 0.0005) {
        frameId = requestAnimationFrame(tick);
      }
    };

    const scheduleDraw = () => { if (!frameId) frameId = requestAnimationFrame(tick); };
    const onScroll     = () => { updateTarget(); scheduleDraw(); };

    resize();
    updateTarget();
    scheduleDraw();

    window.addEventListener("resize", resize,   { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      destroyed = true;
      if (frameId) cancelAnimationFrame(frameId);
      section!.style.height = "";
      section!.classList.remove("is-footer-phase");
      if (exSticky) { exSticky.style.opacity = ""; exSticky.style.pointerEvents = ""; }
      mirWrap!.style.opacity   = "";
      mirWrap!.style.transform  = "";
      footerWrap!.style.opacity = "";
      footerWrap!.style.visibility = "";
      footerWrap!.style.transform  = "";
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className="vz-transition-section">
      <div className="vz-pin-stage">
        <div ref={footerRef} className="vz-footer-under" dangerouslySetInnerHTML={{ __html: footerHtml }} />
        <div ref={mirRef} className="vz-mir" dangerouslySetInnerHTML={{ __html: mirrorHtml }} />
        <div ref={whiteRef} className="vz-white-circle" aria-hidden="true" />
      </div>
    </section>
  );
}

export default function VariantZeroTransition({
  mirrorHtml,
  footerHtml,
}: {
  mirrorHtml: string;
  footerHtml: string;
}) {
  const version  = useSiteVersion();
  const isMobile = useIsMobile();
  const active   = version === "2" && !isMobile;
  return active ? <GlassStage mirrorHtml={mirrorHtml} footerHtml={footerHtml} /> : null;
}
