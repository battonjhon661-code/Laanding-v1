"use client";
import { useEffect, useRef, ReactNode } from "react";
import { useFlatLayout, useIsMobile, useSiteVersion } from "./useFlatLayout";

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
  const underRef = useRef<HTMLDivElement>(null);
  const isFlat = useFlatLayout();
  const isMobile = useIsMobile();
  const version = useSiteVersion();
  // Вариант 2: шкаф лежит ПОД хиро, хиро уезжает вверх как крышка.
  const isLid = version === "4";
  const isPlainBeforeSlide2 = version === "3";
  // Вариант 6: тот же вылет витрины, что и в 1-м, только снизу вверх.
  // Остальные блоки в 6-м идут монолитом (useFlatLayout), поэтому сюда
  // пробрасываемся в обход flat-ветки.
  const isFlyoutUp = version === "6" && !isMobile;
  const isFlyout = version === "1" || isFlyoutUp;

  useEffect(() => {
    if ((isFlat && !isFlyoutUp) || isPlainBeforeSlide2) return;
    const heroEl = heroRef.current;
    const underEl = underRef.current;
    const stageEl = stageRef.current;
    if (!heroEl || !underEl || !stageEl) return;

    let rafId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let revealDistance = window.innerHeight;

    if (isFlyout) {
      // Scroll-hijack gate: while sitting on the hero, a scroll-down gesture
      // does NOT move the page — it just plays the flyout animation in place.
      // Only once the animation has settled and the gesture goes idle does the
      // gate release, so the *next* scroll actually moves the page onward.
      // Scrolling back up to the hero re-arms it so the transition can replay.
      const OPEN_MS = 720; // matches the CSS transform transition (+margin)
      const IDLE_MS = 180; // gesture must pause this long before releasing

      let passed = false;      // true = gate released, page scrolls freely
      let awayFromTop = false; // page has left the hero at least once
      let openedAt = 0;
      let lastIntent = 0;
      let releaseTimer = 0;
      // Phase 2 (v6 only): one-shot hero-exit animation on the first scroll
      // after the flyout-up has settled.
      let phase2done = !isFlyoutUp;

      const openFlyout = () => {
        if (!stageEl.classList.contains("is-flyout-open")) {
          stageEl.classList.add("is-flyout-open");
          openedAt = performance.now();
        }
      };

      const scheduleRelease = () => {
        window.clearTimeout(releaseTimer);
        releaseTimer = window.setTimeout(() => {
          const now = performance.now();
          if (now - openedAt >= OPEN_MS && now - lastIntent >= IDLE_MS) {
            passed = true; // animation done + gesture idle → let the page move
          } else {
            scheduleRelease();
          }
        }, IDLE_MS);
      };

      const atTop = () => (window.scrollY || window.pageYOffset) <= 1;
      const isOpen = () => stageEl.classList.contains("is-flyout-open");

      const triggerDown = () => {
        lastIntent = performance.now();
        openFlyout();
        scheduleRelease();
      };

      const triggerPhase2 = () => {
        if (phase2done) return;
        phase2done = true;

        if (isFlyoutUp) {
          // v6: dispatch event — IceFractureTransition handles the canvas animation
          // and will scroll to slide2 itself when frost covers the screen.
          window.dispatchEvent(new CustomEvent("vg:v6-ice-start"));
          return;
        }

        const slideEl = document.querySelector(".slide-from-under") as HTMLElement | null;
        stageEl.classList.add("is-hero-exit");
        if (slideEl) slideEl.classList.add("is-entering");
        window.setTimeout(() => {
          // Disable transitions, snap to natural positions, then scroll.
          stageEl.style.transition = "none";
          if (slideEl) slideEl.style.transition = "none";
          stageEl.classList.remove("is-hero-exit");
          if (slideEl) slideEl.classList.remove("is-entering");
          // Force layout flush so offsetTop is accurate after class removal.
          void stageEl.offsetHeight;
          const scrollTarget = slideEl ? slideEl.offsetTop : window.innerHeight;
          window.scrollTo({ top: scrollTarget, behavior: "auto" });
          requestAnimationFrame(() => {
            stageEl.style.removeProperty("transition");
            if (slideEl) slideEl.style.removeProperty("transition");
          });
        }, 720);
      };

      // Scroll-up while the flyout is in AND we're still on the hero: reverse it
      // (fly the showcase back out) and re-arm — the fix for "can't hide it right
      // after opening". Returns true when it handled/consumed the gesture.
      const triggerUp = () => {
        if (!isOpen() || !atTop()) return false;
        stageEl.classList.remove("is-flyout-open");
        window.clearTimeout(releaseTimer);
        passed = false;
        awayFromTop = false;
        return true;
      };

      const onWheel = (e: WheelEvent) => {
        // Horizontal wheel is a zone-swipe for the hero; leave it alone.
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        if (e.deltaY < 0) {
          // Upward: only meaningful right on the hero with the flyout showing.
          if (atTop() && isOpen()) { e.preventDefault(); triggerUp(); }
          return;
        }
        if (e.deltaY === 0) return;
        if (passed) {
          // Phase 2 (v6): intercept the first downward scroll after flyout settles.
          if (!phase2done && atTop()) { e.preventDefault(); triggerPhase2(); }
          return;
        }
        e.preventDefault();
        triggerDown();
      };

      const DOWN_KEYS = ["ArrowDown", "PageDown", "End", " ", "Spacebar"];
      const UP_KEYS = ["ArrowUp", "PageUp", "Home"];
      const onKey = (e: KeyboardEvent) => {
        if (UP_KEYS.includes(e.key) && atTop() && isOpen()) {
          e.preventDefault();
          triggerUp();
          return;
        }
        if (!DOWN_KEYS.includes(e.key)) return;
        if (passed) {
          if (!phase2done && atTop()) { e.preventDefault(); triggerPhase2(); }
          return;
        }
        e.preventDefault();
        triggerDown();
      };

      let touchY = 0;
      const onTouchStart = (e: TouchEvent) => {
        touchY = e.touches[0]?.clientY ?? 0;
      };
      const onTouchMove = (e: TouchEvent) => {
        const dy = touchY - (e.touches[0]?.clientY ?? 0); // >0 = scrolling down
        if (dy < 0) {
          if (atTop() && isOpen()) { e.preventDefault(); triggerUp(); }
          return;
        }
        if (dy === 0) return;
        if (passed) {
          if (!phase2done && atTop()) { e.preventDefault(); triggerPhase2(); }
          return;
        }
        e.preventDefault();
        triggerDown();
      };

      const onScroll = () => {
        const y = window.scrollY || window.pageYOffset;
        if (y > 4) awayFromTop = true;
        if (y <= 1 && awayFromTop && passed) {
          // Back on the hero after leaving — re-arm and reset the transition.
          passed = false;
          awayFromTop = false;
          phase2done = !isFlyoutUp;
          stageEl.classList.remove("is-flyout-open");
        }
      };

      window.addEventListener("wheel", onWheel, { passive: false, capture: true });
      window.addEventListener("keydown", onKey, { passive: false });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("scroll", onScroll, { passive: true });

      return () => {
        window.clearTimeout(releaseTimer);
        window.removeEventListener("wheel", onWheel, { capture: true } as EventListenerOptions);
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("scroll", onScroll);
        stageEl.classList.remove("is-flyout-open");
      };
    }

    const syncStageHeight = () => {
      if (isLid) {
        const underHeight = underEl!.offsetHeight;
        const bottomOffset = Math.max(0, window.innerHeight - underHeight);
        revealDistance = Math.max(1, Math.min(window.innerHeight, underHeight));
        stageEl!.style.setProperty("--hr-under-y", `${bottomOffset}px`);
        stageEl!.style.height = `${window.innerHeight + bottomOffset + underHeight}px`;
      } else {
        revealDistance = window.innerHeight;
        stageEl!.style.removeProperty("--hr-under-y");
        stageEl!.style.height = "";
      }
    };

    syncStageHeight();
    window.addEventListener("resize", syncStageHeight, { passive: true });
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(syncStageHeight);
      resizeObserver.observe(underEl);
    }

    function tick() {
      if (isLid) {
        const rect = stageEl!.getBoundingClientRect();
        const progress = clamp(-rect.top / revealDistance, 0, 1);
        heroEl!.style.transform = `translate3d(0, ${(-progress * revealDistance).toFixed(1)}px, 0)`;
      } else {
        const rect = heroEl!.getBoundingClientRect();
        const progress = clamp(-rect.top / window.innerHeight, 0, 1);
        heroEl!.style.transform = `translate3d(0, ${(-progress * 30).toFixed(1)}px, 0)`;
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", syncStageHeight);
      resizeObserver?.disconnect();
      stageEl.style.removeProperty("--hr-under-y");
      stageEl.style.height = "";
      heroEl.style.transform = "";
      heroEl.style.opacity = "";
      heroEl.style.filter = "";
      underEl.style.transform = "";
      underEl.style.opacity = "";
      underEl.style.filter = "";
    };
  }, [isFlat, isLid, isPlainBeforeSlide2, isFlyout, isFlyoutUp]);

  if (isFlyout) {
    return (
      <div
        key="hr-stage-flyout"
        ref={stageRef}
        className={`hr-stage hr-stage--flyout${isFlyoutUp ? " hr-stage--flyout-up" : ""}`}
      >
        <div ref={heroRef} className="hr-sticky">
          {hero}
          <div ref={underRef} className="hr-under">
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (isFlat || isPlainBeforeSlide2) {
    return (
      <>
        {hero}
        {children}
      </>
    );
  }

  return (
    <div
      key="hr-stage"
      ref={stageRef}
      className={isLid ? "hr-stage hr-stage--lid" : "hr-stage"}
    >
      <div ref={heroRef} className="hr-sticky">
        {hero}
      </div>
      <div ref={underRef} className="hr-under">
        {children}
      </div>
    </div>
  );
}
