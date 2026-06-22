"use client";

import "./preloader.css";

export default function Preloader({ visible, loadPct }: { visible: boolean; loadPct: number }) {
  return (
    <div
      className="vg-preloader"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      <div className="vg-logo-stack">
        <img src="/logo.png" alt="VIP GLASS" className="vg-logo-img" />
        <div className="vg-progress-track">
          <div className="vg-progress-fill" style={{ width: `${loadPct}%` }} />
        </div>
        <div className="vg-progress-pct">{loadPct}%</div>
      </div>
    </div>
  );
}
