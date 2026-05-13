import { Card, CardContent } from "../ui/card.jsx";
import { Button } from "../ui/button.jsx";
import { Badge } from "../ui/badge.jsx";
import { themeClasses } from "../../contessa_app_data.mjs";

function toneBadgeClass(darkMode, tone = "neutral") {
  if (tone === "critical") {
    return darkMode ? "bg-[#3f241f] text-[#ffd7cf]" : "bg-[#fff1ed] text-[#9b2c20]";
  }
  if (tone === "warning") {
    return darkMode ? "bg-[#3c341b] text-[#ffe7aa]" : "bg-[#fff4cb] text-[#7a5416]";
  }
  if (tone === "success") {
    return darkMode ? "bg-[#163429] text-[#d7f7ea]" : "bg-[#eaf7f0] text-[#176342]";
  }
  return darkMode ? "border border-white/10 bg-white/5 text-slate-300" : "border border-slate-200/70 bg-white/80 text-slate-600";
}

export function SectionAccordion({
  darkMode = false,
  title,
  subtitle,
  count,
  tone = "neutral",
  isOpen = false,
  onToggle,
  actionLabel,
  onAction,
  children,
}) {
  const theme = themeClasses(darkMode);

  return (
    <Card className={`app-panel app-panel-soft rounded-[24px] border ${theme.card}`}>
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <button
            type="button"
            onClick={onToggle}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="app-kicker">{title}</div>
              <Badge className={toneBadgeClass(darkMode, tone)}>{count}</Badge>
            </div>
            <div className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>{subtitle}</div>
          </button>
          <div className="flex items-center gap-2">
            {onAction ? (
              <Button
                type="button"
                variant="outline"
                onClick={onAction}
                className={`min-h-[40px] rounded-2xl px-3 py-2 text-sm font-medium ${darkMode ? "vessel-outline-button" : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.44)] text-[#43554d] hover:bg-[rgba(255,255,255,0.62)]"}`}
              >
                {actionLabel}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={onToggle}
              className={`min-h-[40px] rounded-2xl px-3 py-2 text-sm font-medium ${darkMode ? "vessel-card-dark vessel-label-dark hover:bg-[var(--vessel-card-dark-strong)]" : "border-[rgba(15,80,70,0.10)] bg-white/52 text-[#4a6057] hover:bg-white/78"}`}
            >
              {isOpen ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
        {isOpen ? <div className="mt-4">{children}</div> : null}
      </CardContent>
    </Card>
  );
}

export function CompactItemCard({
  darkMode = false,
  item,
  selected = false,
  onClick,
  actionLabel = "Open",
}) {
  const theme = themeClasses(darkMode);
  const badgeClass = toneBadgeClass(darkMode, item?.tone || "neutral");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`app-card-hover app-panel w-full rounded-[20px] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
        selected
          ? darkMode
            ? "app-panel-active border-[var(--vessel-primary-dark)] bg-[var(--vessel-card-dark-strong)] shadow-[0_18px_36px_-26px_var(--vessel-glow-dark)]"
            : "app-panel-active border-[var(--vessel-border)] bg-[rgba(255,255,255,0.92)] shadow-[0_18px_36px_-28px_rgba(35,103,84,0.14)]"
          : darkMode
            ? "border-[var(--vessel-border-dark)] bg-[var(--vessel-card-dark)]"
            : "border-[rgba(15,80,70,0.08)] bg-[rgba(255,255,255,0.72)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`truncate text-base font-semibold ${theme.textPrimary}`}>{item?.title}</div>
          {item?.subtitle ? <div className={`mt-1 text-sm ${theme.textSecondary}`}>{item.subtitle}</div> : null}
        </div>
        {item?.badge ? <Badge className={badgeClass}>{item.badge}</Badge> : null}
      </div>
      <div className={`mt-3 grid gap-1 text-sm ${theme.textSecondary}`}>
        {item?.meta?.filter(Boolean).slice(0, 3).map((entry) => (
          <div key={`${item?.id}-${entry.label}`} className="flex items-center justify-between gap-3">
            <span>{entry.label}</span>
            <span className={`text-right font-medium ${theme.textPrimary}`}>{entry.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {item?.chips?.filter(Boolean).slice(0, 3).map((chip) => (
            <Badge key={`${item?.id}-${chip}`} className={darkMode ? "border border-white/10 bg-white/5 text-slate-300" : "border border-slate-200/70 bg-white/80 text-slate-600"}>
              {chip}
            </Badge>
          ))}
        </div>
        <span className="text-vessel-accent text-xs font-semibold uppercase tracking-[0.16em]">{actionLabel}</span>
      </div>
    </button>
  );
}

export function DashboardEmptyState({
  darkMode = false,
  title,
  message,
  actionLabel,
  onAction,
  secondaryContent = null,
}) {
  const theme = themeClasses(darkMode);

  return (
    <div className={`rounded-[20px] border border-dashed p-4 ${darkMode ? "border-[var(--vessel-border-dark)] bg-[rgba(255,255,255,0.03)]" : "border-[rgba(15,80,70,0.14)] bg-[rgba(255,255,255,0.56)]"}`}>
      <div className={`text-sm font-semibold ${theme.textPrimary}`}>{title}</div>
      <div className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>{message}</div>
      {secondaryContent ? <div className="mt-3">{secondaryContent}</div> : null}
      {onAction ? (
        <Button
          type="button"
          variant="outline"
          onClick={onAction}
          className={`mt-3 min-h-[40px] rounded-2xl px-3 py-2 text-sm font-medium ${darkMode ? "vessel-outline-button" : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.44)] text-[#43554d] hover:bg-[rgba(255,255,255,0.62)]"}`}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function DetailDrawer({
  darkMode = false,
  open = false,
  title,
  subtitle,
  meta = [],
  onClose,
  children,
}) {
  const theme = themeClasses(darkMode);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(6,12,18,0.46)] backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close detail drawer"
      />
      <div className={`absolute inset-x-3 bottom-3 top-auto max-h-[78vh] overflow-y-auto rounded-[28px] border p-4 shadow-[0_24px_70px_-28px_rgba(0,0,0,0.48)] md:inset-y-4 md:right-4 md:left-auto md:w-full md:max-w-[480px] md:rounded-[30px] md:p-5 ${darkMode ? "vessel-card-dark border-[var(--vessel-border-dark)] text-[var(--vessel-text-primary-dark)]" : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.92)] text-slate-800"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="app-kicker">Inspector</div>
            <div className={`mt-2 text-2xl font-semibold tracking-tight ${theme.textPrimary}`}>{title}</div>
            {subtitle ? <div className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>{subtitle}</div> : null}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={`min-h-[40px] rounded-2xl px-3 py-2 text-sm font-medium ${darkMode ? "vessel-outline-button" : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.44)] text-[#43554d] hover:bg-[rgba(255,255,255,0.62)]"}`}
          >
            Close
          </Button>
        </div>
        {meta?.filter(Boolean).length ? (
          <div className="mt-4 grid gap-2">
            {meta.filter(Boolean).map((entry) => (
              <div key={`${title}-${entry.label}`} className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-sm ${darkMode ? "border-[var(--vessel-border-dark)] bg-[rgba(255,255,255,0.03)]" : "border-[rgba(15,80,70,0.08)] bg-[rgba(255,255,255,0.56)]"}`}>
                <span className={theme.textSecondary}>{entry.label}</span>
                <span className={`text-right font-semibold ${theme.textPrimary}`}>{entry.value}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
