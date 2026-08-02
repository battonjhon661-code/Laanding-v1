"use client";
import { useEffect, useState } from "react";

/** Текущая тестовая версия сайта ("1" | "2" | "3"), реактивно. */
export function useSiteVersion(): string {
  const [version, setVersion] = useState("1");

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setVersion(root.getAttribute("data-version") || "1");
    read();
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["data-version"] });
    return () => obs.disconnect();
  }, []);

  return version;
}

/** true на мобильной ширине — там переходов нет ни в одной версии. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

/**
 * Возвращает true, когда блоки должны идти монолитом, друг за другом:
 * мобильная ширина или версия 5 (без переходов).
 * Версия 6 — плоская раскладка с anchor-якорями; IceFractureTransition делает переходы.
 */
export function useFlatLayout(): boolean {
  // Оба хука вызываем безусловно — `||` замкнул бы второй и сломал порядок хуков.
  const isMobile = useIsMobile();
  const version = useSiteVersion();
  return isMobile || version === "5";
}
