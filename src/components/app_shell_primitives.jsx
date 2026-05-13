import { Card, CardContent } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Bell, TriangleAlert } from "./icons.jsx";
import { themeClasses } from "../contessa_app_data.mjs";

export function ShellControlButton({
  darkMode = false,
  className = "",
  children,
  ...props
}) {
  const baseClassName = darkMode
    ? "app-control-block-dark vessel-card-dark vessel-label-dark hover:border-vessel hover:bg-[var(--vessel-card-dark-strong)]"
    : "app-control-block border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.44)] text-slate-700 hover:border-vessel hover:bg-[rgba(255,255,255,0.6)]";

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
    : "app-control-block border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.44)] text-slate-700 hover:border-vessel hover:bg-[rgba(255,255,255,0.6)]";

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

  return (
    <Card className={`app-card-hover app-panel h-full min-h-[82px] overflow-hidden rounded-[22px] transition md:rounded-[22px] ${active ? darkMode ? "app-panel-active border-[var(--vessel-primary-dark)] bg-[var(--vessel-primary-soft-dark)] shadow-[0_16px_34px_-28px_var(--vessel-glow-dark)]" : "app-panel-active border-[var(--vessel-border)] bg-[linear-gradient(135deg,rgba(var(--vessel-primary-rgb),0.94),rgba(var(--vessel-secondary-rgb),0.86))] text-white shadow-[0_16px_34px_-26px_rgba(var(--vessel-primary-rgb),0.22)]" : `${theme.card} app-panel-soft`}`}>
      <CardContent className="relative flex h-full items-center justify-between gap-3 overflow-hidden p-3.5">
        <div className={`absolute inset-x-4 bottom-0 h-px ${active ? "bg-current/[0.24]" : darkMode ? "bg-white/[0.08]" : "bg-[rgba(var(--vessel-primary-rgb),0.10)]"}`} />
        <div className="min-w-0">
          <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${active ? "text-current/[0.78]" : theme.textSecondary}`}>{label}</div>
          <div className={`mt-1 truncate text-sm font-semibold ${active ? "text-current" : theme.textPrimary}`}>{value}</div>
        </div>
        <div className="flex items-center gap-2">
          {Icon ? (
            <div className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] ${active ? "bg-white/[0.14] text-current" : "vessel-icon-chip"}`}>
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <div className={`hidden rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] xl:block ${active ? "bg-white/[0.14] text-current" : darkMode ? "bg-white/5 text-slate-400" : "bg-white/60 text-slate-500"}`}>
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
  active = false,
  ...props
}) {
  return (
    <button
      type="button"
      className={`app-card-hover app-panel w-full min-w-0 rounded-[22px] border px-3 py-3 text-center shadow-[0_14px_30px_-26px_rgba(18,47,40,0.18)] transition ${
        active
          ? darkMode
            ? "app-panel-active vessel-active-dark"
            : "app-panel-active border-vessel bg-[linear-gradient(135deg,rgba(var(--vessel-primary-rgb),0.96),rgba(var(--vessel-secondary-rgb),0.92))] text-white"
          : darkMode
            ? "app-panel-soft vessel-card-dark border text-slate-100"
            : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.64)] text-[#365248]"
      }`}
      aria-current={active ? "page" : undefined}
      {...props}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em]">{label}</div>
      <div className="mt-1 text-xs opacity-80">{value}</div>
    </button>
  );
}
