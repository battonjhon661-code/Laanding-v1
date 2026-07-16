"use client";
import { useEffect, useRef, useState, ReactNode } from "react";

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
    const heroEl = heroRef.current;
    if (!heroEl) return;

    let rafId: number;
    function tick() {
      const rect = heroEl!.getBoundingClientRect();
      const progress = clamp(-rect.top / window.innerHeight, 0, 1);
      heroEl!.style.transform = `translate3d(0, ${(-progress * 30).toFixed(1)}px, 0)`;
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
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
      <div ref={heroRef} className="hr-sticky">
        {hero}
      </div>
      <div className="hr-under">
        {children}
      </div>
    </div>
  );
}
