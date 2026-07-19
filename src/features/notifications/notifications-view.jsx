import { Card, CardContent } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { infoBadgeClass, neutralBadgeClass, successBadgeClass, themeClasses, titleCase } from "../../contessa_app_data.mjs";

export function NotificationsView({
  darkMode = false,
  notifications,
  onOpenNotification,
}) {
  const safeNotifications = Array.isArray(notifications) ? notifications.filter(Boolean) : [];
  const visibleNotifications = safeNotifications.slice(0, 20);
  const theme = themeClasses(darkMode);
  const criticalCount = safeNotifications.filter((item) => item.level === "critical").length;
  const warningCount = safeNotifications.filter((item) => item.level === "warning").length;
  const noticeCount = safeNotifications.filter((item) => item.level !== "critical" && item.level !== "warning").length;
  const statusLabelClass = darkMode ? "text-slate-300" : theme.textSecondary;
  const statusTitleClass = darkMode ? "text-slate-100" : theme.textPrimary;
  const statusNumberClass = darkMode ? "text-slate-50" : theme.textPrimary;
  const statusDividerClass = darkMode ? "bg-white/10" : "bg-[rgba(var(--vessel-primary-rgb),0.10)]";

  return (
    <div className="app-section-grid grid md:gap-6">
      <Card className={`app-panel app-hero-surface app-panel-active overflow-hidden rounded-[30px] md:rounded-[32px] ${theme.card}`}>
        <CardContent className="p-0">
          <div className={`neo-module-hero ${darkMode ? "bg-[none,none,repeating-none,none]" : "bg-[none,none,repeating-none,none]"} px-5 py-5 md:px-7 md:py-6`}>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.14fr)_minmax(320px,0.86fr)] xl:items-stretch">
              <div className="flex max-w-2xl flex-col justify-between">
                <div className="app-kicker">Notifications</div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--vessel-primary)] " />
                  <span className={`app-compact-label ${theme.textSecondary}`}>Live alert intelligence</span>
                </div>
                <h2 className={`mt-4 max-w-2xl text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] md:text-[3.2rem] ${theme.textPrimary}`}>Operational awareness. Prioritized.</h2>
                <p className={`mt-3 max-w-[42rem] text-sm leading-6 md:text-[15px] ${theme.textSecondary}`}>Centralized oversight for maintenance, approvals, compliance, and operational risk across the vessel.</p>
              </div>
              <div className={`app-panel flex h-full flex-col justify-between rounded-[24px] border px-4 py-4 md:rounded-[22px] md:px-5 md:py-5 ${darkMode ? "border-[#263941] bg-[none] " : "border-white/84 bg-[none] "}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="app-kicker">Operational Status</div>
                    <div className={`mt-1 text-sm font-semibold tracking-[-0.01em] ${statusTitleClass}`}>Live vessel signal mix</div>
                  </div>
                  <Badge className={safeNotifications.length ? successBadgeClass(darkMode) : neutralBadgeClass(darkMode)}>
                    {safeNotifications.length ? "Monitoring" : "Quiet"}
                  </Badge>
                </div>
                <div className={`my-4 h-px ${statusDividerClass}`} />
                <div className="grid gap-0 sm:grid-cols-3">
                  <div className="px-1 py-1.5 sm:px-2">
                    <div className={`app-compact-label ${statusLabelClass}`}>Critical</div>
                    <div className={`mt-2 text-[2rem] font-semibold leading-none tracking-[-0.04em] ${statusNumberClass}`}>{criticalCount}</div>
                  </div>
                  <div className={`px-1 py-1.5 sm:px-2 ${darkMode ? "sm:border-x sm:border-white/10" : "sm:border-x sm:border-[rgba(var(--vessel-primary-rgb),0.10)]"}`}>
                    <div className={`app-compact-label ${statusLabelClass}`}>Warning</div>
                    <div className={`mt-2 text-[2rem] font-semibold leading-none tracking-[-0.04em] ${statusNumberClass}`}>{warningCount}</div>
                  </div>
                  <div className="px-1 py-1.5 sm:px-2">
                    <div className={`app-compact-label ${statusLabelClass}`}>Notice</div>
                    <div className={`mt-2 text-[2rem] font-semibold leading-none tracking-[-0.04em] ${statusNumberClass}`}>{noticeCount}</div>
                  </div>
                </div>
                <div className={`mt-4 pt-3 text-xs leading-5 ${darkMode ? "border-t border-white/10 text-slate-300" : `border-t border-[rgba(var(--vessel-primary-rgb),0.10)] ${theme.textSecondary}`}`}>
                  Command summary of the vessel’s most actionable operational signals.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`app-panel app-panel-soft rounded-[26px] md:rounded-[24px] ${theme.card}`}>
        <CardContent className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="app-kicker">Inbox</div>
              <div className={`mt-2 text-xl font-semibold ${theme.textPrimary}`}>Operational signals</div>
            </div>
            <Badge className={safeNotifications.length ? successBadgeClass(darkMode) : neutralBadgeClass(darkMode)}>
              {safeNotifications.length} active
            </Badge>
          </div>
          <div className="space-y-3">
            {visibleNotifications.length ? visibleNotifications.map((item) => (
              <div id={`item-${item.id}`} data-jump-target style={{ "--jump-radius": "22px" }} key={item.id} className={`jump-highlight-target app-card-hover app-panel ${item.level === "critical" ? "app-panel-active" : "app-panel-soft"} rounded-[22px] border p-4 md:rounded-xl ${darkMode ? "border-[#1f3037] bg-[#0d1519]/90" : "border-white/80 bg-white/88"}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className={`font-semibold ${theme.textPrimary}`}>{item.title}</div>
                    <div className={`app-helper-text mt-2 ${theme.textSecondary}`}>{item.detail}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={item.level === "critical" ? "manifest-status--crit" : item.level === "warning" ? "manifest-status--warn" : infoBadgeClass(darkMode)}>
                      {titleCase(item.level)}
                    </Badge>
                    <Button type="button" onClick={() => onOpenNotification(item)} className="app-action-reveal button-vessel-primary rounded-2xl px-4 py-2 text-white md:rounded-xl">
                      Open details
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <div className={`app-empty-state rounded-[22px] border border-dashed text-center text-sm leading-6 md:rounded-xl ${theme.textSecondary} ${darkMode ? "border-[#294038] bg-[#0d1513]/88" : "border-[#d5e1da] bg-[#f7faf8]"}`}>
                No operational notifications right now.
              </div>
            )}
            {safeNotifications.length > visibleNotifications.length ? (
              <div className={`rounded-2xl border px-4 py-3 text-center text-sm font-semibold ${darkMode ? "border-white/10 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}>
                Showing first {visibleNotifications.length} of {safeNotifications.length} signals.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
