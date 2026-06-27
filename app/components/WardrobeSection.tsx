"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from "react";

// ── Data ─────────────────────────────────────────────────────────────────────

const TABS = ["ЗЕРКАЛА", "СТЕКЛА", "ТРИПЛЕКС", "УСЛУГИ"] as const;
type Tab = typeof TABS[number];

interface Item { name: string; preview: string; video?: string; }

const M = "/wardrobe/mirrors/";
const G = "/wardrobe/glasses/";
const W = "/wardrobe/works/";

const CATALOG: Record<Tab, Item[]> = {
  ЗЕРКАЛА: [
    { name: "Обычное",            preview: `${M}1_Common_Mirror.webp`,               video: `${M}1_Common_Mirror.webm` },
    { name: "Прозрачное",         preview: `${M}2_Clear_Mirror.webp`,                video: `${M}2_Clear_Mirror.webm` },
    { name: "Радужное",           preview: `${M}3_Rainbow_Mirror.webp`,              video: `${M}3_Rainbow_Mirror.webm` },
    { name: "Бронзовое",          preview: `${M}4_Bronze_Tinted_Mirror.webp`,        video: `${M}4_Bronze_Tinted_Mirror.webm` },
    { name: "Серое",              preview: `${M}5_Grey_Tinted_Mirror.webp`,          video: `${M}5_Grey_Tinted_Mirror.webm` },
    { name: "Серо-голубое",       preview: `${M}6_Grey_Blue_Tinted_Mirror.webp`,     video: `${M}6_Grey_Blue_Tinted_Mirror.webm` },
    { name: "Тёмно-золотое",      preview: `${M}7_Dark_Gold_Tinted_Mirror.webp` },
    { name: "Розовое",            preview: `${M}8_Pink_Tinted_Mirror.webp` },
    { name: "Матовое",            preview: `${M}9_Matte_Mirror.webp` },
    { name: "Красное",            preview: `${M}10_Red_Mirror.webp` },
    { name: "Светло-золотое",     preview: `${M}11_Light_Gold_Tinted_Mirror.webp` },
    { name: "Антик A1",           preview: `${M}12_Antique_Mirror_A1.webp` },
    { name: "Антик A2",           preview: `${M}13_Antique_Mirror_A2.webp` },
    { name: "Антик A5",           preview: `${M}14_Antique_Mirror_A5.webp` },
    { name: "Антик B1",           preview: `${M}15_Antique_Mirror_B1.webp` },
    { name: "Антик B2",           preview: `${M}16_Antique_Mirror_B2.webp` },
    { name: "Антик C9",           preview: `${M}17_Antique_Mirror_C9.webp` },
    { name: "Антик F020-2",       preview: `${M}18_Antique_Mirror_F020_2.webp` },
    { name: "Антик F020-9",       preview: `${M}19_Antique_Mirror_F020_9.webp` },
    { name: "Антик F021",         preview: `${M}20_Antique_Mirror_F021_Colorless.webp` },
    { name: "Антик F030-3",       preview: `${M}21_Antique_Mirror_F030_3.webp` },
    { name: "Антик F030-4",       preview: `${M}22_Antique_Mirror_F030_4.webp` },
    { name: "Антик F30",          preview: `${M}23_Antique_Mirror_F30.webp` },
    { name: "Антик Illaria",      preview: `${M}24_Antique_Mirror_Illaria.webp` },
    { name: "Антик J019B",        preview: `${M}25_Antique_Mirror_J019B.webp` },
    { name: "Антик J021B",        preview: `${M}26_Antique_Mirror_J021B.webp` },
    { name: "Антик J031",         preview: `${M}27_Antique_Mirror_J031.webp` },
    { name: "Антик J001",         preview: `${M}28_Antique_Mirror_J001.webp` },
    { name: "Антик J002",         preview: `${M}29_Antique_Mirror_J002.webp` },
    { name: "Антик J021 5mm",     preview: `${M}30_Antique_Mirror_J021_5mm.webp` },
    { name: "Антик J033-5",       preview: `${M}31_Antique_Mirror_J033_5.webp` },
    { name: "Антик K1",           preview: `${M}32_Antique_Mirror_K1.webp` },
    { name: "Антик K2 Евробронза",preview: `${M}33_Antique_Mirror_K2_Euro_Bronze.webp` },
    { name: "Антик K2 Золото-бронза", preview: `${M}34_Antique_Mirror_K2_Gold_Bronze.webp` },
    { name: "Антик K2 Золото",    preview: `${M}35_Antique_Mirror_K2_Gold.webp` },
    { name: "Антик K2",           preview: `${M}36_Antique_Mirror_K2.webp` },
    { name: "Антик K7",           preview: `${M}37_Antique_Mirror_K7.webp` },
    { name: "Антик K8",           preview: `${M}38_Antique_Mirror_K8.webp` },
    { name: "Антик K12",          preview: `${M}39_Antique_Mirror_K12.webp` },
    { name: "Антик K13",          preview: `${M}40_Antique_Mirror_K13.webp` },
    { name: "Антик Y7",           preview: `${M}41_Antique_Mirror_Y7.webp` },
  ],
  СТЕКЛА: [
    { name: "Обычное",              preview: `${G}1_Common_Glass.webp`,                         video: `${G}1_Common_Glass.webm` },
    { name: "Прозрачное",           preview: `${G}2_Clear_Glass.webp`,                          video: `${G}2_Clear_Glass.webm` },
    { name: "Серое",                preview: `${G}3_Grey_Tinted_Glass.webp`,                    video: `${G}3_Grey_Tinted_Glass.webm` },
    { name: "Тёмно-серое",          preview: `${G}4_Dark_Grey_Tinted_Glass.webp`,               video: `${G}4_Dark_Grey_Tinted_Glass.webm` },
    { name: "Бронзовое",            preview: `${G}5_Bronze_Tinted_Glass.webp`,                  video: `${G}5_Bronze_Tinted_Glass.webm` },
    { name: "Чёрное",               preview: `${G}6_Black_Tinted_Glass.webp`,                   video: `${G}6_Black_Tinted_Glass.webm` },
    { name: "Матовое",              preview: `${G}7_Matte_Common_Glass.webp`,                   video: `${G}7_Matte_Common_Glass.webm` },
    { name: "Матовое прозрачное",   preview: `${G}8_Matte_Clear_Glass.webp`,                    video: `${G}8_Matte_Clear_Glass.webm` },
    { name: "Рифлёное",             preview: `${G}9_Common_Moru_Ribbed_Glass.webp`,             video: `${G}9_Common_Moru_Ribbed_Glass.webm` },
    { name: "Рифлёное прозрачное",  preview: `${G}10_Clear_Moru_Ribbed_Glass.webp`,             video: `${G}10_Clear_Moru_Ribbed_Glass.webm` },
    { name: "Рифлёное бронза",      preview: `${G}11_Bronze_Moru_Ribbed_Glass.webp`,            video: `${G}11_Bronze_Moru_Ribbed_Glass.webm` },
    { name: "Рифлёное серое",       preview: `${G}12_Grey_Moru_Ribbed_Glass.webp`,              video: `${G}12_Grey_Moru_Ribbed_Glass.webm` },
    { name: "Дихроик Аврора",       preview: `${G}13_Dichroic_Glass_Aurora_Green_Orange.webp`,  video: `${G}13_Dichroic_Glass_Aurora_Green_Orange.webm` },
    { name: "Дихроик Роза-синий",   preview: `${G}14_Dichroic_Glass_Rose_Blue.webp`,            video: `${G}14_Dichroic_Glass_Rose_Blue.webm` },
    { name: "Дихроик Золото-фиолет",preview: `${G}15_Dichroic_Glass_Gold_Cyan_Violet.webp`,    video: `${G}15_Dichroic_Glass_Gold_Cyan_Violet.webm` },
    { name: "Master Lane",          preview: `${G}16_Master_Lane_Common.webp`,                  video: `${G}16_Master_Lane_Common.webm` },
    { name: "Vision Sun",           preview: `${G}17_Vision_Sun_Common.webp`,                   video: `${G}17_Vision_Sun_Common.webm` },
    { name: "Estriado",             preview: `${G}18_Estriado_Common.webp`,                     video: `${G}18_Estriado_Common.webm` },
    { name: "Рифлёное сатин",       preview: `${G}19_Ribbed_Moru_Satin.webp`,                  video: `${G}19_Ribbed_Moru_Satin.webm` },
    { name: "Master Soft",          preview: `${G}20_Patterned_Master_Soft.webp`,               video: `${G}20_Patterned_Master_Soft.webm` },
    { name: "Stemalit Розовый",     preview: `${G}21_Stemalit_Candy_Pink.webp`,                 video: `${G}21_Stemalit_Candy_Pink.webm` },
    { name: "Stemalit Голубой",     preview: `${G}22_Stemalit_Sky_Blue.webp`,                   video: `${G}22_Stemalit_Sky_Blue.webm` },
    { name: "Stemalit Лайм",        preview: `${G}23_Stemalit_Lime.webp`,                       video: `${G}23_Stemalit_Lime.webm` },
    { name: "Stemalit Оранжевый",   preview: `${G}24_Stemalit_Tangerine.webp`,                  video: `${G}24_Stemalit_Tangerine.webm` },
    { name: "Stemalit Фиолет",      preview: `${G}25_Stemalit_Purple.webp`,                     video: `${G}25_Stemalit_Purple.webm` },
    { name: "Волновое",             preview: `${G}26_Wave_Glass.webp`,                          video: `${G}26_Wave_Glass.webm` },
  ],
  ТРИПЛЕКС: [
    { name: "Вариант 1", preview: "/wardrobe/t1.png" },
    { name: "Вариант 2", preview: "/wardrobe/t2.png" },
    { name: "Вариант 3", preview: "/wardrobe/t3.png" },
    { name: "Вариант 4", preview: "/wardrobe/t4.png" },
    { name: "Вариант 5", preview: "/wardrobe/t5.png" },
  ],
  УСЛУГИ: [
    { name: "Порезка",              preview: `${W}1_glass_cutting.png` },
    { name: "Шлифовка",             preview: `${W}2_edge_grinding.png` },
    { name: "Полировка",            preview: `${W}3_polished_edge.png` },
    { name: "Фаска",                preview: `${W}4_beveled_mirror.png` },
    { name: "Сверловка",            preview: `${W}5_glass_drilling.png` },
    { name: "Зенковка",             preview: `${W}6_hole_countersinking.png` },
    { name: "Триплекс",             preview: `${W}7_laminated_glass.png` },
    { name: "Декор. скос",          preview: `${W}8_decorative_bevel.png` },
    { name: "Внутр. вырезы",        preview: `${W}9_internal_cutouts.png` },
    { name: "Вырезы под розетки",   preview: `${W}10_socket_cutouts.png` },
    { name: "Внешние вырезы",       preview: `${W}11_external_cutouts.png` },
    { name: "Закалка",              preview: `${W}12_tempered_glass.png` },
    { name: "Алмаз. гравировка",    preview: `${W}13_diamond_engraving.png` },
    { name: "Пескоструйная",        preview: `${W}14_sandblasted_glass.png` },
    { name: "Мойка стекла",         preview: `${W}15_glass_washing.png` },
    { name: "Окраска",              preview: `${W}16_glass_painting.png` },
    { name: "Фотопечать",           preview: `${W}17_glass_photo_printing.png` },
    { name: "УФ-склейка",           preview: `${W}18_uv_glass_bonding.png` },
    { name: "Безопасный скос",      preview: `${W}19_safety_arrised_edge.png` },
  ],
};

const CARD_W   = 220;
const CARD_GAP = 10;
const STRIDE   = CARD_W + CARD_GAP;
const SNAP_MS  = 300;

// ── Component ─────────────────────────────────────────────────────────────────

export default function WardrobeSection() {
  const [activeTab, setActiveTab] = useState<Tab>("ЗЕРКАЛА");
  // activeExtIdx = index in the extended (5-copy) array that is currently centred
  const [activeExtIdx, setActiveExtIdx] = useState(0);

  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs         = useRef<(HTMLButtonElement | null)[]>([]);
  const [ind, setInd]   = useState<{ left: number; width: number } | null>(null);

  const wrapRef  = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const drag       = useRef({ active: false, startX: 0, startTx: 0, velX: 0, lastX: 0, lastT: 0 });
  const txRef      = useRef(0);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kept as ref so the resetRef callback always sees the latest value without
  // recreating the effect on every render.
  const activeExtIdxRef = useRef(activeExtIdx);
  activeExtIdxRef.current = activeExtIdx;

  const items = CATALOG[activeTab];
  const count = items.length;

  // 5 copies: [g-left2 | g-left1 | MIDDLE | g-right1 | g-right2]
  // MIDDLE items are at extended indices 2*count … 3*count-1.
  // Buffer of 2*count items on each side means even a fast continuous swipe
  // burst can't outrun the recenter and reach the edge of the rendered array —
  // which is what made the 3-copy carousel appear to "jump back to item 1".
  const extItems = useMemo(
    () => [...items, ...items, ...items, ...items, ...items],
    [items]
  );

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const txForIdx = useCallback((extIdx: number) => {
    const vw = wrapRef.current?.clientWidth ?? 375;
    return vw / 2 - CARD_W / 2 - extIdx * STRIDE;
  }, []);

  const setTx = useCallback((tx: number, animate: boolean) => {
    txRef.current = tx;
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = animate ? `transform ${SNAP_MS}ms cubic-bezier(.25,.8,.25,1)` : "none";
    track.style.transform  = `translateX(${tx}px)`;
  }, []);

  // Snap to extIdx. If target is outside the middle copy (indices 2*count …
  // 3*count-1), teleport FIRST (invisible), then animate — the user never sees
  // a jump. Formula: shift the track so the middle-copy card sits at the exact
  // screen position the guard-zone card occupied: teleportTx = current + (clamped - midIdx)*STRIDE.
  const snapTo = useCallback((extIdx: number, animate: boolean) => {
    const clamped = Math.max(0, Math.min(5 * count - 1, extIdx));
    const realIdx = ((clamped % count) + count) % count;
    const midIdx  = 2 * count + realIdx; // equivalent card in the middle copy

    if (animate && (clamped < 2 * count || clamped >= 3 * count)) {
      const teleportTx = txRef.current + (clamped - midIdx) * STRIDE;
      setTx(teleportTx, false);
      requestAnimationFrame(() => {
        setTx(txForIdx(midIdx), true);
        setActiveExtIdx(midIdx);
      });
    } else {
      setTx(txForIdx(clamped), animate);
      setActiveExtIdx(clamped);
    }
  }, [count, setTx, txForIdx]);

  // ── Init on tab change ────────────────────────────────────────────────────────

  useLayoutEffect(() => {
    const midStart = 2 * count; // first item of middle copy
    setTx(txForIdx(midStart), false);
    setActiveExtIdx(midStart);
  }, [activeTab, count, setTx, txForIdx]);

  // ── resetRef: recenter back to middle copy after scrolling settles ────────────
  // Scheduled only ONCE per "burst" (not reset on every step) — resetting on
  // each step with fast continuous scrolling postpones this forever, letting
  // activeExtIdx drift past the rendered array. Same technique as in
  // examples-section.html (Виды работ carousel, COPIES=5 comment there).
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (resetRef.current) clearTimeout(resetRef.current); }, []);

  useEffect(() => {
    if (resetRef.current) return; // already scheduled for this burst
    resetRef.current = setTimeout(() => {
      resetRef.current = null;
      if (drag.current.active) return; // don't reset mid-drag
      const cur = activeExtIdxRef.current;
      const midStart = 2 * count;
      const midEnd   = 3 * count;
      if (cur < midStart || cur >= midEnd) {
        const realIdx = ((cur % count) + count) % count;
        const newIdx  = midStart + realIdx;
        setTx(txForIdx(newIdx), false);
        setActiveExtIdx(newIdx);
      }
    }, 570);
  }, [activeExtIdx, count, setTx, txForIdx]);

  // ── Wheel (trackpad two-finger horizontal scroll) ─────────────────────────────

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();

      const track = trackRef.current;
      if (!track) return;
      track.style.transition = "none";
      const newTx = txRef.current - e.deltaX;
      txRef.current = newTx;
      track.style.transform = `translateX(${newTx}px)`;

      const vwNow = wrapRef.current?.clientWidth ?? 375;
      const nearest = Math.max(0, Math.min(5 * count - 1,
        Math.round((vwNow / 2 - CARD_W / 2 - newTx) / STRIDE)));
      setActiveExtIdx(prev => prev === nearest ? prev : nearest);

      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => {
        const vw = wrapRef.current?.clientWidth ?? 375;
        const floatIdx = (vw / 2 - CARD_W / 2 - txRef.current) / STRIDE;
        snapTo(Math.round(floatIdx), true);
      }, 120);
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, [snapTo, count]);

  // ── Tab pill indicator ────────────────────────────────────────────────────────

  useLayoutEffect(() => {
    const container = tabContainerRef.current;
    const btn = tabRefs.current[TABS.indexOf(activeTab)];
    if (!container || !btn) return;
    const cr = container.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setInd({ left: br.left - cr.left + container.scrollLeft, width: br.width });
  }, [activeTab]);

  // ── Pointer events ────────────────────────────────────────────────────────────

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const wrap  = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    wrap.setPointerCapture(e.pointerId);
    track.style.transition = "none";
    const d = drag.current;
    d.active   = true;
    d.startX   = e.clientX;
    d.startTx  = txRef.current;
    d.velX     = 0;
    d.lastX    = e.clientX;
    d.lastT    = e.timeStamp;
    wrap.style.cursor = "grabbing";
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const newTx = d.startTx + (e.clientX - d.startX);
    txRef.current = newTx;
    if (trackRef.current) trackRef.current.style.transform = `translateX(${newTx}px)`;
    const vw = wrapRef.current?.clientWidth ?? 375;
    const nearest = Math.max(0, Math.min(5 * count - 1,
      Math.round((vw / 2 - CARD_W / 2 - newTx) / STRIDE)));
    setActiveExtIdx(prev => prev === nearest ? prev : nearest);
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.velX = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
  }, [count]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (wrapRef.current) wrapRef.current.style.cursor = "grab";
    const vw = wrapRef.current?.clientWidth ?? 375;
    const floatIdx = (vw / 2 - CARD_W / 2 - txRef.current) / STRIDE;
    const target   = Math.round(floatIdx - d.velX * 0.22);
    snapTo(target, true);
  }, [snapTo]);

  // ── Card click / dot click ────────────────────────────────────────────────────

  const scrollToReal = useCallback((realIdx: number) => {
    snapTo(2 * count + realIdx, true);
  }, [count, snapTo]);

  const realActiveIdx = activeExtIdx % count;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <section style={{ position: "relative", zIndex: 0, background: "#0a0b0a", overflow: "hidden", paddingBottom: 32, marginTop: -24, paddingTop: 24 }}>
      <style>{`.wrd-tabs::-webkit-scrollbar { display: none; }`}</style>

      {/* Top shadow */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 140, background: "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.2) 65%, transparent 100%)", zIndex: 3, pointerEvents: "none" }} />

      {/* Background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "url(/back-2.png)", backgroundSize: "cover", backgroundPosition: "center 30%", opacity: 0.62 }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.32) 100%)" }} />

      {/* Header */}
      <div style={{ padding: "60px 20px 0", position: "relative", zIndex: 1, textAlign: "center" }}>
        <h2 style={{ margin: 0, fontFamily: "'Manrope', sans-serif", fontSize: "clamp(26px, 7.5vw, 36px)", fontWeight: 400, lineHeight: 1.08, letterSpacing: ".01em", textTransform: "uppercase", color: "#f4f1ec" }}>
          Широкий выбор стекла и зеркал<br />для ваших проектов
        </h2>
        <p style={{ margin: "12px auto 0", fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 300, lineHeight: 1.55, color: "rgba(244,241,236,0.52)", maxWidth: "78%" }}>
          Предлагаем разные виды стекла, зеркал, обработки и фурнитуры для интерьерных, архитектурных и коммерческих решений. Каждое изделие подбирается под задачу&nbsp;— по стилю, толщине, оттенку, безопасности и условиям эксплуатации.
        </p>
      </div>

      {/* Tabs */}
      <div className="wrd-tabs" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "22px 20px 0", overflowX: "auto", scrollbarWidth: "none", position: "relative", zIndex: 1 }}>
        <div ref={tabContainerRef} style={{ position: "relative", display: "inline-flex", alignItems: "center", background: "#111", borderRadius: 12, padding: 3 }}>
          {ind && (
            <div style={{ position: "absolute", top: 3, bottom: 3, left: ind.left, width: ind.width, background: "#f4f1ec", borderRadius: 9, transition: "left 0.28s cubic-bezier(.4,0,.2,1), width 0.28s cubic-bezier(.4,0,.2,1)", pointerEvents: "none", zIndex: 0 }} />
          )}
          {TABS.map((tab, i) => {
            const isActive = activeTab === tab;
            return (
              <button key={tab} ref={el => { tabRefs.current[i] = el; }} onClick={() => setActiveTab(tab)}
                style={{ position: "relative", zIndex: 1, flexShrink: 0, padding: "7px 14px", borderRadius: 9, border: "none", background: "transparent", color: isActive ? "#0a0b0a" : "rgba(244,241,236,0.48)", fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: isActive ? 600 : 500, letterSpacing: ".16em", cursor: "pointer", transition: "color .22s ease" }}>
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Infinite carousel */}
      <div
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ position: "relative", zIndex: 1, overflow: "hidden", padding: "20px 0", cursor: "grab", userSelect: "none", touchAction: "pan-y pinch-zoom" }}
      >
        <div
          ref={trackRef}
          style={{ display: "flex", gap: CARD_GAP, willChange: "transform" }}
        >
          {extItems.map((item, extIdx) => (
            <CardItem
              key={`${activeTab}-${extIdx}`}
              item={item}
              isActive={extIdx === activeExtIdx}
              onClick={() => scrollToReal(extIdx % count)}
            />
          ))}
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, paddingTop: 2, position: "relative", zIndex: 1 }}>
        {items.map((_, i) => (
          <button key={i} onClick={() => scrollToReal(i)}
            style={{ width: realActiveIdx === i ? 14 : 5, height: 4, borderRadius: 2, border: "none", background: realActiveIdx === i ? "#f4f1ec" : "rgba(244,241,236,0.22)", padding: 0, cursor: "pointer", transition: "width .3s ease, background .3s ease" }} />
        ))}
      </div>
    </section>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function CardItem({ item, isActive, onClick }: { item: Item; isActive: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ flexShrink: 0, width: CARD_W, height: 248, borderRadius: 16, overflow: "hidden", position: "relative", background: "#111", cursor: "pointer", transform: isActive ? "scale(1)" : "scale(0.91)", opacity: isActive ? 1 : 0.52, boxShadow: isActive ? "0 8px 48px rgba(0,0,0,0.75)" : "0 2px 12px rgba(0,0,0,0.35)", transition: "transform .35s cubic-bezier(.2,.8,.2,1), opacity .35s ease, box-shadow .35s ease" }}>
      <img src={item.preview} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {isActive && item.video && (
        <video key={item.video} src={item.video} muted autoPlay loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 12px 13px", background: "linear-gradient(transparent, rgba(0,0,0,0.72))", pointerEvents: "none" }}>
        <span style={{ display: "block", textAlign: "center", fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase", color: "#f4f1ec" }}>
          {item.name}
        </span>
      </div>
    </div>
  );
}
