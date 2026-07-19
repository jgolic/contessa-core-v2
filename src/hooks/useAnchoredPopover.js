"use client";

import { useLayoutEffect, useState } from "react";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resolvePopoverPosition(anchorRect, options = {}) {
  if (typeof window === "undefined" || !anchorRect) {
    return null;
  }

  const {
    align = "end",
    gap = 10,
    margin = 12,
    matchAnchorWidth = false,
    preferredWidth,
    minWidth = 280,
    maxWidth = 420,
    minHeight = 220,
    maxHeight = 520,
    mobileBreakpoint = 640,
  } = options;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const safeWidth = Math.max(160, viewportWidth - margin * 2);
  const isMobile = viewportWidth < mobileBreakpoint;
  const maxAllowedWidth = Math.min(maxWidth, safeWidth);
  const minAllowedWidth = Math.min(minWidth, maxAllowedWidth);
  const requestedWidth = isMobile
    ? safeWidth
    : preferredWidth ?? (matchAnchorWidth ? anchorRect.width : maxAllowedWidth);
  const width = clamp(requestedWidth, minAllowedWidth, maxAllowedWidth);

  let left = anchorRect.right - width;
  if (align === "start") left = anchorRect.left;
  if (align === "center") left = anchorRect.left + (anchorRect.width - width) / 2;
  left = clamp(left, margin, viewportWidth - width - margin);

  const minAllowedTop = Math.max(margin, viewportHeight - minHeight - margin);
  const top = clamp(anchorRect.bottom + gap, margin, minAllowedTop);
  const availableHeight = Math.max(120, viewportHeight - top - margin);
  const heightLimit = Math.max(120, Math.min(maxHeight, availableHeight));
  const anchorCenter = anchorRect.left + anchorRect.width / 2;
  const arrowLeft = clamp(anchorCenter - left - 8, 18, width - 34);

  return {
    left,
    top,
    width,
    maxHeight: heightLimit,
    arrowLeft,
  };
}

export function useAnchoredPopover({ open, anchorRef, options = {} }) {
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) {
      setPosition(null);
      return undefined;
    }

    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      setPosition(resolvePopoverPosition(anchor.getBoundingClientRect(), options));
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef, options]);

  return position;
}
