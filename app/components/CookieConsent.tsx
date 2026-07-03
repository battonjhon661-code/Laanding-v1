"use client";

import { useState, useEffect } from "react";

const YM_ID = 109396212;

function loadMetrika() {
  if (typeof window === "undefined" || (window as any).ym) return;
  (function (m: any, e: any, t: any, r: any, i: any) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * (new Date() as any);
    for (let j = 0; j < e.scripts.length; j++) {
      if (e.scripts[j].src === r) return;
    }
    const k = e.createElement(t);
    const a = e.getElementsByTagName(t)[0];
    k.async = 1;
    k.src = r;
    a.parentNode.insertBefore(k, a);
  })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
  (window as any).ym(YM_ID, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (consent === "1") {
      loadMetrika();
    } else if (!consent) {
      setVisible(true);
    }
    // consent === "0" → declined, do nothing
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem("cookie_consent", "1");
    setVisible(false);
    loadMetrika();
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "0");
    setVisible(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        padding: "16px 20px",
        background: "rgba(10, 11, 10, 0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(244,241,236,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        flexWrap: "wrap",
        animation: "cookieSlideUp .4s ease",
      }}
    >
      <style>{`@keyframes cookieSlideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <p
        style={{
          margin: 0,
          fontFamily: "'Manrope', sans-serif",
          fontSize: 13,
          fontWeight: 400,
          color: "rgba(244,241,236,0.7)",
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
<a
          href="/privacy"
          style={{
            color: "rgba(244,241,236,0.7)",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >Мы используем файлы cookie</a>{" "}
        для улучшения работы сайта и анализа трафика.
        Продолжая использовать сайт, вы соглашаетесь с этим.
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={accept}
          style={{
            padding: "9px 24px",
            borderRadius: 8,
            border: "none",
            background: "#f4f1ec",
            color: "#0a0b0a",
            fontFamily: "'Manrope', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: ".08em",
            cursor: "pointer",
            transition: "opacity .2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Принять
        </button>
        <button
          onClick={decline}
          style={{
            padding: "9px 20px",
            borderRadius: 8,
            border: "1px solid rgba(244,241,236,0.2)",
            background: "transparent",
            color: "rgba(244,241,236,0.6)",
            fontFamily: "'Manrope', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: ".08em",
            cursor: "pointer",
            transition: "border-color .2s, color .2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(244,241,236,0.4)";
            e.currentTarget.style.color = "rgba(244,241,236,0.85)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(244,241,236,0.2)";
            e.currentTarget.style.color = "rgba(244,241,236,0.6)";
          }}
        >
          Отклонить
        </button>
      </div>
    </div>
  );
}
