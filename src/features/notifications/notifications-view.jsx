import { Card, CardContent } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { infoBadgeClass, neutralBadgeClass, successBadgeClass, themeClasses, titleCase, warningBadgeClass } from "../../contessa_app_data.mjs";

export function NotificationsView({
  darkMode = false,
  notifications,
  onOpenNotification,
}) {
  const theme = themeClasses(darkMode);
  const criticalCount = notifications.filter((item) => item.level === "critical").length;
  const warningCount = notifications.filter((item) => item.level === "warning").length;
  const noticeCount = notifications.filter((item) => item.level !== "critical" && item.level !== "warning").length;

  return (
    <div className="app-section-grid grid md:gap-6">
      <Card className={`app-panel app-hero-surface app-panel-active overflow-hidden rounded-[30px] md:rounded-[32px] ${theme.card}`}>
        <CardContent className="p-0">
          <div className={`${darkMode ? "bg-[radial-gradient(circle_at_top_left,_rgba(118,214,180,0.15),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(198,163,91,0.08),_transparent_22%),repeating-linear-gradient(90deg,rgba(255,255,255,0.018)_0,rgba(255,255,255,0.018)_1px,transparent_1px,transparent_28px),linear-gradient(135deg,_rgba(13,20,26,0.99),_rgba(8,13,18,0.99))]" : "bg-[radial-gradient(circle_at_top_left,_rgba(16,124,108,0.1),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(198,163,91,0.12),_transparent_20%),repeating-linear-gradient(90deg,rgba(15,102,91,0.03)_0,rgba(15,102,91,0.03)_1px,transparent_1px,transparent_26px),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(239,245,241,0.98))]"} px-5 py-5 md:px-7 md:py-6`}>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.14fr)_minmax(320px,0.86fr)] xl:items-stretch">
              <div className="flex max-w-2xl flex-col justify-between">
                <div className="app-kicker">Notifications</div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--vessel-primary)] shadow-[0_0_0_5px_rgba(var(--vessel-primary-rgb),0.10)]" />
                  <span className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${theme.textSecondary}`}>Live alert intelligence</span>
                </div>
                <h2 className={`mt-4 max-w-2xl text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] md:text-[3.2rem] ${theme.textPrimary}`}>Operational awareness. Prioritized.</h2>
                <p className={`mt-3 max-w-[42rem] text-sm leading-6 md:text-[15px] ${theme.textSecondary}`}>Centralized oversight for maintenance, approvals, compliance, and operational risk across the vessel.</p>
              </div>
              <div className={`app-panel flex h-full flex-col justify-between rounded-[24px] border px-4 py-4 md:rounded-[22px] md:px-5 md:py-5 ${darkMode ? "border-[#263941] bg-[linear-gradient(180deg,rgba(11,18,23,0.96),rgba(9,15,20,0.96))] shadow-[0_24px_60px_-36px_rgba(0,0,0,0.62)]" : "border-white/84 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,250,248,0.94))] shadow-[0_20px_44px_-28px_rgba(18,47,40,0.18)]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="app-kicker">Operational Status</div>
                    <div className={`mt-1 text-sm font-semibold tracking-[-0.01em] ${theme.textPrimary}`}>Live vessel signal mix</div>
                  </div>
                  <Badge className={notifications.length ? successBadgeClass(darkMode) : neutralBadgeClass(darkMode)}>
                    {notifications.length ? "Monitoring" : "Quiet"}
                  </Badge>
                </div>
                <div className={`my-4 h-px ${darkMode ? "bg-white/8" : "bg-[rgba(var(--vessel-primary-rgb),0.10)]"}`} />
                <div className="grid gap-0 sm:grid-cols-3">
                  <div className="px-1 py-1.5 sm:px-2">
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${theme.textSecondary}`}>Critical</div>
                    <div className={`mt-2 text-[2rem] font-semibold leading-none tracking-[-0.04em] ${theme.textPrimary}`}>{criticalCount}</div>
                  </div>
                  <div className={`px-1 py-1.5 sm:px-2 ${darkMode ? "sm:border-x sm:border-white/8" : "sm:border-x sm:border-[rgba(var(--vessel-primary-rgb),0.10)]"}`}>
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${theme.textSecondary}`}>Warning</div>
                    <div className={`mt-2 text-[2rem] font-semibold leading-none tracking-[-0.04em] ${theme.textPrimary}`}>{warningCount}</div>
                  </div>
                  <div className="px-1 py-1.5 sm:px-2">
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${theme.textSecondary}`}>Notice</div>
                    <div className={`mt-2 text-[2rem] font-semibold leading-none tracking-[-0.04em] ${theme.textPrimary}`}>{noticeCount}</div>
                  </div>
                </div>
                <div className={`mt-4 pt-3 text-xs leading-5 ${theme.textSecondary} ${darkMode ? "border-t border-white/8" : "border-t border-[rgba(var(--vessel-primary-rgb),0.10)]"}`}>
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
            <Badge className={notifications.length ? successBadgeClass(darkMode) : neutralBadgeClass(darkMode)}>
              {notifications.length} active
            </Badge>
          </div>
          <div className="space-y-3">
            {notifications.length ? notifications.map((item) => (
              <div key={item.id} className={`app-card-hover app-panel ${item.level === "critical" ? "app-panel-active" : "app-panel-soft"} rounded-[22px] border p-4 md:rounded-xl ${darkMode ? "border-[#1f3037] bg-[#0d1519]/90" : "border-white/80 bg-white/88"}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className={`font-semibold ${theme.textPrimary}`}>{item.title}</div>
                    <div className={`app-helper-text mt-2 ${theme.textSecondary}`}>{item.detail}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={item.level === "critical" ? (darkMode ? "bg-[#381d1f] text-[#ffd8dc]" : "bg-[#fff1ed] text-[#9b2c20]") : item.level === "warning" ? warningBadgeClass(darkMode) : infoBadgeClass(darkMode)}>
                      {titleCase(item.level)}
                    </Badge>
                    <Button type="button" onClick={() => onOpenNotification(item)} className="app-action-reveal button-vessel-primary rounded-2xl px-4 py-2 text-white md:rounded-xl">
                      Open
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <div className={`app-empty-state rounded-[22px] border border-dashed text-center text-sm leading-6 md:rounded-xl ${theme.textSecondary} ${darkMode ? "border-[#294038] bg-[#0d1513]/88" : "border-[#d5e1da] bg-[#f7faf8]"}`}>
                No operational notifications right now.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
