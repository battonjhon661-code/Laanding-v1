// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";
import { snapdom } from "@zumer/snapdom";
import { useSiteVersion, useIsMobile } from "./useFlatLayout";

/**
 * Стеклянный скролл-переход (patterns/scroll-glass-transition.html), портирован в React.
 * Показывается ТОЛЬКО в варианте 0 (песочница переходов) и только на десктопе.
 * Идёт между блоком «Примеры работ» и блоком «Наши работы вписываются в любой интерьер».
 *
 * Механика (без дублей — каждый блок виден ОДИН раз):
 * - Переход = НАХЛЁСТ на стык, а не отдельная секция. Он лежит НИЖЕ блока «Примеры
 *   работ» по z-index (см. globals.css: .vz-transition-section z-index:1, .cr-stage z-index:3),
 *   и holst прозрачный — поэтому сквозь него виден САМ реальный блок примеров (его
 *   сложную JS-карусель snapdom снять не может, поэтому не снимаем).
 * - Когда блок примеров уезжает вверх, за ним не чёрное, а ребристый фон pin-stage
 *   (= фон блока примеров) — стык бесшовный.
 * - Стеклянные плитки наносят поверх ИНТЕРЬЕР — это снимок реального блока-зеркала
 *   (slide2, snapdom). В конце переход держит slide2, а затем идёт сам реальный блок
 *   «Наши работы вписываются…» — идентичный, поэтому без дубля.
 */
const SLIDE_2 = "/assets/background-5.webp"; // fallback, если snapdom-снимок зеркала не удался

function GlassStage({ mirrorHtml, footerHtml }: { mirrorHtml: string; footerHtml: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const mirRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const loader = loaderRef.current;
    const mirWrap = mirRef.current;
    const footerWrap = footerRef.current;
    if (!section || !canvas || !loader || !mirWrap || !footerWrap) return;

    // Живой закреплённый блок «Примеры работ» (CircleReveal). Он лежит поверх
    // холста, и по ходу перехода мы его гасим — элементы примеров тают на месте,
    // а под ними тот же фон-подложка, который стекло превращает в зеркало.
    const exSticky = document.querySelector(".cr-stage .cr-sticky") as HTMLElement | null;
    const vignette = section.querySelector(".vz-edge-vignette") as HTMLElement | null;

    // Реальный блок-зеркало живёт за холстом; показываем его проявленным.
    const mirSection = mirWrap.querySelector(".mirror-section") as HTMLElement | null;
    if (mirSection) mirSection.classList.add("mirror-visible");

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let images;
    let coverLayers;
    let glassTexture;
    let mirrorTiles = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let targetProgress = 0;
    let easedProgress = 0;
    let targetFooterProgress = 0;
    let easedFooterProgress = 0;
    let mirrorTravelPx = 1;
    let footerH = 400;
    let isReady = false;
    let frameId = 0;
    let destroyed = false;

    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    const smoothstep = (edge0, edge1, value) => {
      const t = clamp((value - edge0) / (edge1 - edge0));
      return t * t * (3 - 2 * t);
    };

    const loadImage = (src) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });

    // anchorY: 0 = прижать к верху (снимок блока показываем с заголовка), 0.5 = центр.
    const getCover = (image, targetWidth = width, targetHeight = height, anchorY = 0.5) => {
      const scale = Math.max(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight);
      const renderWidth = image.naturalWidth * scale;
      const renderHeight = image.naturalHeight * scale;
      return {
        x: (targetWidth - renderWidth) * 0.5,
        y: (targetHeight - renderHeight) * anchorY,
        width: renderWidth,
        height: renderHeight,
      };
    };

    const drawImageCover = (targetCtx, image, targetWidth, targetHeight, anchorY = 0.5) => {
      const rect = getCover(image, targetWidth, targetHeight, anchorY);
      targetCtx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
    };

    const createCoverLayer = (image, anchorY = 0.5) => {
      const layer = document.createElement("canvas");
      layer.width = Math.max(1, Math.round(width));
      layer.height = Math.max(1, Math.round(height));
      const layerCtx = layer.getContext("2d");
      layerCtx.imageSmoothingEnabled = true;
      layerCtx.imageSmoothingQuality = "medium";
      drawImageCover(layerCtx, image, layer.width, layer.height, anchorY);
      return layer;
    };

    const createGlassTexture = () => {
      const scale = 0.5;
      const layer = document.createElement("canvas");
      layer.width = Math.max(320, Math.round(width * scale));
      layer.height = Math.max(220, Math.round(height * scale));
      const textureCtx = layer.getContext("2d");
      let seed = 9173;
      const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      textureCtx.clearRect(0, 0, layer.width, layer.height);
      textureCtx.globalCompositeOperation = "source-over";

      for (let index = 0; index < 150; index += 1) {
        const x = random() * layer.width;
        const y = random() * layer.height;
        const radius = 0.5 + random() * 2.4;
        textureCtx.beginPath();
        textureCtx.arc(x, y, radius, 0, Math.PI * 2);
        textureCtx.fillStyle = `rgba(170, 230, 255, ${0.035 + random() * 0.065})`;
        textureCtx.fill();
      }

      textureCtx.globalAlpha = 1;
      return layer;
    };

    const rebuildRenderCaches = () => {
      coverLayers = {
        // slide1 (examples) НЕ рисуем: реальный блок «Примеры работ» виден сквозь
        // прозрачный холст (он лежит выше по z-index), холст только наносит интерьер.
        slide2: createCoverLayer(images.slide2, 0),
      };
      glassTexture = createGlassTexture();
    };

    const drawLayer = (layer, alpha = 1) => {
      if (alpha <= 0 || !layer) return;
      ctx.save();
      ctx.globalAlpha = clamp(alpha);
      ctx.drawImage(layer, 0, 0, width, height);
      ctx.restore();
    };

    const projectDomePoint = (px, py, progress) => {
      const domeProgress = smoothstep(0.1, 0.72, progress) * (1 - smoothstep(0.84, 0.985, progress));
      const dx = (px / width - 0.5) / 0.55;
      const dy = (py / height - 0.5) / 0.52;
      const distance = Math.min(1.35, Math.sqrt(dx * dx + dy * dy));
      const dome = Math.max(0, 1 - distance * distance);
      const rim = smoothstep(0.55, 1.18, distance);
      const scaleX = 1 + dome * 0.19 * domeProgress - rim * 0.04 * domeProgress;
      const scaleY = 1 + dome * 0.12 * domeProgress - rim * 0.055 * domeProgress;
      return {
        x: width * 0.5 + (px - width * 0.5) * scaleX,
        y: height * 0.52 + (py - height * 0.52) * scaleY - dome * height * 0.035 * domeProgress,
        z: dome * domeProgress,
        rim,
      };
    };

    const tracePolygon = (points) => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index += 1) {
        ctx.lineTo(points[index].x, points[index].y);
      }
      ctx.closePath();
    };

    const buildSquareTiles = () => {
      const tileSize = Math.max(132, Math.min(192, Math.round(Math.min(width, height) * 0.23)));
      const columns = Math.ceil(width / tileSize) + 2;
      const rows = Math.ceil(height / tileSize) + 2;
      const startX = width * 0.5 - columns * tileSize * 0.5;
      const startY = height * 0.52 - rows * tileSize * 0.5;
      mirrorTiles = [];

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < columns; col += 1) {
          const x = startX + col * tileSize;
          const y = startY + row * tileSize;
          if (x > width + tileSize || y > height + tileSize || x + tileSize < -tileSize || y + tileSize < -tileSize) {
            continue;
          }
          mirrorTiles.push({ x, y, size: tileSize });
        }
      }
    };

    const drawMirrorTile = (tile, progress) => {
      const { x, y, size } = tile;
      const tileW = size;
      const tileH = size;
      const cx = x + size * 0.5;
      const cy = y + size * 0.5;
      const dx = (cx / width - 0.5) / 0.55;
      const dy = (cy / height - 0.5) / 0.54;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const start = 0.08 + distance * 0.42;
      const reveal = smoothstep(start, start + 0.24, progress);
      const fade = 1 - smoothstep(0.84, 0.985, progress);
      const alpha = reveal * fade;
      if (alpha <= 0.002) return;

      const centerPull = (1 - reveal) * 0.16;
      const drawX = x + (width * 0.5 - cx) * centerPull;
      const drawY = y + (height * 0.52 - cy) * centerPull;
      const drawW = tileW + Math.max(1.5, width * 0.0012);
      const drawH = tileH + Math.max(1.5, height * 0.0012);
      const refractX = (cx / width - 0.5) * width * 0.014 * (1 - reveal);
      const refractY = (cy / height - 0.5) * height * 0.012 * (1 - reveal);
      const corners = [
        projectDomePoint(drawX, drawY, progress),
        projectDomePoint(drawX + drawW, drawY, progress),
        projectDomePoint(drawX + drawW, drawY + drawH, progress),
        projectDomePoint(drawX, drawY + drawH, progress),
      ];
      const lift = corners.reduce((sum, point) => sum + point.z, 0) * 0.25;
      const edgeFade = 1 - Math.min(0.42, corners.reduce((sum, point) => sum + point.rim, 0) * 0.12);

      ctx.save();
      tracePolygon(corners);
      ctx.clip();
      ctx.globalAlpha = 0.18 + alpha * 0.7;
      ctx.drawImage(coverLayers.slide2, -refractX, -refractY, width, height);

      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = alpha * (0.24 + lift * 0.22);
      ctx.drawImage(glassTexture, -refractX, -refractY, width, height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(88, 198, 255, ${0.04 + (1 - distance) * 0.11 * alpha + lift * 0.075})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = alpha * edgeFade;
      tracePolygon(corners);
      ctx.fillStyle = `rgba(168, 214, 255, ${0.018 + reveal * 0.03 + lift * 0.035})`;
      ctx.fill();
      ctx.restore();
    };

    const drawDomeLighting = (progress, fieldAlpha, withShadow = true) => {
      const domeProgress = smoothstep(0.1, 0.72, progress) * (1 - smoothstep(0.84, 0.985, progress));
      if (domeProgress <= 0.002) return;

      if (withShadow) {
        ctx.save();
        ctx.globalAlpha = fieldAlpha * domeProgress * 0.74;
        ctx.translate(width * 0.53, height * 0.59);
        ctx.scale(1.9, 0.68);
        const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.24);
        shadow.addColorStop(0, "rgba(0, 0, 0, 0.58)");
        shadow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = shadow;
        ctx.beginPath();
        ctx.arc(0, 0, width * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const highlight = ctx.createRadialGradient(width * 0.43, height * 0.35, 0, width * 0.47, height * 0.44, Math.max(width, height) * 0.42);
      highlight.addColorStop(0, `rgba(218, 238, 255, ${0.2 * fieldAlpha * domeProgress})`);
      highlight.addColorStop(0.26, `rgba(78, 189, 255, ${0.12 * fieldAlpha * domeProgress})`);
      highlight.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = highlight;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();
    };

    const drawMirrorField = (progress) => {
      const fieldAlpha = smoothstep(0.04, 0.28, progress) * (1 - smoothstep(0.86, 0.985, progress));
      if (fieldAlpha <= 0.002) return;

      const radius = smoothstep(0.02, 0.72, progress);
      const glowRadius = Math.max(width, height) * (0.06 + radius * 0.7);
      const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, glowRadius);
      gradient.addColorStop(0, `rgba(72, 178, 255, ${0.22 * fieldAlpha})`);
      gradient.addColorStop(0.36, `rgba(36, 116, 204, ${0.1 * fieldAlpha})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      drawDomeLighting(progress, fieldAlpha);

      for (let index = 0; index < mirrorTiles.length; index += 1) {
        drawMirrorTile(mirrorTiles[index], progress);
      }

      drawDomeLighting(progress, fieldAlpha * 0.62, false);
    };

    const draw = () => {
      if (!isReady) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const p = prefersReducedMotion ? targetProgress : easedProgress;

      // Примеры тают в первой трети перехода: сначала пропадают карточки и текст,
      // фон при этом не мигает — подложка pin-stage несёт ту же картинку.
      const contentFade = smoothstep(0.04, 0.34, p);
      if (exSticky) {
        exSticky.style.opacity = (1 - contentFade).toFixed(3);
        exSticky.style.pointerEvents = contentFade > 0.35 ? "none" : "";
      }
      if (vignette) vignette.style.opacity = contentFade.toFixed(3);

      // Кроссфейд в конце: холст (со снимком зеркала) гаснет, а реальный блок-зеркало
      // за ним проявляется. Снимок ≈ реальный блок, поэтому переход незаметен, и дальше
      // по скроллу продолжается уже сам блок — второго экрана зеркала нет.
      // Реальный блок (с заголовком) проявляется плавно ближе к концу; холст (интерьер
      // без текста) синхронно гаснет. Заголовок всплывает только из реального блока.
      const handoff = smoothstep(0.72, 1.0, p);
      if (mirWrap) mirWrap.style.opacity = handoff.toFixed(3);
      canvas.style.opacity = (1 - handoff).toFixed(3);

      if (p >= 0.992) {
        drawLayer(coverLayers.slide2, 1);
        return;
      }

      // База не рисуется — прозрачно; сквозь холст виден реальный блок «Примеры работ»
      // (пока он в кадре) либо ребристый фон pin-stage (когда блок уехал вверх).

      const dim = smoothstep(0.14, 0.46, p) * (1 - smoothstep(0.76, 0.94, p));
      if (dim > 0) {
        ctx.save();
        ctx.globalAlpha = dim * 0.36;
        ctx.fillStyle = "#01030d";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      drawMirrorField(p);

      const finalAlpha = smoothstep(0.68, 0.985, p);
      drawLayer(coverLayers.slide2, finalAlpha);
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      width = window.innerWidth;
      height = window.innerHeight;
      mirrorTravelPx = Math.max(1, window.innerHeight * 1.6);
      const footerEl = footerWrap.querySelector(".site-footer") as HTMLElement | null;
      footerH = footerEl ? footerEl.offsetHeight : 400;
      section.style.height = `${window.innerHeight + mirrorTravelPx + footerH}px`;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "medium";
      if (isReady) {
        buildSquareTiles();
        rebuildRenderCaches();
        updateTargetProgress();
        draw();
      }
    };

    const updateTargetProgress = () => {
      const rect = section.getBoundingClientRect();
      const scrolled = Math.max(0, -rect.top);
      targetProgress = clamp(scrolled / mirrorTravelPx);
      targetFooterProgress = clamp((scrolled - mirrorTravelPx) / Math.max(1, footerH));
      document.documentElement.style.setProperty("--vz-progress", targetProgress.toFixed(4));
    };

    const scheduleDraw = () => {
      if (!frameId) {
        frameId = requestAnimationFrame(tick);
      }
    };

    const tick = () => {
      frameId = 0;
      if (destroyed) return;
      easedProgress += (targetProgress - easedProgress) * (prefersReducedMotion ? 1 : 0.105);
      if (Math.abs(targetProgress - easedProgress) < 0.0005) {
        easedProgress = targetProgress;
      }
      const footerPhase = targetProgress >= 0.999;
      const footerReady = footerPhase && easedProgress > 0.995;
      const footerTarget = footerReady ? targetFooterProgress : 0;
      section.classList.toggle("is-footer-phase", footerPhase);

      easedFooterProgress += (footerTarget - easedFooterProgress) * (prefersReducedMotion ? 1 : 0.1);
      if (Math.abs(footerTarget - easedFooterProgress) < 0.0005) {
        easedFooterProgress = footerTarget;
      }
      const footerP = smoothstep(0, 1, easedFooterProgress);
      const footerVisible = footerReady && easedFooterProgress > 0.002;
      mirWrap.style.transform = `translate3d(0, ${(-footerP * footerH).toFixed(1)}px, 0)`;
      footerWrap.style.transform = `translate3d(0, ${((1 - footerP) * 24).toFixed(1)}px, 0)`;
      footerWrap.style.opacity = footerVisible ? "1" : "0";
      footerWrap.style.visibility = footerVisible ? "visible" : "hidden";
      draw();
      if (
        Math.abs(targetProgress - easedProgress) > 0.0005 ||
        Math.abs(targetFooterProgress - easedFooterProgress) > 0.0005
      ) {
        scheduleDraw();
      }
    };

    const handleScroll = () => {
      updateTargetProgress();
      scheduleDraw();
    };

    // ── Снятие блока-зеркала (нашего, локального) в изображение ───
    const findMirror = () => mirSection;

    // Временно форсим «проявленное» состояние блока (без анимаций/переходов),
    // чтобы снимок содержал фон + текст + карточки, а не скрытое исходное состояние.
    const forceStyle = document.createElement("style");
    forceStyle.textContent = `
      .vz-snap-now, .vz-snap-now *, .vz-snap-now *::before, .vz-snap-now *::after {
        transition: none !important; animation: none !important;
      }
      .vz-snap-now.mirror-section::before { opacity: 1 !important; transform: none !important; }
      /* Фон-интерьер у блока-зеркала задан через ::before — snapdom его не тянет,
         поэтому на время снимка кладём картинку прямо на элемент. */
      .vz-snap-now.mirror-section {
        background: #fff url('/assets/background-5.png') center center / cover no-repeat !important;
      }
      .vz-snap-now .section__title { opacity: 1 !important; transform: none !important; }
      .vz-snap-now .exm-card, .vz-snap-now .exd-carousel .exm-card {
        opacity: 1 !important;
      }
    `;

    const snapWithForced = async (el, extraClasses) => {
      if (!document.head.contains(forceStyle)) document.head.appendChild(forceStyle);
      const added = [];
      ["vz-snap-now", ...extraClasses].forEach((c) => {
        if (!el.classList.contains(c)) {
          el.classList.add(c);
          added.push(c);
        }
      });
      void el.offsetWidth; // reflow — применить форс до снимка
      try {
        // Снимок БЕЗ заголовка (exclude .mirror-text): текст берём только из реального
        // блока при кроссфейде. Иначе снимок и живой блок переносят строки по-разному
        // (шрифт/метрики) и текст «прыгает» при проявлении.
        return await snapdom.toImg(el, {
          fast: true,
          backgroundColor: "#ffffff",
          scale: 1,
          embedFonts: true,
          exclude: [".mirror-text"],
        });
      } finally {
        added.forEach((c) => el.classList.remove(c));
      }
    };

    const captureSlides = async () => {
      // Снимаем ТОЛЬКО блок-зеркало (куда). «Примеры работ» не снимаем — сложную
      // JS-раскладку карусели snapdom не тянет; показываем реальный блок сквозь холст.
      const mirEl = findMirror();
      let slide2;
      try {
        slide2 = mirEl ? await snapWithForced(mirEl, ["mirror-visible"]) : await loadImage(SLIDE_2);
      } catch (e) {
        console.warn("[vz] snapshot зеркального блока не удался, fallback на фон", e);
        slide2 = await loadImage(SLIDE_2);
      }
      return { slide2 };
    };

    const init = async () => {
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch {}
      }
      const captured = await captureSlides();
      if (destroyed) return;
      images = captured;
      isReady = true;
      resize();
      updateTargetProgress();
      loader.classList.add("is-hidden");
      scheduleDraw();
    };

    // Снимаем лениво — когда переход подходит к вьюпорту (примеры уже проскроллены и «осели»).
    let captureStarted = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !captureStarted) {
          captureStarted = true;
          io.disconnect();
          init();
        }
      },
      { rootMargin: "150% 0px 150% 0px" }
    );
    io.observe(section);

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("orientationchange", resize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      destroyed = true;
      if (frameId) cancelAnimationFrame(frameId);
      io.disconnect();
      forceStyle.remove();
      section.style.height = "";
      section.classList.remove("is-footer-phase");
      if (exSticky) {
        exSticky.style.opacity = "";
        exSticky.style.pointerEvents = "";
      }
      if (vignette) vignette.style.opacity = "";
      mirWrap.style.transform = "";
      footerWrap.style.transform = "";
      footerWrap.style.opacity = "";
      footerWrap.style.visibility = "";
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className="vz-transition-section" aria-label="Переход в блок «Наши работы вписываются в любой интерьер»">
      <div className="vz-pin-stage">
        <div ref={footerRef} className="vz-footer-under" dangerouslySetInnerHTML={{ __html: footerHtml }} />
        {/* Реальный блок-зеркало — за холстом; холст в конце гаснет и открывает его. */}
        <div ref={mirRef} className="vz-mir" dangerouslySetInnerHTML={{ __html: mirrorHtml }} />
        <canvas ref={canvasRef} className="vz-glass-scene" aria-label="Плавный переход в блок про интерьер" />
        <div className="vz-edge-vignette" aria-hidden="true" />
        <div className="vz-scroll-meter" aria-hidden="true" />
        <div ref={loaderRef} className="vz-loading">loading</div>
      </div>
    </section>
  );
}

export default function VariantZeroTransition({
  mirrorHtml,
  footerHtml,
}: {
  mirrorHtml: string;
  footerHtml: string;
}) {
  const version = useSiteVersion();
  const isMobile = useIsMobile();
  const active = version === "2" && !isMobile;
  return active ? <GlassStage mirrorHtml={mirrorHtml} footerHtml={footerHtml} /> : null;
}
