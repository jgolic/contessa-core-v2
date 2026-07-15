import { useEffect, useState } from "react";
import { useRef } from "react";
import { useMemo } from "react";
import AnchoredPopover from "./components/AnchoredPopover.jsx";
import { Card, CardContent } from "./components/ui/card.jsx";
import { Button } from "./components/ui/button.jsx";
import { Input } from "./components/ui/input.jsx";
import { Badge } from "./components/ui/badge.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select.jsx";
import { CheckCircle2, LayoutDashboard, Plus, Receipt, Settings, TriangleAlert, Users, Wallet } from "./components/icons.jsx";
import { useRevealHighlight } from "./hooks/useRevealHighlight.js";
import {
  APP_FOOTER_NOTICE,
  APP_LEGAL_COPY,
  APP_LEGAL_SHORT_COPY,
  CURRENCY_OPTIONS,
  MONEY_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  TASK_DEPARTMENT_OPTIONS,
  TASK_STATUS_OPTIONS,
  VESSEL_STATE_MODE_OPTIONS,
  clampMaintenanceDueDate,
  convertedMoney,
  dateStringFromNow,
  daysUntil,
  filePreviewCardClass,
  formatHistoryTime,
  formatMoney,
  formatTaskPriorityLabel,
  formatAppDate,
  formatTaskStatusLabel,
  filePreviewPlaceholderClass,
  getScheduledNextDue,
  infoBadgeClass,
  isPaidMoneyStatus,
  moneyStatusStyles,
  neutralBadgeClass,
  successBadgeClass,
  themeClasses,
  todayDateString,
  titleCase,
  warningBadgeClass,
} from "./contessa_app_data.mjs";
import { ConfirmActionDialog, QuoteRow, ShareAppButton } from "./contessa_app_components.jsx";
import { AlertInboxButton, BottomNavButton, SectionNavCard, ShellControlButton } from "./components/app_shell_primitives.jsx";
import { SmartLabel } from "./components/smart_label.jsx";
import { ModuleMasthead } from "./components/module_masthead.jsx";
import { TaskCreateDialog } from "./components/tasks/task-create-dialog.jsx";
import { DEMO_ROLE_OPTIONS } from "./contessa_access.mjs";
import { APP_BRAND_NAME, ContessaUiLogo } from "./components/branding.jsx";

const premiumShellClass = (darkMode = false) =>
  [
    "rounded-[28px] border p-5 backdrop-blur-xl",
    darkMode
      ? "border-white/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
      : "border-slate-200/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)]",
  ].join(" ");

const premiumInnerClass = (darkMode = false) =>
  [
    "rounded-2xl border",
    darkMode
      ? "border-white/10 bg-white/[0.04]"
      : "border-slate-200/80 bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]",
  ].join(" ");

const premiumLabelClass = "text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200";
const premiumValueClass = "text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50";
const primaryButtonClass = "app-primary-action-button inline-flex items-center justify-center";
const mutedButtonClass = "app-action-button inline-flex items-center justify-center";
const chipBase =
  "inline-flex min-h-9 items-center justify-center rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm transition-all duration-200";
const liveChipClass = (darkMode = false) =>
  darkMode
    ? `${chipBase} border-teal-300/40 bg-teal-300/15 text-teal-100`
    : `${chipBase} border-teal-300 bg-teal-50 text-teal-800`;
const blueChipClass = (darkMode = false) =>
  darkMode
    ? `${chipBase} border-cyan-300/40 bg-cyan-300/15 text-cyan-100`
    : `${chipBase} border-blue-300 bg-blue-50 text-blue-800`;
const goldChipClass = (darkMode = false) =>
  darkMode
    ? `${chipBase} border-amber-300/40 bg-amber-300/15 text-amber-100`
    : `${chipBase} border-amber-300 bg-amber-50 text-amber-800`;

const yachtTypeOptions = [
  "Motor Yacht",
  "Sailing Yacht",
  "Explorer Yacht",
  "Sport Yacht",
  "Classic Yacht",
  "Catamaran",
  "Trimaran",
  "Support Vessel",
  "Chase Boat",
  "Tender",
  "Commercial Yacht",
  "Private Yacht",
];

const flagOptions = [
  "Cayman Islands",
  "Jamaica",
  "Malta",
  "Marshall Islands",
  "Isle of Man",
  "United Kingdom",
  "United States",
  "Bahamas",
  "Bermuda",
  "Panama",
  "Netherlands",
  "France",
  "Italy",
  "Croatia",
  "Greece",
  "Spain",
  "Monaco",
  "Gibraltar",
  "Cook Islands",
  "British Virgin Islands",
];

const flagOptionAliases = {
  "Cayman Islands": "cayman cayman island ci",
  "United States": "usa us america",
  "United Kingdom": "uk britain british great britain",
};

const homePortsByFlag = {
  "Cayman Islands": ["George Town", "Cayman Brac", "West Bay"],
  Jamaica: ["Kingston", "Montego Bay", "Ocho Rios", "Port Antonio", "Oracabessa"],
  Malta: ["Valletta", "Sliema", "Birgu", "Marsamxett"],
  "Marshall Islands": ["Majuro", "Kwajalein"],
  "Isle of Man": ["Douglas"],
  "United Kingdom": ["London", "Southampton", "Portsmouth", "Plymouth", "Cowes"],
  "United States": ["Fort Lauderdale", "Miami", "Newport", "Palm Beach", "San Diego", "Seattle", "New York"],
  Bahamas: ["Nassau", "Freeport", "Marsh Harbour", "George Town"],
  Bermuda: ["Hamilton", "St. George's"],
  Panama: ["Panama City", "Colon", "Balboa"],
  Netherlands: ["Amsterdam", "Rotterdam", "Dordrecht"],
  France: ["Marseille", "Nice", "Cannes", "Antibes"],
  Italy: ["Genoa", "La Spezia", "Naples", "Sanremo", "Viareggio"],
  Croatia: ["Split", "Dubrovnik", "Rijeka", "Zadar", "Sibenik"],
  Greece: ["Piraeus", "Athens", "Rhodes", "Corfu"],
  Spain: ["Palma de Mallorca", "Barcelona", "Valencia", "Malaga"],
  Monaco: ["Monaco"],
  Gibraltar: ["Gibraltar"],
  "Cook Islands": ["Avarua"],
  "British Virgin Islands": ["Road Town"],
};

function normalizeFlag(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (["cayman", "cayman island", "cayman islands"].includes(normalized)) return "Cayman Islands";
  if (["usa", "us", "u.s.", "u.s.a.", "united states"].includes(normalized)) return "United States";
  if (["uk", "u.k.", "britain", "great britain", "united kingdom"].includes(normalized)) return "United Kingdom";
  return flagOptions.find((option) => option.toLowerCase() === normalized) || value;
}

function SearchableSelect({
  label,
  value,
  options = [],
  optionAliases = {},
  placeholder,
  onChange,
  disabled = false,
  required = false,
}) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const anchorRef = useRef(null);

  const filteredOptions = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return options;
    return options.filter((option) =>
      `${option} ${optionAliases[option] || ""}`.toLowerCase().includes(cleanQuery)
    );
  }, [optionAliases, options, query]);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  function selectOption(option) {
    onChange?.(option);
    setQuery(option);
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, Math.max(filteredOptions.length - 1, 0)));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option) selectOption(option);
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative min-w-0">
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </label>
      <input
        ref={anchorRef}
        type="text"
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => !disabled && setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
        className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-300 dark:focus:border-cyan-300 dark:focus:ring-cyan-300/20 dark:disabled:bg-slate-900 dark:disabled:text-slate-400"
      />
      <AnchoredPopover
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        align="start"
        matchAnchorWidth
        minWidth={240}
        maxWidth={520}
        maxHeight={300}
        panelClassName="rounded-2xl border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950"
        contentClassName="max-h-64 p-2"
        showArrow={false}
        ariaLabel={`${label} options`}
      >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={option}
                type="button"
                onClick={() => selectOption(option)}
                className={[
                  "w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
                  index === activeIndex
                    ? "bg-blue-50 text-blue-800 dark:bg-cyan-300/10 dark:text-cyan-100"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/10",
                ].join(" ")}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
              No matching options
            </div>
          )}
      </AnchoredPopover>
    </div>
  );
}

function NotificationSignalIcon({ className = "" }) {
  return (
    <svg
      className={["inline-flex", className].filter(Boolean).join(" ")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 5.25a6.75 6.75 0 0 0-6.75 6.75v2.75l-1.2 2.1h15.9l-1.2-2.1V12A6.75 6.75 0 0 0 12 5.25Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.6 19.05a2.55 2.55 0 0 0 4.8 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5.1 5.1 3.45 3.45M18.9 5.1l1.65-1.65M12 3.4V1.75" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  );
}

function NotificationTypeIcon({ type = "" }) {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("approval")) return <Wallet className="h-4 w-4" />;
  if (normalized.includes("certificate")) return <Users className="h-4 w-4" />;
  if (normalized.includes("maintenance")) return <TriangleAlert className="h-4 w-4" />;
  if (normalized.includes("task")) return <CheckCircle2 className="h-4 w-4" />;
  return <NotificationSignalIcon className="h-4 w-4" />;
}

function NotificationButton({ count = 0, darkMode = false, onClick, open = false }) {
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
  const displayCount = safeCount > 99 ? "99+" : String(safeCount);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      aria-expanded={open}
      aria-label={`Open notifications${safeCount ? `, ${safeCount} unread` : ""}`}
      className={`relative h-10 w-10 shrink-0 overflow-visible rounded-2xl p-0 shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition-all duration-200 md:h-12 md:w-12 md:rounded-[20px] ${
        darkMode
          ? "border-cyan-300/25 bg-slate-900/90 text-cyan-100 shadow-[0_14px_36px_rgba(0,0,0,0.38)] hover:border-cyan-300/50 hover:bg-cyan-300/10"
          : "border-slate-200 bg-white/90 text-slate-900 hover:border-blue-300 hover:bg-blue-50 hover:shadow-[0_14px_34px_rgba(59,130,246,0.16)]"
      }`}
    >
      {safeCount > 0 ? <span className="absolute inset-0 rounded-2xl border border-rose-400/40" /> : null}
      <NotificationSignalIcon className="relative h-4 w-4 md:h-5 md:w-5" />
      {safeCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_6px_18px_rgba(244,63,94,0.45)] dark:border-slate-950">
          {displayCount}
        </span>
      ) : null}
    </Button>
  );
}

function NotificationsPanel({
  open = false,
  anchorRef,
  darkMode = false,
  notifications = [],
  onClose,
  onSelect,
}) {
  const revealRef = useRevealHighlight(open, {
    radius: "28px",
    delay: 80,
  });

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const notificationItems = Array.isArray(notifications) ? notifications.filter(Boolean).slice(0, 20) : [];
  const typeLabel = (item = {}) => {
    if (item.type) return item.type;
    if (item.section === "expenses") return "Approval";
    if (item.section === "certificates") return "Certificate";
    if (item.section === "maintenance") return "Maintenance";
    if (item.section === "tasks") return "Task";
    return "Alert";
  };
  const priorityLabel = (item = {}) => titleCase(item.level || item.priority || "Notice");
  const priorityBadgeClass = (item = {}) => {
    const normalized = priorityLabel(item).toLowerCase();
    if (normalized.includes("critical") || normalized.includes("urgent")) {
      return darkMode
        ? "border border-rose-300/30 bg-rose-300/10 text-rose-100"
        : "border border-rose-200 bg-rose-50 text-rose-700";
    }
    if (normalized.includes("warning") || normalized.includes("review")) {
      return darkMode
        ? "border border-amber-300/30 bg-amber-300/10 text-amber-100"
        : "border border-amber-200 bg-amber-50 text-amber-800";
    }
    return darkMode
      ? "border border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
      : "border border-blue-200 bg-blue-50 text-blue-800";
  };
  const panelSurfaceClass = darkMode
    ? "notification-popover-dark border-white/10 bg-slate-950 text-slate-50 shadow-[0_32px_110px_rgba(0,0,0,0.75)]"
    : "notification-popover-light border-slate-200/90 bg-white text-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.26)]";
  const headerBorderClass = darkMode ? "border-white/10" : "border-slate-200";
  const headerTitleClass = darkMode ? "text-slate-50" : "text-slate-950";
  const headerSubtitleClass = darkMode ? "text-slate-300" : "text-slate-600";
  const countBadgeClass = darkMode
    ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
    : "border-rose-200 bg-rose-50 text-rose-700";
  const emptyStateClass = darkMode
    ? "border-white/10 bg-slate-800 text-slate-100"
    : "border-slate-200 bg-slate-50 text-slate-700";
  const rowClass = darkMode
    ? "border-transparent hover:border-cyan-300/30 hover:bg-cyan-300/10"
    : "border-transparent hover:border-blue-200 hover:bg-blue-50/80";
  const iconClass = darkMode
    ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
    : "border-blue-200 bg-blue-50 text-blue-700";
  const titleTextClass = darkMode ? "text-slate-50" : "text-slate-950";
  const contextTextClass = darkMode ? "text-slate-300" : "text-slate-600";

  return (
    <AnchoredPopover
      open={open}
      anchorRef={anchorRef}
      onClose={onClose}
      align="end"
      minWidth={320}
      maxWidth={420}
      minHeight={280}
      maxHeight={520}
      panelClassName={panelSurfaceClass}
      overlayClassName={darkMode ? "bg-black/30" : "bg-black/5"}
      contentClassName="overflow-hidden"
      ariaLabel="Notifications"
    >
      <div ref={revealRef} className="ui-reveal-target" style={{ "--reveal-radius": "28px" }}>
        <div className={`border-b px-4 py-3 ${headerBorderClass}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className={`truncate text-base font-semibold ${headerTitleClass}`}>Notifications</h3>
              <p className={`mt-1 truncate text-sm font-medium ${headerSubtitleClass}`}>Current vessel attention items.</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${countBadgeClass}`}>
              {notificationItems.length}
            </span>
          </div>
        </div>

        <div className={`notification-popover-list max-h-[min(452px,58vh)] overflow-y-auto p-2 ${darkMode ? "notification-popover-list-dark" : "notification-popover-list-light"}`}>
          {notificationItems.length === 0 ? (
            <div className={`rounded-2xl border p-4 text-sm font-medium ${emptyStateClass}`}>
              No notifications for this vessel.
            </div>
          ) : (
            notificationItems.map((notification) => (
              <button
                key={notification.id || `${notification.section}-${notification.title}`}
                type="button"
                onClick={() => {
                  onSelect?.(notification);
                  onClose?.();
                }}
                className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${rowClass}`}
              >
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${iconClass}`}>
                  <NotificationTypeIcon type={typeLabel(notification)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`min-w-0 flex-1 truncate text-sm font-semibold ${titleTextClass}`}>
                      {safeText(notification.title, "Vessel alert")}
                    </p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityBadgeClass(notification)}`}>
                      {priorityLabel(notification)}
                    </span>
                  </div>
                  {notification.detail || notification.context ? (
                    <p className={`mt-1 line-clamp-2 text-sm leading-5 ${contextTextClass}`}>
                      {safeText(notification.detail || notification.context, "")}
                    </p>
                  ) : null}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </AnchoredPopover>
  );
}

function getVesselIdentifier(vessel) {
  if (vessel?.imo) return `IMO ${vessel.imo}`;
  if (vessel?.vesselPrintInfo?.imo) return `IMO ${vessel.vesselPrintInfo.imo}`;
  if (vessel?.officialNumber) return `Official No. ${vessel.officialNumber}`;
  if (vessel?.vesselPrintInfo?.officialNumber) return `Official No. ${vessel.vesselPrintInfo.officialNumber}`;
  if (vessel?.mmsi) return `MMSI ${vessel.mmsi}`;
  if (vessel?.vesselPrintInfo?.mmsi) return `MMSI ${vessel.vesselPrintInfo.mmsi}`;
  return "IMO pending verification";
}

function getDesktopVesselTitleSize(name = "") {
  const length = String(name || "").length;

  if (length <= 12) return "text-[64px] xl:text-[88px]";
  if (length <= 18) return "text-[58px] xl:text-[78px]";
  if (length <= 24) return "text-[52px] xl:text-[68px]";
  return "text-[44px] xl:text-[58px]";
}

function getMobileVesselTitleSize(name = "") {
  const length = String(name || "").length;

  if (length <= 12) return "text-[40px]";
  if (length <= 18) return "text-[36px]";
  if (length <= 24) return "text-[31px]";
  return "text-[27px]";
}

function getCleanVesselTitle(name = "") {
  const cleanName = String(name || "M/Y VESSEL")
    .replace(/\s+OPERATIONS$/i, "")
    .trim();

  return (cleanName || "M/Y VESSEL").toUpperCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value, fallback = "-") {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (value && typeof value === "object") {
    return (
      safeText(value.title, "") ||
      safeText(value.message, "") ||
      safeText(value.description, "") ||
      safeText(value.context, "") ||
      safeText(value.note, "") ||
      fallback
    );
  }

  return fallback;
}

function formatActivity(activity) {
  if (!activity) return "No recent activity logged.";
  if (typeof activity === "string") return activity;

  if (activity && typeof activity === "object") {
    const action = safeText(activity.action, "");
    const detail = safeText(activity.detail, "");
    const directText = safeText(activity, "");

    if (action && detail) return `${action}: ${detail}`;
    if (action) return action;
    if (detail) return detail;
    if (directText) return directText;
    return "Activity logged.";
  }

  return "Activity logged.";
}

function DesktopVesselIdentityLockup({
  darkMode = false,
  vesselTitle,
  vesselIdentifier,
  vesselMode = "Command workspace",
  currentRoleLabel = "Captain",
  commandStatement = "Private yacht command workspace for crew, approvals, routing, documents, and operational readiness.",
}) {
  const dockShellClass = darkMode
    ? "border-white/8 bg-[linear-gradient(180deg,rgba(12,26,39,0.92),rgba(5,15,27,0.98))] shadow-[0_30px_72px_rgba(0,0,0,0.38)]"
    : "border-white/84 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(243,248,250,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.94),0_22px_56px_rgba(15,23,42,0.12)]";

  return (
    <div className="hidden min-w-0 pl-[6.375rem] pt-3 lg:block xl:pl-[7rem]">
      <div
        className={`pointer-events-none absolute left-3 top-3 z-10 hidden shrink-0 rounded-[40px] border p-[4px] backdrop-blur-xl lg:block xl:left-4 xl:top-4 xl:rounded-[42px] ${dockShellClass}`}
      >
        <div
          className={`rounded-[36px] p-[2px] ${
            darkMode
              ? "bg-[linear-gradient(180deg,rgba(9,21,34,0.98),rgba(3,11,22,1))]"
              : "bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,248,250,0.90))]"
          }`}
        >
          <div
            className={`flex h-[100px] w-[100px] items-center justify-center rounded-[32px] border backdrop-blur-xl xl:h-[104px] xl:w-[104px] ${
              darkMode
                ? "border-white/10 bg-slate-900/80 shadow-[0_20px_48px_rgba(0,0,0,0.38)]"
                : "border-slate-200/80 bg-white/84 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_20px_48px_rgba(15,23,42,0.10)]"
            }`}
          >
            <ContessaUiLogo className="h-16 w-16 object-contain" />
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <h1
          className={`vessel-display-title max-w-full whitespace-normal text-[clamp(3rem,4.2vw,4.75rem)] font-semibold leading-[0.92] tracking-[0.055em] 2xl:whitespace-nowrap ${
            darkMode ? "text-slate-50" : "text-[#071A3A]"
          }`}
        >
          {safeText(vesselTitle, "M/Y VESSEL")}
        </h1>
        <p className={`mt-4 whitespace-nowrap text-sm font-bold uppercase tracking-[0.28em] ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
          {safeText(vesselIdentifier, "IMO pending verification")}
        </p>
        <div className="mt-4 h-px w-48 bg-gradient-to-r from-transparent via-amber-400/65 to-transparent dark:via-amber-300/60" />
      </div>

      <p className={`mt-8 max-w-3xl text-lg font-medium leading-8 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
        {safeText(commandStatement, "Private yacht command workspace for daily readiness.")}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className={liveChipClass(darkMode)}>
          Live vessel workspace
        </span>
        <span className={blueChipClass(darkMode)}>
          {safeText(vesselMode, "Command mode")}
        </span>
        <span className={goldChipClass(darkMode)}>
          {safeText(currentRoleLabel, "Captain")} view
        </span>
      </div>
    </div>
  );
}

function HeroLensTile({ darkMode = false, label, value, tone = "neutral" }) {
  const toneClass = {
    cyan: darkMode
      ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
      : "border-cyan-200 bg-cyan-50/80 text-cyan-900",
    amber: darkMode
      ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
      : "border-amber-200 bg-amber-50/90 text-amber-900",
    teal: darkMode
      ? "border-teal-300/25 bg-teal-300/10 text-teal-100"
      : "border-teal-200 bg-teal-50/80 text-teal-900",
    rose: darkMode
      ? "border-rose-300/25 bg-rose-300/10 text-rose-100"
      : "border-rose-200 bg-rose-50/80 text-rose-900",
    neutral: darkMode
      ? "border-white/10 bg-white/[0.04] text-slate-100"
      : "border-slate-200/80 bg-white/82 text-slate-900",
  }[tone] || (darkMode ? "border-white/10 bg-white/[0.04] text-slate-100" : "border-slate-200/80 bg-white/82 text-slate-900");
  const shellClass = darkMode
    ? "bg-[linear-gradient(180deg,rgba(10,18,28,0.96),rgba(6,14,24,0.98))] shadow-[0_10px_24px_rgba(0,0,0,0.20)]"
    : "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,246,250,0.92))] shadow-[0_10px_24px_rgba(15,23,42,0.08)]";

  return (
    <div className={`rounded-[18px] p-[2px] ${shellClass}`}>
      <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-75">{label}</div>
        <div className="mt-1 truncate text-base font-bold leading-6">{safeText(value)}</div>
      </div>
    </div>
  );
}

function HeroCommandLens({
  darkMode = false,
  confidence = 0,
  nextAction = "Review priorities",
  routeStatus = "Confirmed",
  pendingSpend = "$0",
  pendingApprovals = 0,
  crewReadiness = "Stable",
  latestActivity = "No recent activity logged.",
  onReviewPriorities,
  onOpenApprovals,
}) {
  const safeConfidence = Math.round(Math.max(0, Math.min(100, Number(confidence) || 0)));
  const confidenceTone = safeConfidence >= 82 ? "teal" : safeConfidence >= 65 ? "amber" : "rose";
  const panelClass = darkMode
    ? "border-cyan-300/15 bg-slate-950/58 text-slate-50 shadow-[0_26px_70px_rgba(0,0,0,0.34)]"
    : "border-white/80 bg-white/76 text-[#071A3A] shadow-[0_28px_80px_rgba(15,23,42,0.10)]";
  const lensShellClass = darkMode
    ? "bg-[linear-gradient(180deg,rgba(10,18,28,0.96),rgba(6,14,24,0.98))] shadow-[0_12px_30px_rgba(0,0,0,0.24)]"
    : "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,246,250,0.92))] shadow-[0_12px_30px_rgba(15,23,42,0.08)]";

  return (
    <aside className={`relative min-w-0 overflow-hidden rounded-[34px] border p-5 backdrop-blur-2xl ${panelClass}`}>
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${darkMode ? "text-cyan-100" : "text-cyan-800"}`}>
            Command Lens
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Vessel intelligence</h2>
          <p className={`mt-2 text-sm leading-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            Live signals condensed for captain decisions.
          </p>
        </div>

        <div className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-[26px] border ${confidenceTone === "teal" ? (darkMode ? "border-teal-300/30 bg-teal-300/10 text-teal-100" : "border-teal-200 bg-teal-50 text-teal-900") : confidenceTone === "amber" ? (darkMode ? "border-amber-300/30 bg-amber-300/10 text-amber-100" : "border-amber-200 bg-amber-50 text-amber-900") : (darkMode ? "border-rose-300/30 bg-rose-300/10 text-rose-100" : "border-rose-200 bg-rose-50 text-rose-900")}`}>
          <span className="text-2xl font-black leading-none">{safeConfidence}%</span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em]">Ready</span>
        </div>
      </div>

      <div className={`mt-5 rounded-[28px] p-[2px] ${lensShellClass}`}>
        <div className={`rounded-[26px] border p-4 ${darkMode ? "border-amber-300/20 bg-amber-300/10" : "border-amber-200/80 bg-amber-50/65"}`}>
          <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${darkMode ? "text-amber-100" : "text-amber-800"}`}>
            Next best action
          </p>
          <p className={`mt-2 text-base font-semibold leading-6 ${darkMode ? "text-slate-50" : "text-slate-950"}`}>
            {safeText(nextAction, "Review today's priorities.")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <HeroLensTile darkMode={darkMode} label="Route" value={routeStatus} tone="cyan" />
        <HeroLensTile darkMode={darkMode} label="Pending spend" value={pendingSpend} tone="amber" />
        <HeroLensTile darkMode={darkMode} label="Approval" value={`${Number(pendingApprovals) || 0} waiting`} tone={pendingApprovals ? "amber" : "neutral"} />
        <HeroLensTile darkMode={darkMode} label="Crew" value={crewReadiness} tone="teal" />
      </div>

      <div className={`mt-4 rounded-[26px] p-[2px] ${lensShellClass}`}>
        <div className={`rounded-[24px] border p-4 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200/80 bg-white/82"}`}>
          <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            Latest activity
          </p>
          <p className={`mt-2 line-clamp-2 text-sm font-medium leading-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            {safeText(latestActivity, "No recent activity logged.")}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onReviewPriorities} className="app-primary-action-button rounded-2xl px-4 py-3">
          Review priorities
        </Button>
        <Button type="button" variant="outline" onClick={onOpenApprovals} className={`app-action-button rounded-2xl px-4 py-3 ${darkMode ? "!border-white/10 !bg-white/[0.04] !text-slate-100" : ""}`}>
          Open approvals
        </Button>
      </div>
    </aside>
  );
}

function MobileVesselIdentityLockup({ darkMode = false, vesselTitle, vesselIdentifier }) {
  return (
    <div className="lg:hidden">
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] border backdrop-blur-xl ${
          darkMode
            ? "border-white/10 bg-slate-900/80 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
            : "border-slate-200/80 bg-white/86 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_14px_34px_rgba(15,23,42,0.08)]"
        }`}
      >
        <ContessaUiLogo className="h-11 w-11 object-contain" />
      </div>

      <h1
        className={`${getMobileVesselTitleSize(vesselTitle)} vessel-display-title mt-5 whitespace-nowrap text-center font-semibold leading-[0.92] tracking-[0.055em] ${
          darkMode ? "text-slate-50" : "text-[#071A3A]"
        }`}
      >
        {vesselTitle}
      </h1>
      <p className={`mt-3 whitespace-nowrap text-center text-xs font-bold uppercase tracking-[0.24em] ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
        {vesselIdentifier}
      </p>
      <div className="mx-auto mt-4 h-px w-36 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent dark:via-amber-300/55" />
    </div>
  );
}

function ControlCard({ darkMode = false, label, value, children }) {
  return (
    <div className={`${premiumShellClass(darkMode)} p-4 md:p-5`}>
      <p className={`${premiumLabelClass} ${darkMode ? "!text-slate-300" : ""}`}>{label}</p>
      <div className={`${premiumInnerClass(darkMode)} mt-3 min-h-14 px-4 py-3`}>
        {children || <p className={`${premiumValueClass} ${darkMode ? "!text-slate-50" : ""}`}>{value}</p>}
      </div>
    </div>
  );
}

function SettingsPanel({ darkMode = false }) {
  const theme = themeClasses(darkMode);

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border p-4 ${darkMode ? "border-[#31443a] bg-[#18211d]" : "border-[#d8e7df] bg-[#f7fbf9]"}`}>
        <div className={`mb-2 text-sm font-semibold ${theme.textPrimary}`}>About</div>
        <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${theme.textSecondary}`}>{APP_LEGAL_SHORT_COPY}</p>
        <p className={`text-sm leading-6 ${theme.textSecondary}`}>{APP_LEGAL_COPY}</p>
      </div>
      <div className={`rounded-lg border p-4 ${darkMode ? "border-[#31443a] bg-[#18211d]" : "border-[#d8e7df] bg-[#f7fbf9]"}`}>
        <div className={`mb-2 text-sm font-semibold ${theme.textPrimary}`}>Legal</div>
        <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${theme.textSecondary}`}>{APP_LEGAL_SHORT_COPY}</p>
        <p className={`text-sm leading-6 ${theme.textSecondary}`}>{APP_LEGAL_COPY}</p>
      </div>
      <div className={`text-center text-xs ${theme.textSecondary}`}>{APP_FOOTER_NOTICE}</div>
    </div>
  );
}

function ConfirmableTaskFields({
  task,
  darkMode = false,
  canEdit = true,
  assigneeOptions = [],
  onConfirm,
}) {
  const theme = themeClasses(darkMode);
  const scopedAssigneeOptions = Array.isArray(assigneeOptions) ? assigneeOptions.filter(Boolean) : [];
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    assignee: task.assignee || "",
    department: task.department || "General",
    dueDate: task.dueDate || "",
    priority: task.priority || "medium",
    notes: task.notes || "",
  });
  const isDirty =
    draft.assignee !== (task.assignee || "") ||
    draft.department !== (task.department || "General") ||
    draft.dueDate !== (task.dueDate || "") ||
    draft.priority !== (task.priority || "medium") ||
    draft.notes !== (task.notes || "");

  useEffect(() => {
    setIsEditing(false);
    setDraft({
      assignee: task.assignee || "",
      department: task.department || "General",
      dueDate: task.dueDate || "",
      priority: task.priority || "medium",
      notes: task.notes || "",
    });
  }, [task.assignee, task.department, task.dueDate, task.priority, task.notes, task.id]);

  const resetDraft = () => {
    setDraft({
      assignee: task.assignee || "",
      department: task.department || "General",
      dueDate: task.dueDate || "",
      priority: task.priority || "medium",
      notes: task.notes || "",
    });
  };

  if (!isEditing) {
    return (
      <div className="relative mb-6">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--mb-line-strong)] pb-2">
          <div className="rv-masthead-kicker">Task Information</div>
          {canEdit ? (
            <button type="button" onClick={() => setIsEditing(true)} className="min-h-[44px] text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--mb-gold)] transition-colors hover:text-[var(--mb-gold-bright)]">
              Edit
            </button>
          ) : (
            <Badge className={neutralBadgeClass(darkMode)}>View only</Badge>
          )}
        </div>

        <dl className="grid gap-x-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rv-kv">
            <dt className="rv-kv-label">Assignee</dt>
            <dd className="rv-kv-value">{task.assignee || "Unassigned"}</dd>
          </div>
          <div className="rv-kv">
            <dt className="rv-kv-label">Department</dt>
            <dd className="rv-kv-value">{task.department || "General"}</dd>
          </div>
          <div className="rv-kv">
            <dt className="rv-kv-label">Due</dt>
            <dd className="rv-kv-value">{task.dueDate ? formatAppDate(task.dueDate) : "No due date"}</dd>
          </div>
          <div className="rv-kv">
            <dt className="rv-kv-label">Priority</dt>
            <dd className="rv-kv-value">{formatTaskPriorityLabel(task.priority || "medium")} Priority</dd>
          </div>
        </dl>

        <div className={`mt-3 text-sm leading-6 ${theme.textSecondary}`}>
          {task.notes || "No notes recorded."}
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-5 rounded-lg p-4 ${theme.subtle}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="app-kicker mb-1">Editing Task</div>
          <div className={`text-sm ${theme.textSecondary}`}>Update fields, then confirm to save changes.</div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            resetDraft();
            setIsEditing(false);
          }}
          className="app-action-button rounded-xl px-4 py-2"
        >
          Cancel
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <SearchableSelect
          label="Assignee"
          disabled={!canEdit}
          value={draft.assignee}
          options={scopedAssigneeOptions}
          placeholder={scopedAssigneeOptions.length ? "Select crew member" : "No crew for this vessel"}
          onChange={(value) => setDraft((prev) => ({ ...prev, assignee: value }))}
        />
        <Select value={draft.department} onValueChange={(value) => canEdit && setDraft((prev) => ({ ...prev, department: value }))}>
          <SelectTrigger className={`rounded-lg h-12 ${theme.input}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_DEPARTMENT_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          disabled={!canEdit}
          type="date"
          value={draft.dueDate}
          onChange={(event) => setDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
          className={`rounded-lg h-12 ${theme.input}`}
        />
        <Select value={draft.priority} onValueChange={(value) => canEdit && setDraft((prev) => ({ ...prev, priority: value }))}>
          <SelectTrigger className={`rounded-lg h-12 ${theme.input}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{formatTaskPriorityLabel(option)} Priority</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <textarea
        disabled={!canEdit}
        value={draft.notes}
        onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
        placeholder="Notes, service updates, owner comments..."
        className={`mt-3 min-h-28 w-full rounded-lg border px-3 py-2 outline-none ${theme.input}`}
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className={`text-sm ${theme.textSecondary}`}>{isDirty ? "Changes pending confirmation." : "No unconfirmed changes."}</div>
        {canEdit ? (
          <Button
            type="button"
            onClick={() => {
              onConfirm(task.id, draft);
              setIsEditing(false);
            }}
            disabled={!isDirty}
            className="button-vessel-primary rounded-lg px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            Confirm
          </Button>
        ) : (
          <Badge className={neutralBadgeClass(darkMode)}>View only</Badge>
        )}
      </div>
    </div>
  );
}

export function ObjectivesView({
  darkMode = false,
  canEdit = true,
  stats,
  statusFilter,
  onStatusFilterChange,
  newTaskOpen,
  onNewTaskOpenChange,
  newTask,
  onNewTaskChange,
  onAddTask,
  search,
  onSearchChange,
  filteredTasks,
  selectedId,
  onSelectTask,
  onUpdateTaskStatus,
  selectedTask,
  currency,
  exchangeRates,
  onDeleteTaskRequest,
  onUpdateTask,
  onTaskPhotoUpload,
  onRemoveTaskPhoto,
  onTaskAttachmentUpload,
  onRemoveTaskAttachment,
  onAddTaskComment,
  onAddQuote,
  onUpdateQuote,
  onQuoteReceiptUpload,
  onQuoteRemoveRequest,
  assigneeOptions = [],
}) {
  const theme = themeClasses(darkMode);
  const [mobileTaskPane, setMobileTaskPane] = useState(selectedTask ? "details" : "list");
  const [taskBoardView, setTaskBoardView] = useState("all");
  const taskDetailsRevealRef = useRevealHighlight(Boolean(selectedTask), {
    radius: "22px",
    delay: 160,
    scrollIntoView: true,
    block: "nearest",
    triggerKey: selectedTask?.id || "none",
  });

  useEffect(() => {
    if (!selectedTask) {
      setMobileTaskPane("list");
    }
  }, [selectedTask]);

  const handleSelectTask = (taskId) => {
    onSelectTask(taskId);
    setMobileTaskPane("details");
  };
  const getTaskBoardStatus = (task = {}) => {
    if (task.status === "blocked") return "blocked";
    if (task.status === "completed") return "done";
    if (task.status === "waiting-approval" || task.status === "approved" || task.quotes?.some((quote) => ["requested", "received"].includes(quote.status))) return "waiting-approval";
    if (task.status === "ongoing") return "in-progress";
    return "todo";
  };
  const taskBoardColumns = [
    {
      key: "todo",
      label: "To Do",
      empty: "No tasks waiting to start.",
    },
    {
      key: "in-progress",
      label: "In Progress",
      empty: "No tasks currently in progress.",
    },
    {
      key: "waiting-approval",
      label: "Waiting Approval",
      empty: "No tasks waiting for approval.",
    },
    {
      key: "done",
      label: "Done",
      empty: "No completed tasks in this view.",
    },
    {
      key: "blocked",
      label: "Blocked",
      empty: "No blocked tasks.",
    },
  ];
  const visibleTasks = Array.isArray(filteredTasks) ? filteredTasks : [];
  const taskBoardOptions = [
    { key: "all", label: "All Tasks", count: visibleTasks.length, empty: "No tasks in this view." },
    ...taskBoardColumns.map((column) => ({
      ...column,
      count: visibleTasks.filter((task) => getTaskBoardStatus(task) === column.key).length,
    })),
  ];
  const selectedTaskBoardOption = taskBoardOptions.find((option) => option.key === taskBoardView) || taskBoardOptions[0];
  const isTaskOverdue = (task) =>
    Boolean(task?.dueDate) &&
    !["completed", "approved"].includes(task?.status) &&
    new Date(`${task.dueDate}T23:59:59`) < new Date();
  const taskUrgencyScore = (task) => {
    if (isTaskOverdue(task)) return 0;
    if (["urgent", "critical"].includes(task?.priority)) return 1;
    if (task?.priority === "high") return 2;
    if (!task?.assignee) return 3;
    if (task?.dueDate) return 4;
    if (["completed", "approved"].includes(task?.status)) return 7;
    return 5;
  };
  const taskBoardList = (taskBoardView === "all"
    ? visibleTasks
    : visibleTasks.filter((task) => getTaskBoardStatus(task) === taskBoardView))
    .slice()
    .sort((left, right) => {
      const urgencyDifference = taskUrgencyScore(left) - taskUrgencyScore(right);
      if (urgencyDifference) return urgencyDifference;
      if (left?.dueDate && right?.dueDate) return left.dueDate.localeCompare(right.dueDate);
      if (left?.dueDate) return -1;
      if (right?.dueDate) return 1;
      return String(left?.name || "").localeCompare(String(right?.name || ""));
    });
  const taskBoardSummary = {
    overdue: visibleTasks.filter(isTaskOverdue).length,
    unassigned: visibleTasks.filter((task) => !task?.assignee && !["completed", "approved"].includes(task?.status)).length,
    inProgress: visibleTasks.filter((task) => getTaskBoardStatus(task) === "in-progress").length,
    completed: visibleTasks.filter((task) => getTaskBoardStatus(task) === "done").length,
  };
  const taskTickClass = (task) => {
    if (isTaskOverdue(task) || ["urgent", "critical"].includes(task?.priority)) return "rv-tick-critical";
    if (task?.priority === "high") return "rv-tick-warning";
    if (["completed", "approved"].includes(task?.status)) return "rv-tick-success";
    return "rv-tick-neutral";
  };
  const scopedAssigneeOptions = Array.isArray(assigneeOptions) ? assigneeOptions.filter(Boolean) : [];

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:mb-5 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`h-12 rounded-2xl md:max-w-sm ${theme.input}`}
        />
        {canEdit ? (
          <TaskCreateDialog
            open={newTaskOpen}
            onOpenChange={onNewTaskOpenChange}
            task={newTask}
            onTaskChange={onNewTaskChange}
            onSave={onAddTask}
            assigneeOptions={scopedAssigneeOptions}
            darkMode={darkMode}
          />
        ) : <Badge className="bg-[#e8eee9] text-[#40534a]">View-only access</Badge>}
      </div>

      <div className="task-clarity-strip" aria-label="Task overview">
        <div className={taskBoardSummary.overdue ? "task-clarity-metric task-clarity-metric--critical" : "task-clarity-metric"}>
          <strong>{taskBoardSummary.overdue}</strong><span>Overdue</span>
        </div>
        <div className={taskBoardSummary.unassigned ? "task-clarity-metric task-clarity-metric--watch" : "task-clarity-metric"}>
          <strong>{taskBoardSummary.unassigned}</strong><span>Unassigned</span>
        </div>
        <div className="task-clarity-metric">
          <strong>{taskBoardSummary.inProgress}</strong><span>In progress</span>
        </div>
        <div className="task-clarity-metric task-clarity-metric--ready">
          <strong>{taskBoardSummary.completed}</strong><span>Completed</span>
        </div>
      </div>

      {selectedTask ? (
        <div className="mb-4 grid grid-cols-2 gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileTaskPane("list")}
            className={`min-h-[48px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${mobileTaskPane === "list" ? "vessel-active" : darkMode ? "bg-[#121c21] text-[#dce9e1]" : "bg-white text-[#40534a]"}`}
          >
            Task List
          </button>
          <button
            type="button"
            onClick={() => setMobileTaskPane("details")}
            className={`min-h-[48px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${mobileTaskPane === "details" ? "vessel-active" : darkMode ? "bg-[#121c21] text-[#dce9e1]" : "bg-white text-[#40534a]"}`}
          >
            Details
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(520px,680px)] xl:items-start">
        <Card className={`app-panel app-panel-soft shadow-md ${theme.card} ${mobileTaskPane === "details" ? "hidden md:block" : "block"} rounded-2xl md:rounded-lg`}>
          <CardContent className="p-4">
            {visibleTasks.length === 0 ? (
              <div className={`app-empty-state rounded-xl border border-dashed text-center text-sm ${theme.textSecondary} ${darkMode ? "border-[#31443a] bg-[#0e171c]" : "border-[#c9ded3] bg-[#f7faf8]"}`}>
                No tasks match this view.
              </div>
            ) : (
              <div className="rounded-[22px] border border-[var(--mb-line)] bg-[rgba(255,255,255,0.45)] p-3">
                <div className="task-board-scroll flex gap-2 overflow-x-auto pb-3">
                  {taskBoardOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setTaskBoardView(option.key)}
                      className={`inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-all duration-200 active:scale-[0.98] ${taskBoardView === option.key ? "vessel-active border-transparent" : "border-[var(--mb-line)] bg-[var(--mb-panel)] text-[var(--mb-soft)] hover:border-[var(--mb-gold-hover)] hover:bg-[var(--mb-gold-tint)] hover:text-[var(--mb-gold-bright)]"}`}
                    >
                      <span className="whitespace-nowrap">{option.label}</span>
                      <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] ${taskBoardView === option.key ? "bg-white/20 text-white" : "bg-[var(--mb-gold-tint)] text-[var(--mb-gold-bright)]"}`}>
                        {option.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="app-kicker">{selectedTaskBoardOption.label}</div>
                  <Badge className={neutralBadgeClass(darkMode)}>{taskBoardList.length}</Badge>
                </div>

                <div className="mt-3 grid gap-2">
                  {taskBoardList.length ? taskBoardList.map((task) => (
                    <button
                      id={`item-${task.id}`}
                      data-jump-target
                      style={{ "--jump-radius": "18px" }}
                      key={task.id}
                      type="button"
                      onClick={(event) => {
                        event.currentTarget.classList.remove("jump-highlight-active");
                        void event.currentTarget.offsetWidth;
                        event.currentTarget.classList.add("jump-highlight-target");
                        event.currentTarget.classList.add("jump-highlight-active");
                        window.setTimeout(() => event.currentTarget.classList.remove("jump-highlight-active"), 1900);
                        handleSelectTask(task.id);
                      }}
                      className={`jump-highlight-target group relative overflow-hidden p-4 pl-5 text-left active:scale-[0.99] ${selectedId === task.id ? "vessel-active rounded-[14px]" : "rv-row"}`}
                    >
                      <span className={`rv-row-tick ${taskTickClass(task)}`} />
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-start justify-between gap-2">
                            <div className={`min-w-0 truncate text-base font-semibold ${theme.textPrimary}`}>{task.name}</div>
                            <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold lg:hidden ${darkMode ? "border-white/10 bg-white/[0.06] text-slate-100" : "border-slate-200/80 bg-white/80 text-slate-700"}`}>
                              {(task.assignee || "Ops").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "OP"}
                            </span>
                          </div>
                          <div className={`mt-1 text-sm ${theme.textSecondary}`}>
                            {[task.department, task.area].filter(Boolean).join(" / ") || "General"}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <Badge className={`task-priority-chip task-priority-chip--${task.priority || "medium"}`}>{formatTaskPriorityLabel(task.priority)} priority</Badge>
                            <Badge className={`task-status-chip task-status-chip--${getTaskBoardStatus(task)}`}>{formatTaskStatusLabel(task.status)}</Badge>
                          </div>
                        </div>
                        <div className={`grid gap-1 text-xs ${theme.textSecondary} lg:min-w-[220px]`}>
                          <div className="flex justify-between gap-2">
                            <span>Assigned</span>
                            <span className={`truncate text-right font-medium ${theme.textPrimary}`}>{task.assignee || "Unassigned"}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span>Due</span>
                            <span className={`text-right font-medium ${theme.textPrimary}`}>
                              {task.dueDate ? formatAppDate(task.dueDate) : "Not set"}
                              {isTaskOverdue(task) ? <span className={`ml-2 ${selectedId === task.id ? "text-[#ffb9b0]" : "rv-overdue"}`}>Overdue</span> : null}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )) : (
                    <div className={`rounded-2xl border border-dashed p-5 text-center text-sm ${theme.textSecondary} ${darkMode ? "app-dark-inner border-white/10" : "border-slate-200/70 bg-white/50"}`}>
                      {selectedTaskBoardOption.empty}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div
          ref={taskDetailsRevealRef}
          className={`ui-reveal-target rv-sticky-detail rounded-2xl md:rounded-lg ${mobileTaskPane === "list" ? "hidden md:block" : "block"}`}
          style={{ "--reveal-radius": "22px" }}
        >
          <Card className={`app-panel ${selectedTask ? "app-panel-active xl:min-h-[640px]" : "app-panel-soft"} shadow-md ${theme.card} rounded-2xl md:rounded-lg`}>
            <CardContent className="p-4 md:p-6">
              <TaskDetails
                selectedTask={selectedTask}
                canEdit={canEdit}
                darkMode={darkMode}
                assigneeOptions={scopedAssigneeOptions}
                currency={currency}
                exchangeRates={exchangeRates}
                onDeleteTaskRequest={onDeleteTaskRequest}
                onUpdateTaskStatus={onUpdateTaskStatus}
                onUpdateTask={onUpdateTask}
                onTaskPhotoUpload={onTaskPhotoUpload}
                onRemoveTaskPhoto={onRemoveTaskPhoto}
                onTaskAttachmentUpload={onTaskAttachmentUpload}
                onRemoveTaskAttachment={onRemoveTaskAttachment}
                onAddTaskComment={onAddTaskComment}
                onAddQuote={onAddQuote}
                onUpdateQuote={onUpdateQuote}
                onQuoteReceiptUpload={onQuoteReceiptUpload}
                onQuoteRemoveRequest={onQuoteRemoveRequest}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export function MidnightControlDeck({
  darkMode = false,
  isOffline = false,
  syncState = null,
  currentRole,
  onCurrentRoleChange,
  appMode = "view",
  onAppModeChange,
  canEditApp = true,
  vesselState = {},
  onVesselStateModeChange,
  preferencesOpen = false,
  onPreferencesOpenChange,
  historyOpen = false,
  onHistoryOpenChange,
  actorName,
  onActorNameChange,
  retrieveOpen,
  onToggleRetrieve,
  declinedTasks = [],
  onRetrieveDeclinedTask,
  history = [],
  sharingOpen = false,
  onSharingOpenChange,
  jsonImportInputRef,
  onImportAppStateJson,
  onExportCsv,
  onExportAppStateJson,
  onOpenJsonImportPicker,
  onPrintSummary,
  onResetDemoData,
  shareUrlStatus,
  localShareWarning,
  onShareToast,
  fleetOpen = false,
  onFleetOpenChange,
  fleetVessels = [],
  fleetMetricsByVessel = {},
  activeVesselId = "contessa",
  onSwitchFleetVessel,
  onAddFleetVessel,
  onOpenSettingsWorkspace,
}) {
  const theme = themeClasses(darkMode);
  const [legalOpen, setLegalOpen] = useState(false);
  const [fleetDraft, setFleetDraft] = useState({
    vesselName: "",
    lengthFeet: "",
    vesselType: "",
    flag: "",
    homePort: "",
    crewNumber: "",
    notes: "",
  });
  const [fleetDraftError, setFleetDraftError] = useState("");
  const [fleetFormOpen, setFleetFormOpen] = useState(false);

  useEffect(() => {
    if (!fleetOpen) {
      setFleetFormOpen(false);
      setFleetDraftError("");
      setFleetDraft({ vesselName: "", lengthFeet: "", vesselType: "", flag: "", homePort: "", crewNumber: "", notes: "" });
    }
  }, [fleetOpen]);

  const selectedFleetFlag = normalizeFlag(fleetDraft.flag);
  const fleetHomePortOptions = homePortsByFlag[selectedFleetFlag] || [];
  const settingsCardClass = darkMode
    ? "settings-popover-card-dark rounded-2xl border border-white/15 bg-slate-900/92 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    : "settings-popover-card-light rounded-2xl border border-slate-300 bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]";
  const settingsLabelClass = darkMode
    ? "settings-popover-label-dark text-[11px] font-bold uppercase tracking-[0.18em] text-slate-100"
    : "settings-popover-label-light text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700";
  const settingsSelectClass = darkMode
    ? "settings-popover-field-dark !border-white/15 !bg-slate-800/95 !text-slate-50 dark:!border-white/15 dark:!bg-slate-800/95 dark:!text-slate-50"
    : "settings-popover-field-light !border-slate-300 !bg-white !text-slate-950";
  const settingsValueBoxClass = darkMode
    ? "settings-popover-field-dark border-white/15 bg-slate-800/95 text-slate-50"
    : "settings-popover-field-light border-slate-300 bg-white text-slate-950";
  const settingsMutedActionClass = `${mutedButtonClass} w-full justify-start ${darkMode ? "!border-white/15 !bg-slate-800/92 !text-slate-50 hover:!border-cyan-300/40 hover:!bg-cyan-300/12" : ""}`;
  const settingsMetaClass = darkMode ? "text-slate-200" : "settings-popover-meta-light text-slate-700";
  const fleetLabelClass = darkMode
    ? "fleet-popover-label-dark text-[11px] font-bold uppercase tracking-[0.18em] text-slate-100"
    : "fleet-popover-label-light text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700";
  const fleetDetailGridClass = darkMode
    ? "fleet-popover-detail-dark grid gap-1 text-xs font-semibold text-slate-200"
    : "fleet-popover-detail-light grid gap-1 text-xs font-semibold text-slate-700";
  const fleetFormLabelClass = "mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200";
  const syncPendingCount = Number(syncState?.unsyncedItemsCount || 0);
  const syncLastSavedAt = syncState?.lastSyncAt ? formatHistoryTime(syncState.lastSyncAt) : "Not saved yet";
  const syncStatusLabel = isOffline || syncPendingCount > 0
    ? `${Math.max(syncPendingCount, 1)} pending local change${Math.max(syncPendingCount, 1) === 1 ? "" : "s"}`
    : "Saved locally";
  const syncStatusClass = isOffline || syncPendingCount > 0
    ? "border-amber-300/70 bg-amber-50/90 text-amber-800 dark:border-amber-300/35 dark:bg-amber-300/18 dark:text-amber-50"
    : "border-teal-300/70 bg-teal-50/90 text-teal-800 dark:border-cyan-300/35 dark:bg-cyan-300/14 dark:text-cyan-50";

  return (
    <>
      {/* ---- History (ship's log, actor identity, retrieve declined) ---- */}
      <Dialog open={historyOpen} onOpenChange={onHistoryOpenChange}>
        <DialogContent className={`rounded-lg ${darkMode ? "bg-[#111a16] text-[#f4fbf6] border-[#2a3a32]" : "bg-white"}`}>
          <DialogHeader>
            <DialogTitle>History</DialogTitle>
          </DialogHeader>
          <HistoryPanel
            actorName={actorName}
            onActorNameChange={onActorNameChange}
            darkMode={darkMode}
            retrieveOpen={retrieveOpen}
            onToggleRetrieve={onToggleRetrieve}
            declinedTasks={declinedTasks}
            onRetrieveDeclinedTask={onRetrieveDeclinedTask}
            history={history}
          />
        </DialogContent>
      </Dialog>

      {/* ---- Legal ---- */}
      <Dialog open={legalOpen} onOpenChange={setLegalOpen}>
        <DialogContent className={`rounded-lg ${darkMode ? "border-[#2a3a32] bg-[#111a16] text-[#f4fbf6]" : "bg-white text-[#1d2b24]"}`}>
          <DialogHeader>
            <DialogTitle>Legal</DialogTitle>
          </DialogHeader>
          <SettingsPanel darkMode={darkMode} />
        </DialogContent>
      </Dialog>

      {/* ---- Share / backup ---- */}
      <Dialog open={sharingOpen} onOpenChange={onSharingOpenChange}>
        <DialogContent className={`rounded-[28px] ${darkMode ? "border-[#2a3a32] bg-[#111a16] text-[#f4fbf6]" : "bg-white text-[#1d2b24]"}`}>
          <DialogHeader>
            <DialogTitle>Share</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {localShareWarning ? (
              <div className={`rounded-lg border p-3 text-sm ${darkMode ? "border-[#6c5a27] bg-[#2c2515] text-[#ffe7ad]" : "border-[#ecd28c] bg-[#fff8df] text-[#7a5416]"}`}>
                <div className="font-semibold">Local Development Warning</div>
                <div className="mt-1">{localShareWarning}</div>
              </div>
            ) : null}
            <input
              ref={jsonImportInputRef}
              type="file"
              accept="application/json,.json"
              onChange={onImportAppStateJson}
              className="hidden"
            />
            <div className={`rounded-2xl border p-4 text-sm ${darkMode ? "border-[#31443a] bg-[#18211d] text-[#f4fbf6]" : "border-[#d8e7df] bg-[#f7fbf9] text-[#1f332b]"}`}>
              <div className="mb-3 text-base font-semibold">Share</div>
              <div className={`mb-4 rounded-xl border p-3 ${darkMode ? "border-[#2d5c4e] bg-[#12241f] text-[#e7f8f1]" : "border-[#c9ded3] bg-white text-[#263c33]"}`}>
                <div className="font-semibold">Public App Link</div>
                <div className={`mt-1 break-all text-xs ${darkMode ? "text-[#cfe4da]" : "text-[#40534a]"}`}>
                  {shareUrlStatus?.isValid ? `${shareUrlStatus.url}${shareUrlStatus.source ? ` (${shareUrlStatus.source})` : ""}` : shareUrlStatus?.message}
                </div>
              </div>
              <div className="grid gap-2">
                <ShareAppButton darkMode={darkMode} shareUrlStatus={shareUrlStatus} onToast={onShareToast} className="rounded-xl px-4 py-4">
                  Share App Link
                </ShareAppButton>
                <ShareAppButton mode="email" darkMode={darkMode} shareUrlStatus={shareUrlStatus} onToast={onShareToast} className="rounded-xl px-4 py-4">
                  Email App Link
                </ShareAppButton>
                <ShareAppButton mode="copy" darkMode={darkMode} shareUrlStatus={shareUrlStatus} onToast={onShareToast} className="rounded-xl px-4 py-4">
                  Copy App Link
                </ShareAppButton>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" className={`${mutedButtonClass} w-full`} onClick={onExportCsv}>Export CSV</Button>
              <Button variant="outline" className={`${mutedButtonClass} w-full`} onClick={onExportAppStateJson}>Export JSON</Button>
              {canEditApp ? <Button variant="outline" className={`${mutedButtonClass} w-full`} onClick={onOpenJsonImportPicker}>Import JSON</Button> : null}
              <Button variant="outline" className={`${mutedButtonClass} w-full`} onClick={onPrintSummary}>Print / PDF</Button>
            </div>
            {canEditApp ? (
              <Button
                variant="outline"
                className={`w-full rounded-2xl px-4 py-3 ${darkMode ? "border-[#5b2a2a] bg-[#231515] text-[#ffd9d9] hover:bg-[#382020]" : "border-[#e8bcbc] bg-[#fff3f3] text-[#8a1f2b] hover:bg-[#ffe4e4]"}`}
                onClick={onResetDemoData}
              >
                Reset Demo Data
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- Preferences (role, mode, vessel state, persistence) ---- */}
      <Dialog open={preferencesOpen} onOpenChange={onPreferencesOpenChange}>
        <DialogContent className={`max-h-[88vh] overflow-y-auto rounded-[28px] ${darkMode ? "settings-popover-dark border-cyan-300/15 bg-slate-950 text-slate-50" : "settings-popover-light border-slate-200/90 bg-white text-slate-950"}`}>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className={settingsCardClass}>
              <div className={settingsLabelClass}>Operating As</div>
              <div className="mt-2">
                {onCurrentRoleChange ? (
                  <Select value={currentRole} onValueChange={onCurrentRoleChange}>
                    <SelectTrigger className={`h-11 rounded-2xl border ${theme.input} ${settingsSelectClass}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMO_ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className={`flex h-11 items-center rounded-2xl border px-3 text-sm font-semibold ${settingsValueBoxClass}`}>
                    Shared vessel access
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className={settingsCardClass}>
                <div className={settingsLabelClass}>Mode</div>
                {onAppModeChange ? (
                  <Select value={appMode} onValueChange={onAppModeChange}>
                    <SelectTrigger className={`mt-2 h-11 rounded-2xl border ${theme.input} ${settingsSelectClass}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View Mode</SelectItem>
                      <SelectItem value="editor">Editor Mode</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className={`mt-2 flex h-11 items-center rounded-2xl border px-3 text-sm font-semibold ${settingsValueBoxClass}`}>
                    View Mode only
                  </div>
                )}
              </div>
              <div className={settingsCardClass}>
                <div className={settingsLabelClass}>Status</div>
                <Badge className={`mt-2 flex min-h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-bold ${canEditApp ? "border border-amber-300/70 bg-amber-50/90 text-amber-800 dark:border-amber-300/35 dark:bg-amber-300/20 dark:text-amber-50" : "border border-slate-200/80 bg-slate-50/80 text-slate-700 dark:border-white/15 dark:bg-slate-800/95 dark:text-slate-50"}`}>
                  {canEditApp ? "Editor Mode" : "View Mode"}
                </Badge>
              </div>
            </div>

            <div className={settingsCardClass}>
              <div className={settingsLabelClass}>Vessel State</div>
              <Select value={vesselState?.mode || "standby"} onValueChange={onVesselStateModeChange}>
                <SelectTrigger className={`mt-2 h-11 rounded-2xl border ${theme.input} ${settingsSelectClass}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VESSEL_STATE_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className={`mt-2 text-xs font-medium leading-5 ${settingsMetaClass}`}>
                {vesselState?.primaryFocus || "Routine vessel readiness"} · {Number(vesselState?.confidenceScore || 0)}% confidence
              </div>
            </div>

            <div className={settingsCardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className={settingsLabelClass}>Persistence</div>
                  <div className={`mt-2 text-sm font-semibold ${settingsMetaClass}`}>
                    Last local save: {syncLastSavedAt}
                  </div>
                </div>
                <Badge className={`rounded-2xl border px-3 py-2 text-xs font-bold ${syncStatusClass}`}>
                  {syncStatusLabel}
                </Badge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" className={settingsMutedActionClass} onClick={onExportAppStateJson}>
                  Export backup
                </Button>
                {canEditApp ? (
                  <Button
                    type="button"
                    variant="outline"
                    className={settingsMutedActionClass}
                    onClick={() => {
                      onPreferencesOpenChange?.(false);
                      onSharingOpenChange?.(true);
                      window.setTimeout(() => onOpenJsonImportPicker?.(), 160);
                    }}
                  >
                    Restore backup
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2">
              <Button type="button" variant="outline" className={settingsMutedActionClass} onClick={() => { onPreferencesOpenChange?.(false); onFleetOpenChange?.(true); }}>
                Fleet management
              </Button>
              <Button type="button" variant="outline" className={settingsMutedActionClass} onClick={() => { onPreferencesOpenChange?.(false); onHistoryOpenChange?.(true); }}>
                History
              </Button>
              <Button type="button" variant="outline" className={settingsMutedActionClass} onClick={() => { onPreferencesOpenChange?.(false); onSharingOpenChange?.(true); }}>
                Share
              </Button>
              <Button type="button" variant="outline" className={settingsMutedActionClass} onClick={() => { onPreferencesOpenChange?.(false); setLegalOpen(true); }}>
                Legal
              </Button>
              <Button type="button" variant="outline" className={settingsMutedActionClass} onClick={() => { onPreferencesOpenChange?.(false); onOpenSettingsWorkspace?.(); }}>
                App settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- Fleet manager (switch + add vessel) ---- */}
      <Dialog open={fleetOpen} onOpenChange={onFleetOpenChange}>
        <DialogContent className={`max-h-[88vh] overflow-y-auto rounded-[32px] sm:max-w-3xl ${darkMode ? "fleet-popover-dark border-white/10 bg-slate-950 text-slate-50" : "fleet-popover-light border-slate-200/90 bg-white text-slate-950"}`}>
          <div className="flex items-start justify-between gap-3 pr-14">
            <DialogHeader>
              <DialogTitle>Fleet</DialogTitle>
            </DialogHeader>
            {!fleetFormOpen ? (
              <button
                type="button"
                onClick={() => { setFleetDraftError(""); setFleetFormOpen(true); }}
                className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                  darkMode
                    ? "border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-100 hover:border-cyan-300/45 hover:bg-cyan-300/[0.12]"
                    : "border-amber-300/70 bg-amber-50/80 text-amber-900 hover:border-amber-400 hover:bg-amber-100/70"
                }`}
              >
                <span>Add Vessel</span>
                <Plus className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="flex h-full min-h-0 flex-col gap-3">
            {fleetFormOpen ? (
              <div className={`${darkMode ? "fleet-popover-card-dark rounded-2xl border border-white/15 bg-slate-900/92" : "fleet-popover-card-light rounded-2xl border border-slate-300 bg-white"} p-4`}>
                <div className={fleetLabelClass}>New Vessel</div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={fleetFormLabelClass}>
                      Vessel Name <span className="text-rose-500">*</span>
                    </label>
                    <Input placeholder="M/Y Vessel Name" value={fleetDraft.vesselName} onChange={(event) => setFleetDraft((prev) => ({ ...prev, vesselName: event.target.value }))} className={`h-14 rounded-2xl text-base font-semibold ${theme.input}`} />
                  </div>
                  <div>
                    <label className={fleetFormLabelClass}>
                      Length <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Input type="number" min="1" step="0.1" inputMode="decimal" placeholder="125" value={fleetDraft.lengthFeet} onChange={(event) => setFleetDraft((prev) => ({ ...prev, lengthFeet: event.target.value }))} className={`h-14 rounded-2xl pr-12 text-base font-semibold ${theme.input}`} />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 dark:text-slate-400">ft</span>
                    </div>
                  </div>
                  <SearchableSelect
                    label="Type of Yacht"
                    value={fleetDraft.vesselType}
                    options={yachtTypeOptions}
                    placeholder="Select yacht type"
                    onChange={(value) => setFleetDraft((prev) => ({ ...prev, vesselType: value }))}
                    required
                  />
                  <SearchableSelect
                    label="Flag"
                    value={fleetDraft.flag}
                    options={flagOptions}
                    optionAliases={flagOptionAliases}
                    placeholder="Select flag"
                    onChange={(value) => setFleetDraft((prev) => ({ ...prev, flag: normalizeFlag(value), homePort: "" }))}
                    required
                  />
                  <SearchableSelect
                    label="Home Port"
                    value={fleetDraft.homePort}
                    options={fleetHomePortOptions}
                    placeholder={selectedFleetFlag ? "Select home port" : "Select flag first"}
                    disabled={!selectedFleetFlag}
                    onChange={(value) => setFleetDraft((prev) => ({ ...prev, homePort: value }))}
                    required
                  />
                  <div>
                    <label className={fleetFormLabelClass}>
                      Crew Number
                    </label>
                    <Input type="number" min="0" step="1" inputMode="numeric" placeholder="6" value={fleetDraft.crewNumber} onChange={(event) => setFleetDraft((prev) => ({ ...prev, crewNumber: event.target.value }))} className={`h-14 rounded-2xl text-base font-semibold ${theme.input}`} />
                  </div>
                </div>
                <textarea
                  placeholder="Optional notes"
                  value={fleetDraft.notes}
                  onChange={(event) => setFleetDraft((prev) => ({ ...prev, notes: event.target.value }))}
                  className={`mt-3 min-h-24 w-full rounded-2xl border px-3 py-3 outline-none ${theme.input}`}
                />
                {fleetDraftError ? (
                  <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-300/30 dark:bg-rose-300/10 dark:text-rose-100">
                    {fleetDraftError}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" className={`${mutedButtonClass} rounded-2xl px-4 py-3 ${darkMode ? "!border-white/10 !bg-white/[0.04] !text-slate-300" : ""}`} onClick={() => { setFleetDraftError(""); setFleetFormOpen(false); }}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="button-vessel-primary rounded-2xl px-4 py-3"
                    onClick={() => {
                      const cleanName = String(fleetDraft.vesselName || "").trim();
                      const cleanLength = Number(fleetDraft.lengthFeet);
                      const cleanFlag = normalizeFlag(fleetDraft.flag);
                      if (!cleanName) {
                        setFleetDraftError("Enter a vessel name before creating a new vessel.");
                        return;
                      }
                      if (!Number.isFinite(cleanLength) || cleanLength <= 0) {
                        setFleetDraftError("Length must be entered in feet.");
                        return;
                      }
                      if (!fleetDraft.vesselType) {
                        setFleetDraftError("Choose yacht type.");
                        return;
                      }
                      if (!cleanFlag) {
                        setFleetDraftError("Select a flag before choosing home port.");
                        return;
                      }
                      if (!fleetDraft.homePort) {
                        setFleetDraftError("Choose a home port for the selected flag.");
                        return;
                      }
                      setFleetDraftError("");
                      const didCreate = onAddFleetVessel?.(fleetDraft);
                      if (didCreate !== false) {
                        setFleetFormOpen(false);
                      }
                    }}
                  >
                    Create Vessel
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="min-h-0">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {fleetVessels.map((vessel) => {
                  const vesselMetrics = fleetMetricsByVessel?.[vessel.id] || {};
                  const crewCount = Number(vessel?.details?.crewNumber ?? vessel?.crewProfiles?.length ?? 0) || 0;
                  const statusLabel = vessel?.details?.status || "Operational";
                  const isActive = vessel?.id === activeVesselId;
                  const vesselToneClass = darkMode
                    ? "border-white/12 bg-slate-900/94"
                    : "border-slate-200/90 bg-slate-50/95";
                  const metricToneClass = darkMode
                    ? "border-white/10 bg-slate-950/45"
                    : "border-slate-200/90 bg-white/78";
                  const fleetMetricCards = [
                    { label: "Tasks", value: vesselMetrics.taskCount || 0 },
                    { label: "Alerts", value: vesselMetrics.alertCount || 0 },
                    { label: "Approval", value: vesselMetrics.approvalCount || 0 },
                    { label: "Route", value: vesselMetrics.routeDistanceNm ? `${vesselMetrics.routeDistanceNm.toFixed(1)} nm` : "Draft" },
                  ];

                  return (
                    <div key={vessel.id} className={`relative flex h-full flex-col gap-2.5 overflow-hidden rounded-[22px] border p-4 transition-all duration-200 ${vesselToneClass} ${isActive ? (darkMode ? "ring-1 ring-cyan-300/25" : "ring-1 ring-amber-300/60") : ""}`}>
                      <div className="flex items-start justify-between gap-2.5">
                        <div>
                          <div className={fleetLabelClass}>Vessel</div>
                          <div className={`mt-0.5 text-base font-semibold ${theme.textPrimary}`}>{vessel.name}</div>
                        </div>
                        {isActive ? <Badge className={`px-2 py-0.5 text-[10px] ${darkMode ? "border border-vessel bg-[rgba(var(--vessel-primary-rgb),0.18)] text-vessel-accent" : "border border-vessel bg-[rgba(var(--vessel-primary-rgb),0.10)] text-vessel-accent"}`}>Current</Badge> : null}
                      </div>
                      <div className={fleetDetailGridClass}>
                        <div className="flex items-center justify-between gap-3"><span>Status</span><span className={theme.textPrimary}>{statusLabel}</span></div>
                        <div className="flex items-center justify-between gap-3"><span>Crew</span><span className={theme.textPrimary}>{crewCount}</span></div>
                        <div className="flex items-center justify-between gap-3"><span>Home port</span><span className={`${theme.textPrimary} text-right`}>{vessel?.details?.homePort || "Not set"}</span></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {fleetMetricCards.map((metric) => (
                          <div key={metric.label} className={`rounded-2xl border p-3 ${metricToneClass}`}>
                            <div className="app-compact-label"><SmartLabel label={metric.label} active={isActive} /></div>
                            <div className={`mt-1 text-sm font-semibold ${theme.textPrimary}`}>{metric.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-auto pt-1">
                        {isActive ? (
                          <Button
                            type="button"
                            variant="outline"
                            disabled
                            className={`${mutedButtonClass} h-11 w-full cursor-not-allowed ${darkMode ? "!border-white/10 !bg-white/[0.04] !text-slate-200" : ""}`}
                          >
                            Current Workspace
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => { onFleetOpenChange?.(false); onSwitchFleetVessel?.(vessel.id); }}
                            className={`${primaryButtonClass} h-11 w-full ${darkMode ? "!border-cyan-300/30 !bg-cyan-300/10 !text-cyan-100" : ""}`}
                          >
                            Open Vessel
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AppSectionCards({
  darkMode = false,
  expenseView,
  stats,
  currency,
  visibleModuleKeys = [],
  fleetCount = 1,
  onShowCommand,
  onShowRoute,
  onShowTasksMaintenance,
  onShowCrewCertificates,
  onShowExpenses,
  onShowDocuments,
  onShowSettings,
  onShowFleet,
  onDesktopShowCommand,
  onDesktopShowRoute,
  onDesktopShowTasksMaintenance,
  onDesktopShowCrewCertificates,
  onDesktopShowExpenses,
  onDesktopShowDocuments,
}) {
  const crewAndCertificatesVisible = visibleModuleKeys.includes("crew") || visibleModuleKeys.includes("certificates");
  const tasksVisible = visibleModuleKeys.includes("tasks") || visibleModuleKeys.includes("maintenance");
  const approvalsVisible = visibleModuleKeys.includes("expenses");
  const desktopItems = [
    visibleModuleKeys.includes("today") ? { key: "command", label: "Dashboard", value: stats.todayAttentionCount || 0, icon: TriangleAlert, active: expenseView === "command", onClick: onDesktopShowCommand || onShowCommand } : null,
    tasksVisible ? { key: "tasks-maintenance", label: "Tasks", value: `${stats.totalObjectives || 0} open · ${stats.maintenanceDue || 0} due`, icon: CheckCircle2, active: expenseView === "tasks-maintenance", onClick: onDesktopShowTasksMaintenance || onShowTasksMaintenance } : null,
    approvalsVisible ? { key: "expenses-approvals", label: "Approval", value: `${stats.pendingApprovals || 0} waiting`, icon: Wallet, active: expenseView === "expenses-approvals", onClick: onDesktopShowExpenses || onShowExpenses } : null,
    crewAndCertificatesVisible ? {
      key: "crew-certificates",
      label: "Crew",
      value: `${stats.crewProfiles || 0} crew · ${stats.certificateDue || 0} due`,
      icon: Users,
      active: expenseView === "crew-certificates",
      onClick: onDesktopShowCrewCertificates || onShowCrewCertificates,
    } : null,
    visibleModuleKeys.includes("documents") ? { key: "documents", label: "Docs", value: stats.documentCount || 0, icon: Receipt, active: expenseView === "documents", onClick: onDesktopShowDocuments || onShowDocuments } : null,
  ].filter(Boolean);
  const mobileItems = [
    visibleModuleKeys.includes("today") ? { key: "command", label: "Home", value: String(stats.todayAttentionCount || 0), icon: LayoutDashboard, onClick: onShowCommand } : null,
    tasksVisible ? { key: "tasks-maintenance", label: "Tasks", value: `${stats.totalObjectives || 0}`, icon: CheckCircle2, onClick: onShowTasksMaintenance } : null,
    approvalsVisible ? { key: "expenses-approvals", label: "Approve", value: `${stats.pendingApprovals || 0}`, icon: Wallet, onClick: onShowExpenses } : null,
    crewAndCertificatesVisible ? { key: "crew-certificates", label: "Crew", value: `${stats.crewProfiles || 0}`, icon: Users, onClick: onShowCrewCertificates } : null,
    visibleModuleKeys.includes("documents") ? { key: "documents", label: "Docs", value: `${stats.documentCount || 0}`, icon: Receipt, onClick: onShowDocuments } : null,
  ].filter(Boolean);
  const mobileNavItems = mobileItems.filter((item) => item?.key && item?.label && item?.value !== undefined);

  return (
    <>
      <div
        className="app-card-grid mb-6 hidden md:grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(172px, 1fr))" }}
      >
        {desktopItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              item.onClick?.();
            }}
            className="h-full min-w-0 text-left"
          >
            <SectionNavCard label={item.label} value={item.value} icon={item.icon} active={item.active} darkMode={darkMode} />
          </button>
        ))}
      </div>

      <div
        className={`fixed inset-x-3 bottom-3 z-[3000] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[28px] border p-2 pb-[calc(0.55rem+env(safe-area-inset-bottom))] shadow-[0_-14px_44px_-18px_rgba(17,46,39,0.24)] backdrop-blur-2xl md:hidden ${
          darkMode ? "border-[var(--vessel-border-dark)] bg-[rgba(4,12,18,0.86)] text-[#f4fbf6]" : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.88)] text-[#13231d]"
        }`}
      >
        <div className="grid w-full min-w-0 grid-cols-5 gap-1 pb-0.5 min-[390px]:gap-1.5">
          {mobileNavItems.map((item) => {
            const isActive = expenseView === item.key;
            return (
              <BottomNavButton
                key={`nav-${item.key}`}
                onClick={(event) => {
                  event?.preventDefault?.();
                  event?.stopPropagation?.();
                  item.onClick?.();
                }}
                darkMode={darkMode}
                label={item.label}
                value={item.value}
                icon={item.icon}
                active={isActive}
              >
                {item.label}
              </BottomNavButton>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function AppDialogs({
  darkMode = false,
  quoteDeleteRequest,
  onConfirmRemoveQuote,
  onCancelRemoveQuote,
  taskDeleteRequest,
  onConfirmDeleteTask,
  onCancelDeleteTask,
  crewExpenseDeleteRequest,
  onConfirmDeleteCrewExpense,
  onCancelDeleteCrewExpense,
}) {
  return (
    <>
      <ConfirmActionDialog
        isOpen={Boolean(quoteDeleteRequest)}
        title="Remove quote?"
        message={`This will remove ${quoteDeleteRequest?.supplier || "this quote"} from the task and from Expenses & Quotations.`}
        confirmLabel="Confirm"
        cancelLabel="Return"
        onConfirm={onConfirmRemoveQuote}
        onCancel={onCancelRemoveQuote}
        darkMode={darkMode}
      />
      <ConfirmActionDialog
        isOpen={Boolean(taskDeleteRequest)}
        title="Delete task?"
        message={`This will remove ${taskDeleteRequest?.name || "this task"} and its related quotes from the app.`}
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={onConfirmDeleteTask}
        onCancel={onCancelDeleteTask}
        darkMode={darkMode}
      />
      <ConfirmActionDialog
        isOpen={Boolean(crewExpenseDeleteRequest)}
        title="Delete crew expense?"
        message={`This will remove ${crewExpenseDeleteRequest?.title || "this crew expense"} from Crew Expenses.`}
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={onConfirmDeleteCrewExpense}
        onCancel={onCancelDeleteCrewExpense}
        darkMode={darkMode}
      />
    </>
  );
}

export function MaintenanceReminderModal({
  darkMode = false,
  maintenancePopupItem,
  maintenancePopupFollowUp = false,
  postponeDate,
  onPostponeDateChange,
  onCompleteMaintenanceItem,
  onPostponeMaintenanceTomorrow,
  onNoteMaintenanceReminder,
  onRemindMaintenanceLater,
  onPostponeMaintenanceReminder,
}) {
  if (!maintenancePopupItem) return null;

  const theme = themeClasses(darkMode);

  return (
    <div className="fixed inset-0 z-[30000] flex items-center justify-center bg-black/45 p-4">
      <div className={`w-full max-w-xl rounded-lg border p-5 shadow-2xl ${darkMode ? "border-[#2a3a32] bg-[#111a16] text-[#f4fbf6]" : "border-[#d7e8df] bg-[#fbfefd] text-[#1d2b24]"}`}>
        <div className="text-premium-label mb-2 text-xs font-semibold uppercase">Maintenance Reminder</div>
        <h2 className="text-2xl font-semibold">{maintenancePopupItem.title}</h2>
        <p className={`mt-1 text-sm ${theme.textSecondary}`}>{maintenancePopupItem.area} - Due {maintenancePopupItem.nextDueDate}</p>
        <div className="mt-4 rounded-lg bg-amber-50 p-4 text-amber-900">
          {maintenancePopupFollowUp
            ? "Seven hours have passed since this was noted. Is the maintenance completed?"
            : "This maintenance item needs attention. Choose how you want to handle the reminder."}
        </div>

        {maintenancePopupFollowUp ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Button
              onClick={() => onCompleteMaintenanceItem(maintenancePopupItem.id)}
              className="button-vessel-primary rounded-lg px-4 py-6 text-white"
            >
              Completed
            </Button>
            <Button
              variant="outline"
              onClick={() => onPostponeMaintenanceTomorrow(maintenancePopupItem)}
              disabled={maintenancePopupItem.extensionUsed}
              className={`rounded-lg px-4 py-6 ${darkMode ? "border-[#31443a] bg-[#111a16] text-[#f4fbf6] hover:bg-[#22312a]" : "border-[#c9ded3] bg-white text-[#40534a] hover:bg-[#f3faf6]"}`}
            >
              {maintenancePopupItem.extensionUsed ? "Extension Already Used" : "Postponed - Tomorrow"}
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="grid gap-3 lg:grid-cols-3">
              <Button
                onClick={() => onNoteMaintenanceReminder(maintenancePopupItem)}
                className="button-vessel-primary rounded-lg px-4 py-6 text-white"
              >
                Noted
              </Button>
              <Button
                variant="outline"
                onClick={() => onRemindMaintenanceLater(maintenancePopupItem)}
                className={`rounded-lg px-4 py-6 ${darkMode ? "border-[#31443a] bg-[#111a16] text-[#f4fbf6] hover:bg-[#22312a]" : "border-[#c9ded3] bg-white text-[#40534a] hover:bg-[#f3faf6]"}`}
              >
                Remind Me Later
              </Button>
              <div className={`rounded-lg border p-3 ${darkMode ? "border-[#31443a] bg-[#18211d]/80" : "border-[#d8e7df] bg-white"}`}>
                <div className={`mb-2 text-sm font-medium ${theme.textSecondary}`}>Postpone</div>
                {maintenancePopupItem.extensionUsed ? (
                  <div className="mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                    This maintenance cycle has already been extended once.
                  </div>
                ) : null}
                <Input
                  type="date"
                  min={todayDateString()}
                  max={clampMaintenanceDueDate(maintenancePopupItem, dateStringFromNow(14))}
                  value={postponeDate}
                  onChange={(event) => onPostponeDateChange(event.target.value)}
                  disabled={maintenancePopupItem.extensionUsed}
                  className={`mb-2 rounded-lg h-12 ${theme.input}`}
                />
                <Button
                  onClick={() => onPostponeMaintenanceReminder(maintenancePopupItem, postponeDate)}
                  disabled={maintenancePopupItem.extensionUsed}
                  className="button-vessel-primary w-full rounded-lg px-4 py-4 text-white"
                >
                  {maintenancePopupItem.extensionUsed ? "Extension Used" : "Set Date"}
                </Button>
              </div>
            </div>
            <p className={`text-xs ${theme.textSecondary}`}>Noted asks again in 7 hours. Remind Me Later asks again in 1 hour. Postpone adjusts the due date in Maintenance.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AppBanner({ banner, onDismiss, darkMode = false }) {
  if (!banner) return null;
  const variants = {
    error: darkMode ? "border-[#6a3131] bg-[#2b1717] text-[#ffd4d4]" : "border-[#f1b5b5] bg-[#fff1f1] text-[#8a1f2b]",
    success: darkMode ? "border-[#285445] bg-[#17352c] text-[#d7f7eb]" : "border-[#b7dbc9] bg-[#eef8f3] text-[#285446]",
    info: darkMode ? "border-[#335067] bg-[#182734] text-[#d7ebff]" : "border-[#bfd7ea] bg-[#f2f8fc] text-[#24445c]",
  };

  return (
    <div className={`fixed left-4 right-4 top-4 z-[10001] mx-auto flex max-w-xl items-start justify-between gap-3 rounded-2xl border p-4 shadow-2xl ${variants[banner.type] || variants.info}`}>
      <div>
        {banner.title ? <div className="font-semibold">{banner.title}</div> : null}
        <div className="text-sm">{banner.message}</div>
      </div>
      <button type="button" onClick={onDismiss} className="rounded-lg px-2 py-1 text-sm font-semibold opacity-80 hover:opacity-100">
        x
      </button>
    </div>
  );
}

export function HistoryPanel({
  actorName,
  onActorNameChange,
  darkMode = false,
  retrieveOpen = false,
  onToggleRetrieve,
  declinedTasks,
  onRetrieveDeclinedTask,
  history,
}) {
  const theme = themeClasses(darkMode);

  return (
    <div className="space-y-4">
      <div>
        <div className={`mb-2 text-sm font-medium ${theme.textPrimary}`}>Changed by</div>
        {onActorNameChange ? (
          <Input value={actorName} onChange={(event) => onActorNameChange(event.target.value)} placeholder="Name" className={`h-12 rounded-lg ${theme.input}`} />
        ) : (
          <div className={`flex min-h-12 items-center rounded-lg border px-3 text-sm font-semibold ${theme.input}`}>
            {actorName || "Captain Graham Ellis"}
          </div>
        )}
      </div>
      <div className={`rounded-lg border p-3 ${darkMode ? "border-[#2a3a32] bg-[#18211d]/80" : "border-[#d8e7df] bg-[#fbfefd]"}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className={`text-sm font-semibold ${theme.textPrimary}`}>Declined Tasks</div>
            <div className={`text-xs ${theme.textSecondary}`}>Retrieve tasks that were declined and moved from Objectives.</div>
          </div>
          <Button
            variant="outline"
            className={`rounded-lg px-3 py-3 ${darkMode ? "border-[#31443a] bg-[#111a16] text-[#f4fbf6] hover:bg-[#22312a]" : "border-[#c9ded3] bg-white text-[#40534a] hover:bg-[#f3faf6]"}`}
            onClick={onToggleRetrieve}
          >
            Retrieve
          </Button>
        </div>
        {retrieveOpen && (
          <div className="space-y-2">
            {declinedTasks.length === 0 ? (
              <div className={`rounded-lg border border-dashed p-4 text-center text-sm ${theme.textSecondary} ${darkMode ? "border-[#31443a]" : "border-[#c9ded3]"}`}>
                No declined tasks in history.
              </div>
            ) : (
              declinedTasks.map((task) => (
                <button
                  key={`retrieve-${task.id}`}
                  type="button"
                  onClick={() => onRetrieveDeclinedTask(task.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${darkMode ? "border-[#31443a] bg-[#111a16] text-[#f4fbf6] hover:bg-[#22312a]" : "border-[#d8e7df] bg-white text-[#1d2b24] hover:bg-[#eef8f3]"}`}
                >
                  <div className="font-semibold">{task.name}</div>
                  <div className={`text-sm ${theme.textSecondary}`}>{task.id} - {task.area} - declined {formatHistoryTime(task.declinedAt)}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <div className={`rounded-lg border p-3 ${darkMode ? "border-[#2a3a32] bg-[#18211d]/80" : "border-[#d8e7df] bg-[#fbfefd]"}`}>
        <div className={`mb-3 grid gap-2 text-xs font-semibold uppercase ${theme.textSecondary} lg:grid-cols-4`}>
          <div>Time</div>
          <div>Who</div>
          <div>Section</div>
          <div>Change</div>
        </div>
        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <div className={`rounded-lg border border-dashed p-4 text-center text-sm ${theme.textSecondary} ${darkMode ? "border-[#31443a]" : "border-[#c9ded3]"}`}>
              No changes recorded yet.
            </div>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className={`grid gap-2 rounded-lg border p-3 text-sm lg:grid-cols-4 ${darkMode ? "border-[#2a3a32] bg-[#111a16]" : "border-[#d8e7df] bg-white"}`}>
                <div className={theme.textSecondary}>{formatHistoryTime(entry.at)}</div>
                <div className={theme.textPrimary}>{entry.by}</div>
                <div className={theme.textPrimary}>{entry.section}</div>
                <div>
                  <div className={`font-semibold ${theme.textPrimary}`}>{entry.action}</div>
                  <div className={theme.textSecondary}>{entry.detail}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function TaskDetails({
  selectedTask,
  darkMode = false,
  canEdit = true,
  assigneeOptions = [],
  currency,
  exchangeRates,
  onDeleteTaskRequest,
  onUpdateTaskStatus,
  onUpdateTask,
  onTaskPhotoUpload,
  onRemoveTaskPhoto,
  onTaskAttachmentUpload,
  onRemoveTaskAttachment,
  onAddTaskComment,
  onAddQuote,
  onUpdateQuote,
  onQuoteReceiptUpload,
  onQuoteRemoveRequest,
}) {
  const theme = themeClasses(darkMode);
  const scopedAssigneeOptions = Array.isArray(assigneeOptions) ? assigneeOptions.filter(Boolean) : [];
  const [commentDraft, setCommentDraft] = useState("");

  useEffect(() => {
    setCommentDraft("");
  }, [selectedTask?.id]);

  if (!selectedTask) {
    return <div className={`p-8 text-center ${theme.textSecondary}`}>Select a task.</div>;
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="rv-masthead-kicker">{selectedTask.id}</div>
          <h2 className={`mt-1.5 text-2xl ${theme.textPrimary}`}>{selectedTask.name}</h2>
          <p className={`mt-0.5 text-sm ${theme.textSecondary}`}>{selectedTask.area}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className={neutralBadgeClass(darkMode)}>{selectedTask.assignee || "Unassigned"}</Badge>
            <Badge className={neutralBadgeClass(darkMode)}>{selectedTask.department || "General"}</Badge>
            <Badge className={neutralBadgeClass(darkMode)}>{formatTaskPriorityLabel(selectedTask.priority)} priority</Badge>
            {selectedTask.dueDate ? <Badge className={neutralBadgeClass(darkMode)}>Due {formatAppDate(selectedTask.dueDate)}</Badge> : null}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2.5 md:w-56">
          {canEdit ? <Select value={selectedTask.status} onValueChange={(value) => onUpdateTaskStatus(selectedTask.id, value)}>
            <SelectTrigger className={`h-12 w-full rounded-xl md:rounded-lg ${theme.input}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>{formatTaskStatusLabel(option)}</SelectItem>
              ))}
            </SelectContent>
          </Select> : <Badge className={neutralBadgeClass(darkMode)}>{formatTaskStatusLabel(selectedTask.status)}</Badge>}
          {canEdit ? (
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                type="button"
                variant="outline"
                className="app-action-button min-h-[44px] rounded-xl px-1 py-2 text-xs"
                onClick={() => onUpdateTaskStatus(selectedTask.id, "waiting-approval")}
              >
                Approval
              </Button>
              <Button
                type="button"
                variant="outline"
                className="app-action-button min-h-[44px] rounded-xl px-1 py-2 text-xs"
                onClick={() => onUpdateTaskStatus(selectedTask.id, "completed")}
              >
                Done
              </Button>
              <Button
                type="button"
                variant="outline"
                className="app-action-button min-h-[44px] rounded-xl px-1 py-2 text-xs"
                onClick={() => onUpdateTaskStatus(selectedTask.id, "blocked")}
              >
                Blocked
              </Button>
            </div>
          ) : null}
          {canEdit ? <button
            type="button"
            className="min-h-[44px] self-end text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--mb-critical-text)] transition-colors hover:text-[var(--mb-critical)]"
            onClick={() => onDeleteTaskRequest({ id: selectedTask.id, name: selectedTask.name })}
          >
            Delete task
          </button> : <Badge className={neutralBadgeClass(darkMode)}>View only</Badge>}
        </div>
      </div>

      <ConfirmableTaskFields task={selectedTask} darkMode={darkMode} canEdit={canEdit} assigneeOptions={scopedAssigneeOptions} onConfirm={onUpdateTask} />

      <div className="mb-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className={`rounded-lg p-4 ${theme.subtle}`}>
          <div className={`mb-2 flex items-center gap-2 text-sm font-medium ${theme.textPrimary}`}>
            <Receipt className="h-4 w-4" />
            Task Photos
          </div>
          {canEdit ? <Input type="file" accept="image/*" multiple onChange={(event) => onTaskPhotoUpload(selectedTask.id, event.target.files)} className={`rounded-lg h-12 ${theme.input}`} /> : null}
          {selectedTask.photos && selectedTask.photos.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-4">
              {selectedTask.photos.map((photo, index) => (
                <div key={`${selectedTask.id}-photo-${index}`} className={`relative ${filePreviewCardClass(darkMode)}`}>
                  {canEdit ? <button
                    type="button"
                    onClick={() => onRemoveTaskPhoto(selectedTask.id, index)}
                    className={`absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold shadow ${darkMode ? "bg-[#381d1f]/95 text-[#ffd8dc] hover:bg-[#4a2326]" : "bg-[#fff0ed]/95 text-[#9b2c20] hover:bg-[#ffe0da]"}`}
                    aria-label="Remove task photo"
                  >
                    x
                  </button> : null}
                  <img src={photo} alt={`Task ${index + 1}`} className="h-24 w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className={`mt-2 text-sm ${theme.textSecondary}`}>No task photos uploaded.</div>
          )}
        </div>

        <div className={`rounded-lg p-4 ${theme.subtle}`}>
          <div className={`mb-2 text-sm font-medium ${theme.textPrimary}`}>Task Attachments</div>
          {canEdit ? <Input
            type="file"
            multiple
            onChange={(event) => onTaskAttachmentUpload(selectedTask.id, event.target.files)}
            className={`rounded-lg h-12 ${theme.input}`}
          /> : null}
          {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
            <div className="mt-3 space-y-2">
              {selectedTask.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${darkMode ? "border-[#31443a] bg-[#18211d]" : "border-[#d8e7df] bg-white"}`}
                >
                  <div className="min-w-0">
                    <div className={`truncate text-sm font-medium ${theme.textPrimary}`}>{attachment.name}</div>
                    <div className={`text-xs ${theme.textSecondary}`}>{attachment.type || "Attachment"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={attachment.dataUrl}
                      download={attachment.name}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${darkMode ? "bg-[#22312a] text-[#dce9e1]" : "bg-[#e8eee9] text-[#40534a]"}`}
                    >
                      Open
                    </a>
                    {canEdit ? <button
                      type="button"
                      onClick={() => onRemoveTaskAttachment(selectedTask.id, attachment.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold ${darkMode ? "bg-[#381d1f] text-[#ffd8dc] hover:bg-[#4a2326]" : "bg-[#fff0ed] text-[#9b2c20] hover:bg-[#ffe0da]"}`}
                      aria-label="Remove attachment"
                    >
                      x
                    </button> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`mt-2 text-sm ${theme.textSecondary}`}>No task attachments uploaded.</div>
          )}
        </div>
      </div>

      <div className={`mb-5 rounded-lg p-4 ${theme.subtle}`}>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className={`text-sm font-semibold ${theme.textPrimary}`}>Comments</div>
            <div className={`text-xs ${theme.textSecondary}`}>Leave updates, handover notes, and owner-facing progress in one place.</div>
          </div>
          <Badge className={`w-fit ${neutralBadgeClass(darkMode)}`}>{selectedTask.comments?.length || 0} notes</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <textarea
            disabled={!canEdit}
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
            placeholder="Add a quick task comment..."
            className={`min-h-24 w-full rounded-lg border px-3 py-2 outline-none ${theme.input}`}
          />
          {canEdit ? <Button
            type="button"
            onClick={() => {
              onAddTaskComment(selectedTask.id, commentDraft);
              setCommentDraft("");
            }}
            disabled={!commentDraft.trim()}
            className="button-vessel-primary rounded-lg px-4 py-5 text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            Add Comment
          </Button> : null}
        </div>
        {selectedTask.comments && selectedTask.comments.length > 0 ? (
          <div className="mt-4 space-y-2">
            {selectedTask.comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-lg border p-3 ${darkMode ? "border-[#31443a] bg-[#18211d]" : "border-[#d8e7df] bg-white"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className={`text-sm font-medium ${theme.textPrimary}`}>{comment.by || "User"}</div>
                  <div className={`text-xs ${theme.textSecondary}`}>{formatHistoryTime(comment.at)}</div>
                </div>
                <div className={`mt-2 text-sm ${theme.textPrimary}`}>{comment.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`mt-3 text-sm ${theme.textSecondary}`}>No comments yet.</div>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>Expenses and Quotations</h3>
        {canEdit ? <Button
          variant="outline"
          className="vessel-outline-button w-full rounded-xl px-4 py-5 md:w-auto md:rounded-lg md:py-6"
          onClick={() => onAddQuote(selectedTask.id)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Quote
        </Button> : null}
      </div>

      <div className="space-y-3">
        {selectedTask.quotes.length === 0 ? (
          <div className={`rounded-lg border border-dashed p-6 text-center text-sm ${theme.textSecondary} ${darkMode ? "border-[#31443a]" : "border-[#c9ded3]"}`}>
            No expenses or quotations yet.
          </div>
        ) : (
          <>
            <div className={`rounded-lg border p-4 ${darkMode ? "border-[#2a3a32] bg-[#18211d]/80" : "border-[#d8e7df] bg-white"}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className={`text-sm font-semibold ${theme.textPrimary}`}>Quote Comparison</div>
                  <div className={`text-xs ${theme.textSecondary}`}>Compare selected prices before choosing who to use.</div>
                </div>
                <Badge className={neutralBadgeClass(darkMode)}>{selectedTask.quotes.filter((quote) => quote.includeInSummary).length} selected</Badge>
              </div>
              {selectedTask.quotes.some((quote) => quote.includeInSummary) ? (
                <div className="grid gap-2">
                  {selectedTask.quotes.filter((quote) => quote.includeInSummary).map((quote) => (
                    <div key={`${quote.id}-compare`} className={`grid gap-2 rounded-lg border px-3 py-2 text-sm sm:grid-cols-2 xl:grid-cols-4 ${darkMode ? "border-[#2a3a32] bg-[#111a16]" : "border-[#d8e7df] bg-[#fbfefd]"}`}>
                      <div className={`font-medium ${theme.textPrimary}`}>{quote.supplier || "Quote"}</div>
                      <div>{convertedMoney(quote.amount, quote.currency || "USD", currency, exchangeRates)}</div>
                      <div><Badge className={moneyStatusStyles[quote.status] || moneyStatusStyles.requested}>{titleCase(quote.status || "requested")}</Badge></div>
                      <div><Badge className={isPaidMoneyStatus(quote.status) ? successBadgeClass(darkMode) : warningBadgeClass(darkMode)}>{isPaidMoneyStatus(quote.status) ? "Paid" : "Unpaid"}</Badge></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`rounded-lg border border-dashed px-4 py-5 text-sm ${theme.textSecondary} ${darkMode ? "border-[#31443a]" : "border-[#c9ded3]"}`}>
                  No quotations are selected for the summary yet.
                </div>
              )}
            </div>
            {selectedTask.quotes.map((quote) => (
              <QuoteRow
                key={quote.id}
                quote={quote}
                canEdit={canEdit}
                onConfirm={(patch) => onUpdateQuote(selectedTask.id, quote.id, patch)}
                onToggleIncludeInSummary={(includeInSummary) => onUpdateQuote(selectedTask.id, quote.id, { includeInSummary })}
                onReceiptUpload={(event) => onQuoteReceiptUpload(selectedTask.id, quote.id, event.target.files)}
                onRemoveRequest={() => onQuoteRemoveRequest({ taskId: selectedTask.id, quoteId: quote.id, supplier: quote.supplier })}
                darkMode={darkMode}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export function TaskMaintenanceWorkspace({
  darkMode = false,
  activePanel = "tasks",
  onChangePanel,
  tasksView,
  maintenanceView,
}) {
  return (
    <div id="tasks-maintenance-section" data-jump-target style={{ "--jump-radius": "28px" }} className="jump-highlight-target grid gap-4 rounded-[28px]">
      <ModuleMasthead
        kicker="Operations"
        title="The work board."
        subtitle="Track what needs doing, what is in progress, what needs approval, and what is done."
        tabs={[
          { key: "tasks", label: "Tasks", active: activePanel === "tasks", onSelect: () => onChangePanel("tasks") },
          { key: "maintenance", label: "Maintenance", active: activePanel === "maintenance", onSelect: () => onChangePanel("maintenance") },
        ]}
      />
      {activePanel === "maintenance" ? maintenanceView : tasksView}
    </div>
  );
}

export function CrewCertificatesWorkspace({
  darkMode = false,
  activePanel = "crew",
  onChangePanel,
  crewView,
  certificatesView,
}) {
  return (
    <div id="crew-certificates-section" data-jump-target style={{ "--jump-radius": "28px" }} className="jump-highlight-target grid gap-4 rounded-[28px]">
      <ModuleMasthead
        kicker="People & Compliance"
        title="Crew readiness."
        subtitle="Profiles and certificate risk live together, so people and compliance read in one place."
        tabs={[
          { key: "crew", label: "Crew", active: activePanel === "crew", onSelect: () => onChangePanel("crew") },
          { key: "certificates", label: "Certificates", active: activePanel === "certificates", onSelect: () => onChangePanel("certificates") },
        ]}
      />
      {activePanel === "certificates" ? certificatesView : crewView}
    </div>
  );
}

export function DocumentsView({ darkMode = false, documents = [], vesselName = "Contessa" }) {
  const theme = themeClasses(darkMode);
  return (
    <div
      id="documents-section"
      data-jump-target
      style={{ "--jump-radius": "28px" }}
      className="jump-highlight-target scroll-mt-24 rounded-[28px] md:scroll-mt-28"
    >
      <ModuleMasthead
        kicker="Documents"
        title="The document room."
        subtitle={`Vessel records, legal notices, and manuals for ${vesselName}, kept separate from daily command decisions.`}
      />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {documents.map((document) => (
          <Card id={`item-${document.id}`} data-jump-target style={{ "--jump-radius": "22px" }} key={document.id} className={`jump-highlight-target rounded-[24px] md:rounded-[22px] ${theme.card}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="app-kicker">{document.category}</div>
                  <div className={`mt-2 text-xl font-semibold ${theme.textPrimary}`}>{document.title}</div>
                </div>
                <Badge className={darkMode ? "bg-[#183029] text-[#d7f6e9]" : "bg-[#ebf6f1] text-[#166155]"}>{document.status}</Badge>
              </div>
              <div className={`mt-4 text-sm leading-6 ${theme.textSecondary}`}>{document.notes}</div>
              <div className={`app-compact-label mt-4 ${theme.textSecondary}`}>Owner: {document.owner}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SettingsWorkspaceView({
  darkMode = false,
  vesselProfile,
  currentRole,
  appMode,
  shareUrlStatus,
  localShareWarning,
  canEdit = false,
  jsonImportInputRef,
  onImportAppStateJson,
  onExportCsv,
  onExportAppStateJson,
  onOpenJsonImportPicker,
  onPrintSummary,
  onResetDemoData,
  onOpenHistory,
}) {
  const theme = themeClasses(darkMode);
  return (
    <div className="grid gap-4">
      <ModuleMasthead
        kicker="Settings"
        title="Vessel profile & app state."
        subtitle="Operational defaults, exports, and legal controls stay visible here without crowding the command surface."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className={`rounded-[24px] md:rounded-[22px] ${theme.card}`}>
          <CardContent className="space-y-4 p-5">
            <div className="app-kicker">Vessel Profile</div>
            <div className={`text-xl font-semibold ${theme.textPrimary}`}>{vesselProfile?.vesselName || "Contessa"}</div>
            <div className={`grid gap-2 text-sm ${theme.textSecondary}`}>
              <div>Draft: <span className={theme.textPrimary}>{vesselProfile?.draft || 0} m</span></div>
              <div>Beam: <span className={theme.textPrimary}>{vesselProfile?.beam || 0} m</span></div>
              <div>Cruising speed: <span className={theme.textPrimary}>{vesselProfile?.cruisingSpeedKnots || 0} kn</span></div>
              <div>Fuel burn: <span className={theme.textPrimary}>{vesselProfile?.fuelBurnPerHour || 0} L/h</span></div>
              <div>Fuel capacity: <span className={theme.textPrimary}>{vesselProfile?.fuelCapacity || 0} L</span></div>
            </div>
          </CardContent>
        </Card>
        <Card className={`rounded-[24px] md:rounded-[22px] ${theme.card}`}>
          <CardContent className="space-y-4 p-5">
            <div className="app-kicker">Access Preview</div>
            <div className={`grid gap-2 text-sm ${theme.textSecondary}`}>
              <div>Operating role: <span className={theme.textPrimary}>{titleCase(String(currentRole || "captain").replaceAll("_", " "))}</span></div>
              <div>Mode: <span className={theme.textPrimary}>{appMode === "editor" ? "Editor Mode" : "View Mode"}</span></div>
              <div>Public app URL: <span className={theme.textPrimary}>{shareUrlStatus?.isValid ? shareUrlStatus.url : "Not configured"}</span></div>
            </div>
            {localShareWarning ? <div className={`rounded-xl border p-3 text-sm ${darkMode ? "border-[#6c5a27] bg-[#2c2515] text-[#ffe7ad]" : "border-[#ecd28c] bg-[#fff8df] text-[#7a5416]"}`}>{localShareWarning}</div> : null}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className={`rounded-[24px] md:rounded-[22px] ${theme.card}`}>
          <CardContent className="space-y-3 p-5">
            <div className="app-kicker">Export & Share</div>
            <input
              ref={jsonImportInputRef}
              type="file"
              accept="application/json,.json"
              onChange={onImportAppStateJson}
              className="hidden"
            />
            <Button variant="outline" className="app-action-button w-full" onClick={onExportCsv}>Export CSV</Button>
            <Button variant="outline" className="app-action-button w-full" onClick={onExportAppStateJson}>Export Full JSON</Button>
            <Button variant="outline" className="app-action-button w-full" onClick={onPrintSummary}>Print / PDF</Button>
            {canEdit ? <Button variant="outline" className="app-action-button w-full" onClick={onOpenJsonImportPicker}>Import Full JSON</Button> : null}
          </CardContent>
        </Card>
        <Card className={`rounded-[24px] md:rounded-[22px] ${theme.card}`}>
          <CardContent className="space-y-3 p-5">
            <div className="app-kicker">Admin Utilities</div>
            <Button variant="outline" className="app-action-button w-full" onClick={onOpenHistory}>Open Activity History</Button>
            {canEdit ? <Button variant="outline" className={`w-full rounded-2xl px-4 py-5 md:rounded-xl ${darkMode ? "border-[#5b2a2a] bg-[#231515] text-[#ffd9d9] hover:bg-[#382020]" : "border-[#e8bcbc] bg-[#fff3f3] text-[#8a1f2b] hover:bg-[#ffe4e4]"}`} onClick={onResetDemoData}>Reset Demo Data</Button> : null}
            <div className={`rounded-xl border p-4 text-sm leading-6 ${darkMode ? "border-[#31443a] bg-[#18211d] text-[#dce9e1]" : "border-[#d8e7df] bg-[#f7fbf9] text-[#40534a]"}`}>
              <div className="font-semibold">{APP_LEGAL_SHORT_COPY}</div>
              <div className="mt-2">{APP_LEGAL_COPY}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { CrewView } from "./features/crew/crew-view.jsx";
export { CertificatesView } from "./features/certificates/certificates-view.jsx";
export { MaintenanceView } from "./features/maintenance/maintenance-view.jsx";
export { NotificationsView } from "./features/notifications/notifications-view.jsx";
export { DashboardCommandSearch, TodayOperationsView } from "./features/today/today-operations-view.jsx";
export { ExpensesView } from "./features/expenses/expenses-view.jsx";
export { RoutePlanningView } from "./features/route-planning/route-planning-view.jsx";

