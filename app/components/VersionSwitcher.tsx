"use client";
import { useEffect, useState } from "react";

const VERSIONS = ["1", "2", "3", "4", "5"] as const;
const DEFAULT_VERSION = "1";
const TITLES: Record<string, string> = {
  "1": "Витрина вылетает справа",
  "2": "Песочница новых переходов",
  "3": "Шторка + световой проход",
  "4": "Хиро-крышка + круговой переход",
  "5": "Без переходов между блоками",
};

const RESET_SCROLL_KEY = "vipglassVersionReload";

export default function VersionSwitcher() {
  const [version, setVersion] = useState(DEFAULT_VERSION);

  useEffect(() => {
    const saved = localStorage.getItem("siteVersion");
    const nextVersion =
      saved && VERSIONS.includes(saved as (typeof VERSIONS)[number])
        ? saved
        : DEFAULT_VERSION;

    setVersion(nextVersion);
    document.documentElement.setAttribute("data-version", nextVersion);
    localStorage.setItem("siteVersion", nextVersion);

    const previousScrollRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";

    if (sessionStorage.getItem(RESET_SCROLL_KEY) === "1") {
      sessionStorage.removeItem(RESET_SCROLL_KEY);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
      window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }), 120);
    }

    return () => {
      if (sessionStorage.getItem(RESET_SCROLL_KEY) === "1") return;
      history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  const switchVersion = (nextVersion: string) => {
    if (nextVersion === version) return;

    localStorage.setItem("siteVersion", nextVersion);
    sessionStorage.setItem(RESET_SCROLL_KEY, "1");
    document.documentElement.setAttribute("data-version", nextVersion);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.location.reload();
  };

  return (
    <div className="version-switcher">
      {VERSIONS.map((v) => (
        <button
          key={v}
          type="button"
          title={TITLES[v]}
          aria-label={TITLES[v]}
          className={v === version ? "is-active" : ""}
          onClick={() => switchVersion(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
