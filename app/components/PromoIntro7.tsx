"use client";
import { useEffect, useRef, useState } from "react";
import { useSiteVersion } from "./useFlatLayout";

const PHRASES = [
  "Пространство начинается с деталей.",
  "Свет отражается в каждой грани.",
  "Стекло — это воздух и тишина.",
  "Зеркало создаёт глубину.",
  "Мы не просто продаём стекло.",
  "Мы создаём ваш интерьер.",
];

const VISIBLE_MS = 1700;
const FADE_MS    = 400;
const GAP_MS     = 150;

function delay(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

export default function PromoIntro7() {
  const version = useSiteVersion();
  const active  = version === "7" || version === "8";

  const [mounted, setMounted]       = useState(true);
  const [phraseIdx, setPhraseIdx]   = useState(-1);
  const [phraseVis, setPhraseVis]   = useState(false);
  const [loadPct, setLoadPct]       = useState(0);
  const [logoVisible, setLogoVis]   = useState(false);
  const [logoFlying, setLogoFlying] = useState(false);
  const [overlayOp, setOverlayOp]   = useState(1);

  const cancelRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    document.body.style.overflow = "hidden";
    cancelRef.current = false;

    const go = async () => {
      await delay(200);

      const totalMs = PHRASES.length * (VISIBLE_MS + FADE_MS + GAP_MS);
      const t0 = performance.now();
      const loadTimer = setInterval(() => {
        const pct = Math.min(100, Math.round(((performance.now() - t0) / totalMs) * 100));
        setLoadPct(pct);
      }, 40);

      for (let i = 0; i < PHRASES.length; i++) {
        if (cancelRef.current) break;
        setPhraseIdx(i);
        setPhraseVis(false);
        await delay(30);
        setPhraseVis(true);
        await delay(VISIBLE_MS);
        if (i < PHRASES.length - 1) {
          setPhraseVis(false);
          await delay(FADE_MS + GAP_MS);
        }
      }

      clearInterval(loadTimer);
      setLoadPct(100);
      await delay(300);

      // Logo appears
      setPhraseVis(false);
      await delay(FADE_MS);
      setLogoVis(true);
      await delay(700);

      // Blink 3×
      for (let b = 0; b < 3 && !cancelRef.current; b++) {
        await delay(300);
      }

      // Fly to nav position + fade overlay
      setLogoFlying(true);
      await delay(200);
      window.dispatchEvent(new CustomEvent("vg:v7-promo-done"));
      setOverlayOp(0);
      await delay(700);

      document.body.style.overflow = "";
      setMounted(false);
    };

    go();

    return () => {
      cancelRef.current = true;
      document.body.style.overflow = "";
    };
  }, [active]);

  if (!active || !mounted) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: overlayOp,
        transition: "opacity 0.65s ease",
        pointerEvents: overlayOp < 0.01 ? "none" : "auto",
      }}
    >
      {/* Phrases */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", width: "min(76vw, 680px)", pointerEvents: "none" }}>
        <p style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: "clamp(15px, 2.4vw, 28px)",
          fontWeight: 300,
          letterSpacing: "0.03em",
          lineHeight: 1.45,
          color: "rgba(244,241,236,0.88)",
          opacity: phraseVis && !logoVisible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease`,
          margin: 0,
        }}>
          {phraseIdx >= 0 ? PHRASES[phraseIdx] : ""}
        </p>
      </div>

      {/* Logo */}
      {logoVisible && (
        <img
          src="/logo.webp"
          alt="VIPGLASS"
          style={{
            position: "absolute",
            width:  logoFlying ? "110px" : "min(38vw, 340px)",
            top:    logoFlying ? "16px"  : "50%",
            left:   logoFlying ? "20px"  : "50%",
            transform: logoFlying ? "none" : "translate(-50%, -50%)",
            objectFit: "contain",
            transition: "width 0.65s cubic-bezier(.4,0,.2,1), top 0.65s cubic-bezier(.4,0,.2,1), left 0.65s cubic-bezier(.4,0,.2,1), transform 0.65s cubic-bezier(.4,0,.2,1)",
            animation: !logoFlying ? "v7pi-blink 0.38s steps(1,end) 3" : undefined,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)", width: "min(76vw, 300px)", pointerEvents: "none" }}>
        <div style={{ height: 1, background: "rgba(255,255,255,0.1)", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "rgba(244,241,236,0.5)", width: `${loadPct}%`, transition: "width 0.08s linear", borderRadius: 1 }} />
        </div>
        <div style={{ marginTop: 8, textAlign: "center", fontFamily: "'Manrope', sans-serif", fontSize: 9, letterSpacing: "0.16em", color: "rgba(244,241,236,0.25)" }}>
          {loadPct}%
        </div>
      </div>

      <style>{`
        @keyframes v7pi-blink {
          0%,100%{opacity:1} 50%{opacity:0}
        }
      `}</style>
    </div>
  );
}
