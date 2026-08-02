"use client";
import { useEffect, useRef } from "react";
import { useSiteVersion, useIsMobile } from "./useFlatLayout";

type Phase = "idle" | "ice" | "done";

function makeRNG(seed: number) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return (s >>> 0) / 0x100000000;
  };
}

interface Spike {
  sx: number; sy: number;
  angle: number; maxLen: number; birthT: number; opa: number;
  branches: { t: number; a: number; lr: number }[];
}

function buildSpikes(w: number, h: number): Spike[] {
  const rng = makeRNG(42);
  const result: Spike[] = [];
  const mid = Math.sqrt(w * w + h * h) * 0.52;

  const add = (sx: number, sy: number, angle: number) => {
    const len = mid * (0.45 + rng() * 0.45);
    const n = 2 + (rng() > 0.65 ? 1 : 0);
    result.push({
      sx, sy, angle,
      maxLen: len,
      birthT: rng() * 0.22,
      opa: 0.55 + rng() * 0.45,
      branches: Array.from({ length: n }, () => ({
        t: 0.3 + rng() * 0.5,
        a: angle + (rng() > 0.5 ? 1 : -1) * (Math.PI / 6 + rng() * Math.PI / 7),
        lr: 0.22 + rng() * 0.2,
      })),
    });
  };

  const N = 10;
  for (let i = 0; i < N; i++) {
    const t = (i + 0.3 + rng() * 0.4) / N;
    add(w * t, 0, Math.PI / 2 + (rng() - 0.5) * 0.7);
    add(w * t, h, -Math.PI / 2 + (rng() - 0.5) * 0.7);
    add(0, h * t, (rng() - 0.5) * 0.7);
    add(w, h * t, Math.PI + (rng() - 0.5) * 0.7);
  }
  add(0, 0, Math.PI * 0.25 + (rng() - 0.5) * 0.3);
  add(w, 0, Math.PI * 0.75 + (rng() - 0.5) * 0.3);
  add(0, h, -Math.PI * 0.25 + (rng() - 0.5) * 0.3);
  add(w, h, -Math.PI * 0.75 + (rng() - 0.5) * 0.3);
  return result;
}

export default function IceFractureTransition() {
  const version = useSiteVersion();
  const isMobile = useIsMobile();
  const active = version === "6" && !isMobile;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<Phase>("idle");
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    let w = 0, h = 0, dpr = 1;
    let spikes: Spike[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spikes = buildSpikes(w, h);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Block scroll during ice animation
    const blockWheel = (e: WheelEvent) => {
      if (phaseRef.current === "ice") e.preventDefault();
    };
    const blockTouch = (e: TouchEvent) => {
      if (phaseRef.current === "ice") e.preventDefault();
    };
    const blockKey = (e: KeyboardEvent) => {
      const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Spacebar", "End", "Home"];
      if (keys.includes(e.key) && phaseRef.current === "ice") e.preventDefault();
    };
    window.addEventListener("wheel", blockWheel, { passive: false, capture: true });
    window.addEventListener("touchmove", blockTouch, { passive: false, capture: true });
    window.addEventListener("keydown", blockKey, { capture: true });

    // ── ICE DRAW ────────────────────────────────────────────────
    const drawIce = (p: number) => {
      ctx.clearRect(0, 0, w, h);
      // p: 0→0.5 freeze, 0.5→1 melt
      const freeze = Math.min(1, p / 0.5);
      const melt = p > 0.5 ? Math.min(1, (p - 0.5) / 0.5) : 0;

      // Blue tint
      const tA = Math.max(0, freeze * 0.4 - melt * 0.55);
      if (tA > 0.005) { ctx.fillStyle = `rgba(55,110,210,${tA})`; ctx.fillRect(0, 0, w, h); }

      // Frost areas from corners + edge strips
      const fA = Math.max(0, freeze * 0.9 - melt * 2.2);
      if (fA > 0.01) {
        const maxR = Math.sqrt(w * w + h * h) * 0.73;
        ctx.save();
        ctx.globalAlpha = fA;
        ctx.fillStyle = "rgba(220,240,255,1)";
        for (const [fcx, fcy] of [[0,0],[w,0],[0,h],[w,h]] as [number,number][]) {
          ctx.beginPath(); ctx.arc(fcx, fcy, freeze * maxR, 0, Math.PI * 2); ctx.fill();
        }
        const eIn = Math.max(0, (freeze - 0.18) / 0.82);
        if (eIn > 0) {
          const s = eIn * Math.min(w, h) * 0.21;
          ctx.fillRect(0, 0, w, s); ctx.fillRect(0, h - s, w, s);
          ctx.fillRect(0, 0, s, h); ctx.fillRect(w - s, 0, s, h);
        }
        ctx.restore();
      }

      // Crystal spikes
      const sA = Math.max(0, fA * 0.78);
      if (sA > 0.01) {
        for (const sp of spikes) {
          const lp = Math.max(0, (freeze - sp.birthT) / Math.max(0.01, 1 - sp.birthT));
          const len = lp * sp.maxLen;
          if (len < 2) continue;
          const ex = sp.sx + Math.cos(sp.angle) * len;
          const ey = sp.sy + Math.sin(sp.angle) * len;
          ctx.strokeStyle = `rgba(170,215,255,${sA * sp.opa})`;
          ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(sp.sx, sp.sy); ctx.lineTo(ex, ey); ctx.stroke();
          for (const b of sp.branches) {
            const bx = sp.sx + Math.cos(sp.angle) * len * b.t;
            const by = sp.sy + Math.sin(sp.angle) * len * b.t;
            const bl2 = len * b.lr;
            ctx.strokeStyle = `rgba(195,228,255,${sA * sp.opa * 0.5})`;
            ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(b.a) * bl2, by + Math.sin(b.a) * bl2); ctx.stroke();
          }
        }
      }
    };

    const playIce = () => {
      phaseRef.current = "ice";
      canvas.style.display = "block";
      const DUR = 2800, SCROLL_AT = 0.50;
      let scrolledToExamples = false;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / DUR);
        drawIce(p);
        // At max freeze (screen fully covered): secretly scroll to slide2 —
        // the melt phase then reveals it from under the dissolving ice.
        if (!scrolledToExamples && p >= SCROLL_AT) {
          scrolledToExamples = true;
          const el = document.getElementById("v6-slide2-anchor");
          if (el) {
            // getBoundingClientRect gives absolute position regardless of offsetParent.
            window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "auto" });
          }
        }
        if (p < 1) { rafRef.current = requestAnimationFrame(tick); return; }
        ctx.clearRect(0, 0, w, h);
        canvas.style.display = "none";
        phaseRef.current = "done";
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    // Ice start event (from HeroReveal triggerPhase2)
    const onIceStart = () => {
      if (phaseRef.current !== "idle") return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      playIce();
    };
    window.addEventListener("vg:v6-ice-start", onIceStart);

    // Reset when scrolled back to top
    const onScroll = () => {
      if (window.scrollY <= 2 && phaseRef.current === "done") {
        phaseRef.current = "idle";
        canvas.style.display = "none";
        ctx.clearRect(0, 0, w, h);
        // Восстанавливаем slide2 (могла быть скрыта разрезом)
        const slide2 = document.getElementById("v6-slide2-anchor") as HTMLElement | null;
        if (slide2) { slide2.style.opacity = ""; slide2.style.pointerEvents = ""; }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("wheel", blockWheel, { capture: true } as EventListenerOptions);
      window.removeEventListener("touchmove", blockTouch, { capture: true } as EventListenerOptions);
      window.removeEventListener("keydown", blockKey, { capture: true } as EventListenerOptions);
      window.removeEventListener("vg:v6-ice-start", onIceStart);
      window.removeEventListener("scroll", onScroll);
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9998, pointerEvents: "none", display: "none" }}
    />
  );
}
