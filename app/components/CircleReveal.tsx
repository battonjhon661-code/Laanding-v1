"use client";
import { useEffect, useRef, useState, ReactNode } from "react";

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
function easeOutCubic(v: number) {
  return 1 - Math.pow(1 - v, 3);
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
    const light = lightRef.current;
    const dark = darkRef.current;
    if (!stage || !light || !dark) return;

    let ticking = false;

    function update() {
      const rect = stage!.getBoundingClientRect();
      const offsetPx = window.innerHeight * 2;
      const totalScroll = stage!.offsetHeight - window.innerHeight;
      const scrollable = totalScroll - offsetPx;
      if (scrollable <= 0) { ticking = false; return; }

      const scrolled = Math.max(0, -rect.top - offsetPx);
      const raw = clamp(scrolled / scrollable, 0, 1);
      const eased = easeOutCubic(raw);
      const topInset = (1 - eased) * 100;

      light!.style.clipPath = `inset(${topInset.toFixed(2)}% 0 0 0)`;
      light!.style.pointerEvents = raw > 0.85 ? "auto" : "none";
      dark!.style.opacity = (1 - raw * 0.5).toFixed(4);
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
    };
  }, [isMobile]);

  if (isMobile) {
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: darkHtml }} />
        {children}
      </>
    );
  }

  return (
    <div ref={stageRef} className="cr-stage">
      <div className="cr-sticky">
        <div
          ref={darkRef}
          className="cr-dark"
          dangerouslySetInnerHTML={{ __html: darkHtml }}
        />
        <div ref={lightRef} className="cr-light">
          {children}
        </div>
      </div>
    </div>
  );
}
