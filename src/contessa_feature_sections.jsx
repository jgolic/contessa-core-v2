import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLayoutEffect, useRef } from "react";
import { useMemo } from "react";
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
import { AlertCircle, CheckCircle2, Compass, LayoutDashboard, Moon, Plus, Receipt, Settings, Share2, Sun, TriangleAlert, Users, Wallet, Wifi, WifiOff } from "./components/icons.jsx";
import {
  ASSIGNEE_OPTIONS,
  APP_FOOTER_NOTICE,
  APP_LEGAL_COPY,
  APP_LEGAL_SHORT_COPY,
  CURRENCY_OPTIONS,
  MONEY_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  TASK_DEPARTMENT_OPTIONS,
  TASK_STATUS_OPTIONS,
  VESSEL_STATE_MODE_OPTIONS,
  YACHT_AREA_OPTIONS,
  buildObjectivesFilterTabs,
  clampMaintenanceDueDate,
  convertedMoney,
  dateStringFromNow,
  daysUntil,
  filePreviewCardClass,
  formatHistoryTime,
  formatMoney,
  formatTaskPriorityLabel,
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
import { DEMO_ROLE_OPTIONS } from "./contessa_access.mjs";
import { APP_BRAND_NAME, ContessaUiLogo } from "./components/branding.jsx";
import { VesselTitle } from "./components/vessel_title.jsx";

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

const premiumLabelClass = "text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300";
const premiumValueClass = "text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50";
const primaryButtonClass = "app-primary-action-button inline-flex items-center justify-center";
const mutedButtonClass = "app-action-button inline-flex items-center justify-center";

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
  const wrapperRef = useRef(null);

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div ref={wrapperRef} className="relative min-w-0">
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </label>
      <input
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
        className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-cyan-300 dark:focus:ring-cyan-300/20 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
      />
      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-full z-[10000] mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-slate-950">
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
            <div className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
              No matching options
            </div>
          )}
        </div>
      ) : null}
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

function clampPopoverValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getNotificationPopoverPosition(anchorRect) {
  if (typeof window === "undefined") {
    return { top: 12, left: 12, width: 360, maxHeight: 420 };
  }

  const margin = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportWidth < 640;
  const width = isMobile
    ? Math.max(280, viewportWidth - margin * 2)
    : Math.min(420, viewportWidth - margin * 2);
  const left = isMobile
    ? margin
    : clampPopoverValue(anchorRect.right - width, margin, viewportWidth - width - margin);
  const top = clampPopoverValue(anchorRect.bottom + 10, margin, Math.max(margin, viewportHeight - 160));
  const maxHeight = isMobile
    ? viewportHeight - top - 96
    : Math.min(520, viewportHeight - top - 24);

  return {
    top,
    left,
    width,
    maxHeight: Math.max(280, maxHeight),
  };
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
      className={`relative h-11 w-11 shrink-0 overflow-visible rounded-2xl p-0 shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition-all duration-200 md:h-12 md:w-12 md:rounded-[20px] ${
        darkMode
          ? "border-cyan-300/25 bg-slate-900/90 text-cyan-100 shadow-[0_14px_36px_rgba(0,0,0,0.38)] hover:border-cyan-300/50 hover:bg-cyan-300/10"
          : "border-slate-200 bg-white/90 text-slate-900 hover:border-blue-300 hover:bg-blue-50 hover:shadow-[0_14px_34px_rgba(59,130,246,0.16)]"
      }`}
    >
      {safeCount > 0 ? <span className="absolute inset-0 animate-pulse rounded-2xl border border-rose-400/40" /> : null}
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
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return undefined;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition(getNotificationPopoverPosition(rect));
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef]);

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

  if (!mounted || !open || !position) return null;

  const notificationItems = Array.isArray(notifications) ? notifications.filter(Boolean) : [];
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
    ? "border-white/10 bg-slate-950 text-slate-50 shadow-[0_32px_110px_rgba(0,0,0,0.75)]"
    : "border-slate-200/90 bg-white text-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.26)]";
  const headerBorderClass = darkMode ? "border-white/10" : "border-slate-200";
  const headerTitleClass = darkMode ? "text-slate-50" : "text-slate-950";
  const headerSubtitleClass = darkMode ? "text-slate-300" : "text-slate-600";
  const countBadgeClass = darkMode
    ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
    : "border-rose-200 bg-rose-50 text-rose-700";
  const emptyStateClass = darkMode
    ? "border-white/10 bg-white/[0.04] text-slate-300"
    : "border-slate-200 bg-slate-50 text-slate-700";
  const rowClass = darkMode
    ? "border-transparent hover:border-cyan-300/30 hover:bg-cyan-300/10"
    : "border-transparent hover:border-blue-200 hover:bg-blue-50/80";
  const iconClass = darkMode
    ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
    : "border-blue-200 bg-blue-50 text-blue-700";
  const titleTextClass = darkMode ? "text-slate-50" : "text-slate-950";
  const contextTextClass = darkMode ? "text-slate-300" : "text-slate-600";
  const arrowClass = darkMode ? "border-white/10 bg-slate-950" : "border-slate-200 bg-white";

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        aria-label="Close notifications"
        className={`absolute inset-0 cursor-default ${darkMode ? "bg-black/30" : "bg-black/5"}`}
        onClick={onClose}
      />
      <aside
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: position.maxHeight,
        }}
        className={`fixed z-[10000] overflow-hidden rounded-3xl border backdrop-blur-xl ${panelSurfaceClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`absolute -top-2 right-7 h-4 w-4 rotate-45 border-l border-t ${arrowClass}`} />
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

        <div style={{ maxHeight: Math.max(180, position.maxHeight - 68) }} className={`notification-popover-list overflow-y-auto p-2 ${darkMode ? "notification-popover-list-dark" : ""}`}>
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
                      {notification.title || "Vessel alert"}
                    </p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityBadgeClass(notification)}`}>
                      {priorityLabel(notification)}
                    </span>
                  </div>
                  {notification.detail || notification.context ? (
                    <p className={`mt-1 line-clamp-2 text-sm leading-5 ${contextTextClass}`}>
                      {notification.detail || notification.context}
                    </p>
                  ) : null}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}

function getVesselIdentifier(vessel) {
  if (vessel?.imo) return `IMO ${vessel.imo}`;
  if (vessel?.officialNumber) return `Official No. ${vessel.officialNumber}`;
  if (vessel?.mmsi) return `MMSI ${vessel.mmsi}`;
  return "IMO pending verification";
}

function getVesselTitleSize(name = "") {
  const length = String(name || "").length;

  if (length <= 14) {
    return "text-[clamp(25px,7.8vw,36px)] lg:text-[40px]";
  }

  if (length <= 20) {
    return "text-[clamp(23px,6.8vw,32px)] lg:text-[34px]";
  }

  if (length <= 28) {
    return "text-[clamp(20px,5.8vw,28px)] lg:text-[30px]";
  }

  return "text-[clamp(18px,4.8vw,24px)] lg:text-[26px]";
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
  onConfirm,
}) {
  const theme = themeClasses(darkMode);
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
    setDraft({
      assignee: task.assignee || "",
      department: task.department || "General",
      dueDate: task.dueDate || "",
      priority: task.priority || "medium",
      notes: task.notes || "",
    });
  }, [task.assignee, task.department, task.dueDate, task.priority, task.notes, task.id]);

  return (
    <div className={`mb-5 rounded-lg p-4 ${theme.subtle}`}>
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          disabled={!canEdit}
          value={draft.assignee}
          onChange={(event) => setDraft((prev) => ({ ...prev, assignee: event.target.value }))}
          placeholder="Assignee"
          className={`rounded-lg h-12 ${theme.input}`}
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
            onClick={() => onConfirm(task.id, draft)}
            disabled={!isDirty}
            className="button-vessel-primary rounded-lg px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
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
}) {
  const theme = themeClasses(darkMode);
  const filterTabs = buildObjectivesFilterTabs(stats, statusFilter);
  const [mobileTaskPane, setMobileTaskPane] = useState(selectedTask ? "details" : "list");

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
    if (task.status === "completed") return "done";
    if (task.status === "approved" || task.quotes?.some((quote) => ["requested", "received"].includes(quote.status))) return "waiting-approval";
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
  ];
  const visibleTasks = Array.isArray(filteredTasks) ? filteredTasks : [];

  return (
    <>
      <div className={`app-panel app-panel-soft mb-4 min-w-0 overflow-hidden rounded-2xl p-3 shadow-md md:mb-6 md:rounded-lg ${theme.card}`}>
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onStatusFilterChange(tab.value)}
              className={`inline-flex min-h-[38px] shrink-0 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${tab.active ? darkMode ? "border-[var(--vessel-border-dark)] bg-[var(--vessel-primary-soft-dark)] text-[var(--vessel-text-accent-dark)] shadow-[0_10px_28px_var(--vessel-glow-dark)]" : "border-[var(--vessel-border)] bg-[var(--vessel-primary-soft)] text-[var(--vessel-text-accent)] shadow-[0_10px_24px_rgba(15,118,110,0.10)]" : darkMode ? "border-white/10 bg-white/[0.035] text-slate-300 hover:border-[var(--vessel-border-dark)] hover:bg-[var(--vessel-primary-soft-dark)] hover:text-[var(--vessel-text-accent-dark)]" : "border-slate-200/70 bg-white/55 text-slate-600 hover:border-[var(--vessel-border)] hover:bg-[var(--vessel-primary-soft)] hover:text-[var(--vessel-text-accent)]"}`}
            >
              <span className="whitespace-nowrap">{tab.label} <span className="opacity-70">({tab.count})</span></span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className={`text-xs leading-5 ${theme.textSecondary}`}>Focus the list first, then move into details only when needed.</div>
          {canEdit ? <Dialog open={newTaskOpen} onOpenChange={onNewTaskOpenChange}>
            <DialogTrigger asChild>
              <Button className="button-vessel-primary w-full rounded-xl px-4 py-4 text-white md:w-auto md:rounded-lg md:py-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className={`rounded-lg ${darkMode ? "bg-[#111a16] text-[#f4fbf6] border-[#2a3a32]" : "bg-white"}`}>
              <DialogHeader>
                <DialogTitle>Add Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Task name" value={newTask.name} onChange={(event) => onNewTaskChange({ name: event.target.value })} className={`h-12 ${theme.input}`} />
                <div>
                  <Input
                    list="task-area-options"
                    placeholder="Area"
                    value={newTask.area}
                    onChange={(event) => onNewTaskChange({ area: event.target.value })}
                    className={`h-12 ${theme.input}`}
                  />
                  <datalist id="task-area-options">
                    {YACHT_AREA_OPTIONS.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </div>
                <Select value={newTask.assignee} onValueChange={(value) => onNewTaskChange({ assignee: value })}>
                  <SelectTrigger className={`h-12 ${theme.input}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNEE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newTask.department} onValueChange={(value) => onNewTaskChange({ department: value })}>
                  <SelectTrigger className={`h-12 ${theme.input}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_DEPARTMENT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={newTask.dueDate} onChange={(event) => onNewTaskChange({ dueDate: event.target.value })} className={`h-12 ${theme.input}`} />
                <Select value={newTask.status} onValueChange={(value) => onNewTaskChange({ status: value })}>
                  <SelectTrigger className={`h-12 ${theme.input}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{formatTaskStatusLabel(option)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newTask.priority} onValueChange={(value) => onNewTaskChange({ priority: value })}>
                  <SelectTrigger className={`h-12 ${theme.input}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{formatTaskPriorityLabel(option)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <textarea
                  placeholder="Notes"
                  value={newTask.notes}
                  onChange={(event) => onNewTaskChange({ notes: event.target.value })}
                  className={`min-h-24 w-full rounded-lg border px-3 py-2 outline-none ${theme.input}`}
                />
                <Button onClick={onAddTask} className="button-vessel-primary w-full rounded-lg px-4 py-6 text-white" data-testid="save-task-button">
                  Save Task
                </Button>
              </div>
            </DialogContent>
          </Dialog> : <Badge className="bg-[#e8eee9] text-[#40534a]">View-only access</Badge>}
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className={`app-panel app-panel-soft shadow-md ${theme.card} ${mobileTaskPane === "details" ? "hidden md:block" : "block"} rounded-2xl md:rounded-lg`}>
          <CardContent className="p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="app-kicker">Tasks</div>
                <div className={`mt-1 text-sm ${theme.textSecondary}`}>Simple board: start work, track progress, wait for approval, then close it.</div>
              </div>
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className={`h-12 rounded-2xl md:max-w-xs ${theme.input}`}
              />
            </div>
            {visibleTasks.length === 0 ? (
              <div className={`app-empty-state rounded-xl border border-dashed text-center text-sm ${theme.textSecondary} ${darkMode ? "border-[#31443a] bg-[#0e171c]" : "border-[#c9ded3] bg-[#f7faf8]"}`}>
                No tasks match this view.
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
                {taskBoardColumns.map((column) => {
                  const columnTasks = visibleTasks.filter((task) => getTaskBoardStatus(task) === column.key);
                  return (
                    <div key={column.key} className={`rounded-[22px] border p-3 ${darkMode ? "border-[var(--vessel-border-dark)] bg-[rgba(255,255,255,0.03)]" : "border-[rgba(15,80,70,0.08)] bg-[rgba(255,255,255,0.56)]"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="app-kicker">{column.label}</div>
                        <Badge className={neutralBadgeClass(darkMode)}>{columnTasks.length}</Badge>
                      </div>
                      <div className="mt-3 grid gap-2">
                        {columnTasks.length ? columnTasks.map((task) => (
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
                            className={`jump-highlight-target group relative overflow-hidden rounded-2xl border p-3 pl-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${selectedId === task.id ? "vessel-active" : darkMode ? "app-dark-card border-[var(--vessel-border-dark)] hover:bg-slate-800/80" : "border-[rgba(15,80,70,0.08)] bg-white/70 hover:bg-white/90"}`}
                          >
                            <div className={`absolute inset-y-0 left-0 w-1 ${task.priority === "high" ? "bg-[#d6a94f]" : task.priority === "urgent" ? "bg-[#b1473f]" : "bg-[var(--vessel-primary)]"}`} />
                            <div className="flex min-w-0 items-start justify-between gap-2">
                              <div className={`min-w-0 truncate text-sm font-semibold ${theme.textPrimary}`}>{task.name}</div>
                              <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${darkMode ? "border-white/10 bg-white/[0.06] text-slate-100" : "border-slate-200/80 bg-white/80 text-slate-700"}`}>
                                {(task.assignee || "Ops").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "OP"}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Badge className={neutralBadgeClass(darkMode)}>{formatTaskPriorityLabel(task.priority)} priority</Badge>
                              <Badge className={neutralBadgeClass(darkMode)}>{formatTaskStatusLabel(task.status)}</Badge>
                            </div>
                            <div className={`mt-3 grid gap-1 text-xs ${theme.textSecondary}`}>
                              <div className="flex justify-between gap-2">
                                <span>Assigned</span>
                                <span className={`truncate text-right font-medium ${theme.textPrimary}`}>{task.assignee || "Unassigned"}</span>
                              </div>
                              <div className="flex justify-between gap-2">
                                <span>Due</span>
                                <span className={`text-right font-medium ${theme.textPrimary}`}>{task.dueDate || "Not set"}</span>
                              </div>
                            </div>
                            <div className={`mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 group-hover:-translate-y-0.5 ${darkMode ? "border-[var(--vessel-border-dark)] bg-[var(--vessel-primary-soft-dark)] text-[var(--vessel-text-accent-dark)]" : "border-[var(--vessel-border)] bg-[var(--vessel-primary-soft)] text-[var(--vessel-text-accent)]"}`}>
                              Open details
                            </div>
                          </button>
                        )) : (
                          <div className={`rounded-2xl border border-dashed p-3 text-sm ${theme.textSecondary} ${darkMode ? "app-dark-inner border-white/10" : "border-slate-200/70 bg-white/50"}`}>
                            {column.empty}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`app-panel ${selectedTask ? "app-panel-active" : "app-panel-soft"} shadow-md ${theme.card} ${mobileTaskPane === "list" ? "hidden md:block" : "block"} rounded-2xl md:rounded-lg`}>
          <CardContent className="p-4 md:p-5">
            <TaskDetails
              selectedTask={selectedTask}
              canEdit={canEdit}
              darkMode={darkMode}
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
    </>
  );
}

export function AppShellHeader({
  darkMode = false,
  isOffline = false,
  onToggleDarkMode,
  currentVesselName = "Contessa",
  currentVesselIdentity = null,
  currentRole,
  onCurrentRoleChange,
  appMode = "view",
  onAppModeChange,
  vesselState = {},
  onVesselStateModeChange,
  visibleModuleKeys = [],
  canEditApp = true,
  historyOpen,
  onHistoryOpenChange,
  actorName,
  onActorNameChange,
  retrieveOpen,
  onToggleRetrieve,
  declinedTasks,
  onRetrieveDeclinedTask,
  history,
  sharingOpen,
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
  onOpenFleet,
  onSwitchFleetVessel,
  onAddFleetVessel,
  stats = {},
  currency = "USD",
  routeWarningCount = 0,
  onOpenCommand,
  onOpenTasksMaintenance,
  onOpenApprovals,
  onOpenRoute,
  onOpenCrewCertificates,
  onOpenDocuments,
  onOpenSettingsWorkspace,
  notificationCount = 0,
  notifications = [],
  onOpenNotifications,
  onSelectNotification,
  commandSearchView = null,
}) {
  const theme = themeClasses(darkMode);
  const [legalOpen, setLegalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationAnchorRef = useRef(null);
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
  const [headerClock, setHeaderClock] = useState(() => new Date());
  const fleetWorkspaceLabel = `${currentVesselName} Operations`;
  const openFleetPanel = () => {
    if (onOpenFleet) {
      onOpenFleet();
      return;
    }
    onFleetOpenChange?.(true);
  };
  const handleNotificationSelect = (notification) => {
    setNotificationsOpen(false);
    if (onSelectNotification) {
      onSelectNotification(notification);
      return;
    }
    onOpenNotifications?.();
  };
  useEffect(() => {
    if (!fleetOpen) {
      setFleetFormOpen(false);
      setFleetDraftError("");
      setFleetDraft({
        vesselName: "",
        lengthFeet: "",
        vesselType: "",
        flag: "",
        homePort: "",
        crewNumber: "",
        notes: "",
      });
    }
  }, [fleetOpen]);
  useEffect(() => {
    const interval = setInterval(() => setHeaderClock(new Date()), 30 * 1000);
    return () => clearInterval(interval);
  }, []);
  const visibleModuleLabels = [
    visibleModuleKeys.includes("today") ? { key: "today", label: "Dashboard" } : null,
    visibleModuleKeys.includes("tasks") || visibleModuleKeys.includes("maintenance") ? { key: "tasks-maintenance", label: "Tasks" } : null,
    visibleModuleKeys.includes("expenses") ? { key: "expenses", label: "Approval" } : null,
    visibleModuleKeys.includes("crew") || visibleModuleKeys.includes("certificates") ? { key: "crew-certificates", label: "Crew" } : null,
    visibleModuleKeys.includes("documents") ? { key: "documents", label: "Docs" } : null,
  ].filter(Boolean);
  const activeFleetVessel = fleetVessels.find((vessel) => vessel?.id === activeVesselId) || null;
  const currentVesselMetrics = fleetMetricsByVessel?.[activeVesselId] || {};
  const recentHeaderHistory = Array.isArray(history) ? history.slice(0, 3) : [];
  const currentRoleLabel = DEMO_ROLE_OPTIONS.find((option) => option.value === currentRole)?.label || "Owner";
  const compactVesselName = String(currentVesselName || "Fleet").replace(/^M\/Y\s+/i, "").trim() || "Fleet";
  const normalizedWorkspaceName = String(currentVesselName || "").trim().toLowerCase();
  const isContessaWorkspace = normalizedWorkspaceName === "contessa" || normalizedWorkspaceName === "m/y contessa";
  const vesselName = currentVesselIdentity?.displayName || currentVesselIdentity?.name || currentVesselName || "Vessel";
  const vesselTitle = String(vesselName || "Vessel").toUpperCase();
  const vesselIdentifier = getVesselIdentifier(currentVesselIdentity || {});
  const vesselTitleClass = getVesselTitleSize(vesselTitle);
  const greeting = headerClock.getHours() < 12 ? "Good morning" : headerClock.getHours() < 18 ? "Good afternoon" : "Good evening";
  const selectedFleetFlag = normalizeFlag(fleetDraft.flag);
  const fleetHomePortOptions = homePortsByFlag[selectedFleetFlag] || [];
  const heroMetrics = [
    { label: "Urgent", value: stats.overdueTasks || routeWarningCount || 0, note: "needs review" },
    { label: "Approval", value: stats.pendingApprovals || 0, note: "waiting" },
    { label: "Crew", value: stats.certificateDue || 0, note: "readiness notes" },
    { label: "Tasks", value: stats.totalObjectives || currentVesselMetrics.taskCount || 0, note: "active queue" },
  ];
  const heroSummary = (stats.overdueTasks || stats.pendingApprovals || routeWarningCount)
    ? `${stats.overdueTasks || 0} overdue, ${stats.pendingApprovals || 0} approval${stats.pendingApprovals === 1 ? "" : "s"} waiting, and ${routeWarningCount || 0} route review${routeWarningCount === 1 ? "" : "s"} need attention.`
    : "Vessel operations are calm. Crew readiness, approvals, and route status are available at a glance.";
  const routeStatusLabel = activeFleetVessel?.routePlanning?.status || (routeWarningCount ? "Review" : "Confirmed");
  const operationalSnapshot = [
    { label: "Vessel", value: activeFleetVessel?.details?.status || currentVesselMetrics.status || "Operational", tone: "neutral" },
    { label: "Route", value: routeStatusLabel, tone: routeWarningCount ? "warning" : "active" },
    { label: "Approvals", value: `${stats.pendingApprovals || 0}`, tone: stats.pendingApprovals ? "warning" : "neutral" },
    { label: "Crew", value: (stats.certificateDue || 0) > 0 ? `${stats.certificateDue} due` : "Stable", tone: (stats.certificateDue || 0) > 0 ? "warning" : "active" },
    { label: "Weather", value: "Calm watch", tone: "neutral" },
    { label: "Spend", value: formatMoney(stats.totalExpenses || 0, currency), tone: stats.totalExpenses ? "warning" : "neutral" },
  ];
  const commandIntelCards = [
    {
      key: "vessel-status",
      title: "Vessel Status",
      badge: activeFleetVessel?.details?.status || "Operational",
      accent: "neutral",
      rows: [
        { label: "Home port", value: activeFleetVessel?.details?.homePort || "Not set" },
        { label: "Crew onboard", value: `${currentVesselMetrics.crewCount || stats.crewProfiles || 0}` },
        { label: "Main sections", value: `${visibleModuleLabels.length || 0}` },
      ],
      signal: `${activeFleetVessel?.details?.status || "Operational"} workspace verified`,
      actionLabel: "Open dashboard",
      onAction: onOpenCommand,
    },
    {
      key: "priority-queue",
      title: "Priority Queue",
      badge: routeWarningCount > 0 ? `${routeWarningCount} route review` : "Stable",
      accent: routeWarningCount > 0 || (stats.overdueTasks || 0) > 0 || (stats.pendingApprovals || 0) > 0 ? "warning" : "neutral",
      metrics: [
        { label: "Overdue", value: stats.overdueTasks || 0 },
        { label: "Approval", value: stats.pendingApprovals || 0 },
        { label: "Route", value: routeWarningCount || 0 },
      ],
      signal: `${stats.overdueTasks || 0} overdue · ${stats.pendingApprovals || 0} approvals waiting`,
      actionLabel: "Open tasks",
      onAction: onOpenTasksMaintenance,
      secondaryActionLabel: "View route",
      onSecondaryAction: onOpenRoute,
    },
    {
      key: "crew-readiness",
      title: "Crew",
      badge: `${stats.certificateDue || 0} due`,
      accent: (stats.certificateDue || 0) > 0 || (stats.maintenanceDue || 0) > 0 ? "warning" : "neutral",
      metrics: [
        { label: "Crew", value: stats.crewProfiles || 0 },
        { label: "Certs", value: stats.certificateDue || 0 },
        { label: "Maint.", value: stats.maintenanceDue || 0 },
      ],
      signal: (stats.certificateDue || stats.maintenanceDue) ? "Readiness items need attention" : "Crew readiness stable",
      actionLabel: "Open crew",
      onAction: onOpenCrewCertificates,
      secondaryActionLabel: "Docs",
      onSecondaryAction: onOpenDocuments,
    },
    {
      key: "spend-activity",
      title: "Approval Activity",
      badge: `${currentVesselMetrics.quoteCount || 0} quotes`,
      accent: "neutral",
      rows: [
        { label: "Spend", value: `${currentVesselMetrics.expenseCount || 0}` },
        { label: "Approval", value: `${stats.pendingApprovals || 0}` },
        { label: "Pending spend", value: formatMoney(stats.totalExpenses || 0, currency) },
      ],
      activity: recentHeaderHistory[0] || null,
      signal: recentHeaderHistory[0] ? `${recentHeaderHistory[0].action}: ${recentHeaderHistory[0].detail}` : "Approval queue is current",
      actionLabel: "Open approvals",
      onAction: onOpenApprovals,
      secondaryActionLabel: "History",
      onSecondaryAction: () => onHistoryOpenChange(true),
    },
  ];
  const intelBadgeClass = (accent = "neutral") => {
    if (accent === "warning") {
      return darkMode ? "border border-[#4f4323] bg-[rgba(36,30,18,0.52)] text-[#dac58b]" : "border border-[#eddba6] bg-[#fbf4dc]/82 text-[#8b6d2d]";
    }
    return darkMode ? "border border-white/10 bg-white/5 text-slate-300" : "border border-slate-200/70 bg-white/80 text-slate-600";
  };
  const actionButtonClass = "app-action-button inline-flex items-center justify-center";
  const premiumMetricLabelTone = (label = "", accent = "neutral") => {
    const normalizedLabel = String(label).toLowerCase();
    if (accent === "warning" || /approval|spend|quote|pending|route/.test(normalizedLabel)) return "premium-label-gold";
    if (/urgent|overdue|alert/.test(normalizedLabel)) return "premium-label-urgent";
    return "";
  };

  return (
    <div
      id="app-command-header"
      className={`vessel-hero-card relative mb-6 mt-2 min-w-0 max-w-full overflow-hidden rounded-[34px] border px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)] md:px-8 md:pb-8 md:pt-7 ${darkMode ? "border-cyan-300/10 text-slate-50" : "border-slate-200/80 text-slate-950"}`}
    >
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
      <Dialog open={fleetOpen} onOpenChange={onFleetOpenChange}>
        <DialogContent className={`max-h-[82vh] w-full max-w-[1100px] overflow-y-auto rounded-[32px] border p-5 backdrop-blur-2xl transition-all duration-200 ${premiumShellClass(darkMode)} ${darkMode ? "text-[#f4fbf6]" : "text-[#1d2b24]"}`}>
          <DialogHeader>
            <DialogTitle>Fleet</DialogTitle>
          </DialogHeader>
          <div className="flex h-full flex-col gap-3">
            <div className={`${premiumInnerClass(darkMode)} p-4`}>
              <div className={`${premiumLabelClass} ${darkMode ? "!text-slate-300" : ""}`}>Fleet</div>
              <div className={`mt-1 text-sm leading-5 ${theme.textSecondary}`}>Switch vessels or create a new independent workspace without leaving the current command layout.</div>
            </div>

            {fleetFormOpen ? (
              <div className={`${premiumInnerClass(darkMode)} p-4`}>
                <div className={`${premiumLabelClass} ${darkMode ? "!text-slate-300" : ""}`}>New Vessel</div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
                      Vessel Name <span className="text-rose-500">*</span>
                    </label>
                    <Input placeholder="M/Y Vessel Name" value={fleetDraft.vesselName} onChange={(event) => setFleetDraft((prev) => ({ ...prev, vesselName: event.target.value }))} className={`h-14 rounded-2xl text-base font-semibold ${theme.input}`} />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
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
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
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

            <div className={`min-h-0 ${fleetVessels.length > 4 ? "md:max-h-[52vh] md:overflow-y-auto md:pr-1" : ""}`}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {fleetVessels.map((vessel) => {
                const vesselMetrics = fleetMetricsByVessel?.[vessel.id] || {};
                const crewCount = Number(vessel?.details?.crewNumber ?? vessel?.crewProfiles?.length ?? 0) || 0;
                const statusLabel = vessel?.details?.status || "Operational";
                const isActive = vessel?.id === activeVesselId;

                return (
                  <div key={vessel.id} className={`flex h-full flex-col gap-2.5 rounded-[22px] border p-4 backdrop-blur-xl transition-all duration-200 ${isActive ? (darkMode ? "border-cyan-300/30 bg-cyan-300/10 shadow-[0_16px_38px_rgba(34,211,238,0.10)]" : "border-blue-300/80 bg-blue-50/35 shadow-[0_16px_38px_rgba(59,130,246,0.10)]") : `${premiumInnerClass(darkMode)} hover:-translate-y-0.5 ${darkMode ? "hover:border-cyan-300/30 hover:bg-white/[0.06]" : "hover:border-blue-300 hover:bg-white/90"}`}`}>
                    <div className="flex items-start justify-between gap-2.5">
                      <div>
                        <div className={`${premiumLabelClass} ${darkMode ? "!text-slate-300" : ""}`}>Vessel</div>
                        <div className={`mt-0.5 text-base font-semibold ${theme.textPrimary}`}>{vessel.name}</div>
                      </div>
                      {isActive ? <Badge className={`px-2 py-0.5 text-[10px] ${darkMode ? "border border-vessel bg-[rgba(var(--vessel-primary-rgb),0.18)] text-vessel-accent" : "border border-vessel bg-[rgba(var(--vessel-primary-rgb),0.10)] text-vessel-accent"}`}>Current</Badge> : null}
                    </div>
                    <div className={`grid gap-1 text-xs ${theme.textSecondary}`}>
                      <div className="flex items-center justify-between gap-3"><span>Status</span><span className={theme.textPrimary}>{statusLabel}</span></div>
                      <div className="flex items-center justify-between gap-3"><span>Crew</span><span className={theme.textPrimary}>{crewCount}</span></div>
                      <div className="flex items-center justify-between gap-3"><span>Home port</span><span className={`${theme.textPrimary} text-right`}>{vessel?.details?.homePort || "Not set"}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`group rounded-2xl border p-3 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200/80 bg-white/70"}`}>
                      <div className="app-compact-label"><SmartLabel label="Tasks" /></div>
                        <div className={`mt-1 text-sm font-semibold ${theme.textPrimary}`}>{vesselMetrics.taskCount || 0}</div>
                      </div>
                      <div className={`group rounded-2xl border p-3 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200/80 bg-white/70"}`}>
                        <div className="app-compact-label"><SmartLabel label="Alerts" /></div>
                        <div className={`mt-1 text-sm font-semibold ${theme.textPrimary}`}>{vesselMetrics.alertCount || 0}</div>
                      </div>
                      <div className={`group rounded-2xl border p-3 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200/80 bg-white/70"}`}>
                        <div className="app-compact-label"><SmartLabel label="Approval" active={isActive} /></div>
                        <div className={`mt-1 text-sm font-semibold ${theme.textPrimary}`}>{vesselMetrics.approvalCount || 0}</div>
                      </div>
                      <div className={`group rounded-2xl border p-3 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200/80 bg-white/70"}`}>
                        <div className="app-compact-label"><SmartLabel label="Route" active={isActive} /></div>
                        <div className={`mt-1 text-sm font-semibold ${theme.textPrimary}`}>{vesselMetrics.routeDistanceNm ? `${vesselMetrics.routeDistanceNm.toFixed(1)} nm` : "Draft"}</div>
                      </div>
                    </div>
                    <div className="mt-auto pt-1">
                      {isActive ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled
                          className={`${mutedButtonClass} h-11 w-full cursor-not-allowed ${darkMode ? "!border-white/10 !bg-white/[0.04] !text-slate-400" : ""}`}
                        >
                          Current Workspace
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => onSwitchFleetVessel?.(vessel.id)}
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

            {!fleetFormOpen ? (
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  onClick={() => { setFleetDraftError(""); setFleetFormOpen(true); }}
                  className="button-vessel-primary rounded-2xl px-4 py-3"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Boat
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <div className={`pointer-events-none absolute right-[-24px] top-[-16px] h-24 w-24 rounded-full blur-3xl ${darkMode ? "bg-[#c6a35b]/6" : "bg-[#efe2b7]/36"}`} />

      <div className="vessel-header-flow min-w-0">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0 md:gap-x-6">
          <div className="col-span-2 row-start-1 mt-14 flex min-w-0 items-center gap-3 sm:mt-16 sm:gap-4 md:col-span-1 md:col-start-1 md:mt-0">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] border md:h-[72px] md:w-[72px] ${darkMode ? "vessel-card-dark" : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.72)] shadow-[0_18px_34px_-28px_rgba(19,52,43,0.24)]"}`}>
              <ContessaUiLogo className="h-[52px] w-[52px] md:h-[66px] md:w-[66px]" />
            </div>
            <div className="min-w-0 flex-1 pr-0 md:pr-[300px] lg:pr-[340px]">
              <h1 className={`${vesselTitleClass} whitespace-nowrap font-serif font-medium leading-none tracking-[0.075em] lg:font-semibold lg:tracking-[0.08em] ${darkMode ? "text-slate-50" : "text-[#071A3A]"}`}>
                {vesselTitle}
              </h1>
              <p className={`mt-2 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] sm:text-sm lg:tracking-[0.12em] ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                {vesselIdentifier}
              </p>
            </div>
          </div>

          {commandSearchView ? (
            <div className="relative z-[5000] col-span-2 row-start-2 mt-5 flex w-full min-w-0 justify-start md:row-start-2 md:mt-8">
              <div className="relative z-[5000] w-full min-w-0 max-w-[760px]">
                {commandSearchView}
              </div>
            </div>
          ) : null}

          <div className="absolute right-3 top-3 z-[9200] flex min-w-0 shrink-0 items-center justify-end gap-1.5 sm:right-4 sm:top-4 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className={`inline-flex h-11 min-w-0 shrink-0 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold shadow-sm transition-all duration-200 md:h-12 md:rounded-[20px] md:px-4 md:font-bold ${darkMode ? "border-white/10 bg-slate-900/80 text-slate-50 hover:border-cyan-300/40 hover:bg-slate-800" : "border-slate-200 bg-white/90 text-slate-900 hover:border-blue-300 hover:bg-blue-50"}`}
              onClick={openFleetPanel}
              aria-label="Open fleet switcher"
            >
              <Compass className="h-4 w-4 shrink-0" />
              <span className="hidden max-w-[9rem] truncate lg:inline">Fleet · {compactVesselName}</span>
              <span className="hidden max-w-[5.5rem] truncate sm:inline lg:hidden">Fleet</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className={`h-11 w-11 shrink-0 rounded-2xl p-0 shadow-sm md:h-12 md:w-12 md:rounded-[20px] ${darkMode ? "border-white/10 bg-white/[0.06] text-slate-100 hover:border-cyan-300/30 hover:bg-cyan-300/10" : "border-slate-200/80 bg-white/82 text-slate-800 hover:border-blue-300 hover:bg-white"}`}
              onClick={onToggleDarkMode}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
            </Button>

            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={`h-11 w-11 shrink-0 rounded-2xl p-0 text-sm font-semibold shadow-sm md:h-12 md:w-auto md:rounded-[20px] md:px-4 md:font-bold ${darkMode ? "border-white/10 bg-white/[0.06] text-slate-100 hover:border-cyan-300/30 hover:bg-cyan-300/10" : "border-slate-200/80 bg-white/82 text-slate-800 hover:border-blue-300 hover:bg-white"}`}
                  aria-label="Open settings"
                >
                  <Settings className="h-4 w-4 md:mr-2 md:h-5 md:w-5" />
                  <span className="hidden md:inline">Settings</span>
                </Button>
              </DialogTrigger>
            <DialogContent className={`max-h-[88vh] w-[calc(100vw-1.5rem)] max-w-[520px] overflow-y-auto rounded-[28px] border p-4 shadow-2xl md:p-5 ${darkMode ? "border-white/10 bg-[#111a16] text-[#f4fbf6]" : "border-slate-200/80 bg-white text-slate-900"}`}>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className={`${premiumInnerClass(darkMode)} p-3`}>
                <div className={`${premiumLabelClass} ${darkMode ? "!text-slate-300" : ""}`}>Operating As</div>
                <div className="mt-2">
                  {onCurrentRoleChange ? (
                    <Select value={currentRole} onValueChange={onCurrentRoleChange}>
                      <SelectTrigger className={`h-11 rounded-2xl border ${theme.input}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEMO_ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className={`flex h-11 items-center rounded-2xl border px-3 text-sm font-medium ${darkMode ? "border-white/10 bg-white/[0.04] text-slate-100" : "border-slate-200/80 bg-white/80 text-slate-800"}`}>
                      Shared vessel access
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className={`${premiumInnerClass(darkMode)} p-3`}>
                  <div className={`${premiumLabelClass} ${darkMode ? "!text-slate-300" : ""}`}>Mode</div>
                  <Select value={appMode} onValueChange={onAppModeChange}>
                    <SelectTrigger className={`mt-2 h-11 rounded-2xl border ${theme.input}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View Mode</SelectItem>
                      <SelectItem value="editor">Editor Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className={`${premiumInnerClass(darkMode)} p-3`}>
                  <div className={`${premiumLabelClass} ${darkMode ? "!text-slate-300" : ""}`}>Status</div>
                  <Badge className={`mt-2 flex min-h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold ${canEditApp ? "border border-amber-300/70 bg-amber-50/90 text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/15 dark:text-amber-100" : "border border-slate-200/80 bg-slate-50/80 text-slate-600 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300"}`}>
                    {canEditApp ? "Editor Mode" : "View Mode"}
                  </Badge>
                </div>
              </div>

              <div className={`${premiumInnerClass(darkMode)} p-3`}>
                <div className={`${premiumLabelClass} ${darkMode ? "!text-slate-300" : ""}`}>Vessel State</div>
                <Select value={vesselState?.mode || "standby"} onValueChange={onVesselStateModeChange}>
                  <SelectTrigger className={`mt-2 h-11 rounded-2xl border ${theme.input}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VESSEL_STATE_MODE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className={`mt-2 text-xs leading-5 ${theme.textSecondary}`}>
                  {vesselState?.primaryFocus || "Routine vessel readiness"} · {Number(vesselState?.confidenceScore || 0)}% confidence
                </div>
              </div>

              <div className="grid gap-2">
                <Button type="button" variant="outline" className={`${mutedButtonClass} w-full justify-start ${darkMode ? "!border-white/10 !bg-white/[0.04] !text-slate-300" : ""}`} onClick={() => { setSettingsOpen(false); openFleetPanel(); }}>
                  Fleet management
                </Button>
                <Button type="button" variant="outline" className={`${mutedButtonClass} w-full justify-start ${darkMode ? "!border-white/10 !bg-white/[0.04] !text-slate-300" : ""}`} onClick={() => { setSettingsOpen(false); onHistoryOpenChange(true); }}>
                  History
                </Button>
                <Button type="button" variant="outline" className={`${mutedButtonClass} w-full justify-start ${darkMode ? "!border-white/10 !bg-white/[0.04] !text-slate-300" : ""}`} onClick={() => { setSettingsOpen(false); onSharingOpenChange(true); }}>
                  Share
                </Button>
                <Button type="button" variant="outline" className={`${mutedButtonClass} w-full justify-start ${darkMode ? "!border-white/10 !bg-white/[0.04] !text-slate-300" : ""}`} onClick={() => { setSettingsOpen(false); setLegalOpen(true); }}>
                  Legal
                </Button>
                <Button type="button" variant="outline" className={`${mutedButtonClass} w-full justify-start ${darkMode ? "!border-white/10 !bg-white/[0.04] !text-slate-300" : ""}`} onClick={() => { setSettingsOpen(false); onOpenSettingsWorkspace?.(); }}>
                  App settings
                </Button>
              </div>
            </div>
              </DialogContent>
            </Dialog>

            <div ref={notificationAnchorRef} className="relative z-[9200] shrink-0">
              <NotificationButton
                count={notificationCount}
                darkMode={darkMode}
                open={notificationsOpen}
                onClick={() => setNotificationsOpen((current) => !current)}
              />
              <NotificationsPanel
                open={notificationsOpen}
                anchorRef={notificationAnchorRef}
                darkMode={darkMode}
                notifications={notifications}
                onClose={() => setNotificationsOpen(false)}
                onSelect={handleNotificationSelect}
              />
            </div>
          </div>

        </div>
      </div>

      <Dialog open={legalOpen} onOpenChange={setLegalOpen}>
        <DialogContent className={`rounded-lg ${darkMode ? "border-[#2a3a32] bg-[#111a16] text-[#f4fbf6]" : "bg-white text-[#1d2b24]"}`}>
          <DialogHeader>
            <DialogTitle>Legal</DialogTitle>
          </DialogHeader>
          <SettingsPanel darkMode={darkMode} />
        </DialogContent>
      </Dialog>

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
            <div className={`rounded-lg border p-3 text-sm ${darkMode ? "border-[#31443a] bg-[#18211d] text-[#dce9e1]" : "border-[#d8e7df] bg-[#f7fbf9] text-[#40534a]"}`}>
              <div className="font-semibold">Public App Link</div>
              <div className={`mt-1 text-xs ${theme.textSecondary}`}>
                {shareUrlStatus?.isValid ? `${shareUrlStatus.url}${shareUrlStatus.source ? ` (${shareUrlStatus.source})` : ""}` : shareUrlStatus?.message}
              </div>
            </div>
            <input
              ref={jsonImportInputRef}
              type="file"
              accept="application/json,.json"
              onChange={onImportAppStateJson}
              className="hidden"
            />
            <div className="grid gap-2">
              <ShareAppButton darkMode={darkMode} shareUrlStatus={shareUrlStatus} onToast={onShareToast} className="rounded-lg px-4 py-4">
                Share App
              </ShareAppButton>
              <ShareAppButton mode="email" darkMode={darkMode} shareUrlStatus={shareUrlStatus} onToast={onShareToast} className="rounded-lg px-4 py-4">
                Email App Link
              </ShareAppButton>
              <ShareAppButton mode="copy" darkMode={darkMode} shareUrlStatus={shareUrlStatus} onToast={onShareToast} className="rounded-lg px-4 py-4">
                Copy App Link
              </ShareAppButton>
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

      {false ? <div id="legacy-dashboard-header" className="hidden">
        <div className="min-w-0">
          <div className="md:hidden">
            <div className="brand-hero relative flex flex-col items-center text-center">
              <div className="flex w-full items-center justify-between gap-3">
                <span aria-hidden="true" className="h-10 w-10" />
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${isOffline ? (darkMode ? "border-[#5a4820] bg-[#2a2110] text-[#ffe7aa]" : "border-[#f0d58d] bg-[#fff7de] text-[#7a5416]") : "vessel-pill"}`}>
                  <span className={`inline-flex h-2 w-2 rounded-full ${isOffline ? "bg-[#d9a33e]" : "bg-[#2ea57d]"}`} />
                  {isOffline ? "Offline sync" : "Sync active"}
                </div>
              </div>

              <VesselTitle
                name={currentVesselName}
                darkMode={darkMode}
                className="mt-4 text-center text-[clamp(2rem,9vw,3.35rem)]"
              />
              <div className="app-kicker mt-1.5">{fleetWorkspaceLabel}</div>

              <div className={`mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium ${theme.textSecondary}`}>
                <span>{headerClock.toLocaleDateString()}</span>
                <span className={darkMode ? "text-[#445850]" : "text-[#9ab0a4]"}>&bull;</span>
                <span>{headerClock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span className={darkMode ? "text-[#445850]" : "text-[#9ab0a4]"}>&bull;</span>
                <span>{isOffline ? "Offline sync" : "Sync active"}</span>
              </div>

              <div className={`mt-2 max-w-full text-[13px] font-medium leading-[1.45] sm:max-w-[360px] ${theme.textSecondary}`}>
                Fast yacht operations for tasks, approvals, crew, documents, and route review.
              </div>

              <div className={`mt-4 w-full rounded-[24px] border p-3.5 text-left shadow-[0_18px_42px_-34px_rgba(9,28,32,0.28)] ${darkMode ? "app-dark-card border-[var(--vessel-border-dark)]" : "border-[rgba(15,80,70,0.10)] bg-white/70"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="app-kicker">Today</div>
                    <div className={`mt-1 text-lg font-semibold tracking-tight ${theme.textPrimary}`}>{greeting}, {currentRoleLabel}</div>
                  </div>
                  <Badge className={stats.pendingApprovals || stats.overdueTasks || routeWarningCount ? warningBadgeClass(darkMode) : successBadgeClass(darkMode)}>
                    {stats.pendingApprovals || stats.overdueTasks || routeWarningCount ? "Review" : "Calm"}
                  </Badge>
                </div>
                <div className={`mt-1.5 text-sm leading-5 ${theme.textSecondary}`}>{heroSummary}</div>
                <div className="mt-3 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                  {heroMetrics.map((metric) => (
                    <div key={`mobile-hero-${metric.label}`} className={`group rounded-2xl border px-3 py-2 ${darkMode ? "border-white/10 bg-white/[0.03]" : "border-white/70 bg-white/[0.58]"}`}>
                      <div className={`app-compact-label ${premiumMetricLabelTone(metric.label)}`.trim()}><SmartLabel label={metric.label} /></div>
                      <div className={`mt-1 text-lg font-semibold tracking-tight ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{metric.value}</div>
                      <div className={`mt-0.5 truncate text-[11px] ${theme.textSecondary}`}>{metric.note}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button type="button" onClick={onOpenCommand} className="app-primary-action-button w-full">
                    Review priorities
                  </Button>
                  <Button type="button" variant="outline" onClick={onOpenTasksMaintenance} className="app-action-button w-full">
                    Add task
                  </Button>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Badge className={isOffline ? warningBadgeClass(darkMode) : successBadgeClass(darkMode)}>
                    {isOffline ? "Offline" : "Live"}
                  </Badge>
                  <Badge className={darkMode ? "border border-white/10 bg-white/5 text-slate-300" : "border border-slate-200/70 bg-white/80 text-slate-600"}>
                    {visibleModuleLabels.length} sections
                  </Badge>
                  <Badge className={darkMode ? "border border-[#4f4323] bg-[rgba(36,30,18,0.52)] text-[#dac58b]" : "border border-[#eddba6] bg-[#fbf4dc]/82 text-[#8b6d2d]"}>
                    Today
                  </Badge>
                </div>
              </div>

            </div>
          </div>

          <div className="brand-hero hidden md:flex md:flex-col md:items-center md:text-center lg:items-start lg:text-left">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-col items-center gap-2 lg:flex-row lg:flex-wrap lg:items-center">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${isOffline ? (darkMode ? "border-[#5a4820] bg-[#2a2110] text-[#ffe7aa]" : "border-[#f0d58d] bg-[#fff7de] text-[#7a5416]") : "vessel-pill"}`}>
                  <span className={`inline-flex h-2 w-2 rounded-full ${isOffline ? "bg-[#d9a33e]" : "bg-[#2ea57d]"}`} />
                  {isOffline ? "Offline sync" : "Sync active"}
                </div>
                <div className="app-kicker">{fleetWorkspaceLabel}</div>
              </div>
              <VesselTitle
                name={currentVesselName}
                darkMode={darkMode}
                className="text-center text-[clamp(2.8rem,4.8vw,4.8rem)] lg:text-left"
              />
              <div className={`mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-medium lg:justify-start ${theme.textSecondary}`}>
                <span>{headerClock.toLocaleDateString()}</span>
                <span className={darkMode ? "text-[#445850]" : "text-[#9ab0a4]"}>&bull;</span>
                <span>{headerClock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className={`mt-1.5 max-w-lg text-sm font-medium leading-6 ${theme.textSecondary}`}>
                Investor-ready yacht command workspace for operations, compliance, routing, approvals, and crew readiness.
              </div>
              <div className={`mt-4 rounded-[26px] border p-4 text-left shadow-[0_18px_48px_-38px_rgba(17,46,39,0.18)] ${darkMode ? "app-dark-card border-[var(--vessel-border-dark)]" : "border-[rgba(15,80,70,0.10)] bg-white/62"}`}>
                <div className="app-kicker">Today Command Brief</div>
                <div className={`mt-2 text-2xl font-semibold tracking-tight ${theme.textPrimary}`}>{greeting}, {currentRoleLabel}</div>
                <div className={`mt-1 text-base font-semibold ${theme.textPrimary}`}>Today on {currentVesselName}</div>
                <div className={`mt-2 max-w-2xl text-sm leading-6 ${theme.textSecondary}`}>{heroSummary}</div>
                <div className="mt-3 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 lg:grid-cols-4">
                  {heroMetrics.map((metric) => (
                    <div key={`desktop-hero-${metric.label}`} className={`group rounded-2xl border px-3 py-2.5 ${darkMode ? "border-white/10 bg-white/[0.03]" : "border-white/70 bg-white/[0.58]"}`}>
                      <div className={`app-compact-label ${premiumMetricLabelTone(metric.label)}`.trim()}><SmartLabel label={metric.label} /></div>
                      <div className={`mt-1 text-lg font-semibold tracking-tight ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{metric.value}</div>
                      <div className={`mt-0.5 truncate text-xs ${theme.textSecondary}`}>{metric.note}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  <Button type="button" onClick={onOpenCommand} className="app-primary-action-button">
                    Review priorities
                  </Button>
                  <Button type="button" variant="outline" onClick={onOpenTasksMaintenance} className="app-action-button">
                    Add task
                  </Button>
                  <Button type="button" variant="outline" onClick={onOpenNotifications} className="app-action-button">
                    Open alerts
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-[60] mt-3 hidden flex-wrap items-center justify-center gap-2 md:flex lg:justify-start">
            <Badge className={isOffline ? "border border-[#ecd28c] bg-[#fff0cf]/92 text-[#7c5814]" : "vessel-pill"}>
              {isOffline ? <WifiOff className="mr-1 h-3.5 w-3.5" /> : <Wifi className="mr-1 h-3.5 w-3.5" />}
              {isOffline ? "Offline mode active" : "Live connection active"}
            </Badge>
            <Badge className={darkMode ? "vessel-pill-dark border" : "border border-[rgba(15,80,70,0.06)] bg-[rgba(235,246,241,0.74)] text-[#4d6a61]"}>
              {visibleModuleLabels.length} active modules
            </Badge>
            <Badge className={darkMode ? "border border-[#4f4323] bg-[rgba(36,30,18,0.52)] text-[#dac58b]" : "border border-[#eddba6] bg-[#fbf4dc]/82 text-[#8b6d2d]"}>
              Today
            </Badge>
          </div>
        </div>

        {false ? (
        <div className="hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="app-kicker">Operational Snapshot</div>
              <div className={`mt-1 text-xs ${theme.textSecondary}`}>Compact vessel context without repeating time or sync.</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 xl:grid-cols-3">
            {operationalSnapshot.map((item) => {
              const toneClass = item.tone === "warning"
                ? darkMode
                  ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                  : "border-amber-200 bg-amber-50/80 text-amber-800"
                : item.tone === "active"
                  ? darkMode
                    ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                    : "border-blue-200 bg-blue-50/80 text-blue-800"
                  : darkMode
                    ? "border-white/10 bg-white/[0.035] text-slate-100"
                    : "border-slate-200/70 bg-white/62 text-slate-800";

              return (
                <div
                  key={`operational-snapshot-${item.label}`}
                  className={`min-w-0 rounded-2xl border px-3 py-2.5 ${toneClass}`}
                >
                  <div className="app-compact-label text-current opacity-70"><SmartLabel label={item.label} /></div>
                  <div className="mt-1 truncate text-sm font-semibold tracking-tight">{item.value}</div>
                </div>
              );
            })}
          </div>
          <div className="app-glass-line my-4" />
          <div className="grid min-w-0 gap-4 md:grid-cols-3">
            <ControlCard darkMode={darkMode} label="Operating As">
              {onCurrentRoleChange ? (
                <Select value={currentRole} onValueChange={onCurrentRoleChange}>
                  <SelectTrigger className={`h-11 rounded-2xl border ${theme.input}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className={`flex h-11 items-center rounded-2xl border px-3 text-sm font-medium ${darkMode ? "border-white/10 bg-white/[0.04] text-slate-100" : "border-slate-200/80 bg-white/80 text-slate-800"}`}>
                  Shared vessel access
                </div>
              )}
            </ControlCard>
            <ControlCard darkMode={darkMode} label="Mode">
              <Select value={appMode} onValueChange={onAppModeChange}>
                <SelectTrigger className={`h-11 rounded-2xl border ${theme.input}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Mode</SelectItem>
                  <SelectItem value="editor">Editor Mode</SelectItem>
                </SelectContent>
              </Select>
            </ControlCard>
            <ControlCard darkMode={darkMode} label="Status">
              <Badge className={canEditApp ? "flex min-h-11 w-full items-center justify-center rounded-2xl border border-amber-300/70 bg-amber-50/90 px-4 text-sm font-semibold text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/15 dark:text-amber-100" : "flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300"}>
                {canEditApp ? "Editor Mode" : "View Mode"}
              </Badge>
            </ControlCard>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Button
              variant="outline"
              className={`${premiumShellClass(darkMode)} app-card-hover min-h-[72px] w-full min-w-0 px-5 py-4 text-left text-sm font-semibold ${darkMode ? "text-slate-100 hover:border-cyan-300/40 hover:bg-slate-900/80" : "text-slate-800 hover:border-blue-300 hover:bg-white"}`}
              onClick={onToggleDarkMode}
            >
              <span className="flex items-center gap-3">
                <span className={`${premiumInnerClass(darkMode)} inline-flex h-11 w-11 shrink-0 items-center justify-center`}>
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </span>
                <span>
                  <span className={`${premiumLabelClass} block ${darkMode ? "!text-slate-300" : ""}`}>Dark Mode</span>
                  <span className={`${premiumValueClass} mt-1 block text-base ${darkMode ? "!text-slate-50" : ""}`}>{darkMode ? "Light Mode" : "Dark Mode"}</span>
                </span>
              </span>
            </Button>
            <AlertInboxButton
              onClick={onOpenNotifications}
              darkMode={darkMode}
              notificationCount={notificationCount}
              className={`${premiumShellClass(darkMode)} min-h-[72px] w-full justify-start px-5 py-4 text-left`}
            >
              Alerts
            </AlertInboxButton>
          </div>
          <details className={`${premiumShellClass(darkMode)} group mt-4 w-full min-w-0 max-w-full overflow-hidden p-4`}>
            <summary className="flex cursor-pointer list-none flex-col gap-3 text-sm font-semibold min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
              <span className={`${premiumLabelClass} ${darkMode ? "!text-slate-300" : ""}`}>Secondary Tools</span>
              <span className={`inline-flex min-w-0 items-center gap-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                History, legal, share, settings
                <span className="text-lg leading-none transition-transform group-open:rotate-90">&rarr;</span>
              </span>
            </summary>
          <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
            <ShellControlButton
              type="button"
              onClick={() => onHistoryOpenChange(true)}
              darkMode={darkMode}
              className="w-full"
            >
              <span className="flex items-center gap-2">
                <span>History</span>
                <span className="vessel-pill rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none">
                  {history.length}
                </span>
              </span>
            </ShellControlButton>
            <Dialog open={legalOpen} onOpenChange={setLegalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className={`${mutedButtonClass} min-h-[52px] w-full ${darkMode ? "!border-white/10 !bg-white/[0.04] !text-slate-300 hover:!bg-white/[0.07]" : ""}`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Receipt className={`h-4 w-4 ${darkMode ? "text-[#b8c8c0]" : "text-[#6b7d75]"}`} />
                    <span>Legal</span>
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className={`rounded-lg ${darkMode ? "border-[#2a3a32] bg-[#111a16] text-[#f4fbf6]" : "bg-white text-[#1d2b24]"}`}>
                <DialogHeader>
                  <DialogTitle>Legal</DialogTitle>
                </DialogHeader>
                <SettingsPanel darkMode={darkMode} />
              </DialogContent>
            </Dialog>
            <Dialog open={sharingOpen} onOpenChange={onSharingOpenChange}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className={`${primaryButtonClass} min-h-[52px] w-full ${darkMode ? "!border-cyan-300/30 !bg-cyan-300/10 !text-cyan-100" : ""}`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Share2 className="text-vessel-accent h-4 w-4" />
                    <span>Share</span>
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className={`rounded-lg ${darkMode ? "bg-[#111a16] text-[#f4fbf6] border-[#2a3a32]" : "bg-white"}`}>
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
                  <div className={`rounded-lg border p-3 text-sm ${darkMode ? "border-[#31443a] bg-[#18211d] text-[#dce9e1]" : "border-[#d8e7df] bg-[#f7fbf9] text-[#40534a]"}`}>
                    <div className="font-semibold">Public App URL Configuration</div>
                    <div className={`mt-1 text-xs ${theme.textSecondary}`}>Share, invite, email, and public app links are generated from `NEXT_PUBLIC_APP_URL` in `.env.local` or `.env`. Localhost, `file://` links, and Windows file paths are never used as production share links.</div>
                  </div>
                  {!shareUrlStatus?.isValid ? (
                    <div className={`rounded-lg border p-3 text-sm ${darkMode ? "border-[#6c5a27] bg-[#2c2515] text-[#ffe7ad]" : "border-[#ecd28c] bg-[#fff8df] text-[#7a5416]"}`}>
                      <div className="font-semibold">Share App Setup Required</div>
                      <div className="mt-1">{shareUrlStatus?.message || "Set NEXT_PUBLIC_APP_URL before sharing this app."}</div>
                      <div className={`mt-2 text-xs ${darkMode ? "text-[#f5ddb2]" : "text-[#8a6422]"}`}>
                        Add your public HTTPS app address to `.env.local` or your deployment environment, then rebuild or redeploy before using Share App.
                      </div>
                    </div>
                  ) : null}
                  <div className={`rounded-lg border p-3 text-sm ${darkMode ? "border-[#31443a] bg-[#18211d] text-[#dce9e1]" : "border-[#d8e7df] bg-[#f7fbf9] text-[#40534a]"}`}>
                    <div className="font-semibold">Public App Link</div>
                    <div className={`mt-1 text-xs ${theme.textSecondary}`}>
                      {shareUrlStatus?.isValid ? `${shareUrlStatus.url}${shareUrlStatus.source ? ` (${shareUrlStatus.source})` : ""}` : shareUrlStatus?.message}
                    </div>
                  </div>
                  <div className={`rounded-lg border p-3 text-sm ${darkMode ? "border-[#2d5c4e] bg-[#15332c] text-[#dffbf1]" : "border-[#b7dbc9] bg-[#eef8f3] text-[#285446]"}`}>
                    <div className="font-semibold">Add to Home Screen on iPhone</div>
                    <div className={`mt-1 text-xs ${darkMode ? "text-[#b8d8cc]" : "text-[#4e6a5d]"}`}>
                      Open the shared public link in Safari, tap the Share button, then scroll down and tap Add to Home Screen.
                    </div>
                    <div className={`mt-3 space-y-1 text-xs ${theme.textSecondary}`}>
                      <div>1. Open the {APP_BRAND_NAME} public app link in Safari.</div>
                      <div>2. Tap the Safari Share button.</div>
                      <div>3. Tap Add to Home Screen.</div>
                      <div>4. Rename it if you want, then tap Add.</div>
                    </div>
                  </div>
                  <input
                    ref={jsonImportInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={onImportAppStateJson}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className={`w-full rounded-lg px-4 py-6 ${darkMode ? "border-[#31443a] bg-[#18211d] text-[#f4fbf6] hover:bg-[#22312a]" : "border-[#c9ded3] bg-white text-[#40534a] hover:bg-[#f3faf6]"}`}
                    onClick={onExportCsv}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    className={`w-full rounded-lg px-4 py-6 ${darkMode ? "border-[#31443a] bg-[#18211d] text-[#f4fbf6] hover:bg-[#22312a]" : "border-[#c9ded3] bg-white text-[#40534a] hover:bg-[#f3faf6]"}`}
                    onClick={onExportAppStateJson}
                  >
                    Export Full JSON
                  </Button>
                  {canEditApp ? <Button
                    variant="outline"
                    className={`w-full rounded-lg px-4 py-6 ${darkMode ? "border-[#31443a] bg-[#18211d] text-[#f4fbf6] hover:bg-[#22312a]" : "border-[#c9ded3] bg-white text-[#40534a] hover:bg-[#f3faf6]"}`}
                    onClick={onOpenJsonImportPicker}
                  >
                    Import Full JSON
                  </Button> : null}
                  <div className={`rounded-lg border p-3 text-sm ${darkMode ? "border-[#31443a] bg-[#18211d] text-[#dce9e1]" : "border-[#d8e7df] bg-[#f7fbf9] text-[#40534a]"}`}>
                    <div className="mb-3 font-semibold">Share App</div>
                    <div className="grid gap-3">
                      <ShareAppButton darkMode={darkMode} shareUrlStatus={shareUrlStatus} onToast={onShareToast} className="rounded-lg px-4 py-6">
                        Share App
                      </ShareAppButton>
                      <ShareAppButton mode="email" darkMode={darkMode} shareUrlStatus={shareUrlStatus} onToast={onShareToast} className="rounded-lg px-4 py-6">
                        Email App Link
                      </ShareAppButton>
                      <ShareAppButton mode="copy" darkMode={darkMode} shareUrlStatus={shareUrlStatus} onToast={onShareToast} className="rounded-lg px-4 py-6">
                        Copy App Link
                      </ShareAppButton>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className={`w-full rounded-lg px-4 py-6 ${darkMode ? "border-[#31443a] bg-[#18211d] text-[#f4fbf6] hover:bg-[#22312a]" : "border-[#c9ded3] bg-white text-[#40534a] hover:bg-[#f3faf6]"}`}
                    onClick={onPrintSummary}
                  >
                    Print / PDF
                  </Button>
                  {canEditApp ? <Button
                    variant="outline"
                    className={`w-full rounded-lg px-4 py-6 ${darkMode ? "border-[#5b2a2a] bg-[#231515] text-[#ffd9d9] hover:bg-[#382020]" : "border-[#e8bcbc] bg-[#fff3f3] text-[#8a1f2b] hover:bg-[#ffe4e4]"}`}
                    onClick={onResetDemoData}
                  >
                    Reset Demo Data
                  </Button> : null}
                  <div className={`pt-1 text-center text-xs ${theme.textSecondary}`}>{APP_FOOTER_NOTICE}</div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              type="button"
              variant="outline"
              onClick={onOpenSettingsWorkspace}
              className={`${mutedButtonClass} min-h-[52px] w-full ${darkMode ? "!border-white/10 !bg-white/[0.04] !text-slate-300 hover:!bg-white/[0.07]" : ""}`}
            >
              Settings
            </Button>
          </div>
          </details>
        </div>
        ) : null}
        <section id="dashboard-summary-grid" className="grid min-w-0 auto-rows-fr gap-2.5 md:grid-cols-2">
          {commandIntelCards.map((card) => {
            const dataCells = card.metrics || card.rows || [];
            const accentLineClass =
              card.key === "priority-queue"
                ? "from-amber-300/70 via-amber-200/30 to-transparent"
                : card.key === "crew-readiness"
                  ? "from-teal-300/70 via-cyan-200/25 to-transparent"
                  : card.key === "spend-activity"
                    ? "from-amber-300/65 via-yellow-200/25 to-transparent"
                    : "from-cyan-300/70 via-blue-200/25 to-transparent";

            return (
              <div
                id={card.key === "priority-queue" ? "priority-queue-section" : `${card.key}-section`}
                data-jump-target
                style={{ "--jump-radius": "22px" }}
                key={card.key}
                className={`jump-highlight-target app-panel app-panel-soft flex h-full min-h-[204px] flex-col justify-between rounded-[22px] border p-3 shadow-[0_12px_34px_rgba(15,23,42,0.055)] transition-all duration-200 hover:-translate-y-0.5 ${darkMode ? "app-section-shell-dark shadow-[0_18px_46px_rgba(0,0,0,0.30)]" : "app-section-shell"}`}
              >
                <div className={`h-1 w-full rounded-full bg-gradient-to-r ${accentLineClass}`} />
                <div className="min-w-0">
                  <div className="mt-2 flex min-h-[48px] items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="app-kicker">{card.title}</div>
                      <div className={`mt-1 max-w-full text-sm font-semibold leading-5 ${theme.textPrimary}`}>{card.key === "crew-readiness" ? `${currentVesselName} readiness` : card.key === "priority-queue" ? "What needs action now" : card.key === "spend-activity" ? "Spend and movement" : `${currentVesselName} snapshot`}</div>
                    </div>
                    <Badge className={`${intelBadgeClass(card.accent)} max-w-[44%] shrink-0 truncate px-2.5 py-1 text-[11px]`}>{card.badge}</Badge>
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                    {dataCells.map((cell) => (
                      <div key={`${card.key}-${cell.label}`} className={`group min-w-0 rounded-[18px] border px-2.5 py-2 ${darkMode ? "border-[var(--vessel-border-dark)] bg-[rgba(255,255,255,0.03)]" : "border-[rgba(15,80,70,0.08)] bg-[rgba(255,255,255,0.52)]"}`}>
                        <div className={`app-compact-label ${premiumMetricLabelTone(cell.label, card.accent)}`.trim()}><SmartLabel label={cell.label} /></div>
                        <div className={`mt-1 truncate text-sm font-semibold tracking-tight ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{cell.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-2.5 flex min-h-9 items-center gap-2 rounded-[18px] border px-2.5 py-1.5 ${darkMode ? "border-[var(--vessel-border-dark)] bg-[rgba(255,255,255,0.03)]" : "border-[rgba(15,80,70,0.08)] bg-[rgba(255,255,255,0.52)]"}`}>
                    <span className="app-compact-label shrink-0">Signal</span>
                    <span className={`min-w-0 truncate text-xs font-medium ${theme.textSecondary}`}>{card.signal}</span>
                  </div>
                </div>
                <div className="mt-2.5 flex min-h-9 flex-col gap-1.5 min-[420px]:flex-row min-[420px]:flex-wrap">
                  {card.onAction ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={card.onAction}
                      className={`${actionButtonClass} w-full min-[420px]:w-auto`}
                    >
                      {card.actionLabel} <span aria-hidden="true">→</span>
                    </Button>
                  ) : null}
                  {card.onSecondaryAction ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={card.onSecondaryAction}
                      className={`${actionButtonClass} w-full min-[420px]:w-auto`}
                    >
                      {card.secondaryActionLabel} <span aria-hidden="true">→</span>
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </section>
      </div> : null}

    </div>
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
}) {
  const crewAndCertificatesVisible = visibleModuleKeys.includes("crew") || visibleModuleKeys.includes("certificates");
  const tasksVisible = visibleModuleKeys.includes("tasks") || visibleModuleKeys.includes("maintenance");
  const approvalsVisible = visibleModuleKeys.includes("expenses");
  const desktopItems = [
    visibleModuleKeys.includes("today") ? { key: "command", label: "Dashboard", value: stats.todayAttentionCount || 0, icon: TriangleAlert, active: expenseView === "command", onClick: onShowCommand } : null,
    tasksVisible ? { key: "tasks-maintenance", label: "Tasks", value: `${stats.totalObjectives || 0} open · ${stats.maintenanceDue || 0} due`, icon: CheckCircle2, active: expenseView === "tasks-maintenance", onClick: onShowTasksMaintenance } : null,
    approvalsVisible ? { key: "expenses-approvals", label: "Approval", value: `${stats.pendingApprovals || 0} waiting`, icon: Wallet, active: expenseView === "expenses-approvals", onClick: onShowExpenses } : null,
    crewAndCertificatesVisible ? {
      key: "crew-certificates",
      label: "Crew",
      value: `${stats.crewProfiles || 0} crew · ${stats.certificateDue || 0} due`,
      icon: Users,
      active: expenseView === "crew-certificates",
      onClick: onShowCrewCertificates,
    } : null,
    visibleModuleKeys.includes("documents") ? { key: "documents", label: "Docs", value: stats.documentCount || 0, icon: Receipt, active: expenseView === "documents", onClick: onShowDocuments } : null,
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
        className="app-card-grid mb-4 hidden md:grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(172px, 1fr))" }}
      >
        {desktopItems.map((item) => (
          <button key={item.key} type="button" onClick={item.onClick} className="h-full min-w-0 text-left">
            <SectionNavCard label={item.label} value={item.value} icon={item.icon} active={item.active} darkMode={darkMode} />
          </button>
        ))}
      </div>

      <div
        className={`fixed inset-x-3 bottom-3 z-40 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[28px] border p-2 pb-[calc(0.55rem+env(safe-area-inset-bottom))] shadow-[0_-14px_44px_-18px_rgba(17,46,39,0.24)] backdrop-blur-2xl md:hidden ${
          darkMode ? "border-[var(--vessel-border-dark)] bg-[rgba(4,12,18,0.86)] text-[#f4fbf6]" : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.88)] text-[#13231d]"
        }`}
      >
        <div className="grid w-full min-w-0 grid-cols-5 gap-1 pb-0.5 min-[390px]:gap-1.5">
          {mobileNavItems.map((item) => {
            const isActive = expenseView === item.key;
            return (
              <BottomNavButton
                key={`nav-${item.key}`}
                onClick={item.onClick}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
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
        <Input value={actorName} onChange={(event) => onActorNameChange(event.target.value)} placeholder="Name" className={`h-12 rounded-lg ${theme.input}`} />
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
  const [commentDraft, setCommentDraft] = useState("");

  useEffect(() => {
    setCommentDraft("");
  }, [selectedTask?.id]);

  if (!selectedTask) {
    return <div className={`p-8 text-center ${theme.textSecondary}`}>Select a task.</div>;
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className={`text-sm ${theme.textSecondary}`}>{selectedTask.id}</div>
          <h2 className={`text-2xl font-semibold ${theme.textPrimary}`}>{selectedTask.name}</h2>
          <p className={`text-sm ${theme.textSecondary}`}>{selectedTask.area}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className={neutralBadgeClass(darkMode)}>{selectedTask.assignee || "Unassigned"}</Badge>
            <Badge className={neutralBadgeClass(darkMode)}>{selectedTask.department || "General"}</Badge>
            <Badge className={neutralBadgeClass(darkMode) + " capitalize"}>{selectedTask.priority} priority</Badge>
            {selectedTask.dueDate ? <Badge className={neutralBadgeClass(darkMode)}>Due {selectedTask.dueDate}</Badge> : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          {canEdit ? <Select value={selectedTask.status} onValueChange={(value) => onUpdateTaskStatus(selectedTask.id, value)}>
            <SelectTrigger className={`w-full rounded-xl h-12 md:w-44 md:rounded-lg ${theme.input}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>{titleCase(option)}</SelectItem>
              ))}
            </SelectContent>
          </Select> : <Badge className={neutralBadgeClass(darkMode)}>{titleCase(selectedTask.status)}</Badge>}
          {canEdit ? <Button
            variant="outline"
            className={`w-full rounded-xl px-4 py-3 md:w-auto md:rounded-lg ${darkMode ? "border-[#5b2a2a] bg-[#231515] text-[#ffd9d9] hover:bg-[#382020]" : "border-[#e8bcbc] bg-[#fff3f3] text-[#8a1f2b] hover:bg-[#ffe4e4]"}`}
            onClick={() => onDeleteTaskRequest({ id: selectedTask.id, name: selectedTask.name })}
          >
            Delete Task
          </Button> : <Badge className={neutralBadgeClass(darkMode)}>View only</Badge>}
        </div>
      </div>

      <ConfirmableTaskFields task={selectedTask} darkMode={darkMode} canEdit={canEdit} onConfirm={onUpdateTask} />

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
            className="button-vessel-primary rounded-lg px-4 py-5 text-white disabled:cursor-not-allowed disabled:opacity-50"
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

function WorkspaceSegmentButton({ active = false, onClick, children, darkMode = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-2xl px-4 py-2 text-sm font-semibold transition md:rounded-xl ${
        active
          ? "vessel-active"
          : darkMode
            ? "bg-[#121c21] text-[#dce9e1] hover:bg-[#1a2830]"
            : "bg-[#eef3f0] text-[#40534a] hover:bg-[#dfe9e3]"
      }`}
    >
      {children}
    </button>
  );
}

export function TaskMaintenanceWorkspace({
  darkMode = false,
  activePanel = "tasks",
  onChangePanel,
  tasksView,
  maintenanceView,
}) {
  const theme = themeClasses(darkMode);
  return (
    <div className="grid gap-4">
      <Card className={`rounded-[26px] md:rounded-[24px] ${theme.card}`}>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="app-kicker">Tasks</div>
              <h2 className={`mt-2 text-2xl font-semibold ${theme.textPrimary}`}>Simple work board for daily vessel jobs.</h2>
              <p className={`mt-1 text-sm leading-6 ${theme.textSecondary}`}>Track what needs doing, what is in progress, what needs approval, and what is done.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <WorkspaceSegmentButton active={activePanel === "tasks"} onClick={() => onChangePanel("tasks")} darkMode={darkMode}>Tasks</WorkspaceSegmentButton>
              <WorkspaceSegmentButton active={activePanel === "maintenance"} onClick={() => onChangePanel("maintenance")} darkMode={darkMode}>Maint.</WorkspaceSegmentButton>
            </div>
          </div>
        </CardContent>
      </Card>
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
  const theme = themeClasses(darkMode);
  return (
    <div className="grid gap-4">
      <Card className={`rounded-[26px] md:rounded-[24px] ${theme.card}`}>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="app-kicker">Crew</div>
              <h2 className={`mt-2 text-2xl font-semibold ${theme.textPrimary}`}>Crew readiness, roles, and certificate warnings.</h2>
              <p className={`mt-1 text-sm leading-6 ${theme.textSecondary}`}>Profiles and certificate risk live together so captains and managers see people and compliance in one place.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <WorkspaceSegmentButton active={activePanel === "crew"} onClick={() => onChangePanel("crew")} darkMode={darkMode}>Crew</WorkspaceSegmentButton>
              <WorkspaceSegmentButton active={activePanel === "certificates"} onClick={() => onChangePanel("certificates")} darkMode={darkMode}>Certs</WorkspaceSegmentButton>
            </div>
          </div>
        </CardContent>
      </Card>
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
      className={`jump-highlight-target scroll-mt-24 rounded-[28px] border p-5 shadow-sm md:scroll-mt-28 ${
        darkMode
          ? "border-white/10 bg-slate-900/90"
          : "border-slate-200/80 bg-white/90"
      }`}
    >
      <div className="min-w-0">
        <div className="app-kicker">Documents</div>
        <h2 className={`mt-2 text-2xl font-semibold ${theme.textPrimary}`}>Vessel records, legal notices, manuals, and placeholders.</h2>
        <p className={`mt-1 text-sm leading-6 ${theme.textSecondary}`}>A dedicated document room for {vesselName}, keeping legal/IP notices separate from daily command decisions.</p>
      </div>
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
      <Card className={`rounded-[26px] md:rounded-[24px] ${theme.card}`}>
        <CardContent className="p-5">
          <div className="app-kicker">Settings</div>
          <h2 className={`mt-2 text-2xl font-semibold ${theme.textPrimary}`}>Vessel profile, app state, legal controls, and deployment readiness.</h2>
          <p className={`mt-1 text-sm leading-6 ${theme.textSecondary}`}>Operational defaults stay visible here without crowding the command surface.</p>
        </CardContent>
      </Card>
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

