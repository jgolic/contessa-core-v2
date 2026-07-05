"use client";

import { useEffect, useRef } from "react";

export function triggerRevealHighlight(element, duration = 1900) {
  if (!element) return;

  element.classList.add("ui-reveal-target");
  element.classList.remove("ui-reveal-active");

  // Restart the CSS animation when the same panel is opened again.
  void element.offsetWidth;

  element.classList.add("ui-reveal-active");

  window.setTimeout(() => {
    element.classList.remove("ui-reveal-active");
  }, duration);
}

export function useRevealHighlight(active, options = {}) {
  const ref = useRef(null);
  const previousActive = useRef(false);
  const previousTriggerKey = useRef(null);

  const {
    delay = 120,
    duration = 1900,
    radius = "28px",
    scrollIntoView = false,
    block = "center",
    triggerKey = active ? "open" : "closed",
  } = options;

  useEffect(() => {
    if (!active) {
      previousActive.current = false;
      previousTriggerKey.current = null;
      return undefined;
    }

    if (previousActive.current && previousTriggerKey.current === triggerKey) return undefined;

    previousActive.current = true;
    previousTriggerKey.current = triggerKey;

    const timer = window.setTimeout(() => {
      const element = ref.current;
      if (!element) return;

      element.style.setProperty("--reveal-radius", radius);

      if (scrollIntoView) {
        element.scrollIntoView({
          behavior: "smooth",
          block,
          inline: "nearest",
        });
      }

      triggerRevealHighlight(element, duration);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [active, delay, duration, radius, scrollIntoView, block, triggerKey]);

  return ref;
}
