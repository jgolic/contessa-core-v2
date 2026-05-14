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

function toneRailClass(tone = "neutral") {
  if (tone === "critical") return "from-[#b45309] via-[#ef4444] to-[#f59e0b]";
  if (tone === "warning") return "from-[#d6a94f] via-[#f59e0b] to-[#f7d38a]";
  if (tone === "success") return "from-[#0f766e] via-[#14b8a6] to-[#86efac]";
  return "from-[var(--vessel-primary)] via-[var(--vessel-accent)] to-[var(--vessel-primary)]";
}

function initialsFromName(name = "Ops") {
  return String(name || "Ops")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "OP";
}

export function SectionAccordion({
  id,
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
    <Card id={id} className={`app-panel app-panel-soft min-w-0 overflow-hidden rounded-[24px] border ${theme.card}`}>
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <button
            type="button"
            onClick={onToggle}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div className="app-kicker">{title}</div>
              <Badge className={`${toneBadgeClass(darkMode, tone)} shrink-0`}>{count}</Badge>
            </div>
            <div className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>{subtitle}</div>
          </button>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {onAction ? (
              <Button
                type="button"
                variant="outline"
                onClick={onAction}
                className={`min-h-11 w-full rounded-2xl px-3 py-2 text-sm font-medium sm:w-auto ${darkMode ? "vessel-outline-button" : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.44)] text-[#43554d] hover:bg-[rgba(255,255,255,0.62)]"}`}
              >
                {actionLabel}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={onToggle}
              className={`min-h-11 w-full rounded-2xl px-3 py-2 text-sm font-medium sm:w-auto ${darkMode ? "vessel-card-dark vessel-label-dark hover:bg-[var(--vessel-card-dark-strong)]" : "border-[rgba(15,80,70,0.10)] bg-white/52 text-[#4a6057] hover:bg-white/78"}`}
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
  htmlId,
  darkMode = false,
  item,
  selected = false,
  onClick,
  actionLabel = "Open",
}) {
  const theme = themeClasses(darkMode);
  const badgeClass = toneBadgeClass(darkMode, item?.tone || "neutral");
  const owner = item?.assignedTo || item?.requester || "Operations";
  const dueMeta = item?.meta?.find((entry) => ["Due", "Expiry"].includes(entry?.label));
  const statusMeta = item?.meta?.find((entry) => ["Status", "Decision"].includes(entry?.label));

  return (
    <button
      id={htmlId}
      type="button"
      onClick={onClick}
      className={`app-card-hover app-panel group relative w-full min-w-0 max-w-full overflow-hidden rounded-[22px] border p-0 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
        selected
          ? darkMode
            ? "app-panel-active border-[var(--vessel-primary-dark)] bg-[var(--vessel-card-dark-strong)] shadow-[0_18px_36px_-26px_var(--vessel-glow-dark)]"
            : "app-panel-active border-[var(--vessel-border)] bg-[rgba(255,255,255,0.92)] shadow-[0_18px_36px_-28px_rgba(35,103,84,0.14)]"
          : darkMode
            ? "border-[var(--vessel-border-dark)] bg-[var(--vessel-card-dark)]"
            : "border-[rgba(15,80,70,0.08)] bg-[rgba(255,255,255,0.72)]"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${toneRailClass(item?.tone)}`} />
      <div className="min-w-0 p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 max-w-full">
            <div className={`truncate text-[0.98rem] font-semibold tracking-[-0.01em] ${theme.textPrimary}`}>{item?.title}</div>
            {item?.subtitle ? <div className={`mt-1 line-clamp-2 text-sm leading-5 ${theme.textSecondary}`}>{item.subtitle}</div> : null}
          </div>
          {item?.badge ? <Badge className={`${badgeClass} max-w-[44%] shrink-0 truncate whitespace-nowrap text-center leading-tight`}>{item.badge}</Badge> : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${darkMode ? "border-white/10 bg-white/[0.07] text-slate-100" : "border-slate-200/80 bg-white/80 text-slate-700"}`}>
            {initialsFromName(owner)}
          </span>
          <Badge className={`${darkMode ? "border border-white/10 bg-white/5 text-slate-300" : "border border-slate-200/70 bg-white/80 text-slate-600"} max-w-full truncate whitespace-nowrap leading-tight`}>
            {owner}
          </Badge>
          {dueMeta?.value ? <Badge className={toneBadgeClass(darkMode, item?.tone === "critical" ? "warning" : "neutral")}>{dueMeta.value}</Badge> : null}
          {statusMeta?.value ? <Badge className={badgeClass}>{statusMeta.value}</Badge> : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap gap-2">
            {item?.chips?.filter(Boolean).slice(0, 3).map((chip) => (
              <Badge key={`${item?.id}-${chip}`} className={darkMode ? "border border-white/10 bg-white/5 text-slate-300" : "border border-slate-200/70 bg-white/80 text-slate-600"}>
                {chip}
              </Badge>
            ))}
          </div>
          <span className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 group-hover:-translate-y-0.5 max-[420px]:w-full ${darkMode ? "border-[var(--vessel-border-dark)] bg-[var(--vessel-primary-soft-dark)] text-[var(--vessel-text-accent-dark)]" : "border-[var(--vessel-border)] bg-[var(--vessel-primary-soft)] text-[var(--vessel-text-accent)]"}`}>
            {actionLabel}
          </span>
        </div>
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
    <div className={`rounded-[22px] border border-dashed p-4 ${darkMode ? "border-[var(--vessel-border-dark)] bg-[linear-gradient(135deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))]" : "border-[rgba(15,80,70,0.14)] bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(242,250,246,0.58))]"}`}>
      <div className={`text-sm font-semibold ${theme.textPrimary}`}>{title}</div>
      <div className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>{message}</div>
      {secondaryContent ? <div className="mt-3">{secondaryContent}</div> : null}
      {onAction ? (
        <Button
          type="button"
          variant="outline"
          onClick={onAction}
          className="button-vessel-primary mt-3 min-h-[40px] rounded-2xl px-3 py-2 text-sm font-semibold text-white"
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
      <div className={`absolute inset-x-2 bottom-2 top-auto max-h-[92dvh] max-w-full overflow-x-hidden overflow-y-auto rounded-[30px] border p-4 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.54)] transition-transform duration-300 md:inset-y-4 md:right-4 md:left-auto md:w-full md:max-w-[500px] md:rounded-[32px] md:p-5 ${darkMode ? "vessel-card-dark border-[var(--vessel-border-dark)] text-[var(--vessel-text-primary-dark)]" : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.94)] text-slate-800"}`}>
        <div className={`rounded-[24px] border p-4 ${darkMode ? "border-[var(--vessel-border-dark)] bg-[linear-gradient(135deg,var(--vessel-primary-soft-dark),rgba(255,255,255,0.025))]" : "border-[var(--vessel-border)] bg-[linear-gradient(135deg,var(--vessel-primary-soft),rgba(255,255,255,0.74))]"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="app-kicker">Operational Details</div>
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
        </div>
        {meta?.filter(Boolean).length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {meta.filter(Boolean).map((entry) => (
              <div key={`${title}-${entry.label}`} className={`rounded-2xl border px-3 py-2.5 text-sm ${darkMode ? "border-[var(--vessel-border-dark)] bg-[rgba(255,255,255,0.03)]" : "border-[rgba(15,80,70,0.08)] bg-[rgba(255,255,255,0.56)]"}`}>
                <div className={`app-compact-label ${theme.textSecondary}`}>{entry.label}</div>
                <div className={`mt-1 truncate font-semibold ${theme.textPrimary}`}>{entry.value}</div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
