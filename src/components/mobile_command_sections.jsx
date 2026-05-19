import { getModuleTheme, moduleThemeKeyForResult } from "./module_themes.js";

export function MobileSection({
  id,
  title,
  subtitle,
  count,
  themeKey = "dashboard",
  open = false,
  onOpen,
  children,
}) {
  const moduleTheme = getModuleTheme(themeKey);

  return (
    <section
      id={`mobile-${id}`}
      className={`w-full min-w-0 max-w-full overflow-hidden rounded-3xl border bg-white/90 text-slate-950 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:bg-slate-900/90 dark:text-slate-50 dark:shadow-[0_18px_50px_rgba(0,0,0,0.34)] ${open ? `${moduleTheme.border} ${moduleTheme.glow}` : "border-slate-200/80 dark:border-white/10"}`}
    >
      <button
        type="button"
        onClick={() => onOpen?.(id)}
        className="flex w-full min-w-0 items-center justify-between gap-3 px-4 py-4 text-left"
        aria-expanded={open}
        aria-controls={`mobile-${id}-content`}
      >
        <span className="min-w-0">
          <span className={`block max-w-full truncate whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.1em] ${open ? moduleTheme.accent : "text-slate-600 dark:text-slate-300"}`}>
            {title}
          </span>
          {subtitle ? (
            <span className="mt-1 block max-w-full truncate text-sm leading-5 text-slate-600 dark:text-slate-300">
              {subtitle}
            </span>
          ) : null}
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {count !== undefined && count !== null ? (
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${moduleTheme.chip}`}>
              {count}
            </span>
          ) : null}
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-lg font-semibold leading-none text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
            {open ? "-" : "+"}
          </span>
        </span>
      </button>

      {open ? (
        <div id={`mobile-${id}-content`} className="border-t border-slate-200/80 px-4 pb-4 pt-3 dark:border-white/10">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function MobileDetailSheet({ item, onClose }) {
  if (!item) return null;
  const moduleTheme = getModuleTheme(moduleThemeKeyForResult(item));

  const facts = [
    ["Priority", item.priority],
    ["Status", item.status],
    ["Assigned", item.assignedTo],
    ["Due", item.dueDate],
  ].filter(([, value]) => value);

  return (
    <div className="fixed inset-0 z-[90] md:hidden">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/55 backdrop-blur-sm"
        aria-label="Close details"
        onClick={onClose}
      />
      <aside className={`absolute inset-x-0 bottom-0 max-h-[88vh] overflow-hidden rounded-t-[32px] border bg-slate-950 text-slate-50 shadow-[0_-28px_80px_rgba(0,0,0,0.45)] ${moduleTheme.border}`}>
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${moduleTheme.accent}`}>{item.type || "Details"}</p>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-50">{item.title || "Untitled"}</h2>
            {item.subtitle ? <p className="mt-1 truncate text-sm text-slate-300">{item.subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(88vh-88px)] overflow-y-auto px-5 py-4">
          {facts.length ? (
            <div className="grid grid-cols-2 gap-3">
              {facts.map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-100">{value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {item.description ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className={`text-[11px] font-bold uppercase tracking-[0.1em] ${moduleTheme.accent}`}>Brief</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
            </div>
          ) : null}

          <div className="sticky bottom-0 mt-5 grid gap-2 bg-slate-950/95 py-3">
            <button type="button" className={`min-h-11 rounded-2xl border px-4 py-2 text-sm font-semibold ${moduleTheme.chip}`}>
              Request update
            </button>
            <button type="button" onClick={onClose} className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-100">
              Mark reviewed
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
