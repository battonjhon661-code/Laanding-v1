"use client";
import { useEffect, useRef, useState } from "react";

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const stage = stageRef.current;
    const mirror = mirrorRef.current;
    const footer = footerRef.current;
    if (!stage || !mirror || !footer) return;

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
    };
  }, [isMobile]);

  if (isMobile) {
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: mirrorHtml }} />
        <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
      </>
    );
  }

  return (
    <div ref={stageRef} className="mr-stage">
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
