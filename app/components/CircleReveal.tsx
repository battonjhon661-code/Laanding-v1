"use client";
import { useEffect, useRef, ReactNode } from "react";

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

  useEffect(() => {
    const stage = stageRef.current;
    const light = lightRef.current;
    const dark = darkRef.current;
    if (!stage || !light || !dark) return;

    let ticking = false;

    function update() {
      const rect = stage!.getBoundingClientRect();
      const scrollable = stage!.offsetHeight - window.innerHeight;
      if (scrollable <= 0) { ticking = false; return; }

      const raw = clamp(-rect.top / scrollable, 0, 1);
      const eased = easeOutCubic(raw);
      const maxR = Math.hypot(window.innerWidth / 2, window.innerHeight / 2) * 1.16;

      light!.style.clipPath = `circle(${(eased * maxR).toFixed(1)}px at 50% 50%)`;
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
  }, []);

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
