"use client";

import { useEffect, useRef } from "react";

export function useAutoFitSingleLine(value, {
  minFontSize = 1,
  maxFontSize = 154,
} = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof window === "undefined") return undefined;

    const container = element.parentElement;
    let animationFrame = 0;
    let active = true;

    const measureTextWidth = (fontSize) => {
      const styles = window.getComputedStyle(element);
      const probe = document.createElement("span");
      probe.textContent = element.textContent || value || "";
      Object.assign(probe.style, {
        position: "fixed",
        left: "-10000px",
        top: "0",
        visibility: "hidden",
        width: "max-content",
        maxWidth: "none",
        overflow: "visible",
        whiteSpace: "nowrap",
        textOverflow: "clip",
        fontFamily: styles.fontFamily,
        fontSize: `${fontSize}px`,
        fontStyle: styles.fontStyle,
        fontWeight: styles.fontWeight,
        fontStretch: styles.fontStretch,
        fontVariant: styles.fontVariant,
        fontKerning: styles.fontKerning,
        fontFeatureSettings: styles.fontFeatureSettings,
        letterSpacing: styles.letterSpacing,
        textTransform: styles.textTransform,
      });
      document.body.appendChild(probe);
      const width = probe.getBoundingClientRect().width;
      probe.remove();
      return width;
    };

    const fit = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        if (!active) return;

        let low = minFontSize;
        let high = maxFontSize;
        element.style.setProperty("--auto-fit-font-size", `${high}px`);

        const availableWidth = element.clientWidth - 2;
        if (availableWidth <= 0) return;

        for (let step = 0; step < 9; step += 1) {
          const candidate = (low + high) / 2;
          if (measureTextWidth(candidate) <= availableWidth) {
            low = candidate;
          } else {
            high = candidate;
          }
        }

        element.style.setProperty("--auto-fit-font-size", `${Math.floor(low * 10) / 10}px`);
      });
    };

    fit();
    let observedWidth = container?.clientWidth || 0;
    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width || 0;
      if (Math.abs(nextWidth - observedWidth) < 0.5) return;
      observedWidth = nextWidth;
      fit();
    }) : null;
    if (container) resizeObserver?.observe(container);
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    document.fonts?.ready.then(fit).catch(() => {});

    return () => {
      active = false;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, [maxFontSize, minFontSize, value]);

  return ref;
}
