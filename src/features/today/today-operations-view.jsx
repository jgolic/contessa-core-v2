import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import {
  calculateConfidenceScore,
  formatAppDate,
  formatHistoryTime,
  formatMoney,
  formatTaskStatusLabel,
  neutralBadgeClass,
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
import { FleetOperationsOverview } from "../../components/dashboard/fleet-operations-overview.jsx";
import GlobalSearch from "../../components/GlobalSearch.jsx";
import ChartCanvas from "../../harbourline/ChartCanvas.jsx";
import { useHarbourlineMotion } from "../../harbourline/useHarbourlineMotion.js";
import { useAutoFitSingleLine } from "../../hooks/useAutoFitSingleLine.js";
import { ConfirmActionDialog } from "../../contessa_app_components.jsx";

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

function formatOperationalDate(value, fallback = "Not set") {
  if (!value) return fallback;
  return /^\d{4}-\d{2}-\d{2}/.test(String(value)) ? formatAppDate(value) : value;
}

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
        { label: "Due", value: formatOperationalDate(item.dueDate) },
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
        { label: "Due", value: formatOperationalDate(item.dueDate, "Today") },
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
        { label: "Expiry", value: formatOperationalDate(item.dueDate, "Unknown") },
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
        { label: "Due", value: formatOperationalDate(item.dueDate, "Immediate review") },
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
      { label: "Due", value: formatOperationalDate(item.dueDate) },
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
    description: "Route, weather, bridge duty, fuel, and safety items are prioritized.",
    focusTerms: ["route", "weather", "passage", "fuel", "safety", "navigation", "bridge", "alert"],
  },
  standby: {
    label: "Standby Mode",
    description: "Routine readiness is active. Tasks, documents, crew, and approvals remain monitored.",
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
function IntelligencePanel({
  darkMode = false,
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
}) {
  return (
    <section data-mb-reveal className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[10.5px] font-bold uppercase tracking-[0.26em] text-[var(--mb-gold)]">{title}</h3>
        {onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--mb-soft)] transition-colors hover:text-[var(--mb-gold-bright)]"
          >
            {actionLabel}
            <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3"><path d="M3 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        ) : null}
      </div>
      <div className="harbourline-rule mt-3" />
      {subtitle ? <p className="mt-3 text-[13px] leading-6 text-[var(--mb-muted)]">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ConfidenceRing({ score = 0, mood = "calm" }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const stroke = mood === "critical" ? "var(--mb-critical)" : mood === "pressure" ? "var(--mb-gold)" : "var(--mb-safe)";

  return (
    <div className="relative h-[88px] w-[88px] shrink-0" title="Vessel confidence, calculated live from open work, approvals, and compliance">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="var(--mb-line)" strokeWidth="2" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.max(0, Math.min(100, score)) / 100)}
          style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none tracking-tight text-[var(--mb-ink)]" data-mb-count={score} data-mb-suffix="%">
          {score}%
        </span>
        <span className="mt-1 text-[7.5px] font-bold uppercase tracking-[0.2em] text-[var(--mb-muted)]">Confidence</span>
      </div>
    </div>
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
  const mode = vesselState?.mode || "standby";
  const mood = vesselState?.mood || "calm";
  const config = getVesselStateConfig(mode);
  const isOwnerView = String(role || "").toLowerCase() === "owner";
  const pendingSpend = currentVessel?.metrics?.pendingSpend || formatMoney(stats.pendingApprovalSpend || 0, currency);
  const focusLine = isOwnerView
    ? `${pendingSpend} pending spend across ${stats.pendingApprovals || 0} decision${(stats.pendingApprovals || 0) === 1 ? "" : "s"}. Detail stays out of the way unless it is material.`
    : config.description;
  const moodText = mood === "critical" ? "text-[var(--mb-critical-text)]" : mood === "pressure" ? "text-[var(--mb-gold-bright)]" : "text-[var(--mb-safe-text)]";

  return (
    <section
      id="vessel-state-section"
      data-jump-target
      data-mb-reveal
      style={{ "--jump-radius": "18px" }}
      className="jump-highlight-target flex min-w-0 items-center justify-between gap-5 rounded-[18px] border border-[var(--mb-line)] bg-[var(--mb-panel)] px-5 py-4 backdrop-blur-xl md:px-6"
    >
      <div className="min-w-0">
        <div className={`text-[10px] font-bold uppercase tracking-[0.26em] ${moodText}`}>Vessel state</div>
        <h2 className="harbourline-heading mt-1.5 text-2xl text-[var(--mb-ink)] md:text-[1.7rem]">{config.label}</h2>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-[var(--mb-muted)]">{focusLine}</p>
      </div>
      <ConfidenceRing score={confidenceScore} mood={mood} />
    </section>
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
  onQuickAddTask,
  onApprovalAction,
  onNavigateToTasks,
  onNavigateToMaintenance,
  onNavigateToCrew,
  onNavigateToCertificates,
  onNavigateToApprovals,
  onNavigateToRoute,
  onNavigateToAlerts,
  onNavigateToDocuments,
  commandSearchResults = [],
  onCommandSearchJump,
}) {
  const theme = themeClasses(darkMode);
  const currentVessel = vesselOperations || null;
  const [selectedItem, setSelectedItem] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [dailyReportOpen, setDailyReportOpen] = useState(false);
  const [approvalDecisionRequest, setApprovalDecisionRequest] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    tasksMaintenance: false,
    expensesApprovals: false,
    certificatesCrew: false,
    documents: false,
    routePlanning: false,
    activity: false,
  });

  useHarbourlineMotion([]);

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

  const vesselStateConfig = getVesselStateConfig(resolvedVesselState?.mode);
  const isOwnerView = String(currentRole || "").toLowerCase() === "owner";
  const pendingSpendLabel = currentVessel?.metrics?.pendingSpend || formatMoney(stats.pendingApprovalSpend || 0, currency);
  const nextWorkItem = sortByPriority([...taskItems, ...maintenanceItems])[0] || null;
  const tasksTeaser = nextWorkItem ? `Next: ${nextWorkItem.title}` : "Work queue is clear today.";
  const approvalsTeaser = approvalItems[0]
    ? `Next: ${approvalItems[0].title}${approvalItems[0].amount ? ` · ${approvalItems[0].amount}` : ""}`
    : "No decisions waiting.";
  const crewTeaser = certificateItems[0]
    ? `Next: ${certificateItems[0].title} · ${certificateItems[0].subtitle || certificateItems[0].dueDate}`
    : "No certificate reviews pending.";
  const docsTeaser = (stats.documentCount || 0) > 0
    ? `${stats.documentCount} document${stats.documentCount === 1 ? "" : "s"} tracked in the vault.`
    : "No documents indexed yet.";
  const routeTeaser = routeReviewItems[0]?.title || "Route planning standing by.";

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
      makeSection({ id: "search-mission-cards", title: "Priority Queue", context: "Mission cards: urgent work, approvals, and risk items surfaced first", targetId: "mission-cards-section" }),
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
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
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

  function requestApprovalDecision(item, decision) {
    if (!item || !decision) return;
    setApprovalDecisionRequest({ item, decision });
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

  const heroName = String(currentVessel?.name || currentVesselName || "Vessel").replace(/^M\/Y\s+/i, "").toUpperCase();
  const heroNameRef = useAutoFitSingleLine(heroName);

  if (!currentVessel) {
    return (
      <div className="min-h-screen rounded-[28px] bg-slate-950 p-6 text-slate-100">
        <h1 className="text-xl font-semibold">Vessel workspace unavailable</h1>
        <p className="mt-2 text-sm text-slate-300">Please select a valid vessel.</p>
      </div>
    );
  }

  const heroStatement = resolvedVesselState?.primaryFocus || vesselStateConfig.description;
  const heroOnDeck = [
    stats.pendingApprovals ? `${stats.pendingApprovals} decision${stats.pendingApprovals === 1 ? "" : "s"} waiting` : "",
    stats.certificateDue ? `${stats.certificateDue} certificate${stats.certificateDue === 1 ? "" : "s"} due` : "",
    stats.routeReviewCount ? `${stats.routeReviewCount} route review${stats.routeReviewCount === 1 ? "" : "s"}` : "",
  ].filter(Boolean).join("  ·  ");
  const visibleQuickActions = (Array.isArray(quickActions) ? quickActions : []).slice(0, 3);
  const heroMetrics = [
    { label: "Open work", value: stats.totalObjectives || taskItems.length + maintenanceItems.length },
    { label: "Decisions", value: stats.pendingApprovals || approvalItems.length },
    { label: "Crew readiness", value: stats.certificateDue || certificateItems.length },
  ];

  return (
    <>
      <ChartCanvas enabled />
      <div className="harbourline-grain" aria-hidden="true" />
      <div id="dashboard-section" data-jump-target style={{ "--jump-radius": "28px" }} className="jump-highlight-target relative z-[5] rounded-[28px] scroll-mt-24 md:scroll-mt-28">

        {/* ---- Hero: a live bridge instrument, not a static landing page ---- */}
        <section className="neo-hero relative my-4 min-h-[calc(70svh-5rem)] overflow-visible rounded-[34px] px-5 py-7 sm:px-7 md:rounded-[46px] md:px-10 md:py-10 xl:px-14 xl:py-12">
          <div className="neo-hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="neo-hero-glow pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full" aria-hidden="true" />

          <div className="relative z-10 grid min-h-[calc(70svh-11rem)] items-center gap-10 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)] xl:gap-14">
            <div className="min-w-0">
              <div data-mb-hero className="flex flex-wrap items-center gap-3">
                <span className="neo-live-chip inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[9px] font-extrabold uppercase tracking-[0.24em]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--neo-mint)] shadow-[0_0_12px_var(--neo-mint)]" />
                  Live command
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.26em] text-[var(--mb-muted)]">Motor yacht / bridge OS</span>
              </div>

              <h1
                ref={heroNameRef}
                data-mb-hero
                className="neo-vessel-title vessel-display-title mt-6 whitespace-nowrap font-semibold leading-[0.78] tracking-[-0.035em]"
              >
                {heroName}
              </h1>

              <div data-mb-hero className="mt-7 grid max-w-3xl gap-6 border-l border-[var(--mb-line-strong)] pl-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:pl-7">
                <div>
                  <p className="max-w-2xl text-[15px] leading-7 text-[var(--mb-muted)] md:text-[17px] md:leading-8">{heroStatement}</p>
                  {heroOnDeck ? (
                    <p className="mt-3 text-[9.5px] font-bold uppercase tracking-[0.21em] text-[var(--mb-soft)]">On deck / {heroOnDeck}</p>
                  ) : null}
                </div>
                <div className="min-w-0 md:text-right">
                  <div className="text-[9px] font-bold uppercase tracking-[0.23em] text-[var(--mb-muted)]">Pending spend</div>
                  <div className="mt-1 font-sans text-[1.55rem] font-semibold tracking-[-0.04em] text-[var(--mb-gold-bright)]">{pendingSpendLabel}</div>
                </div>
              </div>

              <div data-mb-hero className="neo-search-shell mt-9 max-w-2xl">
                <GlobalSearch
                  results={commandSearchResults.length ? commandSearchResults : searchResults}
                  onJump={onCommandSearchJump || jumpToResult}
                />
              </div>
            </div>

            <aside data-mb-hero className="neo-command-card min-w-0 rounded-[28px] border p-5 backdrop-blur-2xl md:p-6">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <div className="text-[9px] font-extrabold uppercase tracking-[0.28em] text-[var(--neo-mint)]">Operational pulse</div>
                  <h2 className="mt-2 font-sans text-xl font-semibold tracking-[-0.04em] text-[var(--mb-ink)]">{vesselStateConfig.label}</h2>
                  <p className="mt-2 text-xs leading-5 text-[var(--mb-muted)]">{currentRoleLabel} view / intelligence updated from the active vessel workspace.</p>
                </div>
                <ConfidenceRing score={confidenceScore} mood={resolvedVesselState?.mood || "calm"} />
              </div>

              <div className="mt-6 grid grid-cols-3 border-y border-[var(--mb-line)]">
                {heroMetrics.map((metric) => (
                  <div key={metric.label} className="neo-pulse-metric min-w-0 px-2 py-4 first:pl-0 last:pr-0">
                    <div className="text-[1.45rem] font-semibold leading-none tracking-[-0.05em] text-[var(--mb-ink)]">{metric.value}</div>
                    <div className="mt-2 truncate text-[8px] font-extrabold uppercase tracking-[0.19em] text-[var(--mb-muted)]">{metric.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="text-[8.5px] font-extrabold uppercase tracking-[0.24em] text-[var(--mb-muted)]">Fast launch</div>
                <div className="mt-3 grid gap-2">
                  {visibleQuickActions.map((action, index) => (
                    <button
                      key={action.id || action.label}
                      type="button"
                      onClick={action.onClick}
                      className="neo-quick-action group flex min-h-12 items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left"
                    >
                      <span className="text-[10px] font-bold tabular-nums text-[var(--mb-muted)]">0{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--mb-ink)]">{action.label}</span>
                      <span className="shrink-0 text-[8.5px] font-bold uppercase tracking-[0.14em] text-[var(--neo-mint)]">{action.meta}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={() => setDailyReportOpen(true)} className="neo-brief-button mt-5 flex min-h-12 w-full items-center justify-between rounded-[16px] px-4 py-3 text-left">
                <span>
                  <span className="block text-[8px] font-bold uppercase tracking-[0.22em] opacity-70">Captain brief</span>
                  <span className="mt-1 block text-sm font-semibold">Open daily report</span>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-current/30" aria-hidden="true">↗</span>
              </button>
            </aside>
          </div>

          <button
            data-mb-hero
            type="button"
            onClick={() => {
              if (typeof document === "undefined") return;
              document.getElementById("vessel-state-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="neo-descend group relative z-10 mt-8 inline-flex w-fit items-center gap-3 text-[9px] font-bold uppercase tracking-[0.27em] text-[var(--mb-soft)] transition-colors hover:text-[var(--mb-gold-bright)] xl:absolute xl:bottom-8 xl:left-14 xl:mt-0"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mb-line-strong)] transition-colors group-hover:border-[var(--mb-gold-hover)]">
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 animate-bounce [animation-duration:2.2s]"><path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            Enter operations
          </button>
        </section>

        {fleetVessels.length ? (
          <FleetOperationsOverview
            vessels={fleetVessels}
            metricsByVessel={fleetMetricsByVessel}
            activeVesselId={activeVesselId}
            currentRole={currentRole}
            onSwitchVessel={onSwitchFleetVessel}
            onOpenFleet={onOpenFleet}
            onQuickAddTask={canEdit ? onQuickAddTask : null}
          />
        ) : null}

        <div className="grid gap-12 pb-16 xl:grid-cols-12 xl:items-start xl:gap-14">
          <div className="min-w-0 xl:col-span-8">
            <VesselStateBanner
              darkMode={darkMode}
              vesselState={resolvedVesselState}
              confidenceScore={confidenceScore}
              stats={stats}
              currentVessel={currentVessel}
              role={currentRole}
              currency={currency}
            />

            <section
              id="mission-cards-section"
              data-jump-target
              data-mb-reveal
              style={{ "--jump-radius": "18px" }}
              className="jump-highlight-target mt-12 min-w-0 scroll-mt-28 rounded-[18px]"
            >
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                <div className="min-w-0">
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.26em] text-[var(--mb-gold)]">Priority queue</div>
                  <h2 className="harbourline-heading mt-2 text-[1.75rem] leading-tight text-[var(--mb-ink)] md:text-[2rem]">
                    {isOwnerView ? "Material signals, surfaced first." : `${vesselStateConfig.label} priorities, surfaced first.`}
                  </h2>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDailyReportOpen(true)}
                    className="app-primary-action-button rounded-[14px]"
                  >
                    Daily report
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateToTasks}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--mb-soft)] transition-colors hover:text-[var(--mb-gold-bright)]"
                  >
                    All work
                    <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3"><path d="M3 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              </div>

              {priorityItems.length ? (
                <ol className="mt-7 border-b border-[var(--mb-line)]">
                  {priorityItems.map((item, index) => {
                    const dueMeta = item?.meta?.find((entry) => ["Due", "Expiry"].includes(entry?.label));
                    const metaLine = [compactTypeLabel(item.type), item.badge, item.assignedTo || item.requester, dueMeta?.value, item.amount]
                      .filter(Boolean)
                      .join("  ·  ");
                    const tickClass = item.tone === "critical" ? "bg-[var(--mb-critical)]" : item.tone === "warning" ? "bg-[var(--mb-gold-badge)]" : "bg-[var(--mb-tick-neutral)]";
                    return (
                      <li key={item.id}>
                        <button
                          id={`item-${item.id}`}
                          data-jump-target
                          style={{ "--jump-radius": "14px" }}
                          type="button"
                          onClick={() => openInspector(item)}
                          className="jump-highlight-target mb-ledger-row group relative flex w-full items-center gap-5 rounded-[14px] py-5 pl-3 pr-1 text-left md:gap-8 md:py-6"
                        >
                          <span className={`absolute left-0 top-1/2 h-[46%] w-[2px] -translate-y-1/2 rounded-r-full ${tickClass}`} />
                          <span className="mb-index-numeral shrink-0 text-[2.4rem] md:text-[3.2rem]">{String(index + 1).padStart(2, "0")}</span>
                          <span className="min-w-0 flex-1">
                            <span className="harbourline-heading block text-xl leading-snug text-[var(--mb-ink)] transition-colors duration-300 group-hover:text-[var(--mb-gold-bright)] md:text-[1.5rem]">
                              {item.title}
                            </span>
                            <span className="mt-1.5 block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--mb-muted)]">
                              {metaLine}
                            </span>
                          </span>
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--mb-line-strong)] text-[var(--mb-soft)] transition-all duration-300 group-hover:border-[var(--mb-gold-hover)] group-hover:text-[var(--mb-gold-bright)]" aria-hidden="true">
                            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5"><path d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="mt-7">
                  <DashboardEmptyState
                    darkMode={darkMode}
                    title="No urgent items tonight."
                    message="The vessel is stable right now. Approvals, crew documents, and route warnings will appear here only when they need attention."
                    actionLabel="View tasks"
                    onAction={onNavigateToTasks}
                  />
                </div>
              )}
            </section>

            <div className="mt-14">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.26em] text-[var(--mb-gold)]">Operations ledger</div>
            </div>

            <SectionAccordion
              id="tasks-section"
              darkMode={darkMode}
              title="Tasks"
              subtitle={tasksTeaser}
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
              subtitle={approvalsTeaser}
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
                    secondaryContent={<div className={`text-xs ${theme.textSecondary}`}>Pending spend: {currentVessel?.metrics?.pendingSpend || formatMoney(stats.pendingApprovalSpend || 0, currency)}</div>}
                  />
                )}
            </SectionAccordion>

            <SectionAccordion
              id="crew-section"
              darkMode={darkMode}
              title="Crew"
              subtitle={crewTeaser}
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
              subtitle={docsTeaser}
              count={stats.documentCount || 0}
              tone="neutral"
              module="docs"
              isOpen={expandedSections.documents}
              onToggle={() => toggleSection("documents")}
              actionLabel="Open documents"
              onAction={onNavigateToDocuments}
            >
              {(stats.documentCount || 0) > 0 ? (
                <DashboardEmptyState
                  darkMode={darkMode}
                  title={`${stats.documentCount} document${stats.documentCount === 1 ? "" : "s"} indexed for this vessel`}
                  message="Certificates, manuals, and operational files are tracked in the vault with controlled sharing and export."
                  actionLabel="Open documents"
                  onAction={onNavigateToDocuments}
                />
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
              subtitle={routeTeaser}
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

          </div>

          <aside className="grid min-w-0 content-start gap-11 xl:col-span-4 xl:border-l xl:border-[var(--mb-line)] xl:pl-10">
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
              title="Decisions Waiting"
              subtitle={`${stats.pendingApprovals || 0} approval${(stats.pendingApprovals || 0) === 1 ? "" : "s"} waiting · ${pendingSpendLabel} pending spend.`}
              actionLabel="View approvals"
              onAction={onNavigateToApprovals}
            >
              <div className="grid gap-3">
                {approvalItems.length ? (
                  <>
                    <CompactItemCard
                      htmlId={`approval-summary-item-${approvalItems[0].id}`}
                      darkMode={darkMode}
                      item={approvalItems[0]}
                      selected={selectedItem?.id === approvalItems[0].id}
                      onClick={() => openInspector(approvalItems[0])}
                      actionLabel="Review"
                    />
                    {canEdit ? (
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => requestApprovalDecision(approvalItems[0].raw || approvalItems[0], "approved")}
                          className="app-primary-action-button justify-center rounded-[14px] text-center"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => requestApprovalDecision(approvalItems[0].raw || approvalItems[0], "declined")}
                          className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-[var(--mb-line-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--mb-soft)] transition-colors hover:border-[rgba(217,119,107,0.6)] hover:text-[var(--mb-critical-text)]"
                        >
                          Decline
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <DashboardEmptyState
                    darkMode={darkMode}
                    title="No approvals waiting"
                    message="Quotes and spend requests surface here the moment they need a decision."
                    actionLabel="View approvals"
                    onAction={onNavigateToApprovals}
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
              title="Recent Activity"
              subtitle={activityItems.length ? "The latest changes across tasks, approvals, and crew." : "Updates appear here as the crew logs work."}
            >
              {activityItems.length ? (
                <ol id="activity-section" className="relative ml-1 grid gap-0 border-l border-[var(--mb-line)]">
                  {activityItems.slice(0, 5).map((item) => (
                    <li key={item.id} className="relative">
                      <span className="absolute -left-[4.5px] top-[1.35rem] h-2 w-2 rounded-full border border-[var(--mb-gold)] bg-[var(--mb-bg)]" aria-hidden="true" />
                      <button
                        id={`activity-item-${item.id}`}
                        data-jump-target
                        style={{ "--jump-radius": "12px" }}
                        type="button"
                        onClick={() => openInspector(item)}
                        className="jump-highlight-target group w-full min-w-0 rounded-[12px] py-3.5 pl-5 pr-2 text-left transition-colors duration-200 hover:bg-[var(--mb-gold-tint)]"
                      >
                        <div className="truncate text-sm font-semibold text-[var(--mb-ink)] transition-colors group-hover:text-[var(--mb-gold-bright)]">{item.title}</div>
                        <div className="mt-0.5 line-clamp-2 text-xs leading-5 text-[var(--mb-muted)]">{item.subtitle}</div>
                        <div suppressHydrationWarning className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.18em] text-[var(--mb-muted)]">{`${item.assignedTo} · ${item.dueDate}`}</div>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <DashboardEmptyState
                  darkMode={darkMode}
                  title="No recent activity"
                  message="Operational activity will appear here as the vessel team updates tasks, route work, approvals, and certificates."
                />
              )}
            </IntelligencePanel>
          </aside>
        </div>
      </div>

      <DailyReportModal
        open={dailyReportOpen}
        darkMode={darkMode}
        report={dailyReportData}
        onClose={() => setDailyReportOpen(false)}
      />

      <ConfirmActionDialog
        isOpen={Boolean(approvalDecisionRequest)}
        darkMode={darkMode}
        tone={approvalDecisionRequest?.decision === "approved" ? "success" : "danger"}
        title={approvalDecisionRequest?.decision === "approved" ? "Approve this request?" : "Decline this request?"}
        message={approvalDecisionRequest ? [
          approvalDecisionRequest.item?.title || approvalDecisionRequest.item?.supplier || "Operational request",
          approvalDecisionRequest.item?.supplier ? `Supplier: ${approvalDecisionRequest.item.supplier}` : "",
          approvalDecisionRequest.item?.amount !== null && approvalDecisionRequest.item?.amount !== undefined
            ? `Amount: ${formatMoney(approvalDecisionRequest.item.amount, approvalDecisionRequest.item.currency || currency)}`
            : "No monetary amount attached",
          "This decision is recorded in the vessel activity history.",
        ].filter(Boolean).join(" - ") : ""}
        confirmLabel={approvalDecisionRequest?.decision === "approved" ? "Confirm approval" : "Confirm decline"}
        onConfirm={() => {
          if (approvalDecisionRequest) {
            onApprovalAction?.(approvalDecisionRequest.item, approvalDecisionRequest.decision);
          }
          setApprovalDecisionRequest(null);
        }}
        onCancel={() => setApprovalDecisionRequest(null)}
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
          onApprovalAction={requestApprovalDecision}
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

