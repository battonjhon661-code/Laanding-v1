"use client";

type PulseMode = "class" | "animate";

function maxScrollY() {
  return Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight
  );
}

function pulseMessengerButtons(mode: PulseMode) {
  const buttons = document.querySelectorAll<HTMLElement>(".footer-msg-btn");

  buttons.forEach((button, index) => {
    window.setTimeout(() => {
      if (mode === "animate" && button.animate) {
        button.animate(
          [
            {
              transform: "scale(1)",
              boxShadow:
                "0 0 0 0 rgba(255,255,255,.9), 0 0 0 0 rgba(255,255,255,.4)",
            },
            {
              transform: "scale(1.10)",
              boxShadow:
                "0 0 18px 4px rgba(255,255,255,.5), 0 0 0 10px rgba(255,255,255,.08)",
              offset: 0.22,
            },
            {
              transform: "scale(1.04)",
              boxShadow:
                "0 0 28px 8px rgba(255,255,255,.14), 0 0 0 22px rgba(255,255,255,.02)",
              offset: 0.55,
            },
            {
              transform: "scale(1)",
              boxShadow:
                "0 0 0 0 rgba(255,255,255,0), 0 0 0 32px rgba(255,255,255,0)",
            },
          ],
          { duration: 900, iterations: 3, easing: "ease-out" }
        );
        return;
      }

      button.classList.remove("msg-pulse");
      void button.offsetWidth;
      button.classList.add("msg-pulse");
      button.addEventListener(
        "animationend",
        () => button.classList.remove("msg-pulse"),
        { once: true }
      );
    }, index * 160);
  });
}

function waitForFooterReveal(
  transition: HTMLElement,
  footer: HTMLElement,
  mode: PulseMode
) {
  let frames = 0;

  const check = () => {
    frames += 1;
    const wrap = transition.querySelector<HTMLElement>(".vz-footer-under");
    const wrapStyle = wrap ? window.getComputedStyle(wrap) : null;
    const rect = footer.getBoundingClientRect();
    const isOpen =
      (!wrapStyle ||
        (wrapStyle.visibility === "visible" &&
          Number.parseFloat(wrapStyle.opacity || "0") > 0.45)) &&
      rect.top < window.innerHeight - 80 &&
      rect.bottom > 80;

    if (isOpen || frames > 360) {
      pulseMessengerButtons(mode);
      return;
    }

    window.requestAnimationFrame(check);
  };

  window.requestAnimationFrame(check);
}

export function scrollToFooterAndPulse(options: { mode?: PulseMode } = {}) {
  const mode = options.mode || "class";
  const root = document.documentElement;
  const isVersionZero = root.getAttribute("data-version") === "2";
  const isDesktop = !window.matchMedia("(max-width: 768px)").matches;
  const transition = document.querySelector<HTMLElement>(".vz-transition-section");
  const footer =
    transition?.querySelector<HTMLElement>(".site-footer") ||
    document.querySelector<HTMLElement>(".site-footer") ||
    document.querySelector<HTMLElement>("footer");

  if (!footer) return;

  if (
    isVersionZero &&
    isDesktop &&
    transition &&
    transition.contains(footer)
  ) {
    const sectionTop = transition.getBoundingClientRect().top + window.scrollY;
    const footerHeight = footer.offsetHeight || 400;
    const mirrorTravel = Math.max(1, window.innerHeight * 1.6);
    const neededHeight = window.innerHeight + mirrorTravel + footerHeight;
    if (transition.getBoundingClientRect().height < neededHeight - 1) {
      transition.style.height = `${neededHeight}px`;
    }
    const targetY = Math.min(maxScrollY(), sectionTop + mirrorTravel + footerHeight);

    window.scrollTo({ top: targetY, behavior: "smooth" });
    waitForFooterReveal(transition, footer, mode);
    return;
  }

  footer.scrollIntoView({ behavior: "smooth" });
  window.setTimeout(() => pulseMessengerButtons(mode), 650);
}
