"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ContessaUiLogo } from "../components/branding.jsx";
import { getFleetVesselStatus } from "../lib/fleet_status.mjs";

/* ------------------------------------------------------------------ */
/* Thin-line icon set (all-new, 1.5px stroke)                          */
/* ------------------------------------------------------------------ */

function Icon({ children, className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {children}
    </svg>
  );
}

const HelmIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="7.25" />
    <circle cx="12" cy="12" r="2.75" />
    <path d="M12 2.5v2.25M12 19.25v2.25M2.5 12h2.25M19.25 12h2.25M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
  </Icon>
);

const TasksIcon = (props) => (
  <Icon {...props}>
    <path d="M4 6.2h9M4 12h9M4 17.8h6" />
    <path d="M16.5 5.2l1.6 1.6 3-3.2" />
    <path d="M16.5 11l1.6 1.6 3-3.2" />
  </Icon>
);

const SealIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="9.5" r="5.25" />
    <path d="M9.8 9.3l1.6 1.6 2.9-3" />
    <path d="M8.6 14.2 7 21l5-2.6L17 21l-1.6-6.8" />
  </Icon>
);

const CrewIcon = (props) => (
  <Icon {...props}>
    <circle cx="9" cy="8" r="3.25" />
    <path d="M3.5 19.5c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5" />
    <path d="M15.5 5.4a3.25 3.25 0 1 1 1.3 6.3M17.6 14.7c1.9.5 3.2 2 3.6 4.4" />
  </Icon>
);

const VaultIcon = (props) => (
  <Icon {...props}>
    <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h4l2 2.2h7A1.5 1.5 0 0 1 20 9.7v7.8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-10Z" />
    <path d="M9 14.5h6" />
  </Icon>
);

const RouteIcon = (props) => (
  <Icon {...props}>
    <circle cx="6" cy="18" r="2.25" />
    <circle cx="18" cy="6" r="2.25" />
    <path d="M8 16.5c3-1.4 3.4-3.6 2.4-5.6-1-2-.4-4 2-5" strokeDasharray="0.1 3.2" />
  </Icon>
);

const BellIcon = (props) => (
  <Icon {...props}>
    <path d="M12 4a5.4 5.4 0 0 0-5.4 5.4c0 4.4-1.6 5.9-1.6 5.9h14s-1.6-1.5-1.6-5.9A5.4 5.4 0 0 0 12 4Z" />
    <path d="M10.2 18.6a2 2 0 0 0 3.6 0" />
  </Icon>
);

const GearIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="2.75" />
    <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" />
  </Icon>
);

const AnchorIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="5.5" r="2" />
    <path d="M12 7.5V20M12 20c-4.4 0-7.5-2.9-8-7h2.5M12 20c4.4 0 7.5-2.9 8-7h-2.5" />
  </Icon>
);

const LogIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="7.5" />
    <path d="M12 8v4.2l2.8 1.7" />
  </Icon>
);

const MoreIcon = (props) => (
  <Icon {...props}>
    <circle cx="5.5" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="18.5" cy="12" r="1" fill="currentColor" />
  </Icon>
);

const ChevronIcon = (props) => (
  <Icon {...props}>
    <path d="m7 9.5 5 5 5-5" />
  </Icon>
);

/* ------------------------------------------------------------------ */

function useClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setNow(new Date()));
    const interval = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, []);
  return now;
}

function RailItem({ icon: ItemIcon, label, count, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`harbourline-rail-item group relative flex w-full flex-col items-center gap-1 py-3 transition-colors duration-200 ${
        active ? "text-[var(--fog)]" : "text-[var(--fog-soft)] hover:text-[var(--fog)]"
      }`}
    >
      <span
        className={`pointer-events-none absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--signal)] transition-opacity duration-200 ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
      <span className="relative">
        <ItemIcon className="h-[21px] w-[21px]" />
        {count ? (
          <span className="harbourline-count absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--signal)] px-1 text-[9px] font-bold leading-none text-white">
            {count}
          </span>
        ) : null}
      </span>
      <span className="text-[8.5px] font-bold uppercase tracking-[0.18em]">{label}</span>
    </button>
  );
}

function DockItem({ icon: ItemIcon, label, count, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`harbourline-dock-item relative flex min-w-0 flex-col items-center gap-1 px-1 py-2 transition-colors duration-200 ${
        active ? "text-[var(--fog)]" : "text-[var(--fog-soft)]"
      }`}
    >
      <span className="relative">
        <ItemIcon className="h-[22px] w-[22px]" />
        {count ? (
          <span className="harbourline-count absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--signal)] px-1 text-[9px] font-bold leading-none text-white">
            {count}
          </span>
        ) : null}
      </span>
      <span className="max-w-full truncate text-[9px] font-bold uppercase tracking-[0.14em]">{label}</span>
      <span
        className={`h-[3px] w-7 rounded-full bg-[var(--signal)] transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
      />
    </button>
  );
}

function VesselStatusLamp({ level = "ready", className = "" }) {
  return <span className={`harbourline-status-lamp harbourline-status-lamp--${level} ${className}`.trim()} aria-hidden="true" />;
}

function VesselSwitcher({
  vesselTitle,
  vesselIdentifier,
  modeLabel,
  fleetVessels,
  fleetMetricsByVessel,
  activeVesselId,
  onSwitchFleetVessel,
  onOpenFleet,
  open,
  onOpenChange,
}) {
  const switcherRef = useRef(null);
  const activeVessel = fleetVessels.find((vessel) => vessel?.id === activeVesselId) || {};
  const activeStatus = getFleetVesselStatus(fleetMetricsByVessel?.[activeVesselId] || {}, activeVessel);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsidePress = (event) => {
      if (!switcherRef.current?.contains(event.target)) onOpenChange(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onOpenChange, open]);

  return (
    <div ref={switcherRef} className="harbourline-vessel-switcher relative min-w-0">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="harbourline-vessel-switcher-button flex min-w-0 items-center gap-3 text-left"
      >
        <span className="harbourline-vessel-mark flex h-10 w-10 shrink-0 items-center justify-center">
          <ContessaUiLogo className="h-7 w-7" />
        </span>
        <VesselStatusLamp level={activeStatus.level} className="shrink-0" />
        <span className="min-w-0">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="harbourline-heading block truncate text-[clamp(0.84rem,2.5vw,1.08rem)] tracking-[0.055em] text-[var(--fog)]">
              {vesselTitle}
            </span>
            {vesselIdentifier ? (
              <span className="hidden shrink-0 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--fog-soft)] xl:inline">
                {vesselIdentifier}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 flex items-center gap-2 truncate text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--fog-soft)]">
            <span className="truncate">{activeStatus.label}</span>
            {modeLabel ? <span className="hidden truncate sm:inline">/ {modeLabel}</span> : null}
          </span>
        </span>
        <ChevronIcon className={`h-4 w-4 shrink-0 text-[var(--fog-soft)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="harbourline-vessel-menu absolute left-0 top-[calc(100%+0.55rem)] z-[26000] w-[min(25rem,calc(100vw-2rem))] overflow-hidden border">
          <div className="border-b border-[var(--deck-200)] px-4 py-3">
            <div className="harbourline-micro-label">Fleet vessels</div>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">Switch workspace without leaving the current module.</p>
          </div>
          <div className="max-h-[min(26rem,62vh)] overflow-y-auto p-2" role="listbox" aria-label="Choose vessel">
            {fleetVessels.map((vessel) => {
              const isActive = vessel?.id === activeVesselId;
              const metrics = fleetMetricsByVessel?.[vessel?.id] || {};
              const status = getFleetVesselStatus(metrics, vessel);
              return (
                <button
                  key={vessel?.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onOpenChange(false);
                    if (!isActive) onSwitchFleetVessel?.(vessel?.id);
                  }}
                  className={`harbourline-vessel-option relative flex w-full items-center gap-3 border-l-[3px] px-3 py-3 text-left ${
                    isActive ? "harbourline-vessel-option--active" : ""
                  }`}
                >
                  <VesselStatusLamp level={status.level} className="shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[var(--ink)]">{vessel?.name || "Vessel"}</span>
                    <span className="mt-0.5 block truncate text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                      {status.label} / {status.detail}
                    </span>
                  </span>
                  <span className="harbourline-count shrink-0 text-[10px] text-[var(--ink-soft)]">
                    {Number(metrics.taskCount || 0)} tasks
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onOpenFleet?.();
            }}
            className="harbourline-vessel-menu-footer flex w-full items-center justify-between border-t border-[var(--deck-200)] px-4 py-3 text-left"
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.14em] text-[var(--ink)]">Open fleet manager</span>
              <span className="mt-0.5 block text-xs text-[var(--ink-soft)]">Add vessels and review fleet details</span>
            </span>
            <AnchorIcon className="h-5 w-5 text-[var(--brass)]" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ShellPanel({ open, onClose, title, children, align = "right" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[24000]">
      <button type="button" aria-label="Close panel" onClick={onClose} className="absolute inset-0 bg-[var(--mb-scrim)]" />
      <div
        className={`harbourline-shell-panel absolute flex max-h-[calc(100dvh-2rem)] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden border ${
          align === "right" ? "right-3 top-3 bottom-3 rounded-[10px]" : "left-3 bottom-24 rounded-[10px] lg:left-24 lg:bottom-6"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--mb-line)] px-5 py-4">
          <span className="harbourline-heading text-lg text-[var(--ink)]">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--deck-200)] text-[var(--ink-soft)] transition-colors hover:border-[var(--ink-soft)] hover:text-[var(--ink)]"
            aria-label={`Close ${title}`}
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function HarbourlineShell({
  vesselTitle = "M/Y VESSEL",
  vesselIdentifier = "",
  modeLabel = "",
  roleLabel = "Captain",
  isOffline = false,
  activeModule = "command",
  counts = {},
  onNavCommand,
  onNavTasks,
  onNavApprovals,
  onNavCrew,
  onNavDocs,
  onNavRoute,
  onNavAlerts,
  notifications = [],
  notificationCount = 0,
  onSelectNotification,
  fleetVessels = [],
  fleetMetricsByVessel = {},
  activeVesselId = "contessa",
  onSwitchFleetVessel,
  onOpenFleet,
  onQuickAddTask,
  onOpenHistory,
  onOpenPreferences,
}) {
  const clock = useClock();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [vesselSwitcherOpen, setVesselSwitcherOpen] = useState(false);

  // Counts come from persisted client state; render them only after mount so
  // server HTML (seed data) never disagrees with the hydrating client.
  const mounted = clock !== null;
  const shownCount = (value) => (mounted ? value : 0);

  const clockLabel = useMemo(() => {
    if (!clock) return "—:—";
    return clock.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }, [clock]);

  const railItems = [
    { key: "command", label: "Bridge", icon: HelmIcon, onClick: onNavCommand, count: 0 },
    { key: "tasks-maintenance", label: "Tasks", icon: TasksIcon, onClick: onNavTasks, count: counts.tasks || 0 },
    { key: "expenses-approvals", label: "Approve", icon: SealIcon, onClick: onNavApprovals, count: counts.approvals || 0 },
    { key: "crew-certificates", label: "Crew", icon: CrewIcon, onClick: onNavCrew, count: counts.crew || 0 },
    { key: "documents", label: "Vault", icon: VaultIcon, onClick: onNavDocs, count: counts.docs || 0 },
    { key: "route", label: "Route", icon: RouteIcon, onClick: onNavRoute, count: counts.route || 0 },
  ];

  const closeAll = () => {
    setNotificationsOpen(false);
    setMoreOpen(false);
    setVesselSwitcherOpen(false);
  };

  const navigate = (fn) => () => {
    closeAll();
    fn?.();
  };

  return (
    <>
      {/* ---- Desktop rail ---- */}
      <nav className="harbourline-rail fixed inset-y-3 left-3 z-[20000] hidden w-[5.25rem] flex-col items-center rounded-[10px] border lg:flex">
        <button
          type="button"
          onClick={navigate(onNavCommand)}
          aria-label="Open command bridge"
          className="harbourline-logo-button mt-5 flex h-12 w-12 items-center justify-center rounded-[8px] border"
        >
          <ContessaUiLogo className="h-9 w-9" />
        </button>

        <div className="mt-6 flex w-full flex-1 flex-col items-stretch justify-center gap-1">
          {railItems.map((item) => (
            <RailItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              count={shownCount(item.count)}
              active={activeModule === item.key}
              onClick={navigate(item.onClick)}
            />
          ))}
        </div>

        <div className="mb-5 flex w-full flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => { closeAll(); setNotificationsOpen(true); }}
            aria-label="Open notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-[8px] text-[var(--fog-soft)] transition-colors hover:text-[var(--fog)]"
          >
            <BellIcon className="h-5 w-5" />
            {shownCount(notificationCount) ? (
              <span className="harbourline-count absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--signal)] px-1 text-[9px] font-bold leading-none text-white">
                {shownCount(notificationCount)}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => { closeAll(); onOpenFleet?.(); }}
            aria-label="Open fleet manager"
            className="flex h-10 w-10 items-center justify-center rounded-[8px] text-[var(--fog-soft)] transition-colors hover:text-[var(--fog)]"
          >
            <AnchorIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => { closeAll(); onOpenHistory?.(); }}
            aria-label="Open history"
            className="flex h-10 w-10 items-center justify-center rounded-[8px] text-[var(--fog-soft)] transition-colors hover:text-[var(--fog)]"
          >
            <LogIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => { closeAll(); onOpenPreferences?.(); }}
            aria-label="Open settings"
            className={`flex h-10 w-10 items-center justify-center rounded-[8px] transition-colors hover:text-[var(--fog)] ${
              activeModule === "settings" ? "text-[var(--signal)]" : "text-[var(--fog-soft)]"
            }`}
          >
            <GearIcon className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* ---- Top strip ---- */}
      <header
        id="app-command-header"
        data-jump-target
        style={{ "--jump-radius": "18px" }}
        className="harbourline-command-header jump-highlight-target relative z-[500] flex items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 md:px-4"
      >
        <VesselSwitcher
          vesselTitle={vesselTitle}
          vesselIdentifier={vesselIdentifier}
          modeLabel={modeLabel}
          fleetVessels={fleetVessels}
          fleetMetricsByVessel={fleetMetricsByVessel}
          activeVesselId={activeVesselId}
          onSwitchFleetVessel={onSwitchFleetVessel}
          onOpenFleet={onOpenFleet}
          open={vesselSwitcherOpen}
          onOpenChange={setVesselSwitcherOpen}
        />

        <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
          {onQuickAddTask ? (
            <button
              type="button"
              onClick={navigate(onQuickAddTask)}
              className="neo-header-task-action"
              aria-label="Create a new task"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">New task</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => { closeAll(); onOpenPreferences?.(); }}
            className="harbourline-header-secondary hidden min-h-9 items-center gap-1 rounded-[8px] border px-3 text-[10px] font-bold uppercase tracking-[0.16em] md:inline-flex"
            aria-label={`Change operating role. Current role: ${roleLabel}`}
          >
            {roleLabel} view
            <span aria-hidden="true">&#9662;</span>
          </button>
          <span suppressHydrationWarning className="harbourline-count text-[13px] font-semibold tracking-[0.08em] text-[var(--fog)]">
            {clockLabel}
          </span>
          <span
            title={isOffline ? "Offline" : "Live"}
            className={`inline-block h-1.5 w-1.5 rounded-full ${isOffline ? "bg-[var(--crit)]" : "bg-[var(--ok)]"}`}
          />
          <button
            type="button"
            onClick={() => { closeAll(); setNotificationsOpen(true); }}
            aria-label="Open notifications"
            className="harbourline-header-secondary relative flex h-9 w-9 items-center justify-center rounded-[8px] border lg:hidden"
          >
            <BellIcon className="h-[18px] w-[18px]" />
            {shownCount(notificationCount) ? (
              <span className="harbourline-count absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--signal)] px-1 text-[9px] font-bold leading-none text-white">
                {shownCount(notificationCount)}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      {/* ---- Mobile dock ---- */}
      <nav className="harbourline-mobile-dock fixed inset-x-3 bottom-3 z-[20000] grid grid-cols-5 gap-0.5 rounded-[10px] border px-2 pb-[calc(0.35rem+env(safe-area-inset-bottom))] pt-1.5 lg:hidden">
        <DockItem icon={HelmIcon} label="Bridge" active={activeModule === "command"} onClick={navigate(onNavCommand)} />
        <DockItem icon={TasksIcon} label="Tasks" count={shownCount(counts.tasks || 0)} active={activeModule === "tasks-maintenance"} onClick={navigate(onNavTasks)} />
        <DockItem icon={SealIcon} label="Approve" count={shownCount(counts.approvals || 0)} active={activeModule === "expenses-approvals"} onClick={navigate(onNavApprovals)} />
        <DockItem icon={CrewIcon} label="Crew" count={shownCount(counts.crew || 0)} active={activeModule === "crew-certificates"} onClick={navigate(onNavCrew)} />
        <DockItem icon={MoreIcon} label="More" active={["documents", "route", "notifications", "settings"].includes(activeModule)} onClick={() => { closeAll(); setMoreOpen(true); }} />
      </nav>

      {/* ---- Notifications drawer ---- */}
      <ShellPanel open={notificationsOpen} onClose={closeAll} title="Signals">
        {notifications.length ? (
          <ul className="grid gap-1.5">
            {notifications.map((notification) => (
              <li key={notification.id || notification.title}>
                <button
                  type="button"
                  aria-label={notification.title || notification.message || "Open notification"}
                  onClick={() => {
                    closeAll();
                    onSelectNotification?.(notification);
                  }}
                  className="w-full rounded-[14px] border border-transparent px-3.5 py-3 text-left transition-colors hover:border-[var(--mb-line-strong)] hover:bg-[var(--mb-gold-tint)]"
                >
                  <div className="truncate text-sm font-semibold text-[var(--mb-ink)]">{notification.title || notification.message}</div>
                  {notification.detail || notification.description ? (
                    <div className="mt-0.5 line-clamp-2 text-xs leading-5 text-[var(--mb-muted)]">
                      {notification.detail || notification.description}
                    </div>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-6 text-center text-sm text-[var(--ink-soft)]">No active signals right now.</p>
        )}
        <button
          type="button"
          onClick={navigate(onNavAlerts)}
          className="app-primary-action-button mt-3 w-full justify-center rounded-[14px] text-center"
        >
          Open all alerts
        </button>
      </ShellPanel>

      {/* ---- Mobile "More" sheet ---- */}
      <ShellPanel open={moreOpen} onClose={closeAll} title="More" align="left">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Vault", icon: VaultIcon, onClick: onNavDocs, count: shownCount(counts.docs || 0) },
            { label: "Route", icon: RouteIcon, onClick: onNavRoute, count: shownCount(counts.route || 0) },
            { label: "Alerts", icon: BellIcon, onClick: onNavAlerts, count: shownCount(notificationCount) },
            { label: "Settings", icon: GearIcon, onClick: onOpenPreferences, count: 0 },
          ].map((entry) => (
            <button
              key={entry.label}
              type="button"
              onClick={navigate(entry.onClick)}
              className="flex flex-col items-center gap-2 rounded-[8px] border border-[var(--deck-200)] px-3 py-4 text-[var(--ink-soft)] transition-colors hover:border-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              <span className="relative">
                <entry.icon className="h-6 w-6" />
                {entry.count ? (
                  <span className="harbourline-count absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--signal)] px-1 text-[9px] font-bold leading-none text-white">
                    {entry.count}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{entry.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 border-t border-[var(--mb-line)] pt-3">
          <div className="harbourline-micro-label px-1 pb-2">Workspace</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => { closeAll(); onOpenFleet?.(); }}
              className="flex items-center justify-center gap-2 rounded-[8px] border border-[var(--deck-200)] px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-soft)]"
            >
              <AnchorIcon className="h-4 w-4" />
              Fleet manager
            </button>
            <button
              type="button"
              onClick={() => { closeAll(); onOpenHistory?.(); }}
              className="flex items-center justify-center gap-2 rounded-[8px] border border-[var(--deck-200)] px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-soft)]"
            >
              <LogIcon className="h-4 w-4" />
              History
            </button>
          </div>
        </div>
      </ShellPanel>
    </>
  );
}
