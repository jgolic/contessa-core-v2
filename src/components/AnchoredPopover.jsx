"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAnchoredPopover } from "../hooks/useAnchoredPopover.js";

export default function AnchoredPopover({
  open = false,
  anchorRef,
  onClose,
  children,
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
  showArrow = true,
  panelClassName = "",
  overlayClassName = "bg-transparent",
  contentClassName = "",
  ariaLabel = "Popover",
}) {
  const [mounted, setMounted] = useState(false);
  const options = useMemo(
    () => ({
      align,
      gap,
      margin,
      matchAnchorWidth,
      preferredWidth,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      mobileBreakpoint,
    }),
    [align, gap, margin, matchAnchorWidth, preferredWidth, minWidth, maxWidth, minHeight, maxHeight, mobileBreakpoint]
  );
  const position = useAnchoredPopover({ open, anchorRef, options });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!mounted || !open || !position) return null;

  return createPortal(
    <div className="fixed inset-0 z-[30000]">
      <button
        type="button"
        aria-label={`Close ${ariaLabel}`}
        className={`absolute inset-0 cursor-default ${overlayClassName}`}
        onMouseDown={onClose}
      />
      <aside
        role="dialog"
        aria-label={ariaLabel}
        style={{
          left: position.left,
          top: position.top,
          width: position.width,
          maxHeight: position.maxHeight,
        }}
        className={[
          "fixed z-[30001] rounded-3xl border border-slate-200/90 bg-white text-slate-950  backdrop-blur-xl",
          "dark:border-white/10 dark:bg-slate-950 dark:text-slate-50 ",
          panelClassName,
        ].filter(Boolean).join(" ")}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {showArrow ? (
          <div
            aria-hidden="true"
            style={{ left: position.arrowLeft }}
            className="absolute -top-2 h-4 w-4 rotate-45 border-l border-t border-slate-200/90 bg-white dark:border-white/10 dark:bg-slate-950"
          />
        ) : null}
        <div
          style={{ maxHeight: position.maxHeight }}
          className={["rounded-3xl overflow-y-auto", contentClassName].filter(Boolean).join(" ")}
        >
          {children}
        </div>
      </aside>
    </div>,
    document.body
  );
}
