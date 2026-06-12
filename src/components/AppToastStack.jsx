"use client";

function getToastTone(type = "info", darkMode = false) {
  const surface = darkMode
    ? "border-white/10 bg-slate-950/95 text-slate-50 shadow-[0_24px_70px_rgba(0,0,0,0.48)]"
    : "border-slate-200/90 bg-white/95 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.16)]";

  const tones = {
    success: {
      rail: darkMode ? "bg-emerald-300" : "bg-emerald-500",
      pill: darkMode
        ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
        : "border-emerald-200 bg-emerald-50 text-emerald-800",
      label: "Saved",
    },
    error: {
      rail: darkMode ? "bg-rose-300" : "bg-rose-500",
      pill: darkMode
        ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
        : "border-rose-200 bg-rose-50 text-rose-700",
      label: "Needs attention",
    },
    warning: {
      rail: darkMode ? "bg-amber-300" : "bg-amber-500",
      pill: darkMode
        ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
        : "border-amber-200 bg-amber-50 text-amber-800",
      label: "Review",
    },
    info: {
      rail: darkMode ? "bg-cyan-300" : "bg-blue-500",
      pill: darkMode
        ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
        : "border-blue-200 bg-blue-50 text-blue-800",
      label: "Update",
    },
  };

  return { surface, ...(tones[type] || tones.info) };
}

export default function AppToastStack({ toasts = [], darkMode = false, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-3 top-3 z-[11000] flex justify-end sm:inset-x-auto sm:right-6 sm:top-6"
    >
      <div className="flex w-full max-w-[420px] flex-col gap-3">
        {toasts.map((toast) => {
          const tone = getToastTone(toast.type, darkMode);

          return (
            <div
              key={toast.id}
              className={[
                "pointer-events-auto overflow-hidden rounded-3xl border backdrop-blur-xl",
                "transition-all duration-200",
                tone.surface,
              ].join(" ")}
            >
              <div className="flex gap-4 p-4">
                <div className={`w-1.5 shrink-0 rounded-full ${tone.rail}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${tone.pill}`}>
                        {toast.label || tone.label}
                      </span>
                      {toast.title ? (
                        <p className="mt-2 truncate text-sm font-semibold text-inherit">
                          {toast.title}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss notification"
                      onClick={() => onDismiss?.(toast.id)}
                      className={[
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-sm font-bold",
                        darkMode
                          ? "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                      ].join(" ")}
                    >
                      x
                    </button>
                  </div>
                  {toast.message ? (
                    <p className={darkMode ? "mt-2 line-clamp-2 text-sm leading-5 text-slate-300" : "mt-2 line-clamp-2 text-sm leading-5 text-slate-600"}>
                      {toast.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
