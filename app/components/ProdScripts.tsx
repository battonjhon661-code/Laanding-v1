"use client";
import { useEffect } from "react";

export default function ProdScripts() {
  useEffect(() => {
    import("./prod-init").then(({ initProdScripts }) => initProdScripts());
  }, []);

  useEffect(() => {
    const navWrap = document.getElementById("navWrap") as HTMLElement | null;
    if (!navWrap) return;

    let lastY = window.scrollY;
    let rafId: number | null = null;
    let pendingTransition = "";
    let pendingTransform  = "";

    const onScroll = () => {
      const y = window.scrollY;
      if (y < 40) {
        pendingTransition = "transform 0.22s cubic-bezier(.4,0,.2,1)";
        pendingTransform  = "";
      } else if (y > lastY) {
        pendingTransition = "transform 0.55s cubic-bezier(.7,0,.2,1)";
        pendingTransform  = "translateY(-100vh)";
      } else {
        pendingTransition = "transform 0.22s cubic-bezier(.4,0,.2,1)";
        pendingTransform  = "";
      }
      lastY = y;

      // ScrollVideoHero is exactly 100vh tall; once scrolled past it, the
      // nav needs a dark backdrop so it stays legible over non-hero content.
      // Kept here (not in prod-init.ts) because that file is regenerated
      // from index-prod.html, which has no knowledge of ScrollVideoHero.
      navWrap.classList.toggle("has-bg", y > window.innerHeight - 4);

      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        navWrap.style.transition = pendingTransition;
        navWrap.style.transform  = pendingTransform;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
