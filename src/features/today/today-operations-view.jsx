import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { AlertCircle, Compass, Receipt, TriangleAlert, Users, Wifi, WifiOff } from "../../components/icons.jsx";
import {
  calculateConfidenceScore,
  formatHistoryTime,
  formatMoney,
  formatTaskStatusLabel,
  neutralBadgeClass,
  successBadgeClass,
  themeClasses,
  titleCase,
  warningBadgeClass,
} from "../../contessa_app_data.mjs";
import {
  CompactItemCard,
  DashboardEmptyState,
  DetailDrawer,
  SectionAccordion,
} from "../../components/dashboard/dashboard_primitives.jsx";
import GlobalSearch from "../../components/GlobalSearch.jsx";
import { SmartLabel } from "../../components/smart_label.jsx";

const PRIORITY_WEIGHT = {
  critical: 0,
  urgent: 1,
  high: 2,
  review: 3,
  warning: 4,
  medium: 5,
  planned: 6,
  upcoming: 7,
  low: 8,
  stable: 9,
  neutral: 10,
};

function normalizeTone(item = {}) {
  const priority = String(item.priority || "").toLowerCase();
  const status = String(item.status || "").toLowerCase();

  if (item.type === "alert" && status.includes("critical")) return "critical";
  if (priority.includes("critical") || priority.includes("urgent") || priority.includes("high")) return "critical";
  if (
    item.type === "approval" ||
    item.type === "quote" ||
    item.type === "maintenance" ||
    item.type === "certificate" ||
    item.type === "alert" ||
    status.includes("review") ||
    status.includes("overdue") ||
    status.includes("requested")
  ) {
    return "warning";
  }

  return "neutral";
}

function buildOperationCard(item = {}) {
  const tone = normalizeTone(item);
  const label = item.priority || item.status || titleCase(item.type || "item");
  const chips = [titleCase(item.type || "item"), item.amount || "", item.requester ? `By ${item.requester}` : ""].filter(Boolean);

  if (item.type === "task") {
    return {
      ...item,
      badge: label,
      tone,
      meta: [
        { label: "Owner", value: item.assignedTo || "Unassigned" },
        { label: "Due", value: item.dueDate || "Not set" },
        { label: "Status", value: item.status || "Pending" },
      ],
      chips,
    };
  }

  if (item.type === "maintenance") {
    return {
      ...item,
      badge: item.status || "Due",
      tone,
      meta: [
        { label: "Lead", value: item.assignedTo || "Operations" },
        { label: "Due", value: item.dueDate || "Today" },
        { label: "Priority", value: item.priority || "Planned" },
      ],
      chips,
    };
  }

  if (item.type === "approval" || item.type === "quote") {
    return {
      ...item,
      badge: item.status || "Requested",
      tone,
      meta: [
        { label: "Requester", value: item.requester || "Operations" },
        { label: "Amount", value: item.amount || "Operational review" },
        { label: "Decision", value: item.status || "Requested" },
      ],
      chips,
    };
  }

  if (item.type === "certificate") {
    return {
      ...item,
      badge: item.priority || "Expiry",
      tone,
      meta: [
        { label: "Holder", value: item.assignedTo || "Crew" },
        { label: "Expiry", value: item.dueDate || "Unknown" },
        { label: "Status", value: item.status || "Review" },
      ],
      chips,
    };
  }

  if (item.type === "alert" || item.type === "route") {
    return {
      ...item,
      badge: item.priority || item.status || "Review",
      tone,
      meta: [
        { label: "Area", value: item.subtitle || "Route planning" },
        { label: "Status", value: item.status || "Review" },
        { label: "Due", value: item.dueDate || "Immediate review" },
      ],
      chips,
    };
  }

  return {
    ...item,
    badge: label,
    tone,
    meta: [
      { label: "Owner", value: item.assignedTo || "Operations" },
      { label: "Status", value: item.status || "Open" },
      { label: "Due", value: item.dueDate || "Not set" },
    ],
    chips,
  };
}

function buildActivityCard(entry = {}, index = 0) {
  const detail = entry.detail || "Operational update";
  return {
    id: entry.id || `activity-${index}`,
    type: "activity",
    title: entry.action || "Recent activity",
    subtitle: detail,
    status: entry.section || "History",
    priority: "Log",
    assignedTo: entry.by || "System",
    requester: entry.section || "History",
    dueDate: formatHistoryTime(entry.at),
    amount: "",
    description: detail,
    checklist: [],
    activity: [detail],
    badge: entry.section || "History",
    tone: "neutral",
    meta: [
      { label: "By", value: entry.by || "System" },
      { label: "At", value: formatHistoryTime(entry.at) },
      { label: "Area", value: entry.section || "History" },
    ],
    chips: [entry.section || "History"],
  };
}

function sortByPriority(items = []) {
  return [...items].sort((left, right) => {
    const leftWeight = PRIORITY_WEIGHT[String(left.priority || left.status || "neutral").toLowerCase()] ?? 99;
    const rightWeight = PRIORITY_WEIGHT[String(right.priority || right.status || "neutral").toLowerCase()] ?? 99;
    if (leftWeight !== rightWeight) return leftWeight - rightWeight;
    return String(left.title || "").localeCompare(String(right.title || ""));
  });
}

const VESSEL_STATE_CONFIG = {
  "guest-arrival": {
    label: "Guest Arrival Mode",
    description: "Guest arrival preparation is active. Interior, provisioning, and deck presentation are prioritized.",
    focusTerms: ["guest", "welcome", "provision", "interior", "deck", "presentation", "route", "weather", "certificate"],
  },
  "yard-refit": {
    label: "Yard / Refit Mode",
    description: "Technical works, quotes, and departure readiness are prioritized.",
    focusTerms: ["maintenance", "yard", "quote", "paint", "thruster", "technical", "defect", "approval", "document", "epirb"],
  },
  underway: {
    label: "Underway Mode",
    description: "Route, weather, watchkeeping, fuel, and safety items are prioritized.",
    focusTerms: ["route", "weather", "watch", "fuel", "safety", "navigation", "bridge", "alert"],
  },
  standby: {
    label: "Standby Mode",
    description: "Routine readiness is active. The system is watching tasks, documents, crew, and approvals quietly.",
    focusTerms: ["readiness", "task", "crew", "document", "approval", "route"],
  },
  critical: {
    label: "Critical Attention",
    description: "Urgent operational risks require captain review.",
    focusTerms: ["critical", "urgent", "overdue", "risk", "alert", "approval", "safety"],
  },
};

function getVesselStateConfig(mode = "standby") {
  return VESSEL_STATE_CONFIG[mode] || VESSEL_STATE_CONFIG.standby;
}

function getMoodClasses(darkMode = false, mood = "calm") {
  if (mood === "critical") {
    return darkMode
      ? "border-rose-300/30 bg-rose-400/10 shadow-[0_0_34px_rgba(251,113,133,0.12)]"
      : "border-rose-200/80 bg-rose-50/70 shadow-[0_18px_46px_rgba(225,29,72,0.08)]";
  }
  if (mood === "pressure") {
    return darkMode
      ? "border-amber-300/30 bg-amber-300/10 shadow-[0_0_34px_rgba(251,191,36,0.12)]"
      : "border-amber-200/80 bg-amber-50/70 shadow-[0_18px_46px_rgba(180,83,9,0.08)]";
  }
  return darkMode
    ? "border-cyan-300/25 bg-cyan-300/10 shadow-[0_0_34px_rgba(34,211,238,0.12)]"
    : "border-cyan-200/80 bg-cyan-50/70 shadow-[0_18px_46px_rgba(14,165,233,0.08)]";
}

function getMoodTextClass(darkMode = false, mood = "calm") {
  if (mood === "critical") return darkMode ? "text-rose-200" : "text-rose-700";
  if (mood === "pressure") return darkMode ? "text-amber-200" : "text-amber-700";
  return darkMode ? "text-cyan-200" : "text-cyan-700";
}

function vesselModeWeight(item = {}, mode = "standby") {
  const config = getVesselStateConfig(mode);
  const haystack = makeSearchText([
    item.type,
    item.title,
    item.subtitle,
    item.status,
    item.priority,
    item.assignedTo,
    item.requester,
    item.description,
    item.checklist,
    item.activity,
  ]);
  const matchCount = config.focusTerms.reduce((count, term) => count + (haystack.includes(term) ? 1 : 0), 0);
  const type = String(item.type || "").toLowerCase();
  let modeBoost = matchCount * -8;

  if (mode === "guest-arrival" && ["approval", "quote", "task", "route", "certificate"].includes(type)) modeBoost -= 4;
  if (mode === "yard-refit" && ["maintenance", "quote", "approval", "certificate"].includes(type)) modeBoost -= 6;
  if (mode === "underway" && ["route", "alert", "maintenance"].includes(type)) modeBoost -= 7;
  if (mode === "critical" && (item.tone === "critical" || /critical|urgent|overdue/i.test(`${item.priority} ${item.status}`))) modeBoost -= 10;

  return modeBoost;
}

function sortByVesselState(items = [], mode = "standby") {
  return sortByPriority(items).sort((left, right) => {
    const leftWeight = vesselModeWeight(left, mode);
    const rightWeight = vesselModeWeight(right, mode);
    if (leftWeight !== rightWeight) return leftWeight - rightWeight;
    return 0;
  });
}

function buildDrawerMeta(item = {}) {
  return [
    { label: "Type", value: titleCase(item.type || "item") },
    { label: "Priority", value: item.priority || "Operational" },
    { label: "Status", value: item.status || "Open" },
    { label: "Assigned", value: item.assignedTo || "Operations" },
    { label: "Requester", value: item.requester || "System" },
    { label: "Due", value: item.dueDate || "Not set" },
    item.amount ? { label: "Amount", value: item.amount } : null,
  ].filter(Boolean);
}

function compactTypeLabel(type = "Item") {
  return titleCase(String(type || "Item").replace(/[-_]/g, " "));
}

function makeSearchText(parts = []) {
  const safeParts = Array.isArray(parts) ? parts : [];
  return safeParts
    .reduce((list, part) => {
      if (Array.isArray(part)) return [...list, ...part];
      return [...list, part];
    }, [])
    .filter((part) => part !== null && part !== undefined)
    .map((part) => String(part).toLowerCase())
    .join(" ");
}

function itemSectionForSearch(item = {}) {
  if (item.type === "task" || item.type === "maintenance") return "tasksMaintenance";
  if (item.type === "approval" || item.type === "quote") return "expensesApprovals";
  if (item.type === "certificate" || item.type === "crew") return "certificatesCrew";
  if (item.type === "alert" || item.type === "route") return "routePlanning";
  if (item.type === "activity") return "activity";
  return "";
}

function itemTargetForSearch(item = {}, priorityIds = new Set()) {
  const id = item?.id || `${item?.type || "item"}-${item?.title || "unknown"}`;
  if (priorityIds.has(id)) return `item-${id}`;
  if (item.type === "task" || item.type === "maintenance") return `queue-item-${id}`;
  if (item.type === "approval" || item.type === "quote") return `approval-item-${id}`;
  if (item.type === "certificate" || item.type === "crew") return `certificate-item-${id}`;
  if (item.type === "alert" || item.type === "route") return `route-item-${id}`;
  if (item.type === "activity") return `activity-item-${id}`;
  return `item-${id}`;
}

export function CommandJumpBar({ darkMode = false, results = [], onJump }) {
  return <GlobalSearch darkMode={darkMode} results={results} onJump={onJump} />;
}
function MetricTile({ darkMode = false, label, value, note, tone = "neutral", active = false }) {
  const theme = themeClasses(darkMode);
  const labelToneClass =
    tone === "critical" || String(label || "").toLowerCase().includes("urgent")
      ? "premium-label-urgent"
      : tone === "warning" || /approval|spend|quote|pending/i.test(String(label || ""))
        ? "premium-label-gold"
        : active
          ? "premium-label-accent"
          : "";
  const badgeClass =
    tone === "critical"
      ? darkMode
        ? "border border-rose-300/40 bg-rose-300/15 text-rose-100 shadow-sm"
        : "border border-rose-300 bg-rose-50 text-rose-800 shadow-sm"
      : tone === "warning"
        ? warningBadgeClass(darkMode)
        : tone === "success"
          ? successBadgeClass(darkMode)
          : neutralBadgeClass(darkMode);

  return (
    <div className={`group min-w-0 max-w-full overflow-hidden rounded-[22px] border p-3 sm:p-3.5 ${darkMode ? "app-dark-card border-[var(--vessel-border-dark)]" : "border-[rgba(15,80,70,0.08)] bg-[rgba(255,255,255,0.76)]"}`}>
      <div className={`app-compact-label ${labelToneClass}`.trim()}>
        <SmartLabel label={label} active={active} />
      </div>
      <div className={`mt-3 truncate text-[1.15rem] font-semibold tracking-tight sm:text-[1.25rem] ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{value}</div>
      <div className="mt-2">
        <Badge className={`${badgeClass} max-w-full truncate whitespace-nowrap leading-tight`}>{note}</Badge>
      </div>
    </div>
  );
}

function IntelligencePanel({
  darkMode = false,
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
}) {
  const theme = themeClasses(darkMode);

  return (
    <Card className={`app-panel app-panel-soft min-w-0 overflow-hidden rounded-[24px] ${theme.card}`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="app-kicker">{title}</div>
            {subtitle ? <div className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>{subtitle}</div> : null}
          </div>
          {onAction ? (
            <Button
              type="button"
              variant="outline"
              onClick={onAction}
              className="app-action-button w-full sm:w-auto"
            >
              {actionLabel}
            </Button>
          ) : null}
        </div>
        <div className="mt-4">{children}</div>
      </CardContent>
    </Card>
  );
}

function VesselStateBanner({
  darkMode = false,
  vesselState = {},
  confidenceScore = 0,
  stats = {},
  currentVessel = {},
  role = "captain",
  currency = "USD",
}) {
  const theme = themeClasses(darkMode);
  const mode = vesselState?.mode || "standby";
  const mood = vesselState?.mood || "calm";
  const config = getVesselStateConfig(mode);
  const isOwnerView = String(role || "").toLowerCase() === "owner";
  const pendingSpend = currentVessel?.metrics?.openExposure || formatMoney(stats.totalExpenses || 0, currency);
  const routeStatus = currentVessel?.routeStatus || currentVessel?.routePlanning?.status || "Watched";
  const ownerTiles = [
    { label: "Vessel Confidence", value: `${confidenceScore}%`, note: "vessel state" },
    { label: "Pending spend", value: pendingSpend, note: `${stats.pendingApprovals || 0} decisions` },
    { label: "Guest ready", value: mode === "guest-arrival" ? "Active" : "Watched", note: vesselState?.primaryFocus || "Captain summary" },
    { label: "Top risk", value: stats.overdueTasks || stats.routeReviewCount || stats.certificateDue || 0, note: "visible only if material" },
  ];
  const captainTiles = [
    { label: "Vessel Confidence", value: `${confidenceScore}%`, note: "calculated live" },
    { label: "Blocked", value: stats.overdueTasks || 0, note: "overdue items", tone: (stats.overdueTasks || 0) > 0 ? "critical" : "neutral" },
    { label: "Approvals", value: stats.pendingApprovals || 0, note: "need decision", tone: (stats.pendingApprovals || 0) > 0 ? "warning" : "neutral" },
    { label: "Crew", value: stats.certificateDue || 0, note: "cert reviews", tone: (stats.certificateDue || 0) > 0 ? "warning" : "neutral" },
    { label: "Route", value: stats.routeReviewCount || 0, note: routeStatus, tone: (stats.routeReviewCount || 0) > 0 ? "warning" : "neutral" },
  ];
  const tiles = isOwnerView ? ownerTiles : captainTiles;

  return (
    <Card
      id="vessel-state-section"
      data-jump-target
      style={{ "--jump-radius": "24px" }}
      className={`jump-highlight-target app-panel min-w-0 overflow-hidden rounded-[24px] border ${getMoodClasses(darkMode, mood)}`}
    >
      <CardContent className="p-4 md:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="min-w-0">
            <div className={`app-kicker ${getMoodTextClass(darkMode, mood)}`}>Vessel State</div>
            <div className={`mt-2 text-xl font-semibold tracking-tight ${theme.textPrimary}`}>{config.label}</div>
            <p className={`mt-2 max-w-2xl text-sm leading-6 ${theme.textSecondary}`}>
              {config.description}
            </p>
            <div className={`mt-3 text-sm font-semibold ${getMoodTextClass(darkMode, mood)}`}>
              {isOwnerView ? "Owner view: calm executive summary." : "Captain view: operational risks surfaced first."}
            </div>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-2">
            {tiles.map((tile) => (
              <MetricTile
                key={tile.label}
                darkMode={darkMode}
                label={tile.label}
                value={tile.value}
                note={tile.note}
                tone={tile.tone || (mood === "pressure" ? "warning" : mood === "critical" ? "critical" : "neutral")}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailPanelBody({
  darkMode = false,
  item,
  canEdit = false,
  onApprovalAction,
  onNavigateToTasks,
  onNavigateToMaintenance,
  onNavigateToCrew,
  onNavigateToCertificates,
  onNavigateToApprovals,
  onNavigateToRoute,
  onNavigateToAlerts,
}) {
  const theme = themeClasses(darkMode);

  if (!item) return null;

  const linkedQuotes = Array.isArray(item?.raw?.quotes)
    ? item.raw.quotes
    : Array.isArray(item?.linkedQuotes)
      ? item.linkedQuotes
      : [];
  const linkedExpenses = Array.isArray(item?.linkedExpenses) ? item.linkedExpenses : [];
  const activity = Array.isArray(item.activity) ? item.activity.filter(Boolean) : [];
  const checklist = Array.isArray(item.checklist) ? item.checklist.filter(Boolean) : [];

  const primaryAction = (() => {
    if (item.type === "task") return { label: "View tasks", onClick: onNavigateToTasks };
    if (item.type === "maintenance") return { label: "View maintenance", onClick: onNavigateToMaintenance };
    if (item.type === "certificate") return { label: "View crew", onClick: onNavigateToCertificates };
    if (item.type === "approval" || item.type === "quote") return { label: "View approvals", onClick: onNavigateToApprovals };
    if (item.type === "alert" || item.type === "route") return { label: "View route", onClick: onNavigateToRoute };
    return { label: "View alerts", onClick: onNavigateToAlerts };
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge className={darkMode ? "border border-[var(--vessel-border-dark)] bg-[var(--vessel-primary-soft-dark)] text-[var(--vessel-text-accent-dark)]" : "border border-[var(--vessel-border)] bg-[var(--vessel-primary-soft)] text-[var(--vessel-text-accent)]"}>
          {titleCase(item.type || "Item")}
        </Badge>
        {item.priority ? (
          <Badge className={normalizeTone(item) === "critical" ? (darkMode ? "border border-rose-300/40 bg-rose-300/15 text-rose-100 shadow-sm" : "border border-rose-300 bg-rose-50 text-rose-800 shadow-sm") : warningBadgeClass(darkMode)}>
            {item.priority}
          </Badge>
        ) : null}
        {item.status ? (
          <Badge className={neutralBadgeClass(darkMode)}>
            {item.status}
          </Badge>
        ) : null}
      </div>

      {item.description ? (
        <section className={`rounded-[22px] border p-4 ${darkMode ? "app-dark-inner border-[var(--vessel-border-dark)]" : "border-[rgba(15,80,70,0.08)] bg-[rgba(255,255,255,0.56)]"}`}>
          <div className="app-kicker">Brief</div>
          <p className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>{item.description}</p>
        </section>
      ) : null}

      {checklist.length ? (
        <section className={`rounded-[22px] border p-4 ${darkMode ? "app-dark-inner border-[var(--vessel-border-dark)]" : "border-[rgba(15,80,70,0.08)] bg-[rgba(255,255,255,0.56)]"}`}>
          <div className="app-kicker">Checklist</div>
          <div className="mt-3 space-y-2">
            {checklist.map((step) => (
              <label key={step} className={`flex items-start gap-3 text-sm ${theme.textSecondary}`}>
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--vessel-primary)]" />
                <span>{step}</span>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {linkedQuotes.length ? (
        <section className={`rounded-[22px] border p-4 ${darkMode ? "app-dark-inner border-[var(--vessel-border-dark)]" : "border-[rgba(15,80,70,0.08)] bg-[rgba(255,255,255,0.56)]"}`}>
          <div className="app-kicker">Linked Quotes</div>
          <div className="mt-3 space-y-2">
            {linkedQuotes.slice(0, 4).map((quote) => (
              <div key={`${item.id}-${quote.id || quote.supplier}`} className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 ${darkMode ? "app-dark-card border-white/10" : "border-[rgba(15,80,70,0.06)] bg-white/50"}`}>
                <div>
                  <div className={`text-sm font-semibold ${theme.textPrimary}`}>{quote.supplier || quote.title || "Quote"}</div>
                  <div className={`text-xs ${theme.textSecondary}`}>{titleCase(quote.status || "requested")}</div>
                </div>
                <div className={`text-sm font-semibold ${theme.textPrimary}`}>{formatMoney(quote.amount || 0, quote.currency || "USD")}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {linkedExpenses.length ? (
        <section className={`rounded-[22px] border p-4 ${darkMode ? "app-dark-inner border-[var(--vessel-border-dark)]" : "border-[rgba(15,80,70,0.08)] bg-[rgba(255,255,255,0.56)]"}`}>
          <div className="app-kicker">Linked Expenses</div>
          <div className="mt-3 space-y-2">
            {linkedExpenses.slice(0, 4).map((expense) => (
              <div key={`${item.id}-${expense.id || expense.title}`} className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 ${darkMode ? "app-dark-card border-white/10" : "border-[rgba(15,80,70,0.06)] bg-white/50"}`}>
                <div>
                  <div className={`text-sm font-semibold ${theme.textPrimary}`}>{expense.title || "Expense"}</div>
                  <div className={`text-xs ${theme.textSecondary}`}>{titleCase(expense.status || "requested")}</div>
                </div>
                <div className={`text-sm font-semibold ${theme.textPrimary}`}>{expense.amount || "Pending"}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activity.length ? (
        <section className={`rounded-[22px] border p-4 ${darkMode ? "app-dark-inner border-[var(--vessel-border-dark)]" : "border-[rgba(15,80,70,0.08)] bg-[rgba(255,255,255,0.56)]"}`}>
          <div className="app-kicker">Recent Activity</div>
          <ul className={`mt-3 space-y-2 text-sm leading-6 ${theme.textSecondary}`}>
            {activity.map((entry) => (
              <li key={`${item.id}-${entry}`}>- {entry}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className={`sticky bottom-0 z-10 -mx-1 grid gap-2 rounded-[22px] border p-2.5 shadow-[0_-18px_42px_-34px_rgba(0,0,0,0.46)] backdrop-blur-xl sm:grid-cols-2 ${darkMode ? "app-dark-panel border-[var(--vessel-border-dark)]" : "border-[rgba(15,80,70,0.08)] bg-white/86"}`}>
        <Button type="button" onClick={primaryAction.onClick} className="app-primary-action-button">
          {primaryAction.label}
        </Button>
        <Button type="button" variant="outline" className="app-action-button">
          Request update
        </Button>
        <Button type="button" variant="outline" className="app-action-button">
          Add comment
        </Button>
        <Button
          type="button"
          onClick={item.type === "approval" || item.type === "quote" ? () => onApprovalAction?.(item.raw || item, "approved") : undefined}
          className={`min-h-11 rounded-2xl px-4 py-3 font-semibold ${item.type === "approval" || item.type === "quote" ? "border border-amber-300 bg-amber-100 text-amber-950 shadow-[0_14px_30px_-24px_rgba(180,83,9,0.55)] hover:bg-amber-200 dark:border-amber-300/40 dark:bg-amber-300/15 dark:text-amber-100 dark:hover:bg-amber-300/25" : "border border-slate-300 bg-white text-slate-800 shadow-sm hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-cyan-300/40 dark:hover:bg-slate-700"} disabled:cursor-not-allowed disabled:opacity-60`}
          disabled={!canEdit && (item.type === "approval" || item.type === "quote")}
        >
          {item.type === "approval" || item.type === "quote" ? "Approve" : "Mark reviewed"}
        </Button>
      </div>
    </div>
  );
}

function DailyReportModal({ open = false, darkMode = false, report = {}, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const panelClass = darkMode
    ? "border-white/10 bg-slate-950 text-slate-50"
    : "border-slate-200 bg-white text-slate-950";
  const mutedClass = darkMode ? "text-slate-300" : "text-slate-600";
  const itemClass = darkMode
    ? "border-white/10 bg-white/[0.04]"
    : "border-slate-200 bg-slate-50";
  const sections = [
    ["Completed tasks", report.completedTasks || [], (item) => item.name || item.title || "Completed task"],
    ["Open tasks", report.openTasks || [], (item) => `${item.name || item.title || "Open task"} - ${formatTaskStatusLabel(item.status || "pending")}`],
    ["Overdue items", report.overdueItems || [], (item) => item.name || item.title || "Overdue item"],
    ["Approvals waiting", report.approvalsWaiting || [], (item) => item.title || item.supplier || "Approval waiting"],
    ["Crew notes", report.crewNotes || [], (item) => `${item.crewName || item.holderName || item.name || "Crew"} - ${item.statusLabel || item.statusText || "Review"}`],
    ["Maintenance warnings", report.maintenanceWarnings || [], (item) => item.title || item.name || "Maintenance warning"],
    ["Latest activity", report.latestActivity || [], (item) => item.message || item.detail || item.title || item.action || "Activity update"],
  ];

  return createPortal(
    <div className="fixed inset-0 z-[30000] flex items-center justify-center p-4">
      <button type="button" aria-label="Close daily report" className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <section className={`relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border p-5 shadow-[0_30px_100px_rgba(15,23,42,0.32)] ${panelClass}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="app-kicker">Daily Report</div>
            <h2 className="mt-2 text-2xl font-semibold">{report.vesselName || "Vessel"}</h2>
            <p className={`mt-1 text-sm ${mutedClass}`}>{report.date || new Date().toLocaleDateString()} - Route: {report.routeStatus || "Planning"} - Pending spend: {report.pendingSpend || "0"}</p>
          </div>
          <Button type="button" variant="outline" className="app-action-button" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {sections.map(([title, items, getLabel]) => (
            <div key={title} className={`rounded-2xl border p-4 ${itemClass}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-[0.12em]">{title}</h3>
                <Badge className={neutralBadgeClass(darkMode)}>{items.length}</Badge>
              </div>
              <div className="mt-3 grid gap-2">
                {items.length ? items.slice(0, 6).map((item, index) => (
                  <div key={item.id || `${title}-${index}`} className={`rounded-xl border px-3 py-2 text-sm ${darkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
                    {getLabel(item)}
                  </div>
                )) : (
                  <div className={`rounded-xl border border-dashed px-3 py-3 text-sm ${mutedClass} ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                    None for this report.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>,
    document.body
  );
}

export function TodayOperationsView({
  darkMode = false,
  canEdit = true,
  todayOperations,
  dailyReportData = {},
  currency,
  currentRole = "captain",
  currentRoleLabel = "Captain",
  currentVesselName = "Contessa",
  vesselState = {},
  stats = {},
  vesselOperations = null,
  isOffline = false,
  lastSyncAt = "",
  unsyncedItemsCount = 0,
  notificationPermission = "default",
  onRequestNotifications,
  mobileHomeConfig = null,
  routeAlerts = [],
  recentActivity = [],
  quickActions = [],
  fleetVessels = [],
  fleetMetricsByVessel = {},
  activeVesselId = "contessa",
  onOpenFleet,
  onSwitchFleetVessel,
  onApprovalAction,
  onNavigateToTasks,
  onNavigateToMaintenance,
  onNavigateToCrew,
  onNavigateToCertificates,
  onNavigateToApprovals,
  onNavigateToRoute,
  onNavigateToAlerts,
  onNavigateToDocuments,
}) {
  const theme = themeClasses(darkMode);
  const currentVessel = vesselOperations || null;
  const [selectedItem, setSelectedItem] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [dailyReportOpen, setDailyReportOpen] = useState(false);
  const [commandClock, setCommandClock] = useState(() => new Date());
  const [expandedSections, setExpandedSections] = useState({
    tasksMaintenance: false,
    expensesApprovals: false,
    certificatesCrew: false,
    documents: false,
    routePlanning: false,
    activity: false,
  });

  const commandPanelConfig = mobileHomeConfig || {
    title: "Captain command panel",
    summary: "Compact operational overview with the next decisions surfaced first.",
    status: "Bridge command",
  };

  useEffect(() => {
    const interval = setInterval(() => setCommandClock(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isInspectorOpen) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsInspectorOpen(false);
        setSelectedItem(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isInspectorOpen]);

  const operationItems = useMemo(
    () => (Array.isArray(currentVessel?.items) ? currentVessel.items.map(buildOperationCard) : []),
    [currentVessel]
  );
  const activityItems = useMemo(
    () => (Array.isArray(recentActivity) ? recentActivity.map(buildActivityCard) : []),
    [recentActivity]
  );

  const taskItems = useMemo(() => operationItems.filter((item) => item.type === "task"), [operationItems]);
  const maintenanceItems = useMemo(() => operationItems.filter((item) => item.type === "maintenance"), [operationItems]);
  const approvalItems = useMemo(() => operationItems.filter((item) => item.type === "approval" || item.type === "quote"), [operationItems]);
  const certificateItems = useMemo(() => operationItems.filter((item) => item.type === "certificate"), [operationItems]);
  const alertItems = useMemo(() => operationItems.filter((item) => item.type === "alert"), [operationItems]);
  const resolvedVesselState = useMemo(() => ({
    ...(currentVessel?.vesselState || {}),
    ...(vesselState || {}),
  }), [currentVessel?.vesselState, vesselState]);

  const routeReviewItems = useMemo(() => {
    if (alertItems.length) return alertItems;

    return [
      buildOperationCard({
        id: `route-${currentVessel?.slug || "active"}`,
        type: "route",
        title: stats.routeWaypoints ? `${stats.routeWaypoints} planned waypoints` : "Route planning standby",
        subtitle: stats.routeDistanceNm ? `${stats.routeDistanceNm.toFixed(1)} nm estimated passage` : "No full passage plan published yet",
        status: stats.routeReviewCount ? "Review" : "Stable",
        priority: stats.routeReviewCount ? "Review" : "Stable",
        assignedTo: "Bridge",
        requester: "Route planning",
        dueDate: stats.routeReviewCount ? "Review today" : "Standing by",
        description: stats.routeDistanceNm
          ? `Current route estimate is ${stats.routeDistanceNm.toFixed(1)} nm across ${stats.routeWaypoints || 0} waypoints.`
          : "Open route planning to review waypoints, fuel assumptions, and safe depth targets.",
        checklist: [],
        activity: [],
      }),
    ];
  }, [alertItems, currentVessel?.slug, stats.routeWaypoints, stats.routeDistanceNm, stats.routeReviewCount]);

  const priorityItems = useMemo(() => {
    const sourceItems = [
      ...alertItems,
      ...taskItems,
      ...maintenanceItems,
      ...approvalItems,
      ...certificateItems,
    ];

    return sortByVesselState(sourceItems, resolvedVesselState?.mode).slice(0, String(currentRole).toLowerCase() === "owner" ? 3 : 4);
  }, [alertItems, taskItems, maintenanceItems, approvalItems, certificateItems, resolvedVesselState?.mode, currentRole]);
  const priorityItemIds = useMemo(() => new Set(priorityItems.map((item) => item.id)), [priorityItems]);

  const activeFleetVessel = useMemo(
    () => (Array.isArray(fleetVessels) ? fleetVessels.find((vessel) => vessel?.id === activeVesselId) : null),
    [fleetVessels, activeVesselId]
  );
  const confidenceScore = useMemo(() => {
    const calculated = activeFleetVessel ? calculateConfidenceScore(activeFleetVessel) : Number(resolvedVesselState?.confidenceScore || 0);
    return Math.max(0, Math.min(100, Math.round(Number(calculated) || 0)));
  }, [activeFleetVessel, resolvedVesselState?.confidenceScore]);

  const crewReadinessNote = useMemo(() => {
    if (certificateItems.length) {
      return certificateItems.slice(0, 3);
    }

    return [];
  }, [certificateItems]);

  const statusTiles = [
    {
      label: "Urgent today",
      value: currentVessel?.metrics?.activeTasks ?? stats.totalObjectives ?? 0,
      note: `${stats.overdueTasks || 0} overdue`,
      tone: (stats.overdueTasks || 0) > 0 ? "critical" : "neutral",
    },
    {
      label: "Waiting approval",
      value: currentVessel?.metrics?.pendingApprovals ?? todayOperations?.pendingApprovals?.length ?? 0,
      note: `${approvalItems.length} live queue`,
      tone: approvalItems.length ? "warning" : "neutral",
    },
    {
      label: "Overdue",
      value: stats.overdueTasks || 0,
      note: (stats.overdueTasks || 0) > 0 ? "Needs attention" : "None today",
      tone: (stats.overdueTasks || 0) > 0 ? "critical" : "success",
    },
    {
      label: "Changed recently",
      value: activityItems.length,
      note: "Latest updates",
      tone: activityItems.length ? "neutral" : "success",
    },
    {
      label: "Vessel status",
      value: currentVessel?.status || "Operational",
      note: currentVessel?.syncStatus || "Live",
      tone: isOffline ? "warning" : "success",
    },
    {
      label: "Pending spend",
      value: currentVessel?.metrics?.openExposure ?? formatMoney(stats.totalExpenses || 0, currency),
      note: `${stats.pendingApprovals || 0} approvals waiting`,
      tone: (stats.pendingApprovals || 0) > 0 ? "warning" : "neutral",
    },
  ];

  const greeting = commandClock.getHours() < 12 ? "Good morning" : commandClock.getHours() < 18 ? "Good afternoon" : "Good evening";
  const urgentBriefCount = priorityItems.filter((item) => item.tone === "critical").length || stats.overdueTasks || 0;
  const crewBriefCount = crewReadinessNote.length || stats.certificateDue || 0;
  const nextMilestone = routeReviewItems[0]?.title || maintenanceItems[0]?.title || "Service plan standing by";
  const vesselStateConfig = getVesselStateConfig(resolvedVesselState?.mode);
  const isOwnerView = String(currentRole || "").toLowerCase() === "owner";

  const notificationsReady = notificationPermission === "granted";
  const notificationsUnsupported = notificationPermission === "unsupported";

  const searchResults = useMemo(() => {
    const makeSection = ({ id, title, type = "Section", context, targetId, moduleAction, sectionKey }) => ({
      id,
      type,
      title,
      context,
      targetId,
      moduleAction,
      sectionKey,
      searchText: makeSearchText([id, type, title, context]),
    });

    const sectionResults = [
      makeSection({ id: "search-dashboard", title: "Dashboard", context: "Vessel status and command brief", targetId: "dashboard-section" }),
      makeSection({ id: "search-mission-cards", title: "Mission Cards", context: "Urgent work, approvals, and risk items", targetId: "mission-cards-section" }),
      makeSection({ id: "search-tasks", title: "Tasks", context: "Task board and maintenance queue", targetId: "tasks-section", moduleAction: onNavigateToTasks }),
      makeSection({ id: "search-maintenance", title: "Maintenance", context: "Service schedule and upkeep", targetId: "maintenance-section", moduleAction: onNavigateToMaintenance }),
      makeSection({ id: "search-approvals", title: "Approvals", context: "Quotes, expenses, and decisions", targetId: "approvals-section", moduleAction: onNavigateToApprovals }),
      makeSection({ id: "search-crew", title: "Crew", context: "Crew roster and readiness", targetId: "crew-section", moduleAction: onNavigateToCrew || onNavigateToCertificates }),
      makeSection({ id: "search-crew-list", type: "Document", title: "Crew List", context: "Crew list print view for current vessel", targetId: "crew-list-action", moduleAction: onNavigateToCrew || onNavigateToCertificates }),
      makeSection({ id: "search-certificates", title: "Certificates", context: "Crew certificates and expiry reviews", targetId: "certificates-section", moduleAction: onNavigateToCertificates }),
      makeSection({ id: "search-documents", title: "Documents", context: "Vessel document vault", targetId: "documents-section", moduleAction: onNavigateToDocuments }),
      makeSection({ id: "search-route", title: "Route Planning", context: "Waypoints, chart review, ETA, and fuel", targetId: "route-section", moduleAction: onNavigateToRoute }),
      makeSection({ id: "search-alerts", title: "Alerts", context: "Operational warnings and notifications", targetId: "alerts-section", moduleAction: onNavigateToAlerts }),
      makeSection({ id: "search-fleet", title: "Fleet Switcher", context: "Open another vessel workspace", targetId: "app-command-header", moduleAction: onOpenFleet }),
      makeSection({
        id: "search-vessel-state",
        type: "Intelligence",
        title: "Vessel State",
        context: `${getVesselStateConfig(resolvedVesselState?.mode).label} · ${confidenceScore}% confidence`,
        targetId: "vessel-state-section",
      }),
      makeSection({
        id: "search-confidence-score",
        type: "Intelligence",
        title: "Confidence Score",
        context: `Vessel confidence is ${confidenceScore}% for ${currentVessel?.name || currentVesselName}`,
        targetId: "vessel-state-section",
      }),
      makeSection({
        id: "search-owner-view",
        type: "View",
        title: "Owner View",
        context: "Calm-summary vessel confidence, pending spend, top risks, and captain summary",
        targetId: "vessel-state-section",
      }),
      makeSection({
        id: "search-captain-view",
        type: "View",
        title: "Captain View",
        context: "Operational risk view for overdue items, approvals, crew accountability, and certificates",
        targetId: "vessel-state-section",
      }),
    ];

    const itemResults = operationItems.map((item) => {
      const sectionKey = itemSectionForSearch(item);
      const targetId = itemTargetForSearch(item, priorityItemIds);
      const context = [
        currentVessel?.name || currentVesselName,
        item.status,
        item.assignedTo || item.requester,
        item.dueDate,
        item.amount,
      ].filter(Boolean).join(" · ");

      return {
        id: `search-item-${item.id}`,
        type: compactTypeLabel(item.type),
        title: item.title,
        context,
        targetId,
        sectionKey,
        item,
        searchText: makeSearchText([
          item.id,
          item.type,
          item.title,
          item.subtitle,
          item.status,
          item.priority,
          item.assignedTo,
          item.requester,
          item.description,
          item.dueDate,
          item.amount,
          item.checklist,
          item.activity,
          context,
        ]),
      };
    });

    const crewResults = (Array.isArray(activeFleetVessel?.crewProfiles) ? activeFleetVessel.crewProfiles : []).map((profile) => ({
      id: `search-crew-${profile.id || profile.fullName}`,
      type: "Crew",
      title: profile.fullName || "Crew member",
      context: [currentVessel?.name || currentVesselName, profile.rank, profile.department, `${profile.certificates?.length || 0} certificates`].filter(Boolean).join(" · "),
      targetId: profile.id ? `item-${profile.id}` : "crew-section",
      moduleAction: onNavigateToCrew || onNavigateToCertificates,
      item: profile,
      searchText: makeSearchText([profile.id, profile.fullName, profile.rank, profile.department, profile.notes, currentVessel?.name, "crew readiness certificates"]),
    }));

    const documentResults = (Array.isArray(activeFleetVessel?.documents) ? activeFleetVessel.documents : []).map((document) => ({
      id: `search-document-${document.id || document.name || document.title}`,
      type: "Document",
      title: document.name || document.title || "Vessel document",
      context: [currentVessel?.name || currentVesselName, document.category || document.type || "Document vault", document.status].filter(Boolean).join(" · "),
      targetId: document.id ? `item-${document.id}` : "documents-section",
      moduleAction: onNavigateToDocuments,
      item: document,
      searchText: makeSearchText([document.id, document.name, document.title, document.category, document.type, document.status, "documents docs vault"]),
    }));

    return [...sectionResults, ...itemResults, ...crewResults, ...documentResults];
  }, [
    activeFleetVessel,
    currentVessel,
    currentVesselName,
    operationItems,
    priorityItemIds,
    onNavigateToTasks,
    onNavigateToMaintenance,
    onNavigateToCrew,
    onNavigateToCertificates,
    onNavigateToApprovals,
    onNavigateToDocuments,
    onNavigateToRoute,
    onNavigateToAlerts,
    onOpenFleet,
    resolvedVesselState?.mode,
    confidenceScore,
  ]);

  function openInspector(item) {
    setSelectedItem(item);
    setIsInspectorOpen(true);
  }

  function closeInspector() {
    setIsInspectorOpen(false);
    setSelectedItem(null);
  }

  function toggleSection(key) {
    setExpandedSections((prev) => {
      const nextOpen = !prev[key];
      return {
        tasksMaintenance: false,
        expensesApprovals: false,
        certificatesCrew: false,
        documents: false,
        routePlanning: false,
        activity: false,
        [key]: nextOpen,
      };
    });
  }

  function getHighlightElement(targetId) {
    if (!targetId || typeof document === "undefined") return null;
    const baseElement = document.getElementById(targetId);
    return baseElement?.matches("[data-jump-target]")
      ? baseElement
      : baseElement?.querySelector("[data-jump-target]") || baseElement?.closest("[data-jump-target]") || baseElement || null;
  }

  function waitForHighlightElement(targetId, retries = 12, delay = 80) {
    return new Promise((resolve) => {
      if (!targetId || typeof window === "undefined" || typeof document === "undefined") {
        resolve(null);
        return;
      }

      let attempts = 0;

      function check() {
        const element = getHighlightElement(targetId);
        if (element || attempts >= retries) {
          resolve(element || null);
          return;
        }
        attempts += 1;
        window.setTimeout(check, delay);
      }

      check();
    });
  }

  function scrollTargetToReadableTop(element) {
    if (!element || typeof window === "undefined") return;

    const viewportWidth = window.innerWidth || 0;
    const topOffset = viewportWidth >= 1024 ? 112 : 92;
    const targetTop = element.getBoundingClientRect().top + window.scrollY - topOffset;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }

  async function highlightTarget(targetId, fallbackId = "") {
    if (!targetId || typeof window === "undefined" || typeof document === "undefined") return false;
    const element = (await waitForHighlightElement(targetId)) || (fallbackId ? await waitForHighlightElement(fallbackId, 6, 70) : null);
    if (!element) return false;
    scrollTargetToReadableTop(element);
    element.classList.remove("jump-highlight-active");
    void element.offsetWidth;
    element.classList.add("jump-highlight-target");
    element.classList.add("jump-highlight-active");
    window.setTimeout(() => {
      element.classList.remove("jump-highlight-active");
    }, 1900);
    return true;
  }

  function jumpToResult(result) {
    if (!result) return;

    if (result.sectionKey) {
      setExpandedSections({
        tasksMaintenance: false,
        expensesApprovals: false,
        certificatesCrew: false,
        documents: false,
        routePlanning: false,
        activity: false,
        [result.sectionKey]: true,
      });
    }

    if (typeof result.moduleAction === "function") {
      result.moduleAction();
      if (typeof window !== "undefined") {
        window.setTimeout(() => highlightTarget(result.targetId, result.sectionId), 260);
      }
      if (result.item) {
        openInspector(result.item);
      }
      return;
    }

    if (typeof window !== "undefined") {
      window.setTimeout(() => highlightTarget(result.targetId, result.sectionId), result.sectionKey ? 150 : 0);
    }

    if (result.item) {
      openInspector(result.item);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleCommandItemOpen = (event) => {
      const itemId = event?.detail?.id;
      if (!itemId) return;
      const item = operationItems.find((candidate) => candidate?.id === itemId);
      if (!item) return;

      const sectionKey = itemSectionForSearch(item);
      if (sectionKey) {
        setExpandedSections({
          tasksMaintenance: false,
          expensesApprovals: false,
          certificatesCrew: false,
          documents: false,
          routePlanning: false,
          activity: false,
          [sectionKey]: true,
        });
      }
      openInspector(item);
      window.setTimeout(() => highlightTarget(itemTargetForSearch(item, priorityItemIds)), sectionKey ? 180 : 80);
    };

    window.addEventListener("contessa:open-command-item", handleCommandItemOpen);
    return () => window.removeEventListener("contessa:open-command-item", handleCommandItemOpen);
  }, [operationItems, priorityItemIds]);

  if (!currentVessel) {
    return (
      <div className="min-h-screen rounded-[28px] bg-slate-950 p-6 text-slate-100">
        <h1 className="text-xl font-semibold">Vessel workspace unavailable</h1>
        <p className="mt-2 text-sm text-slate-300">Please select a valid vessel.</p>
      </div>
    );
  }

  return (
    <>
      <div id="dashboard-section" data-jump-target style={{ "--jump-radius": "28px" }} className="jump-highlight-target grid gap-4 rounded-[28px] scroll-mt-24 md:gap-5 md:scroll-mt-28">
        <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
          <div className="grid gap-4 xl:col-span-8">
            <VesselStateBanner
              darkMode={darkMode}
              vesselState={resolvedVesselState}
              confidenceScore={confidenceScore}
              stats={stats}
              currentVessel={currentVessel}
              role={currentRole}
              currency={currency}
            />

            <Card
              id="mission-cards-section"
              data-jump-target
              style={{ "--jump-radius": "24px" }}
              className={`jump-highlight-target app-panel app-panel-soft min-w-0 overflow-hidden rounded-[24px] ${theme.card}`}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="app-kicker">Mission Cards</div>
                    <div className={`mt-2 text-lg font-semibold ${theme.textPrimary}`}>
                      {isOwnerView ? "Only material owner-level signals are surfaced first." : `${vesselStateConfig.label} priorities are surfaced first.`}
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button
                      type="button"
                      onClick={() => setDailyReportOpen(true)}
                      className="app-primary-action-button w-full sm:w-auto"
                    >
                      Generate Daily Report
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onNavigateToTasks}
                      className="app-action-button w-full sm:w-auto"
                    >
                      View details
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {priorityItems.length ? (
                    priorityItems.map((item) => (
                      <CompactItemCard
                        htmlId={`item-${item.id}`}
                        key={item.id}
                        darkMode={darkMode}
                        item={item}
                        selected={selectedItem?.id === item.id}
                        onClick={() => openInspector(item)}
                      />
                    ))
                  ) : (
                    <div className="md:col-span-2">
                      <DashboardEmptyState
                        darkMode={darkMode}
                        title="No urgent tasks today."
                        message="The vessel is stable right now. Approvals, crew documents, and route warnings will appear here only when they need attention."
                        actionLabel="View tasks"
                        onAction={onNavigateToTasks}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <SectionAccordion
              id="tasks-section"
              darkMode={darkMode}
              title="Tasks"
              subtitle="Compact queue of work orders, overdue actions, and due-today upkeep."
              count={taskItems.length + maintenanceItems.length}
              tone={taskItems.length || maintenanceItems.length ? "warning" : "neutral"}
              module="tasks"
              isOpen={expandedSections.tasksMaintenance}
              onToggle={() => toggleSection("tasksMaintenance")}
              actionLabel="Open tasks"
              onAction={onNavigateToTasks}
            >
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {sortByPriority([...taskItems, ...maintenanceItems]).slice(0, 6).map((item) => (
                    <CompactItemCard
                      htmlId={`queue-item-${item.id}`}
                      key={item.id}
                      darkMode={darkMode}
                      item={item}
                      selected={selectedItem?.id === item.id}
                      onClick={() => openInspector(item)}
                    />
                  ))}
                </div>
                {!taskItems.length && !maintenanceItems.length ? (
                  <DashboardEmptyState
                    darkMode={darkMode}
                    title="No maintenance due today"
                    message="The immediate work board is clear. Open the maintenance plan or task workspace for upcoming service and pending jobs."
                    actionLabel="View maintenance plan"
                    onAction={onNavigateToMaintenance}
                  />
                ) : null}
              </div>
            </SectionAccordion>

            <SectionAccordion
              id="approvals-section"
              darkMode={darkMode}
              title="Approval"
              subtitle="Quotes, expenses, and service decisions stay folded until selected."
              count={approvalItems.length}
              tone={approvalItems.length ? "warning" : "neutral"}
              module="approval"
              isOpen={expandedSections.expensesApprovals}
              onToggle={() => toggleSection("expensesApprovals")}
              actionLabel="Open approvals"
              onAction={onNavigateToApprovals}
            >
              {approvalItems.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {approvalItems.slice(0, 6).map((item) => (
                    <CompactItemCard
                      htmlId={`approval-item-${item.id}`}
                      key={item.id}
                      darkMode={darkMode}
                      item={item}
                      selected={selectedItem?.id === item.id}
                      onClick={() => openInspector(item)}
                    />
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  darkMode={darkMode}
                  title="No approvals waiting"
                    message="No spend or quote decision is waiting at the moment. Open approvals to review the wider board."
                    actionLabel="View approvals"
                    onAction={onNavigateToApprovals}
                    secondaryContent={<div className={`text-xs ${theme.textSecondary}`}>Pending spend: {currentVessel?.metrics?.openExposure || formatMoney(stats.totalExpenses || 0, currency)}</div>}
                  />
                )}
            </SectionAccordion>

            <SectionAccordion
              id="crew-section"
              darkMode={darkMode}
              title="Crew"
              subtitle="Crew readiness stays collapsed until documentation or review is needed."
              count={certificateItems.length}
              tone={certificateItems.length ? "warning" : "neutral"}
              module="crew"
              isOpen={expandedSections.certificatesCrew}
              onToggle={() => toggleSection("certificatesCrew")}
              actionLabel="Open crew"
              onAction={onNavigateToCertificates}
            >
              {certificateItems.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {certificateItems.slice(0, 4).map((item) => (
                    <CompactItemCard
                      htmlId={`certificate-item-${item.id}`}
                      key={item.id}
                      darkMode={darkMode}
                      item={item}
                      selected={selectedItem?.id === item.id}
                      onClick={() => openInspector(item)}
                    />
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  darkMode={darkMode}
                  title="Crew compliance looks clear"
                  message="No crew certificates are near expiry today. Open the crew and certificates workspace for the full roster and records."
                  actionLabel="View crew"
                  onAction={onNavigateToCertificates}
                />
              )}
            </SectionAccordion>

            <SectionAccordion
              id="documents-section"
              darkMode={darkMode}
              title="Docs"
              subtitle="Document controls stay collapsed until someone needs the vault."
              count={stats.documentCount || 0}
              tone="neutral"
              module="docs"
              isOpen={expandedSections.documents}
              onToggle={() => toggleSection("documents")}
              actionLabel="Open documents"
              onAction={onNavigateToDocuments}
            >
              {(stats.documentCount || 0) > 0 ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <MetricTile darkMode={darkMode} label="Files" value={stats.documentCount || 0} note="Tracked in vault" />
                  <MetricTile darkMode={darkMode} label="Share" value="Ready" note="Controlled export" />
                  <MetricTile darkMode={darkMode} label="Status" value="Indexed" note="Workspace scoped" />
                </div>
              ) : (
                <DashboardEmptyState
                  darkMode={darkMode}
                  title="No document records yet"
                  message="This vessel has no documents indexed right now. Open the document vault to upload certificates, manuals, and operational files."
                  actionLabel="Open documents"
                  onAction={onNavigateToDocuments}
                />
              )}
            </SectionAccordion>

            <SectionAccordion
              id="route-section"
              darkMode={darkMode}
              title="Route"
              subtitle="Navigation review stays concise until the bridge team needs detail."
              count={stats.routeReviewCount || routeReviewItems.length}
              tone={stats.routeReviewCount || routeAlerts.length ? "warning" : "neutral"}
              module="route"
              isOpen={expandedSections.routePlanning}
              onToggle={() => toggleSection("routePlanning")}
              actionLabel="Open route"
              onAction={onNavigateToRoute}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {routeReviewItems.map((item) => (
                  <CompactItemCard
                    htmlId={`route-item-${item.id}`}
                    key={item.id}
                    darkMode={darkMode}
                    item={item}
                    selected={selectedItem?.id === item.id}
                    onClick={() => openInspector(item)}
                  />
                ))}
              </div>
            </SectionAccordion>

            <SectionAccordion
              id="activity-section"
              darkMode={darkMode}
              title="Activity"
              subtitle="A compact running log instead of a full-width empty history panel."
              count={activityItems.length}
              tone="neutral"
              module="activity"
              isOpen={expandedSections.activity}
              onToggle={() => toggleSection("activity")}
            >
              {activityItems.length ? (
                <div className="grid gap-3">
                  {activityItems.slice(0, 5).map((item) => (
                    <CompactItemCard
                      htmlId={`activity-item-${item.id}`}
                      key={item.id}
                      darkMode={darkMode}
                      item={item}
                      selected={selectedItem?.id === item.id}
                      onClick={() => openInspector(item)}
                    />
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  darkMode={darkMode}
                  title="No recent activity"
                  message="Operational activity will appear here as the vessel team updates tasks, route work, approvals, and certificates."
                />
              )}
            </SectionAccordion>
          </div>

          <div className="grid gap-4 xl:col-span-4">
            <IntelligencePanel
              darkMode={darkMode}
              title="Alerts Summary"
              subtitle={alertItems.length ? "Top warnings stay visible here without opening the whole route surface." : "The route board is calm right now."}
              actionLabel="Open alerts"
              onAction={onNavigateToAlerts}
            >
              <div className="grid gap-3">
                {alertItems.length ? (
                  alertItems.slice(0, 3).map((item) => (
                    <CompactItemCard
                      htmlId={`alert-item-${item.id}`}
                      key={item.id}
                      darkMode={darkMode}
                      item={item}
                      selected={selectedItem?.id === item.id}
                      onClick={() => openInspector(item)}
                    />
                  ))
                ) : (
                  <DashboardEmptyState
                    darkMode={darkMode}
                    title="No active route warnings"
                    message="No navigation warnings are active. Open route planning to review safe depth assumptions, ETA, and fuel margin."
                    actionLabel="Open route"
                    onAction={onNavigateToRoute}
                  />
                )}
              </div>
            </IntelligencePanel>

            <IntelligencePanel
              darkMode={darkMode}
              title="Crew"
              subtitle={`${currentVessel?.metrics?.crewReady || "100%"} crew readiness with ${stats.certificateDue || 0} certificate reviews pending.`}
              actionLabel="Open crew"
              onAction={onNavigateToCertificates}
            >
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <MetricTile darkMode={darkMode} label="Crew" value={stats.crewProfiles || 0} note="Profiles active" />
                  <MetricTile darkMode={darkMode} label="Certs" value={stats.certificateDue || 0} note="Due for review" tone={(stats.certificateDue || 0) > 0 ? "warning" : "neutral"} />
                </div>
                {crewReadinessNote.length ? (
                  crewReadinessNote.map((item) => (
                    <CompactItemCard
                      htmlId={`crew-note-item-${item.id}`}
                      key={item.id}
                      darkMode={darkMode}
                      item={item}
                      selected={selectedItem?.id === item.id}
                      onClick={() => openInspector(item)}
                    />
                  ))
                ) : (
                  <DashboardEmptyState
                    darkMode={darkMode}
                    title="Crew documents look clear"
                    message="No immediate crew or certificate review items are waiting right now."
                  />
                )}
              </div>
            </IntelligencePanel>

            <IntelligencePanel
              darkMode={darkMode}
              title="Approvals"
              subtitle="Pending spend, approvals, and decisions stay visible without opening the whole approvals module."
              actionLabel="View approvals"
              onAction={onNavigateToApprovals}
            >
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <MetricTile darkMode={darkMode} label="Pending" value={stats.pendingApprovals || 0} note="Approval" tone={(stats.pendingApprovals || 0) > 0 ? "warning" : "neutral"} />
                  <MetricTile darkMode={darkMode} label="Pending spend" value={currentVessel?.metrics?.openExposure || formatMoney(stats.totalExpenses || 0, currency)} note="Open spend" />
                  <MetricTile darkMode={darkMode} label="Quotes" value={approvalItems.filter((item) => item.type === "quote").length} note="Live quote items" />
                  <MetricTile darkMode={darkMode} label="Crew spend" value={formatMoney(stats.crewTotal || 0, currency)} note="Crew expenses" />
                </div>
                {approvalItems.length ? (
                  <CompactItemCard
                    htmlId={`approval-summary-item-${approvalItems[0].id}`}
                    darkMode={darkMode}
                    item={approvalItems[0]}
                    selected={selectedItem?.id === approvalItems[0].id}
                    onClick={() => openInspector(approvalItems[0])}
                  />
                ) : null}
              </div>
            </IntelligencePanel>
          </div>
        </div>
      </div>

      <DailyReportModal
        open={dailyReportOpen}
        darkMode={darkMode}
        report={dailyReportData}
        onClose={() => setDailyReportOpen(false)}
      />

      <DetailDrawer
        darkMode={darkMode}
        open={isInspectorOpen}
        title={selectedItem?.title}
        subtitle={selectedItem?.subtitle}
        meta={buildDrawerMeta(selectedItem || {})}
        onClose={closeInspector}
      >
        <DetailPanelBody
          darkMode={darkMode}
          item={selectedItem}
          canEdit={canEdit}
          onApprovalAction={onApprovalAction}
          onNavigateToTasks={onNavigateToTasks}
          onNavigateToMaintenance={onNavigateToMaintenance}
          onNavigateToCertificates={onNavigateToCertificates}
          onNavigateToApprovals={onNavigateToApprovals}
          onNavigateToRoute={onNavigateToRoute}
          onNavigateToAlerts={onNavigateToAlerts}
        />
      </DetailDrawer>
    </>
  );
}

export function DashboardCommandSearch({
  darkMode = false,
  currentVesselName = "Vessel",
  searchResults = [],
  onJump,
}) {
  return (
    <CommandJumpBar
      compact
      darkMode={darkMode}
      vesselName={currentVesselName}
      results={searchResults}
      onJump={onJump}
    />
  );
}

