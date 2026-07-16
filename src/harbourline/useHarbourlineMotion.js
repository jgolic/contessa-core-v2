"use client";

import { useEffect } from "react";

/**
 * Harbourline motion system.
 * Targets declarative hooks in the DOM:
 *   [data-mb-hero]  — staggered rise on first paint (hero lines)
 *   [data-mb-reveal] — rise + fade when scrolled into view (once)
 *   [data-mb-count] — numeric count-up; supports data-mb-prefix / data-mb-suffix / data-mb-decimals
 * Skips entirely under prefers-reduced-motion.
 */
export function useHarbourlineMotion(deps = []) {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let cancelled = false;
    let ctx = null;

    (async () => {
      const [gsapModule, scrollTriggerModule] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      const gsap = gsapModule.gsap || gsapModule.default;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const heroLines = gsap.utils.toArray("[data-mb-hero]");
        if (heroLines.length) {
          gsap.fromTo(
            heroLines,
            { y: 48, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 1.15,
              ease: "power3.out",
              stagger: 0.10,
              delay: 0.1,
              clearProps: "transform,opacity,visibility",
            }
          );
        }

        gsap.utils.toArray("[data-mb-reveal]").forEach((element) => {
          gsap.fromTo(
            element,
            { y: 30, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.9,
              ease: "power3.out",
              clearProps: "transform,opacity,visibility",
              scrollTrigger: { trigger: element, start: "top 90%", once: true },
            }
          );
        });

        gsap.utils.toArray("[data-mb-count]").forEach((element) => {
          const target = Number.parseFloat(element.dataset.mbCount || "0");
          if (!Number.isFinite(target)) return;
          const prefix = element.dataset.mbPrefix || "";
          const suffix = element.dataset.mbSuffix || "";
          const decimals = Number(element.dataset.mbDecimals || 0);
          const counter = { value: 0 };
          gsap.to(counter, {
            value: target,
            duration: 1.7,
            ease: "power2.out",
            scrollTrigger: { trigger: element, start: "top 94%", once: true },
            onUpdate() {
              element.textContent = `${prefix}${counter.value.toLocaleString("en-US", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              })}${suffix}`;
            },
          });
        });
      });
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
