"use client";
import { useEffect } from "react";
import { scrollToFooterAndPulse } from "./scrollToFooter";

export default function ProdScripts() {
  useEffect(() => {
    (window as any).__vipglassScrollToFooter = scrollToFooterAndPulse;
    import("./prod-init").then(({ initProdScripts }) => initProdScripts());
    return () => {
      if ((window as any).__vipglassScrollToFooter === scrollToFooterAndPulse) {
        delete (window as any).__vipglassScrollToFooter;
      }
    };
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest?.('a[href="#footer"]');
      if (!link) return;
      event.preventDefault();
      scrollToFooterAndPulse();
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
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

  // Mobile scroll-reveal. Most of this markup is injected imperatively
  // (ProductSlide builds .exs-mobile, MirrorReveal swaps in the footer), so we
  // rescan on DOM changes rather than tagging once on mount.
  useEffect(() => {
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // [selector, extra class, stagger step in ms]
    const groups: [string, string, number][] = [
      [".exs-mobile > .exm-main-title", "vg-rv-lift", 0],
      [".exs-mobile > .exm-cat-title", "", 80],
      [".exs-mobile > .exm-cat-sub", "", 140],
      [".exs-mobile > .exm-carousel", "", 100],
      [".exs-mobile > .exm-pagination", "", 160],
      [".exs-mobile > .exm-cats-title", "", 80],
      [".exs-mobile > .exm-cats-sub", "", 140],
      [".exs-mobile > .exm-cats-list", "vg-rv-side", 100],
      [".site-footer__contacts", "", 0],
      [".site-footer__contacts .footer-messengers", "", 120],
      [".footer-faq .footer-faq__item", "", 70],
      [".site-footer__brand", "", 0],
      [".site-footer__nav a", "", 60],
      [".footer-meta", "", 120],
    ];

    const tagged = new WeakSet<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("vg-rv-in");
          io.unobserve(e.target);
        }
      },
      // No negative bottom margin: elements that sit flush with the end of the
      // page (.footer-meta) can never clear it once scrolling bottoms out.
      { threshold: 0.12 }
    );

    const scan = () => {
      for (const [selector, extra, step] of groups) {
        document.querySelectorAll(selector).forEach((el, i) => {
          if (tagged.has(el)) return;
          tagged.add(el);

          // Already scrolled past: show it immediately, no animation.
          const r = el.getBoundingClientRect();
          if (r.bottom < 0) {
            el.classList.add("vg-rv", "vg-rv-in");
            return;
          }

          el.classList.add("vg-rv");
          if (extra) el.classList.add(extra);
          if (step) {
            (el as HTMLElement).style.setProperty("--vg-rv-delay", `${i * step}ms`);
          }
          io.observe(el);
        });
      }
    };

    scan();

    let pending = 0;
    const mo = new MutationObserver(() => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net: never leave content stuck at opacity 0.
    const sweep = () => {
      document.querySelectorAll(".vg-rv:not(.vg-rv-in)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          el.classList.add("vg-rv-in");
        }
      });
    };
    const onScroll = () => {
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 2) sweep();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const failsafe = window.setTimeout(sweep, 2500);

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (pending) cancelAnimationFrame(pending);
      clearTimeout(failsafe);
    };
  }, []);

  return null;
}
