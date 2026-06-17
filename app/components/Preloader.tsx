"use client";

import "./preloader.css";

export default function Preloader({ visible }: { visible: boolean }) {
  return (
    <div
      className="vg-preloader"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      <div className="vg-stage">
        <div className="vg-vp">VP</div>
        <div className="vg-bar" />
        <div className="vg-word">
          <span>Vip</span>
          <span>Glass</span>
        </div>
      </div>
    </div>
  );
}
