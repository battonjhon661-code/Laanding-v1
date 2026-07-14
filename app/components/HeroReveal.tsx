"use client";
import { useEffect, useRef, useState, ReactNode } from "react";

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function smoothstep(v: number) {
  return v * v * (3 - 2 * v);
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
    const over = heroRef.current;
    const under = underRef.current;
    if (!stage || !over || !under) return;

    let underH = under.offsetHeight;

    function resize() {
      underH = under!.offsetHeight;
      stage!.style.height = `${window.innerHeight + underH}px`;
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

      over!.style.transform = `translate3d(0, ${(-eased * underH).toFixed(1)}px, 0)`;
      under!.style.transform = `translate3d(0, ${((1 - eased) * 24).toFixed(1)}px, 0)`;

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
        {hero}
        {children}
      </>
    );
  }

  return (
    <div ref={stageRef} className="hr-stage">
      <div className="hr-sticky">
        <div ref={underRef} className="hr-under">
          {children}
        </div>
        <div ref={heroRef} className="hr-over">
          {hero}
        </div>
      </div>
    </div>
  );
}
