"use client";
import { useEffect, useRef } from "react";
import { useFlatLayout, useSiteVersion, useIsMobile } from "./useFlatLayout";

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function smoothstep(v: number) {
  return v * v * (3 - 2 * v);
}

export default function MirrorReveal({
  mirrorHtml,
  footerHtml,
}: {
  mirrorHtml: string;
  footerHtml: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const flatMirrorRef = useRef<HTMLDivElement>(null);
  const isFlat = useFlatLayout();
  const isMobile = useIsMobile();
  const version = useSiteVersion();
  const isV0 = version === "2";
  const isV2 = version === "4";
  const isV4 = version === "3";
  const isV5 = version === "1";
  const isV7Desktop = version === "7" && !isMobile;
  useEffect(() => {
    if (isFlat || isV0 || isV2 || isV4 || isV5 || isV7Desktop) return;
    const stage = stageRef.current;
    const mirror = mirrorRef.current;
    const footer = footerRef.current;
    if (!stage || !mirror || !footer) return;

    // Mirror section must be in its revealed state immediately (no entry animation).
    const mirSection = mirror.querySelector(".mirror-section") as HTMLElement | null;
    if (mirSection) mirSection.classList.add("mirror-visible");

    const footerEl = footer.querySelector(".site-footer") as HTMLElement | null;
    let footerH = footerEl ? footerEl.offsetHeight : 400;

    function resize() {
      footerH = footerEl ? footerEl.offsetHeight : 400;
      stage!.style.height = `${window.innerHeight + footerH}px`;
    }
    resize();
    window.addEventListener("resize", resize);

    let progress = 0;
    let target = 0;
    let rafId: number;

    function tick() {
      const rect = stage!.getBoundingClientRect();
      const travel = stage!.offsetHeight - window.innerHeight;
      if (travel > 0) {
        target = clamp(-rect.top / travel, 0, 1);
      }

      progress += (target - progress) * 0.1;
      const p = Math.round(progress * 10000) / 10000;
      const eased = smoothstep(p);

      mirror!.style.transform = `translate3d(0, ${(-eased * footerH).toFixed(1)}px, 0)`;
      footer!.style.transform = `translate3d(0, ${((1 - eased) * 24).toFixed(1)}px, 0)`;

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      // These are written imperatively, so React will not clean them up if the
      // node is reused by the mobile branch.
      stage.style.height = "";
      mirror.style.transform = "";
      footer.style.transform = "";
    };
  }, [isFlat, isV0, isV2, isV4, isV5, isV7Desktop]);

  // На мобилке initProdScripts() запускается до того, как isFlat становится true,
  // поэтому #mirror ещё нет в DOM и observer из prod-init не вешается.
  // Вешаем observer здесь, прямо там, где рендерим секцию.
  useEffect(() => {
    if (!isFlat) return;
    const section = flatMirrorRef.current?.querySelector('.mirror-section') as HTMLElement | null;
    if (!section) return;
    if (section.classList.contains('mirror-visible')) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        section.classList.add('mirror-visible');
        io.disconnect();
      }
    }, { threshold: 0.15 });
    io.observe(section);
    return () => io.disconnect();
  }, [isFlat]);

  if (isFlat) {
    // Keys keep React from reusing the .mr-stage node here, which would carry
    // over the inline height the desktop effect sets on it.
    return (
      <>
        <div key="mirror-mobile" ref={flatMirrorRef} dangerouslySetInnerHTML={{ __html: mirrorHtml }} />
        <div key="footer-mobile" dangerouslySetInnerHTML={{ __html: footerHtml }} />
      </>
    );
  }

  // v1/v7 (bg morph) and v4/circle (wipe) show the mirror inside CircleReveal,
  // so here we render only the footer that follows it.
  if (isV5 || isV7Desktop || isV2) {
    return <div key="footer-cr" dangerouslySetInnerHTML={{ __html: footerHtml }} />;
  }

  // v0/v4 have their own dedicated mirror transition components.
  if (isV0 || isV4) {
    return null;
  }

  return (
    <div key={isV0 ? "mr-stage-v0" : "mr-stage"} ref={stageRef} className="mr-stage">
      <div className="mr-sticky">
        <div
          ref={footerRef}
          className="mr-under"
          dangerouslySetInnerHTML={{ __html: footerHtml }}
        />
        <div
          ref={mirrorRef}
          className="mr-over"
          dangerouslySetInnerHTML={{ __html: mirrorHtml }}
        />
      </div>
    </div>
  );
}
