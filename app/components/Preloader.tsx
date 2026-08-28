"use client";

import "./preloader.css";

export default function Preloader({ visible, loadPct }: { visible: boolean; loadPct: number }) {
  return (
    <div
      className="vg-preloader"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      <video
        className="vg-preloader-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/start.webm" type="video/webm" />
        <source src="/start.mp4" type="video/mp4" />
      </video>
      <div className="vg-preloader-overlay" />
      <div className="vg-logo-stack">
        <img src="/logo.webp" alt="VIP GLASS" className="vg-logo-img" />
        <div className="vg-progress-track">
          <div className="vg-progress-fill" style={{ width: `${loadPct}%` }} />
        </div>
        <div className="vg-progress-pct">{loadPct}%</div>
      </div>
    </div>
  );
}
