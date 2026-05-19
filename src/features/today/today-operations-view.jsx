import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { AlertCircle, Compass, Receipt, TriangleAlert, Users, Wifi, WifiOff } from "../../components/icons.jsx";
import {
  formatHistoryTime,
  formatMoney,
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
import { SmartLabel } from "../../components/smart_label.jsx";
import { getModuleTheme, moduleThemeKeyForResult } from "../../components/module_themes.js";

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

function CommandSearchMark({ className = "" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="command-search-mark-stroke" x1="6" y1="5" x2="27" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.98" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.62" />
        </linearGradient>
      </defs>
      <path
        d="M13.8 5.7 21 12.9l-7.2 7.2-7.2-7.2 7.2-7.2Z"
        fill="none"
        stroke="url(#command-search-mark-stroke)"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M13.8 5.7v14.4M6.6 12.9H21M10 9.1l7.6 7.6"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.42"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle
        cx="15.2"
        cy="14.3"
        r="6.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M20.1 19.2 26.1 25.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M10.9 11.2c1.1-1.35 2.75-2.05 4.5-1.88"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function CommandJumpBar({
  darkMode = false,
  vesselName = "Vessel",
  results = [],
  onJump,
  compact = false,
}) {
  const theme = themeClasses(darkMode);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredResults = useMemo(() => {
    if (!normalizedQuery) return [];
    const safeResults = Array.isArray(results) ? results : [];
    return safeResults
      .filter((result) => result?.searchText?.includes(normalizedQuery))
      .slice(0, 9);
  }, [normalizedQuery, results]);

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleSlashFocus = (event) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      const tagName = String(target?.tagName || "").toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) return;
      if (!inputRef.current || inputRef.current.offsetParent === null) return;
      event.preventDefault();
      inputRef.current?.focus();
      setOpen(Boolean(query.trim()));
    };

    window.addEventListener("keydown", handleSlashFocus);
    return () => window.removeEventListener("keydown", handleSlashFocus);
  }, [query]);

  function chooseResult(result) {
    if (!result?.targetId && !result?.item) return;
    onJump?.(result);
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (!filteredResults.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, filteredResults.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      chooseResult(filteredResults[activeIndex] || filteredResults[0]);
    }
  }

  if (compact) {
    return (
      <div className="search-command-card relative z-[9999] w-full min-w-0 md:max-w-[680px]">
        <div className={`group flex min-h-[52px] items-center gap-2.5 rounded-2xl border px-3 py-2 backdrop-blur-xl transition-all duration-200 md:min-h-[60px] md:gap-3 md:rounded-3xl md:px-5 ${darkMode ? "border-cyan-300/22 bg-slate-950/78 text-slate-100 shadow-[0_18px_52px_rgba(0,0,0,0.20)] hover:border-cyan-300/40 focus-within:border-cyan-300/60 focus-within:shadow-[0_0_0_4px_rgba(34,211,238,0.12),0_18px_52px_rgba(0,0,0,0.28)]" : "border-blue-200/80 bg-white/88 text-slate-900 shadow-[0_10px_40px_rgba(15,23,42,0.08)] hover:border-blue-300 focus-within:border-blue-400 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12),0_16px_48px_rgba(15,23,42,0.10)]"}`}>
          <button
            type="button"
            onClick={() => {
              inputRef.current?.focus();
              setOpen(Boolean(query.trim()));
            }}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-[0_6px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-200 hover:scale-[1.03] md:h-12 md:w-12 ${
              darkMode
                ? "border-cyan-300/20 bg-slate-900/70 text-cyan-100 hover:border-cyan-300/50 hover:shadow-[0_10px_30px_rgba(34,211,238,0.18)] focus:outline-none focus:ring-2 focus:ring-cyan-300/35"
                : "border-blue-200/70 bg-white/70 text-blue-700 hover:border-blue-400 hover:shadow-[0_10px_30px_rgba(59,130,246,0.16)] focus:outline-none focus:ring-2 focus:ring-blue-400/35"
            }`}
            aria-label="Focus command search"
          >
            <CommandSearchMark className="h-6 w-6 drop-shadow-[0_0_10px_rgba(59,130,246,0.22)] md:h-7 md:w-7" />
          </button>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(Boolean(query.trim()))}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, crew, approvals, maintenance..."
            className={`h-11 min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none placeholder:text-slate-500 md:text-[15px] ${darkMode ? "placeholder:text-slate-400" : ""}`}
            aria-label="Search tasks, crew, approvals, documents"
          />
          <div className={`hidden shrink-0 items-center gap-2 text-xs font-semibold lg:flex ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            <span>Jump anywhere</span>
            <span className={`rounded-lg border px-2 py-1 ${darkMode ? "border-white/10 bg-white/5 text-slate-300" : "border-slate-200 bg-white/70 text-slate-600"}`}>Press /</span>
          </div>
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              className={`rounded-xl px-2 py-1 text-xs font-semibold ${darkMode ? "text-slate-300 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"}`}
            >
              Esc
            </button>
          ) : null}
        </div>

        {open && normalizedQuery ? (
          <div className={`absolute left-0 right-0 top-full z-[10000] mt-3 max-h-[min(440px,70vh)] overflow-y-auto rounded-3xl border p-2.5 shadow-2xl backdrop-blur-xl ${darkMode ? "border-white/10 bg-slate-950" : "border-slate-200 bg-white"}`}>
            {filteredResults.length ? (
              <div className="grid gap-2">
                {filteredResults.map((result, index) => (
                  (() => {
                    const moduleTheme = getModuleTheme(moduleThemeKeyForResult(result));
                    return (
                  <button
                    key={result.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseResult(result)}
                    className={`flex min-w-0 items-start justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      index === activeIndex
                        ? darkMode
                          ? "border-cyan-300/45 bg-cyan-300/10 shadow-[0_14px_34px_-28px_rgba(34,211,238,0.45)]"
                          : "border-blue-300 bg-blue-50 shadow-[0_14px_34px_-28px_rgba(59,130,246,0.35)]"
                        : darkMode
                          ? "border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.04]"
                          : "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                      <div className="min-w-0">
                        <div className={`truncate text-[15px] font-semibold ${theme.textPrimary}`}>{result.title}</div>
                        <div className={`mt-0.5 truncate text-xs ${theme.textSecondary}`}>{result.context}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${moduleTheme.chip}`}>
                          {result.type}
                        </span>
                        <span className={`hidden text-xs font-semibold md:inline ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Enter</span>
                      </div>
                  </button>
                    );
                  })()
                ))}
              </div>
            ) : (
              <div className={`rounded-2xl border border-dashed px-4 py-5 text-center text-sm ${darkMode ? "border-white/10 text-slate-300" : "border-slate-200 text-slate-600"}`}>
                No matching command found.
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div id="dashboard-section" className={`app-panel app-panel-soft search-command-card relative z-[9999] w-full min-w-0 rounded-[24px] border p-3.5 md:p-4 ${darkMode ? "app-dark-panel border-[var(--vessel-border-dark)]" : "border-[rgba(15,80,70,0.10)] bg-white/70"}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="app-kicker">Command Search</div>
          <div className={`mt-1 text-sm leading-5 ${theme.textSecondary}`}>
            Jump across {vesselName} tasks, crew, approvals, route, certificates, and documents.
          </div>
        </div>
        <div className="relative z-[9999] min-w-0 flex-1 lg:max-w-[620px]">
          <div className={`flex min-h-12 items-center gap-3 rounded-2xl border px-3.5 ${darkMode ? "border-[var(--vessel-border-dark)] bg-slate-950/45 text-slate-100 focus-within:border-[var(--vessel-primary-dark)]" : "border-slate-200/80 bg-white/82 text-slate-900 focus-within:border-blue-400"} shadow-sm transition-all duration-200 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]`}>
            <button
              type="button"
              onClick={() => {
                inputRef.current?.focus();
                setOpen(Boolean(query.trim()));
              }}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-[0_6px_20px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-200 hover:scale-[1.03] ${
                darkMode
                  ? "border-cyan-300/20 bg-slate-900/70 text-cyan-100 hover:border-cyan-300/50 hover:shadow-[0_10px_30px_rgba(34,211,238,0.16)] focus:outline-none focus:ring-2 focus:ring-cyan-300/35"
                  : "border-blue-200/70 bg-white/80 text-blue-700 hover:border-blue-400 hover:shadow-[0_10px_30px_rgba(59,130,246,0.14)] focus:outline-none focus:ring-2 focus:ring-blue-400/35"
              }`}
              aria-label="Focus command search"
            >
              <CommandSearchMark className="h-5 w-5" />
            </button>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(Boolean(query.trim()))}
              onKeyDown={handleKeyDown}
              placeholder="Search tasks, crew, approvals, documents..."
              className={`h-11 min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 ${darkMode ? "placeholder:text-slate-500" : ""}`}
              aria-label="Search tasks, crew, approvals, documents"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                }}
                className={`rounded-xl px-2 py-1 text-xs font-semibold ${darkMode ? "text-slate-300 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"}`}
              >
                Esc
              </button>
            ) : null}
          </div>

          {open && normalizedQuery ? (
            <div className={`absolute left-0 right-0 top-full z-[10000] mt-3 max-h-[min(420px,70vh)] overflow-y-auto rounded-3xl border p-2 shadow-2xl backdrop-blur-xl ${darkMode ? "border-white/10 bg-slate-950" : "border-slate-200 bg-white"}`}>
              {filteredResults.length ? (
                <div className="grid gap-1.5">
                  {filteredResults.map((result, index) => (
                    (() => {
                      const moduleTheme = getModuleTheme(moduleThemeKeyForResult(result));
                      return (
                    <button
                      key={result.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseResult(result)}
                      className={`flex min-w-0 items-start justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 ${
                        index === activeIndex
                          ? darkMode
                            ? "border-[var(--vessel-primary-dark)] bg-[var(--vessel-primary-soft-dark)]"
                            : "border-blue-300 bg-blue-50"
                          : darkMode
                            ? "border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.04]"
                            : "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className={`truncate text-sm font-semibold ${theme.textPrimary}`}>{result.title}</div>
                        <div className={`mt-0.5 truncate text-xs ${theme.textSecondary}`}>{result.context}</div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${moduleTheme.chip}`}>
                        {result.type}
                      </span>
                    </button>
                      );
                    })()
                  ))}
                </div>
              ) : (
                <div className={`rounded-2xl border border-dashed px-4 py-5 text-center text-sm ${darkMode ? "border-white/10 text-slate-300" : "border-slate-200 text-slate-600"}`}>
                  No matching command found.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
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
        ? "bg-[#3f241f] text-[#ffd7cf]"
        : "bg-[#fff1ed] text-[#9b2c20]"
      : tone === "warning"
        ? warningBadgeClass(darkMode)
        : tone === "success"
          ? successBadgeClass(darkMode)
          : darkMode
            ? "border border-white/10 bg-white/5 text-slate-300"
            : "border border-slate-200/70 bg-white/80 text-slate-600";

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
            className={`min-h-11 w-full rounded-2xl px-3 py-2 text-sm font-medium sm:w-auto ${darkMode ? "app-dark-action" : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.44)] text-[#43554d] hover:bg-[rgba(255,255,255,0.62)]"}`}
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
          <Badge className={normalizeTone(item) === "critical" ? (darkMode ? "bg-[#3f241f] text-[#ffd7cf]" : "bg-[#fff1ed] text-[#9b2c20]") : warningBadgeClass(darkMode)}>
            {item.priority}
          </Badge>
        ) : null}
        {item.status ? (
          <Badge className={darkMode ? "border border-white/10 bg-white/5 text-slate-300" : "border border-slate-200/70 bg-white/80 text-slate-600"}>
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
        <Button type="button" onClick={primaryAction.onClick} className="button-vessel-primary min-h-11 rounded-2xl px-4 py-3 text-white">
          {primaryAction.label}
        </Button>
        <Button type="button" variant="outline" className={`min-h-11 rounded-2xl px-4 py-3 ${darkMode ? "app-dark-action" : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.44)] text-[#43554d] hover:bg-[rgba(255,255,255,0.62)]"}`}>
          Request update
        </Button>
        <Button type="button" variant="outline" className={`min-h-11 rounded-2xl px-4 py-3 ${darkMode ? "app-dark-action" : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.44)] text-[#43554d] hover:bg-[rgba(255,255,255,0.62)]"}`}>
          Add comment
        </Button>
        <Button
          type="button"
          onClick={item.type === "approval" || item.type === "quote" ? () => onApprovalAction?.(item.raw || item, "approved") : undefined}
          className={`min-h-11 rounded-2xl px-4 py-3 font-semibold ${item.type === "approval" || item.type === "quote" ? "border border-amber-300 bg-amber-100 text-amber-950 shadow-[0_14px_30px_-24px_rgba(180,83,9,0.55)] hover:bg-amber-200 dark:border-amber-300/25 dark:bg-amber-300/14 dark:text-amber-100 dark:hover:bg-amber-300/20" : darkMode ? "border border-white/10 bg-white/5 text-slate-300" : "border border-slate-200/70 bg-white/70 text-slate-500"} disabled:cursor-not-allowed disabled:opacity-60`}
          disabled={!canEdit && (item.type === "approval" || item.type === "quote")}
        >
          {item.type === "approval" || item.type === "quote" ? "Approve" : "Mark reviewed"}
        </Button>
      </div>
    </div>
  );
}

export function TodayOperationsView({
  darkMode = false,
  canEdit = true,
  todayOperations,
  currency,
  currentRole = "captain",
  currentRoleLabel = "Captain",
  currentVesselName = "Contessa",
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
  const [commandClock, setCommandClock] = useState(null);
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
    setCommandClock(new Date());
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
    return sortByPriority([
      ...alertItems,
      ...taskItems,
      ...maintenanceItems,
      ...approvalItems,
      ...certificateItems,
    ]).slice(0, 4);
  }, [alertItems, taskItems, maintenanceItems, approvalItems, certificateItems]);
  const priorityItemIds = useMemo(() => new Set(priorityItems.map((item) => item.id)), [priorityItems]);

  const activeFleetVessel = useMemo(
    () => (Array.isArray(fleetVessels) ? fleetVessels.find((vessel) => vessel?.id === activeVesselId) : null),
    [fleetVessels, activeVesselId]
  );

  const fleetEntries = useMemo(() => {
    return [...fleetVessels]
      .filter(Boolean)
      .sort((left, right) => {
        if (left.id === activeVesselId) return -1;
        if (right.id === activeVesselId) return 1;
        return String(left.name || "").localeCompare(String(right.name || ""));
      });
  }, [fleetVessels, activeVesselId]);

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

  const commandHour = commandClock?.getHours?.() ?? 15;
  const greeting = commandHour < 12 ? "Good morning" : commandHour < 18 ? "Good afternoon" : "Good evening";
  const urgentBriefCount = priorityItems.filter((item) => item.tone === "critical").length || stats.overdueTasks || 0;
  const crewBriefCount = crewReadinessNote.length || stats.certificateDue || 0;
  const nextMilestone = routeReviewItems[0]?.title || maintenanceItems[0]?.title || "Service plan standing by";

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
      makeSection({ id: "search-dashboard", title: "Dashboard", context: "Main command overview", targetId: "dashboard-section" }),
      makeSection({ id: "search-mission-cards", title: "Mission Cards", context: "Urgent work, approvals, and risk items", targetId: "mission-cards-section" }),
      makeSection({ id: "search-tasks", title: "Tasks", context: "Task board and maintenance queue", targetId: "tasks-section", moduleAction: onNavigateToTasks }),
      makeSection({ id: "search-maintenance", title: "Maintenance", context: "Due service and upkeep plan", targetId: "maintenance-section", moduleAction: onNavigateToMaintenance }),
      makeSection({ id: "search-approvals", title: "Approvals", context: "Quotes, expenses, and decisions", targetId: "approvals-section", moduleAction: onNavigateToApprovals }),
      makeSection({ id: "search-crew", title: "Crew", context: "Crew roster and readiness", targetId: "crew-section", moduleAction: onNavigateToCrew || onNavigateToCertificates }),
      makeSection({ id: "search-certificates", title: "Certificates", context: "Crew certificates and expiry reviews", targetId: "certificates-section", moduleAction: onNavigateToCertificates }),
      makeSection({ id: "search-documents", title: "Documents", context: "Vessel document vault", targetId: "docs-section", moduleAction: onNavigateToDocuments }),
      makeSection({ id: "search-route", title: "Route Planning", context: "Waypoints, chart review, ETA, and fuel", targetId: "route-section", moduleAction: onNavigateToRoute }),
      makeSection({ id: "search-alerts", title: "Alerts", context: "Operational warnings and notifications", targetId: "alerts-section", moduleAction: onNavigateToAlerts }),
      makeSection({ id: "search-fleet", title: "Fleet Switcher", context: "Open another vessel workspace", targetId: "fleet-switcher-section", moduleAction: onOpenFleet }),
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
      targetId: "crew-section",
      moduleAction: onNavigateToCrew || onNavigateToCertificates,
      searchText: makeSearchText([profile.id, profile.fullName, profile.rank, profile.department, profile.notes, currentVessel?.name, "crew readiness certificates"]),
    }));

    const documentResults = (Array.isArray(activeFleetVessel?.documents) ? activeFleetVessel.documents : []).map((document) => ({
      id: `search-document-${document.id || document.name || document.title}`,
      type: "Document",
      title: document.name || document.title || "Vessel document",
      context: [currentVessel?.name || currentVesselName, document.category || document.type || "Document vault", document.status].filter(Boolean).join(" · "),
      targetId: "docs-section",
      moduleAction: onNavigateToDocuments,
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

  function highlightTarget(targetId) {
    if (!targetId || typeof window === "undefined" || typeof document === "undefined") return;
    const element = document.getElementById(targetId);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("search-jump-highlight");
    window.setTimeout(() => {
      element.classList.remove("search-jump-highlight");
    }, 1400);
  }

  function jumpToResult(result) {
    if (!result) return;

    if (result.sectionKey) {
      setExpandedSections((prev) => ({ ...prev, [result.sectionKey]: true }));
    }

    if (typeof result.moduleAction === "function") {
      result.moduleAction();
      if (typeof window !== "undefined") {
        window.setTimeout(() => highlightTarget(result.targetId), 260);
      }
      return;
    }

    if (typeof window !== "undefined") {
      window.setTimeout(() => highlightTarget(result.targetId), result.sectionKey ? 150 : 0);
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
        setExpandedSections((prev) => ({ ...prev, [sectionKey]: true }));
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
      <div className="grid gap-4 md:gap-5">
        <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
          <div className="grid gap-4 xl:col-span-8">
            <Card id="dashboard-section" className={`app-panel app-hero-surface min-w-0 overflow-visible rounded-[34px] border ${darkMode ? "border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(198,163,91,0.14),transparent_25%),linear-gradient(135deg,rgba(11,24,40,0.98),rgba(6,16,29,0.96))] text-slate-50 shadow-[0_30px_95px_rgba(0,0,0,0.46)]" : "border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.11),transparent_30%),radial-gradient(circle_at_top_right,rgba(198,163,91,0.10),transparent_24%),rgba(255,255,255,0.92)] text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.08)]"}`}>
              <CardContent className="p-5 md:p-7">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.7fr)] xl:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="app-kicker premium-label-accent">Today Command Brief</div>
                      <Badge className={isOffline ? warningBadgeClass(darkMode) : successBadgeClass(darkMode)}>{isOffline ? "Offline" : "Live command"}</Badge>
                    </div>
                    <h2 className={`mt-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl ${theme.textPrimary}`}>
                      {greeting}, {currentRoleLabel}
                    </h2>
                    <p className={`mt-3 max-w-[64ch] text-base font-semibold leading-7 ${theme.textPrimary}`}>
                      Today on {currentVessel?.name || currentVesselName}
                    </p>
                    <p className={`mt-2 max-w-[68ch] text-sm leading-6 ${theme.textSecondary}`}>
                      {currentVessel?.status || "Operational"} command state. {urgentBriefCount} urgent, {stats.pendingApprovals || approvalItems.length} approvals waiting, and {crewBriefCount} crew readiness notes before the next handoff.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Button type="button" onClick={onNavigateToTasks} className="button-vessel-primary min-h-11 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white">
                        Review priorities
                      </Button>
                      <Button type="button" variant="outline" onClick={onNavigateToApprovals} className={`min-h-11 rounded-2xl px-5 py-2.5 text-sm font-semibold ${darkMode ? "border-amber-300/35 bg-amber-300/12 text-amber-100 hover:bg-amber-300/20" : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"}`}>
                        View approvals
                      </Button>
                      <Button type="button" variant="outline" onClick={onNavigateToRoute} className={`min-h-11 rounded-2xl px-5 py-2.5 text-sm font-semibold ${darkMode ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/18" : "border-blue-200 bg-blue-50/80 text-blue-800 hover:bg-blue-100"}`}>
                        Open route
                      </Button>
                    </div>
                  </div>

                  <div className={`min-w-0 rounded-[28px] border p-4 ${darkMode ? "border-white/10 bg-white/[0.045]" : "border-slate-200/70 bg-white/76"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-cyan-100">Operational Snapshot</p>
                        <p className={`mt-1 text-sm leading-6 ${theme.textSecondary}`}>Compact vessel context without repeating controls.</p>
                      </div>
                      <Badge className={notificationsReady ? successBadgeClass(darkMode) : notificationsUnsupported ? warningBadgeClass(darkMode) : "border border-slate-200 bg-white/80 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"}>
                        Alerts {notificationsReady ? "ready" : "available"}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {[
                        { label: "Vessel", value: currentVessel?.status || "Operational", tone: "normal" },
                        { label: "Route", value: stats.routeReviewCount ? "Review" : "Clear", tone: stats.routeReviewCount ? "gold" : "normal" },
                        { label: "Approval", value: `${stats.pendingApprovals || approvalItems.length}`, tone: "gold" },
                        { label: "Crew", value: crewBriefCount ? `${crewBriefCount} notes` : "Stable", tone: crewBriefCount ? "gold" : "normal" },
                        { label: "Weather", value: "Calm watch", tone: "normal" },
                        { label: "Spend", value: currentVessel?.metrics?.openExposure || formatMoney(stats.totalExpenses || 0, currency), tone: "gold" },
                      ].map((item) => (
                        <div key={item.label} className={`min-w-0 rounded-2xl border px-3 py-3 ${darkMode ? item.tone === "gold" ? "border-amber-300/25 bg-amber-300/10" : "border-white/10 bg-[#0f2033]/70" : item.tone === "gold" ? "border-amber-200 bg-amber-50/70" : "border-slate-200/80 bg-white/78"}`}>
                          <p className={`truncate text-[10px] font-bold uppercase tracking-[0.12em] ${item.tone === "gold" ? "text-amber-700 dark:text-amber-200" : "text-slate-600 dark:text-slate-300"}`}>{item.label}</p>
                          <p className={`mt-1 truncate text-sm font-semibold ${theme.textPrimary}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {statusTiles.slice(0, 4).map((tile) => (
                    <MetricTile
                      key={tile.label}
                      darkMode={darkMode}
                      label={tile.label}
                      value={tile.value}
                      note={tile.note}
                      tone={tile.tone}
                      active={tile.tone === "success"}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card id="mission-cards-section" className={`app-panel app-panel-soft min-w-0 overflow-hidden rounded-[24px] ${theme.card}`}>
              <CardContent className="p-4 md:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="app-kicker">Mission Cards</div>
                    <div className={`mt-2 text-lg font-semibold ${theme.textPrimary}`}>Urgent work, approvals, and risk items are surfaced first.</div>
                  </div>
                  <Button
                    type="button"
                    onClick={onNavigateToTasks}
                    className="button-vessel-primary min-h-11 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white sm:w-auto"
                  >
                    View details
                  </Button>
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
              id="tasks-dashboard-section"
              darkMode={darkMode}
              title="Tasks"
              subtitle="Compact queue of work orders, overdue actions, and due-today upkeep."
              count={taskItems.length + maintenanceItems.length}
              tone={taskItems.length || maintenanceItems.length ? "warning" : "neutral"}
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
              id="approvals-dashboard-section"
              darkMode={darkMode}
              title="Approval"
              subtitle="Quotes, expenses, and service decisions stay folded until selected."
              count={approvalItems.length}
              tone={approvalItems.length ? "warning" : "neutral"}
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
              id="crew-dashboard-section"
              darkMode={darkMode}
              title="Crew"
              subtitle="Crew readiness stays collapsed until documentation or review is needed."
              count={certificateItems.length}
              tone={certificateItems.length ? "warning" : "neutral"}
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
              id="documents-dashboard-section"
              darkMode={darkMode}
              title="Docs"
              subtitle="Document controls stay collapsed until someone needs the vault."
              count={stats.documentCount || 0}
              tone="neutral"
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
              id="route-dashboard-section"
              darkMode={darkMode}
              title="Route"
              subtitle="Navigation review stays concise until the bridge team needs detail."
              count={stats.routeReviewCount || routeReviewItems.length}
              tone={stats.routeReviewCount || routeAlerts.length ? "warning" : "neutral"}
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
              id="activity-dashboard-section"
              darkMode={darkMode}
              title="Activity"
              subtitle="A compact running log instead of a full-width empty history panel."
              count={activityItems.length}
              tone="neutral"
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
              title="Recent Activity"
              subtitle="Latest vessel movement without opening a full history board."
            >
              <div className="grid gap-3">
                {activityItems.length ? (
                  activityItems.slice(0, 4).map((item) => (
                    <CompactItemCard
                      htmlId={`right-activity-item-${item.id}`}
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
                    title="No recent changes"
                    message="New vessel actions and notes will appear here as the crew updates the workspace."
                  />
                )}
              </div>
            </IntelligencePanel>

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
