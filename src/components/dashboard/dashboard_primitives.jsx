import { useRevealHighlight } from "../../hooks/useRevealHighlight.js";

/* ------------------------------------------------------------------ */
/* Midnight Bridge dashboard primitives.                               */
/* Editorial ledger language: hairlines, serif accents, champagne      */
/* ticks — no card-soup. Exported API matches the previous primitives. */
/* ------------------------------------------------------------------ */

const TONE_TICK = {
  critical: "bg-[#d9776b]",
  warning: "bg-[#c9a96a]",
  success: "bg-[#58ae8f]",
  neutral: "bg-[rgba(233,226,208,0.28)]",
};

const TONE_TEXT = {
  critical: "text-[#e9a49a]",
  warning: "text-[#e6cf9f]",
  success: "text-[#8fd0b5]",
  neutral: "text-[rgba(233,226,208,0.6)]",
};

function flashJumpHighlight(element) {
  if (!element) return;
  element.classList.remove("jump-highlight-active");
  void element.offsetWidth;
  element.classList.add("jump-highlight-target");
  element.classList.add("jump-highlight-active");
  window.setTimeout(() => element.classList.remove("jump-highlight-active"), 1900);
}

export function SectionAccordion({
  id,
  darkMode = true,
  title,
  subtitle,
  count,
  tone = "neutral",
  module,
  isOpen = false,
  onToggle,
  actionLabel,
  onAction,
  children,
}) {
  const expandedRevealRef = useRevealHighlight(isOpen, {
    radius: "18px",
    delay: 160,
    scrollIntoView: true,
    block: "nearest",
  });

  const toggle = (event) => {
    flashJumpHighlight(event.currentTarget.closest("[data-jump-target]"));
    onToggle?.();
  };

  return (
    <section
      id={id}
      data-jump-target
      style={{ "--jump-radius": "14px" }}
      className="jump-highlight-target mb-ledger-row group min-w-0 rounded-[14px]"
    >
      <div className="flex min-w-0 items-center gap-4 py-4 md:gap-6 md:py-5">
        <button type="button" onClick={toggle} className="flex min-w-0 flex-1 items-baseline gap-3 text-left md:gap-5">
          <span className={`hidden shrink-0 text-[10px] font-bold uppercase tracking-[0.26em] sm:inline ${TONE_TEXT[tone] || TONE_TEXT.neutral}`}>
            {String(count ?? 0).padStart(2, "0")}
          </span>
          <span className="min-w-0">
            <span className="midnight-heading block truncate text-xl text-[#f4f0e6] md:text-2xl">{title}</span>
            {subtitle ? (
              <span className="mt-1 block truncate text-[13px] leading-5 text-[rgba(229,223,209,0.55)]">{subtitle}</span>
            ) : null}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2.5">
          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[rgba(233,226,208,0.55)] transition-colors hover:text-[#e6cf9f] sm:inline-flex"
            >
              {actionLabel}
              <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3"><path d="M3 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ) : null}
          <button
            type="button"
            onClick={toggle}
            aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
            aria-expanded={isOpen}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
              isOpen
                ? "border-[rgba(230,207,159,0.6)] text-[#e6cf9f]"
                : "border-[rgba(201,169,106,0.22)] text-[rgba(233,226,208,0.5)] group-hover:border-[rgba(230,207,159,0.45)] group-hover:text-[#e6cf9f]"
            }`}
          >
            <svg viewBox="0 0 16 16" fill="none" className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {isOpen ? (
        <div ref={expandedRevealRef} className="ui-reveal-target rounded-[18px] pb-5" style={{ "--reveal-radius": "18px" }}>
          {children}
          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a96a] transition-colors hover:text-[#e6cf9f] sm:hidden"
            >
              {actionLabel}
              <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3"><path d="M3 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function CompactItemCard({
  htmlId,
  darkMode = true,
  item,
  selected = false,
  onClick,
  actionLabel = "Open",
}) {
  const tone = item?.tone || "neutral";
  const owner = item?.assignedTo || item?.requester || "Operations";
  const dueMeta = item?.meta?.find((entry) => ["Due", "Expiry"].includes(entry?.label));
  const metaLine = [item?.badge, owner, dueMeta?.value, item?.amount].filter(Boolean).join("  ·  ");

  return (
    <button
      id={htmlId}
      data-jump-target
      style={{ "--jump-radius": "14px" }}
      type="button"
      onClick={(event) => {
        if (htmlId) flashJumpHighlight(event.currentTarget);
        onClick?.(event);
      }}
      className={`jump-highlight-target group relative w-full min-w-0 rounded-[14px] border px-4 py-3.5 text-left transition-all duration-300 ${
        selected
          ? "border-[rgba(230,207,159,0.55)] bg-[rgba(201,169,106,0.08)]"
          : "border-[rgba(201,169,106,0.13)] bg-[rgba(10,15,29,0.35)] hover:border-[rgba(230,207,159,0.4)] hover:bg-[rgba(201,169,106,0.05)]"
      }`}
    >
      <span className={`absolute left-0 top-1/2 h-[60%] w-[2px] -translate-y-1/2 rounded-r-full ${TONE_TICK[tone] || TONE_TICK.neutral}`} />
      <span className="flex min-w-0 items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="app-clamp-2 block text-[15px] font-semibold leading-snug text-[#f4f0e6]">{item?.title}</span>
          {item?.subtitle ? (
            <span className="mt-1 block truncate text-[12.5px] leading-5 text-[rgba(229,223,209,0.55)]">{item.subtitle}</span>
          ) : null}
          {metaLine ? (
            <span className={`mt-2 block truncate text-[10px] font-bold uppercase tracking-[0.16em] ${TONE_TEXT[tone] || TONE_TEXT.neutral}`}>
              {metaLine}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(201,169,106,0.2)] text-[rgba(233,226,208,0.45)] transition-all duration-300 group-hover:border-[rgba(230,207,159,0.55)] group-hover:text-[#e6cf9f]" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3"><path d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </span>
    </button>
  );
}

export function DashboardEmptyState({
  darkMode = true,
  title,
  message,
  actionLabel,
  onAction,
  secondaryContent = null,
}) {
  return (
    <div className="rounded-[14px] border border-dashed border-[rgba(201,169,106,0.22)] px-5 py-6 text-center">
      <div className="midnight-heading text-lg italic text-[rgba(240,234,218,0.85)]">{title}</div>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-[rgba(229,223,209,0.55)]">{message}</p>
      {secondaryContent ? <div className="mt-3 text-[rgba(229,223,209,0.6)]">{secondaryContent}</div> : null}
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a96a] transition-colors hover:text-[#e6cf9f]"
        >
          {actionLabel}
          <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3"><path d="M3 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      ) : null}
    </div>
  );
}

export function DetailDrawer({
  darkMode = true,
  open = false,
  title,
  subtitle,
  meta = [],
  onClose,
  children,
}) {
  const revealRef = useRevealHighlight(open, {
    radius: "24px",
    delay: 180,
    triggerKey: `${title || ""}-${subtitle || ""}`,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[30000]">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(3,5,10,0.6)] backdrop-blur-[3px]"
        onClick={onClose}
        aria-label="Close detail drawer"
      />
      <div
        ref={revealRef}
        className="mb-glass ui-reveal-target absolute inset-x-2 bottom-2 top-auto max-h-[92dvh] overflow-y-auto overflow-x-hidden rounded-[24px] border p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:inset-y-3 md:left-auto md:right-3 md:w-[480px] md:p-6"
        style={{ "--reveal-radius": "24px", position: "absolute" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#c9a96a]">Manifest entry</div>
            <h2 className="midnight-heading mt-2 text-[1.65rem] leading-tight text-[#f4f0e6]">{title}</h2>
            {subtitle ? <p className="mt-2 text-sm leading-6 text-[rgba(229,223,209,0.6)]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(201,169,106,0.25)] text-[rgba(233,226,208,0.7)] transition-colors hover:border-[rgba(230,207,159,0.6)] hover:text-[#e6cf9f]"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="midnight-gold-rule mt-5" />

        {meta?.filter(Boolean).length ? (
          <dl className="mt-4 grid grid-cols-2 gap-x-4">
            {meta.filter(Boolean).map((entry) => (
              <div key={`${title}-${entry.label}`} className="border-b border-[rgba(201,169,106,0.1)] py-2.5">
                <dt className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[rgba(229,223,209,0.45)]">{entry.label}</dt>
                <dd className="mt-1 truncate text-sm font-semibold text-[#f4f0e6]">{entry.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
