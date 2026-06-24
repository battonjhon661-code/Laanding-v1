"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";

// ── Data ─────────────────────────────────────────────────────────────────────

const TABS = ["ЗЕРКАЛА", "СТЕКЛА", "ТРИПЛЕКС", "УСЛУГИ"] as const;
type Tab = typeof TABS[number];

interface Item {
  name: string;
  preview: string;
  video?: string;
}

const CATALOG: Record<Tab, Item[]> = {
  ЗЕРКАЛА: [
    { name: "Обычное",       preview: "/wardrobe/1_common.png",  video: "/wardrobe/1_Common_Mirror.mp4" },
    { name: "Прозрачное",    preview: "/wardrobe/2_light.png",   video: "/wardrobe/2_Clear_Mirror.mp4" },
    { name: "Радужное",      preview: "/wardrobe/3_rainboy.png", video: "/wardrobe/3_Rainbow_Mirror.mp4" },
    { name: "Бронзовое",     preview: "/wardrobe/4_ton.png",     video: "/wardrobe/4_Bronze_Tinted_Mirror.mp4" },
    { name: "Серое",         preview: "/wardrobe/5_gold.png",    video: "/wardrobe/5_Grey_Tinted_Mirror.mp4" },
    { name: "Серо-голубое",  preview: "/wardrobe/6_blue.png",    video: "/wardrobe/6_Grey_Blue_Tinted_Mirror.mp4" },
    { name: "Тёмно-золотое", preview: "/wardrobe/7_darkgold.png" },
    { name: "Розовое",       preview: "/wardrobe/8_pink.png" },
    { name: "Красное",       preview: "/wardrobe/9_red.png" },
  ],
  СТЕКЛА: [
    { name: "Обычное",       preview: "/wardrobe/g1.png", video: "/wardrobe/g1.mp4" },
    { name: "Прозрачное",    preview: "/wardrobe/g2.png", video: "/wardrobe/g2.mp4" },
    { name: "Серое",         preview: "/wardrobe/g3.png", video: "/wardrobe/g3.mp4" },
    { name: "Тёмно-серое",   preview: "/wardrobe/g4.png", video: "/wardrobe/g4.mp4" },
    { name: "Чёрное",        preview: "/wardrobe/g5.png", video: "/wardrobe/g5.mp4" },
    { name: "Рифлёное мору", preview: "/wardrobe/g6.png", video: "/wardrobe/g6.mp4" },
  ],
  ТРИПЛЕКС: [
    { name: "Вариант 1", preview: "/wardrobe/t1.png" },
    { name: "Вариант 2", preview: "/wardrobe/t2.png" },
    { name: "Вариант 3", preview: "/wardrobe/t3.png" },
    { name: "Вариант 4", preview: "/wardrobe/t4.png" },
    { name: "Вариант 5", preview: "/wardrobe/t5.png" },
  ],
  УСЛУГИ: [
    { name: "Порезка",   preview: "/wardrobe/w1.png" },
    { name: "Шлифовка",  preview: "/wardrobe/w2.png" },
    { name: "Полировка", preview: "/wardrobe/w3.png" },
    { name: "Фаска",     preview: "/wardrobe/w4.png" },
    { name: "Сверловка", preview: "/wardrobe/w5.png" },
    { name: "Зенковка",  preview: "/wardrobe/w6.png" },
  ],
};

const CARD_W = 220;
const CARD_GAP = 10;

// ── Component ─────────────────────────────────────────────────────────────────

export default function WardrobeSection() {
  const [activeTab, setActiveTab] = useState<Tab>("ЗЕРКАЛА");
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef      = useRef<HTMLDivElement>(null);
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTabRef   = useRef<Tab>("ЗЕРКАЛА");
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs        = useRef<(HTMLButtonElement | null)[]>([]);
  const [ind, setInd]  = useState<{ left: number; width: number } | null>(null);

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  useLayoutEffect(() => {
    const container = tabContainerRef.current;
    const btn = tabRefs.current[TABS.indexOf(activeTab)];
    if (!container || !btn) return;
    const cr = container.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setInd({ left: br.left - cr.left + container.scrollLeft, width: br.width });
  }, [activeTab]);

  // Compute active card from scroll position (runs after scrolling settles)
  const syncActive = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / (CARD_W + CARD_GAP));
    const count = CATALOG[activeTabRef.current].length;
    setActiveIdx(Math.max(0, Math.min(count - 1, idx)));
  }, []);

  const onScroll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(syncActive, 90);
  }, [syncActive]);

  // On tab switch: reset scroll + active index
  const switchTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setActiveIdx(0);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = 0;
  }, [activeTab]);

  // Scroll to a specific card (for dot/card click)
  const scrollToCard = useCallback((idx: number) => {
    scrollRef.current?.scrollTo({ left: idx * (CARD_W + CARD_GAP), behavior: "smooth" });
  }, []);

  const items = CATALOG[activeTab];

  return (
    <section style={{ position: "relative", zIndex: 0, background: "#0a0b0a", overflow: "hidden", paddingBottom: 32, marginTop: -24, paddingTop: 24 }}>
      <style>{`
        .wrd-scroll::-webkit-scrollbar { display: none; }
        .wrd-tabs::-webkit-scrollbar  { display: none; }
      `}</style>

      {/* Top shadow — extends into the overlap under hero rounded corners */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 140,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.2) 65%, transparent 100%)",
        zIndex: 3,
        pointerEvents: "none",
      }} />

      {/* Background image */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "url(/back-2.png)",
        backgroundSize: "cover", backgroundPosition: "center 30%",
        opacity: 0.62,
      }} />
      {/* Dark veil so text stays readable */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.32) 100%)",
      }} />

      {/* Header */}
      <div style={{ padding: "60px 20px 0", position: "relative", zIndex: 1, textAlign: "center" }}>
        <h2 style={{
          margin: 0,
          fontFamily: "'Manrope', sans-serif",
          fontSize: "clamp(26px, 7.5vw, 36px)",
          fontWeight: 400,
          lineHeight: 1.08,
          letterSpacing: ".01em",
          textTransform: "uppercase",
          color: "#f4f1ec",
        }}>
          Качество<br />в каждой детали
        </h2>
        <p style={{
          margin: "12px auto 0",
          fontFamily: "'Manrope', sans-serif",
          fontSize: 13,
          fontWeight: 300,
          lineHeight: 1.55,
          color: "rgba(244,241,236,0.52)",
          maxWidth: "78%",
        }}>
          Мы тщательно подбираем материалы и комплектующие, чтобы каждая деталь служила долго и выглядела безупречно.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="wrd-tabs"
        style={{
          display: "flex", alignItems: "center",
          padding: "22px 20px 0",
          overflowX: "auto", scrollbarWidth: "none",
          position: "relative", zIndex: 1,
        }}
      >
        <div
          ref={tabContainerRef}
          style={{
            position: "relative",
            display: "inline-flex", alignItems: "center",
            background: "#111",
            borderRadius: 12,
            padding: 3,
          }}
        >
          {/* Sliding white indicator */}
          {ind && (
            <div style={{
              position: "absolute",
              top: 3, bottom: 3,
              left: ind.left,
              width: ind.width,
              background: "#f4f1ec",
              borderRadius: 9,
              transition: "left 0.28s cubic-bezier(.4,0,.2,1), width 0.28s cubic-bezier(.4,0,.2,1)",
              pointerEvents: "none",
              zIndex: 0,
            }} />
          )}
          {TABS.map((tab, i) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                ref={el => { tabRefs.current[i] = el; }}
                onClick={() => switchTab(tab)}
                style={{
                  position: "relative", zIndex: 1,
                  flexShrink: 0,
                  padding: "7px 14px",
                  borderRadius: 9,
                  border: "none",
                  background: "transparent",
                  color: isActive ? "#0a0b0a" : "rgba(244,241,236,0.48)",
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: ".16em",
                  cursor: "pointer",
                  transition: "color .22s ease",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="wrd-scroll"
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          gap: CARD_GAP,
          // Side padding centers the first/last card
          padding: `20px calc((100% - ${CARD_W}px) / 2)`,
          scrollbarWidth: "none",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
          boxSizing: "content-box",
        } as React.CSSProperties}
      >
        {items.map((item, i) => {
          const isActive = i === activeIdx;
          return (
            <CardItem
              key={`${activeTab}-${i}`}
              item={item}
              isActive={isActive}
              onClick={() => scrollToCard(i)}
            />
          );
        })}
      </div>

      {/* Pagination dots */}
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        gap: 4, paddingTop: 2, position: "relative", zIndex: 1,
      }}>
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToCard(i)}
            style={{
              width: activeIdx === i ? 14 : 5,
              height: 4,
              borderRadius: 2,
              border: "none",
              background: activeIdx === i ? "#f4f1ec" : "rgba(244,241,236,0.22)",
              padding: 0,
              cursor: "pointer",
              transition: "width .3s ease, background .3s ease",
            }}
          />
        ))}
      </div>
    </section>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

function CardItem({
  item,
  isActive,
  onClick,
}: {
  item: Item;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        scrollSnapAlign: "center",
        flexShrink: 0,
        width: CARD_W,
        height: 248,
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        background: "#111",
        cursor: "pointer",
        transform: isActive ? "scale(1)" : "scale(0.91)",
        opacity: isActive ? 1 : 0.52,
        boxShadow: isActive
          ? "0 8px 48px rgba(0,0,0,0.75)"
          : "0 2px 12px rgba(0,0,0,0.35)",
        transition: "transform .35s cubic-bezier(.2,.8,.2,1), opacity .35s ease, box-shadow .35s ease",
      }}
    >
      {/* Preview image — always visible as fallback */}
      <img
        src={item.preview}
        alt={item.name}
        style={{
          width: "100%", height: "100%",
          objectFit: "cover", display: "block",
        }}
      />

      {/* Video — renders on top of image when card is active */}
      {isActive && item.video && (
        <video
          key={item.video}
          src={item.video}
          muted
          autoPlay
          loop
          playsInline
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* Name label */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "28px 12px 13px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.72))",
        pointerEvents: "none",
      }}>
        <span style={{
          display: "block",
          textAlign: "center",
          fontFamily: "'Manrope', sans-serif",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: ".22em",
          textTransform: "uppercase",
          color: "#f4f1ec",
        }}>
          {item.name}
        </span>
      </div>
    </div>
  );
}
