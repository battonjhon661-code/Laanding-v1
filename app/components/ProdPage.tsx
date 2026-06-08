"use client";
import { useEffect } from "react";
import prodContent from "./prod-content.json";
import { initProdScripts } from "./prod-init";

export default function ProdPage() {
  useEffect(() => {
    initProdScripts();
  }, []);

  useEffect(() => {
    const navWrap = document.getElementById("navWrap") as HTMLElement | null;
    if (!navWrap) return;

    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      if (y < 40) {
        navWrap.style.transition = "transform 0.22s cubic-bezier(.4,0,.2,1)";
        navWrap.style.transform = "";
      } else if (y > lastY) {
        navWrap.style.transition = "transform 0.55s cubic-bezier(.7,0,.2,1)";
        navWrap.style.transform = "translateY(-100vh)";
      } else {
        navWrap.style.transition = "transform 0.22s cubic-bezier(.4,0,.2,1)";
        navWrap.style.transform = "";
      }
      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: (prodContent as { html: string }).html }} />
  );
}
