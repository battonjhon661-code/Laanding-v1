// @ts-nocheck
"use client";
import { useEffect, useRef } from "react";
import { useSiteVersion, useIsMobile } from "./useFlatLayout";

function clamp(v: number, lo = 0, hi = 1) { return Math.min(hi, Math.max(lo, v)); }
function ss(e0: number, e1: number, v: number) {
  const t = clamp((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

const SLIDES = [
  { img: "/gym.png",      title: "СТЕКЛЯННЫЕ РЕШЕНИЯ",         sub: "Для вашего пространства" },
  { img: "/balcony.png",  title: "ШИРОКИЙ ВЫБОР МАТЕРИАЛОВ",   sub: "Зеркала, стёкла, триплекс" },
  { img: "/bedroom.png",  title: "ПРИМЕРЫ НАШИХ РАБОТ",         sub: "Реализованные проекты" },
  { img: "/back-13.jpg",  title: "СВЯЖИТЕСЬ С НАМИ",            sub: "+7 (495) 111-22-33" },
] as const;

// Scroll zones per transition:
const DWELL_VH = 1; // viewer rests on a slide (100vh of scroll does nothing visual)
const TRANS_VH = 2; // the glass transition consumes this much scroll (200vh)

function GlassPanelStage() {
  const stageRef   = useRef<HTMLDivElement>(null);

  // Visual layer refs
  const bRef       = useRef<HTMLDivElement>(null); // next slide (behind)
  const aRef       = useRef<HTMLDivElement>(null); // current slide (transforms into glass)
  const glassRef   = useRef<HTMLDivElement>(null); // glass surface (mirrors A's transform)

  // Label refs
  const la0TitleRef = useRef<HTMLSpanElement>(null);
  const la0SubRef   = useRef<HTMLSpanElement>(null);
  const la1TitleRef = useRef<HTMLSpanElement>(null);
  const la1SubRef   = useRef<HTMLSpanElement>(null);
  const la0Ref      = useRef<HTMLDivElement>(null);
  const la1Ref      = useRef<HTMLDivElement>(null);

  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stageEl = stageRef.current;
    const bEl     = bRef.current;
    const aEl     = aRef.current;
    const glassEl = glassRef.current;
    const la0El   = la0Ref.current;
    const la1El   = la1Ref.current;
    if (!stageEl || !bEl || !aEl || !glassEl || !la0El || !la1El) return;

    const N = SLIDES.length;
    let vh        = window.innerHeight;
    let stageTop  = 0;
    let frameId   = 0;
    let lastAIdx  = -1;

    const resize = () => {
      vh       = window.innerHeight;
      stageTop = stageEl.getBoundingClientRect().top + window.scrollY;
    };
    resize();

    const syncContent = (aIdx: number, bIdx: number) => {
      if (aIdx === lastAIdx) return;
      lastAIdx = aIdx;

      aEl.style.backgroundImage = `url(${SLIDES[aIdx].img})`;
      bEl.style.backgroundImage = `url(${SLIDES[bIdx].img})`;

      if (la0TitleRef.current) la0TitleRef.current.textContent = SLIDES[aIdx].title;
      if (la0SubRef.current)   la0SubRef.current.textContent   = SLIDES[aIdx].sub;
      if (la1TitleRef.current) la1TitleRef.current.textContent = bIdx < N ? SLIDES[bIdx].title : "";
      if (la1SubRef.current)   la1SubRef.current.textContent   = bIdx < N ? SLIDES[bIdx].sub   : "";

      // Update dots
      const dots = dotsRef.current?.children;
      if (dots) {
        for (let i = 0; i < dots.length; i++) {
          (dots[i] as HTMLElement).classList.toggle("v7-dot--active", i === aIdx);
        }
      }
    };

    // Initial state
    syncContent(0, 1);
    bEl.style.opacity   = "0";
    la1El.style.opacity = "0";

    const draw = () => {
      frameId = 0;
      const maxScroll = (N - 1) * (DWELL_VH + TRANS_VH) * vh;
      const scrolled  = clamp(window.scrollY - stageTop, 0, maxScroll);

      const zoneVh  = (DWELL_VH + TRANS_VH) * vh;
      const zoneF   = scrolled / zoneVh;
      const zoneI   = Math.floor(Math.min(zoneF, N - 1.0001));
      const zoneRem = scrolled - zoneI * zoneVh;

      const inTrans = zoneI < N - 1 && zoneRem > DWELL_VH * vh;
      const p       = inTrans ? clamp((zoneRem - DWELL_VH * vh) / (TRANS_VH * vh)) : 0;

      const aIdx = zoneI;
      const bIdx = Math.min(zoneI + 1, N - 1);
      syncContent(aIdx, bIdx);

      if (!inTrans) {
        // Idle — A fills viewport
        aEl.style.transform  = "";
        aEl.style.opacity    = "1";
        aEl.style.filter     = "";
        glassEl.style.transform   = "";
        glassEl.style.opacity     = "0";
        glassEl.style.background  = "";
        glassEl.style.boxShadow   = "";
        bEl.style.opacity    = "0";
        bEl.style.transform  = "scale(1.04)";
        la0El.style.opacity  = "1";
        la0El.style.transform = "translateY(0)";
        la1El.style.opacity  = "0";
        la1El.style.transform = "translateY(14px)";
        return;
      }

      // ── Phase map ───────────────────────────────────────────
      // p 0→0.50  A shrinks
      // p 0→0.20  glass surface fades in
      // p 0.28→0.70  panel tilts (rotateY)
      // p 0.65→1.00  A fades out (glass disappears with it)
      // p 0.35→0.90  B scales + fades in

      const scaleA  = 1 - ss(0.0,  0.50, p) * 0.10;   // 1.00 → 0.90
      const rotY    = ss(0.28, 0.70, p) * 13.5;          // 0 → 13.5 deg
      const rotX    = ss(0.33, 0.64, p) * 2.0;           // 0 → 2 deg
      const opA     = 1 - ss(0.65, 1.00, p);             // 1 → 0 (late)
      const brtA    = 1 - ss(0.30, 0.72, p) * 0.07;     // subtle darkening

      // Build transform (perspective FIRST)
      const tfm = `perspective(1500px) scale(${scaleA.toFixed(4)}) rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg)`;

      aEl.style.transform = tfm;
      aEl.style.opacity   = opA.toFixed(3);
      aEl.style.filter    = `brightness(${brtA.toFixed(3)})`;

      // ── Glass surface: same transform as A ──────────────────
      const glassOp  = ss(0.14, 0.50, p) * (1 - ss(0.70, 1.00, p));
      const specX    = 48 + rotY * 1.8; // highlight walks right as panel tilts
      const specAngle = 105 + rotY * 0.8;

      glassEl.style.transform  = tfm;
      glassEl.style.opacity    = glassOp.toFixed(3);
      glassEl.style.background = [
        `linear-gradient(${specAngle.toFixed(1)}deg,`,
        `  transparent 0%,`,
        `  rgba(255,255,255,0.015) ${Math.max(0, specX - 22).toFixed(1)}%,`,
        `  rgba(255,255,255,0.092) ${specX.toFixed(1)}%,`,
        `  rgba(255,255,255,0.015) ${Math.min(100, specX + 22).toFixed(1)}%,`,
        `  transparent 100%),`,
        `linear-gradient(180deg,`,
        `  rgba(255,255,255,0.04) 0%, transparent 18%,`,
        `  transparent 82%, rgba(255,255,255,0.04) 100%)`,
      ].join("");

      // Edge glint: lit edge (left side when rotateY > 0)
      if (rotY > 1) {
        const edgePx  = (rotY * 0.55).toFixed(1);
        const edgeOp  = (rotY / 13.5 * 0.18).toFixed(3);
        glassEl.style.boxShadow = [
          `inset ${edgePx}px 0 ${(rotY * 2.5).toFixed(1)}px rgba(255,255,255,${edgeOp}),`,
          `inset -1px 0 3px rgba(255,255,255,0.03),`,
          `0 0 0 0.5px rgba(255,255,255,${(glassOp * 0.35).toFixed(3)})`,
        ].join("");
      } else {
        glassEl.style.boxShadow = "";
      }

      // ── B: emerges from behind ───────────────────────────────
      const scaleB = 1.04 - ss(0.40, 1.0, p) * 0.04; // 1.04 → 1.00
      const opB    = ss(0.35, 0.88, p);

      bEl.style.transform = `scale(${scaleB.toFixed(4)})`;
      bEl.style.opacity   = opB.toFixed(3);

      // ── Labels ───────────────────────────────────────────────
      const la0Op = 1 - ss(0.0, 0.32, p);
      const la0Ty = ss(0.0, 0.32, p) * -16;
      la0El.style.opacity   = la0Op.toFixed(3);
      la0El.style.transform = `translateY(${la0Ty.toFixed(1)}px)`;

      const la1Op = ss(0.76, 1.0, p);
      const la1Ty = (1 - ss(0.76, 1.0, p)) * 18;
      la1El.style.opacity   = la1Op.toFixed(3);
      la1El.style.transform = `translateY(${la1Ty.toFixed(1)}px)`;
    };

    const onScroll = () => { if (!frameId) frameId = requestAnimationFrame(draw); };
    const onResize = () => { resize(); onScroll(); };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize,  { passive: true });
    draw();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const N = SLIDES.length;
  // height = (N-1) zones of (DWELL+TRANS)×100vh + 1 final viewport
  const stageH = `${((N - 1) * (DWELL_VH + TRANS_VH) + 1) * 100}vh`;

  return (
    <div ref={stageRef} className="v7-stage" style={{ height: stageH }}>
      <div className="v7-sticky">

        {/* Layer 1 (z:1): next slide background */}
        <div ref={bRef} className="v7-slide v7-slide-b" />

        {/* Layer 2 (z:2): current slide → transforms into glass panel */}
        <div ref={aRef} className="v7-slide v7-slide-a" />

        {/* Layer 3 (z:3): glass surface (follows A's transform) */}
        <div ref={glassRef} className="v7-glass-surface" aria-hidden="true" />

        {/* Layer 4 (z:10): labels — do NOT transform */}
        <div ref={la0Ref} className="v7-label v7-label-cur">
          <span ref={la0TitleRef} className="v7-label-title">{SLIDES[0].title}</span>
          <span ref={la0SubRef}   className="v7-label-sub">{SLIDES[0].sub}</span>
        </div>
        <div ref={la1Ref} className="v7-label v7-label-nxt">
          <span ref={la1TitleRef} className="v7-label-title" />
          <span ref={la1SubRef}   className="v7-label-sub" />
        </div>

        {/* Slide progress indicator */}
        <div ref={dotsRef} className="v7-dots" aria-hidden="true">
          {SLIDES.map((_, i) => (
            <div key={i} className={`v7-dot${i === 0 ? " v7-dot--active" : ""}`} />
          ))}
        </div>

        {/* Scroll hint (disappears after first transition) */}
        <div className="v7-scroll-hint" aria-hidden="true">
          <span>SCROLL</span>
          <div className="v7-scroll-line" />
        </div>
      </div>
    </div>
  );
}

export default function GlassPanelSlides() {
  return null;
}
