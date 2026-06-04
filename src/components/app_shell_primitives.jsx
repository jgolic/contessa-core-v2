import { Card, CardContent } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Bell, TriangleAlert } from "./icons.jsx";
import { SmartLabel } from "./smart_label.jsx";
import { themeClasses } from "../contessa_app_data.mjs";

export function ShellControlButton({
  darkMode = false,
  className = "",
  children,
  ...props
}) {
  const baseClassName = darkMode
    ? "app-control-block-dark vessel-card-dark vessel-label-dark hover:border-vessel hover:bg-[var(--vessel-card-dark-strong)]"
    : "app-control-block border-slate-200/80 bg-white/90 text-slate-700 hover:border-vessel hover:bg-white";

  return (
    <Button
      variant="outline"
      className={`app-card-hover app-panel app-panel-soft min-h-[52px] w-full min-w-0 rounded-2xl px-4 py-3 text-sm font-medium shadow-[0_16px_36px_-30px_rgba(18,47,40,0.18)] md:px-4 md:py-3 ${baseClassName} ${className}`.trim()}
      {...props}
    >
      {children}
    </Button>
  );
}

export function AlertInboxButton({
  darkMode = false,
  notificationCount = 0,
  className = "",
  children,
  ...props
}) {
  const activeClassName = darkMode
    ? "app-alert-strong-dark border-[#6d5721]/70 text-[#f6df94] hover:border-[#8b7130]"
    : "border-[#ead59a] bg-[linear-gradient(135deg,rgba(255,251,233,0.98),rgba(255,242,205,0.92))] text-[#7a5b18] hover:border-[#dfc57d]";
  const idleClassName = darkMode
    ? "app-control-block-dark vessel-card-dark vessel-label-dark hover:border-vessel hover:bg-[var(--vessel-card-dark-strong)]"
    : "app-control-block border-slate-200/80 bg-white/90 text-slate-700 hover:border-vessel hover:bg-white";

  return (
    <Button
      type="button"
      variant="outline"
      className={`app-card-hover app-panel relative min-h-[52px] w-full min-w-0 rounded-2xl px-3 py-3 text-sm font-medium shadow-[0_16px_36px_-30px_rgba(18,47,40,0.18)] md:px-3 md:py-3 ${notificationCount > 0 ? `app-panel-active ${activeClassName}` : `app-panel-soft ${idleClassName}`} ${className}`.trim()}
      aria-label={notificationCount > 0 ? `${notificationCount} active alerts` : "Notifications"}
      {...props}
    >
      <span className="flex items-center gap-2">
        {notificationCount > 0 ? <TriangleAlert className="h-4 w-4 shrink-0" /> : <Bell className="h-4 w-4 shrink-0" />}
        {notificationCount > 0 ? <span className="rounded-full bg-current/12 px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-wide">{notificationCount}</span> : null}
        {children || <span>Alerts</span>}
      </span>
    </Button>
  );
}

export function SectionNavCard({
  darkMode = false,
  label,
  value,
  icon: Icon,
  active = false,
}) {
  const theme = themeClasses(darkMode);
  const navLabelTone = active ? "premium-label-accent" : "";
  const moduleCardBase =
    "group app-card-hover app-panel h-full min-h-[82px] overflow-hidden rounded-[22px] border transition-all duration-200 md:rounded-[22px]";
  const moduleCardInactive = darkMode
    ? "app-panel-soft app-dark-card border-white/10 text-slate-100 shadow-[0_18px_50px_rgba(0,0,0,0.35)] hover:border-[var(--vessel-primary-dark)] hover:bg-slate-800/80"
    : "app-panel-soft border-slate-200/80 bg-white/90 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.06)] hover:border-[var(--vessel-border)] hover:bg-white";
  const moduleCardActive = darkMode
    ? "app-panel-active app-dark-inner border-[var(--vessel-primary-dark)] text-cyan-100 shadow-[0_0_24px_var(--vessel-glow-dark)]"
    : "app-panel-active border-[var(--vessel-border)] bg-[var(--vessel-primary-soft)] text-slate-900 shadow-[0_0_24px_rgba(var(--vessel-primary-rgb),0.12)]";

  return (
    <Card className={`${moduleCardBase} ${active ? moduleCardActive : moduleCardInactive}`}>
      <CardContent className="relative z-10 flex h-full min-w-0 items-center justify-between gap-3 overflow-hidden p-3.5">
        <div className={`absolute inset-x-4 bottom-0 h-px ${active ? "bg-current/[0.24]" : darkMode ? "bg-white/[0.08]" : "bg-[rgba(var(--vessel-primary-rgb),0.10)]"}`} />
        <div className="min-w-0">
          <div className={`app-compact-label ${navLabelTone}`.trim()}>
            <SmartLabel label={label} active={active} />
          </div>
          <div className={`mt-1 truncate text-sm font-semibold ${active ? darkMode ? "text-slate-50" : "text-slate-900" : darkMode ? "text-slate-100" : theme.textPrimary}`}>{value}</div>
        </div>
        <div className="flex items-center gap-2">
          {Icon ? (
            <div className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] ${active ? darkMode ? "border border-cyan-300/40 bg-cyan-300/15 text-cyan-100" : "border border-teal-300 bg-teal-50 text-teal-800" : darkMode ? "border border-white/10 bg-slate-800 text-cyan-100" : "vessel-icon-chip"}`}>
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <div className={`hidden rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] shadow-sm xl:block ${active ? darkMode ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100" : "border-teal-300 bg-teal-50 text-teal-800" : darkMode ? "border-white/10 bg-slate-800 text-slate-100" : "border-slate-300 bg-white text-slate-800"}`}>
            {active ? "Active" : "Open"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BottomNavButton({
  darkMode = false,
  label,
  value,
  icon: Icon,
  active = false,
  ...props
}) {
  return (
    <button
      type="button"
      className={`group app-card-hover app-panel flex min-h-[54px] w-full min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border px-1 py-2 text-center shadow-[0_14px_30px_-26px_rgba(18,47,40,0.18)] transition active:scale-[0.96] min-[390px]:min-h-[58px] min-[390px]:px-1.5 sm:px-2 ${
        active
          ? darkMode
            ? "app-panel-active vessel-active-dark"
            : "app-panel-active border-teal-300 bg-teal-50 text-teal-900 shadow-[0_14px_34px_rgba(13,148,136,0.14)]"
          : darkMode
            ? "app-panel-soft app-dark-card border text-slate-100"
            : "border-slate-200/80 bg-white/90 text-[#365248] shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
      }`}
      aria-current={active ? "page" : undefined}
      {...props}
    >
      {Icon ? (
        <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-xl min-[390px]:h-6 min-[390px]:w-6 ${active ? darkMode ? "border border-cyan-300/35 bg-cyan-300/15 text-cyan-100" : "border border-teal-300 bg-teal-50 text-teal-800" : darkMode ? "border border-white/10 bg-slate-800 text-cyan-100" : "border border-teal-300 bg-teal-50 text-teal-800"}`}>
          <Icon className="h-3 w-3 min-[390px]:h-3.5 min-[390px]:w-3.5" />
        </span>
      ) : null}
      <div className="max-w-full truncate text-[8.5px] font-semibold uppercase tracking-[0.035em] min-[390px]:text-[9px] sm:text-[10px] sm:tracking-[0.08em]">
        <SmartLabel label={label} active={active} />
      </div>
      <div className="max-w-full truncate text-[10px] leading-none opacity-85">{value}</div>
    </button>
  );
}
