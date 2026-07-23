"use client";
import { useEffect, useRef } from "react";
import { useFlatLayout, useSiteVersion } from "./useFlatLayout";

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export default function LightSweepMirrorReveal({
  mirrorHtml,
  footerHtml,
}: {
  mirrorHtml: string;
  footerHtml: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const version = useSiteVersion();
  const isFlat = useFlatLayout();
  const active = version === "4" && !isFlat;

  useEffect(() => {
    if (!active) return;
    const stage = stageRef.current;
    const mirror = mirrorRef.current;
    if (!stage || !mirror) return;

    const mirrorSection = mirror.querySelector(".mirror-section") as HTMLElement | null;
    if (mirrorSection) mirrorSection.classList.add("mirror-visible");

    let raf = 0;

    function update() {
      raf = 0;
      const travel = Math.max(1, stage!.offsetHeight - window.innerHeight);
      const p = clamp(-stage!.getBoundingClientRect().top / travel, 0, 1);
      const reveal = smoothstep(0.08, 0.82, p);
      const glow = smoothstep(0, 0.44, p) * (1 - smoothstep(0.78, 1, p));

      stage!.style.setProperty("--ls-p", reveal.toFixed(4));
      stage!.style.setProperty("--ls-glow", glow.toFixed(4));
      stage!.style.setProperty("--ls-beam-left", `${(reveal * 122 - 24).toFixed(2)}%`);
      stage!.style.setProperty("--ls-focus-x", `${(reveal * 100).toFixed(2)}%`);
      stage!.style.setProperty("--ls-beam-opacity", (0.08 + glow * 0.92).toFixed(4));
      stage!.style.setProperty("--ls-frost-opacity", (glow * 0.65).toFixed(4));
      mirror!.style.opacity = reveal.toFixed(3);
      mirror!.style.clipPath = `inset(0 ${((1 - reveal) * 100).toFixed(2)}% 0 0)`;
      mirror!.style.transform = `scale(${(1.025 - reveal * 0.025).toFixed(4)})`;
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      stage.style.removeProperty("--ls-p");
      stage.style.removeProperty("--ls-glow");
      stage.style.removeProperty("--ls-beam-left");
      stage.style.removeProperty("--ls-focus-x");
      stage.style.removeProperty("--ls-beam-opacity");
      stage.style.removeProperty("--ls-frost-opacity");
      mirror.style.opacity = "";
      mirror.style.clipPath = "";
      mirror.style.transform = "";
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      <section ref={stageRef} className="ls-stage" aria-label="Light sweep mirror transition">
        <div className="ls-sticky">
          <div
            ref={mirrorRef}
            className="ls-mirror"
            dangerouslySetInnerHTML={{ __html: mirrorHtml }}
          />
          <div className="ls-beam" aria-hidden="true" />
          <div className="ls-frost" aria-hidden="true" />
        </div>
      </section>
      <div className="ls-footer" dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </>
  );
}
