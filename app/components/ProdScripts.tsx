"use client";
import { useEffect } from "react";
import { initProdScripts } from "./prod-init";

export default function ProdScripts() {
  useEffect(() => {
    initProdScripts();
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
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        navWrap.style.transition = pendingTransition;
        navWrap.style.transform  = pendingTransform;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
