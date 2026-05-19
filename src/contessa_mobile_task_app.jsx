// Copyright (c) 2026 Josip Golic. Proprietary and confidential.
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ASSIGNEE_OPTIONS,
  APP_FOOTER_NOTICE,
  buildBoatExpenseSummaryItems,
  buildTodayOperationsSnapshot,
  getCanonicalPublicAppUrlStatus,
  buildDashboardSnapshot,
  buildCertificateAlerts,
  buildOperationalNotifications,
  CURRENCY_OPTIONS,
  CREW_DEPARTMENT_OPTIONS,
  CREW_RANK_OPTIONS,
  DECLINED_HOLD_MS,
  FALLBACK_USD_RATES,
  MAINTENANCE_AREA_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  STORAGE_KEY,
  TASK_DEPARTMENT_OPTIONS,
  MONEY_STATUS_OPTIONS,
  archiveDeclinedTasks,
  buildMaintenanceAlerts,
  clampMaintenanceDueDate,
  completeMaintenanceCycle,
  convertMoney,
  createEmptyAppState,
  buildFleetVesselId,
  buildVesselThemeCssVars,
  createFleetVesselWorkspace,
  createFullStateExport,
  createNextTaskId,
  createPersistedAppState,
  csvValue,
  dateStringFromNow,
  describePatch,
  downloadFile,
  formatVesselNameFromId,
  formatMoney,
  getConfiguredPublicAppUrlEnvValue,
  getInitialAppState,
  getNextFleetTheme,
  getVesselMetrics,
  hasMaintenanceDuplicate,
  isLocalRuntimeLocation,
  isPaidMoneyStatus,
  isRejectedExpired,
  loadReminderState,
  normalizeCrewProfile,
  normalizeImportedAppState,
  normalizeFleetVessel,
  normalizeMaintenanceItem,
  normalizeMoneyItem,
  parseAmountInput,
  readFilesAsAttachmentPayloads,
  readFilesAsDataUrls,
  safeNumber,
  sortMaintenanceLogs,
  themeClasses,
  titleCase,
  todayDateString,
} from "./contessa_app_data.mjs";
import {
  createEmptyCertificateDraft,
  extractCertificateDraft,
} from "./contessa_certificate_extraction.mjs";
import {
  AppBanner,
  AppDialogs,
  AppSectionCards,
  AppShellHeader,
  CrewCertificatesWorkspace,
  DashboardCommandSearch,
  DocumentsView,
  SettingsWorkspaceView,
  MaintenanceReminderModal,
  ObjectivesView,
  TaskMaintenanceWorkspace,
  TodayOperationsView,
} from "./contessa_feature_sections.jsx";
import { canAccessCrewProfile, canAccessModule, canAccessTask, DEMO_ROLE_OPTIONS, getVisibleModulesForRole } from "./contessa_access.mjs";
import { APP_BRAND_NAME, ContessaUiLogo } from "./components/branding.jsx";
import { MobileDetailSheet, MobileSection } from "./components/mobile_command_sections.jsx";
import { getModuleTheme, moduleThemeKeyForView } from "./components/module_themes.js";
import {
  calculateRoutePassageSummary,
  createRouteWaypoint,
  normalizeRoutePlanningState,
  reorderRouteWaypoints,
} from "./lib/route_planning.mjs";
import {
  getStoredJson,
  removeStoredKey,
  setStoredJson,
} from "./lib/browser_storage.mjs";

const PROTOTYPE_SYNC_KEY = `${STORAGE_KEY}-prototype-sync-state`;

function buildCommandSearchText(parts = []) {
  return (Array.isArray(parts) ? parts : [])
    .reduce((list, part) => (Array.isArray(part) ? [...list, ...part] : [...list, part]), [])
    .filter((part) => part !== null && part !== undefined)
    .map((part) => String(part).toLowerCase())
    .join(" ");
}

function DeferredFeatureFallback() {
  return (
    <div className="app-panel app-panel-soft rounded-[26px] border border-slate-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
      <div className="app-compact-label text-xs font-semibold uppercase">Loading</div>
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Preparing workspace...</div>
    </div>
  );
}

const RoutePlanningView = dynamic(
  () => import("./features/route-planning/route-planning-view.jsx").then((module) => module.RoutePlanningView),
  { ssr: false, loading: () => <DeferredFeatureFallback /> }
);
const CrewView = dynamic(
  () => import("./features/crew/crew-view.jsx").then((module) => module.CrewView),
  { loading: () => <DeferredFeatureFallback /> }
);
const CertificatesView = dynamic(
  () => import("./features/certificates/certificates-view.jsx").then((module) => module.CertificatesView),
  { loading: () => <DeferredFeatureFallback /> }
);
const MaintenanceView = dynamic(
  () => import("./features/maintenance/maintenance-view.jsx").then((module) => module.MaintenanceView),
  { loading: () => <DeferredFeatureFallback /> }
);
const NotificationsView = dynamic(
  () => import("./features/notifications/notifications-view.jsx").then((module) => module.NotificationsView),
  { loading: () => <DeferredFeatureFallback /> }
);
const ExpensesView = dynamic(
  () => import("./features/expenses/expenses-view.jsx").then((module) => module.ExpensesView),
  { loading: () => <DeferredFeatureFallback /> }
);

export default function ContessaApp({ routeVesselId = "contessa", onNavigateVessel } = {}) {
  const initialAppState = useMemo(() => {
    const state = getInitialAppState();
    const routeHasWorkspace = Array.isArray(state.vessels) && state.vessels.some((vessel) => vessel?.id === routeVesselId);

    if (!routeVesselId || !routeHasWorkspace) return state;
    return createPersistedAppState({ ...state, activeVesselId: routeVesselId });
  }, [routeVesselId]);
  const initialFleet = useMemo(() => initialAppState.vessels || [], [initialAppState.vessels]);
  const initialRouteVesselMissing = useMemo(
    () => Boolean(routeVesselId && !initialFleet.some((vessel) => vessel?.id === routeVesselId)),
    [initialFleet, routeVesselId]
  );
  const initialActiveVesselId = useMemo(() => {
    const routeMatch = initialFleet.find((vessel) => vessel?.id === routeVesselId);
    if (routeMatch) return routeVesselId;
    return initialAppState.activeVesselId || initialFleet[0]?.id || "contessa";
  }, [initialAppState.activeVesselId, initialFleet, routeVesselId]);
  const initialActiveWorkspace = useMemo(() => {
    const workspace = initialFleet.find((vessel) => vessel?.id === initialActiveVesselId) || initialFleet[0];
    return normalizeFleetVessel(workspace, initialActiveVesselId);
  }, [initialActiveVesselId, initialFleet]);
  const [vessels, setVessels] = useState(initialFleet);
  const [activeVesselId, setActiveVesselId] = useState(initialActiveVesselId);
  const [routeNotFound, setRouteNotFound] = useState(initialRouteVesselMissing);
  const [fleetOpen, setFleetOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(initialAppState.darkMode);
  const [currency, setCurrency] = useState(initialAppState.currency);
  const [exchangeRates, setExchangeRates] = useState({ rates: FALLBACK_USD_RATES, date: "fallback", source: "fallback", live: false });
  const [isOffline, setIsOffline] = useState(false);
  const [tasks, setTasks] = useState(initialActiveWorkspace.tasks || []);
  const [declinedTasks, setDeclinedTasks] = useState(initialActiveWorkspace.declinedTasks || []);
  const [crewExpenses, setCrewExpenses] = useState(initialActiveWorkspace.crewExpenses || []);
  const [crewProfiles, setCrewProfiles] = useState(initialActiveWorkspace.crewProfiles || []);
  const [maintenanceItems, setMaintenanceItems] = useState(initialActiveWorkspace.maintenanceItems || []);
  const [vesselProfile, setVesselProfile] = useState(initialActiveWorkspace.vesselProfile || initialActiveWorkspace.routePlanning?.vesselProfile || {});
  const [documents, setDocuments] = useState(initialActiveWorkspace.documents || []);
  const [routePlanning, setRoutePlanning] = useState(initialActiveWorkspace.routePlanning);
  const [selectedId, setSelectedId] = useState(initialActiveWorkspace.tasks?.[0]?.id ?? "");
  const [selectedCrewId, setSelectedCrewId] = useState(initialActiveWorkspace.crewProfiles?.[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expenseView, setExpenseView] = useState("command");
  const [openMobileSection, setOpenMobileSection] = useState("today");
  const [mobileDetailItem, setMobileDetailItem] = useState(null);
  const [expenseBucket, setExpenseBucket] = useState("boat");
  const [tasksMaintenancePanel, setTasksMaintenancePanel] = useState("tasks");
  const [crewCertificatesPanel, setCrewCertificatesPanel] = useState("crew");
  const [currentRole, setCurrentRole] = useState(initialAppState.currentRole || "captain");
  const [appMode, setAppMode] = useState(initialAppState.appMode === "editor" ? "editor" : "view");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [retrieveOpen, setRetrieveOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const [pendingSectionNavigation, setPendingSectionNavigation] = useState(null);
  const [newCrewExpenseOpen, setNewCrewExpenseOpen] = useState(false);
  const [newCrewProfileOpen, setNewCrewProfileOpen] = useState(false);
  const [newCertificateOpen, setNewCertificateOpen] = useState(false);
  const [newMaintenanceOpen, setNewMaintenanceOpen] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState("");
  const [appBanner, setAppBanner] = useState(null);
  const [newTask, setNewTask] = useState({ name: "", area: "", department: TASK_DEPARTMENT_OPTIONS[0], status: "pending", priority: "medium", assignee: ASSIGNEE_OPTIONS[0], dueDate: "", notes: "" });
  const [newExpense, setNewExpense] = useState({ taskId: initialActiveWorkspace.tasks?.[0]?.id ?? "", supplier: "", amount: 0, currency: initialAppState.currency, status: "requested" });
  const [newCrewExpense, setNewCrewExpense] = useState({ title: "", amount: 0, currency: initialAppState.currency, status: "requested" });
  const [newCrewProfile, setNewCrewProfile] = useState({ fullName: "", rank: CREW_RANK_OPTIONS[0], department: CREW_DEPARTMENT_OPTIONS[0], nationality: "", roleKey: "captain", notes: "" });
  const [newCertificate, setNewCertificate] = useState(createEmptyCertificateDraft());
  const [newCertificateCrewId, setNewCertificateCrewId] = useState(initialActiveWorkspace.crewProfiles?.[0]?.id ?? "");
  const [isExtractingCertificate, setIsExtractingCertificate] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState({
    title: "",
    area: MAINTENANCE_AREA_OPTIONS[0],
    areaOption: MAINTENANCE_AREA_OPTIONS[0],
    customArea: "",
    frequencyMonths: 1,
    nextDueDate: todayDateString(),
    notes: "",
  });
  const [maintenanceReminderState, setMaintenanceReminderState] = useState(() => loadReminderState());
  const [maintenancePopupTick, setMaintenancePopupTick] = useState(Date.now());
  const [postponeDate, setPostponeDate] = useState(dateStringFromNow(1));
  const [quoteDeleteRequest, setQuoteDeleteRequest] = useState(null);
  const [taskDeleteRequest, setTaskDeleteRequest] = useState(null);
  const [crewExpenseDeleteRequest, setCrewExpenseDeleteRequest] = useState(null);
  const [actorName, setActorName] = useState(initialAppState.actorName);
  const [history, setHistory] = useState(initialActiveWorkspace.history || []);
  const [notificationPermission, setNotificationPermission] = useState(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const jsonImportInputRef = useRef(null);
  const sectionNavigationTimeoutRef = useRef(null);
  const [prototypeTaskApprovals, setPrototypeTaskApprovals] = useState({});
  const [prototypeSyncState, setPrototypeSyncState] = useState(() => {
    const saved = getStoredJson(PROTOTYPE_SYNC_KEY, null);
    if (saved && typeof saved === "object") {
      return {
        lastSyncAt: saved.lastSyncAt || new Date().toISOString(),
        unsyncedItemsCount: Number.isFinite(Number(saved.unsyncedItemsCount)) ? Number(saved.unsyncedItemsCount) : 0,
      };
    }

    return { lastSyncAt: new Date().toISOString(), unsyncedItemsCount: 0 };
  });
  const syncTrackingReadyRef = useRef(false);

  const theme = themeClasses(darkMode);
  const canEditApp = appMode === "editor";
  const effectiveRole = currentRole;
  const publicAppUrlStatus = useMemo(() => {
    return getCanonicalPublicAppUrlStatus(
      getConfiguredPublicAppUrlEnvValue(),
      typeof window === "undefined" ? {} : { locationLike: window.location }
    );
  }, []);
  const localShareWarning = useMemo(() => {
    if (typeof window === "undefined") return "";
    return isLocalRuntimeLocation(window.location)
      ? "You are running the app locally. Sharing from local development may not open on other devices. The app will still share NEXT_PUBLIC_APP_URL as the canonical public link."
      : "";
  }, []);
  const activeVesselWorkspace = useMemo(() => {
    return normalizeFleetVessel(
      {
        ...(vessels.find((vessel) => vessel.id === activeVesselId) || {}),
        id: activeVesselId,
        vesselProfile,
        documents,
        tasks,
        history,
        declinedTasks,
        crewExpenses,
        crewProfiles,
        workers: crewProfiles,
        maintenanceItems,
        routePlanning,
      },
      activeVesselId
    );
  }, [vessels, activeVesselId, vesselProfile, documents, tasks, history, declinedTasks, crewExpenses, crewProfiles, maintenanceItems, routePlanning]);
  const vesselsForPersistence = useMemo(() => {
    const nextFleet = Array.isArray(vessels) && vessels.length ? vessels : [activeVesselWorkspace];
    const hasActiveVessel = nextFleet.some((vessel) => vessel.id === activeVesselId);

    if (!hasActiveVessel) {
      return [...nextFleet.filter(Boolean), activeVesselWorkspace];
    }

    return nextFleet.map((vessel) => (vessel.id === activeVesselId ? activeVesselWorkspace : vessel));
  }, [vessels, activeVesselId, activeVesselWorkspace]);
  const fleetMetricsByVessel = useMemo(() => {
    return Object.fromEntries(
      vesselsForPersistence.map((vessel) => [vessel.id, getVesselMetrics(vessel.id, vesselsForPersistence)])
    );
  }, [vesselsForPersistence]);
  const vesselThemeVars = useMemo(
    () => buildVesselThemeCssVars(activeVesselWorkspace?.theme),
    [activeVesselWorkspace?.theme]
  );
  const persistedAppState = useMemo(
    () => createPersistedAppState({ darkMode, currency, actorName, currentRole, appMode, history, declinedTasks, vesselProfile, documents, tasks, crewExpenses, crewProfiles, maintenanceItems, routePlanning, vessels: vesselsForPersistence, activeVesselId }),
    [darkMode, currency, actorName, currentRole, appMode, history, declinedTasks, vesselProfile, documents, tasks, crewExpenses, crewProfiles, maintenanceItems, routePlanning, vesselsForPersistence, activeVesselId]
  );
  const visibleModuleKeys = useMemo(
    () => getVisibleModulesForRole(effectiveRole).map((module) => module.key),
    [effectiveRole]
  );
  const visibleCrewProfiles = useMemo(
    () => crewProfiles.filter((profile) => canAccessCrewProfile(effectiveRole, profile, actorName)),
    [crewProfiles, effectiveRole, actorName]
  );
  const visibleTasks = useMemo(
    () => tasks.filter((task) => canAccessTask(effectiveRole, task, actorName)),
    [tasks, effectiveRole, actorName]
  );
  const approvalScopedBoatItems = useMemo(
    () =>
      visibleTasks.flatMap((task) =>
        (task.quotes || []).map((quote) => ({
          ...quote,
          kind: "quote",
          displayName: quote.supplier,
          taskId: task.id,
          taskName: task.name,
          taskArea: task.area,
        }))
      ),
    [visibleTasks]
  );
  const maintenanceAlerts = useMemo(() => {
    return buildMaintenanceAlerts(maintenanceItems);
  }, [maintenanceItems]);
  const canAccessSection = (sectionKey) => visibleModuleKeys.includes(sectionKey);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncStatus = () => setIsOffline(!window.navigator.onLine);
    syncStatus();
    window.addEventListener("online", syncStatus);
    window.addEventListener("offline", syncStatus);
    return () => {
      window.removeEventListener("online", syncStatus);
      window.removeEventListener("offline", syncStatus);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return undefined;
    }

    const syncPermission = () => setNotificationPermission(Notification.permission);
    syncPermission();
    window.addEventListener("focus", syncPermission);
    document.addEventListener("visibilitychange", syncPermission);

    return () => {
      window.removeEventListener("focus", syncPermission);
      document.removeEventListener("visibilitychange", syncPermission);
    };
  }, []);

  useEffect(() => {
    setStoredJson(STORAGE_KEY, persistedAppState);
  }, [persistedAppState]);

  useEffect(() => {
    setStoredJson(`${STORAGE_KEY}-maintenance-reminders`, maintenanceReminderState);
  }, [maintenanceReminderState]);

  useEffect(() => {
    setStoredJson(PROTOTYPE_SYNC_KEY, prototypeSyncState);
  }, [prototypeSyncState]);

  useEffect(() => {
    if (!syncTrackingReadyRef.current) {
      syncTrackingReadyRef.current = true;
      return;
    }

    setPrototypeSyncState((prev) => {
      if (isOffline) {
        return { ...prev, unsyncedItemsCount: prev.unsyncedItemsCount + 1 };
      }

      return {
        lastSyncAt: new Date().toISOString(),
        unsyncedItemsCount: 0,
      };
    });
  }, [persistedAppState, isOffline]);

  useEffect(() => {
    if (isOffline || prototypeSyncState.unsyncedItemsCount === 0) return;
    setPrototypeSyncState({
      lastSyncAt: new Date().toISOString(),
      unsyncedItemsCount: 0,
    });
  }, [isOffline, prototypeSyncState.unsyncedItemsCount]);

  useEffect(() => {
    const archiveExpiredDeclinedTasks = () => {
      const now = Date.now();
      setTasks((prev) => {
        const { archivedTasks, remainingTasks } = archiveDeclinedTasks(prev, now);
        if (!archivedTasks.length) return prev;
        setDeclinedTasks((existing) => [...archivedTasks, ...existing]);
        setHistory((existing) => [
          ...archivedTasks.map((task) => ({
            id: `H-${Date.now()}-${task.id}`,
            at: new Date().toISOString(),
            by: "System",
            section: "History",
            action: "Declined task archived",
            detail: `${task.name} was moved from Objectives to History.`,
          })),
          ...existing,
        ].slice(0, 300));
        return remainingTasks;
      });
    };
    archiveExpiredDeclinedTasks();
    const interval = setInterval(archiveExpiredDeclinedTasks, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setMaintenancePopupTick(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const targetCurrencies = CURRENCY_OPTIONS.map((option) => option.code).filter((code) => code !== "USD").join(",");

    fetch(`https://api.frankfurter.dev/v1/latest?base=USD&symbols=${targetCurrencies}`)
      .then((response) => {
        if (!response.ok) throw new Error("Frankfurter rates unavailable");
        return response.json();
      })
      .then((data) => {
        setExchangeRates({
          rates: { ...FALLBACK_USD_RATES, USD: 1, ...(data.rates || {}) },
          date: data.date || "latest",
          source: "Frankfurter",
          live: true,
        });
      })
      .catch(() => {
        fetch("https://open.er-api.com/v6/latest/USD")
          .then((response) => {
            if (!response.ok) throw new Error("Open exchange rates unavailable");
            return response.json();
          })
          .then((data) => {
            setExchangeRates({
              rates: { ...FALLBACK_USD_RATES, USD: 1, ...(data.rates || {}) },
              date: data.time_last_update_utc || "latest",
              source: "ExchangeRate-API",
              live: true,
            });
          })
          .catch(() => {
            setExchangeRates({ rates: FALLBACK_USD_RATES, date: "fallback", source: "offline fallback", live: false });
          });
      });
  }, []);

  useEffect(() => {
    if (!visibleTasks.length) {
      setSelectedId("");
      return;
    }

    if (!visibleTasks.some((task) => task.id === selectedId)) {
      setSelectedId(visibleTasks[0].id);
    }
  }, [visibleTasks, selectedId]);

  useEffect(() => {
    if (!visibleCrewProfiles.length) {
      setSelectedCrewId("");
      setNewCertificateCrewId("");
      return;
    }

    if (!visibleCrewProfiles.some((profile) => profile.id === selectedCrewId)) {
      setSelectedCrewId(visibleCrewProfiles[0].id);
    }

    if (!visibleCrewProfiles.some((profile) => profile.id === newCertificateCrewId)) {
      setNewCertificateCrewId(visibleCrewProfiles[0].id);
    }
  }, [visibleCrewProfiles, selectedCrewId, newCertificateCrewId]);

  useEffect(() => {
    if (
      (expenseView === "command" && !visibleModuleKeys.includes("today")) ||
      (expenseView === "tasks-maintenance" && !visibleModuleKeys.includes("tasks") && !visibleModuleKeys.includes("maintenance")) ||
      (expenseView === "crew-certificates" && !visibleModuleKeys.includes("crew") && !visibleModuleKeys.includes("certificates")) ||
      (expenseView === "route" && !visibleModuleKeys.includes("route")) ||
      (expenseView === "expenses-approvals" && !visibleModuleKeys.includes("expenses")) ||
      (expenseView === "documents" && !visibleModuleKeys.includes("documents")) ||
      (expenseView === "settings" && !visibleModuleKeys.includes("settings")) ||
      (expenseView === "notifications" && !visibleModuleKeys.includes("notifications"))
    ) {
      setExpenseView("command");
    }
  }, [expenseView, visibleModuleKeys]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const notified = getStoredJson(`${STORAGE_KEY}-maintenance-notified`, {});
    const nextNotified = { ...notified };

    maintenanceAlerts.forEach((item) => {
      const key = `${item.id}-${item.nextDueDate}`;
      if (nextNotified[key]) return;

      const timing = item.daysRemaining < 0 ? "overdue" : item.daysRemaining === 0 ? "due today" : "due tomorrow";
      new Notification(`${APP_BRAND_NAME} maintenance ${timing}`, {
        body: `${item.title} - ${item.area}`,
      });
      nextNotified[key] = true;
    });

    setStoredJson(`${STORAGE_KEY}-maintenance-notified`, nextNotified);
  }, [maintenanceAlerts]);

  useEffect(() => {
    if (publicAppUrlStatus.source === "local-dev-fallback") {
      console.warn(publicAppUrlStatus.message);
      return;
    }

    if (publicAppUrlStatus.isValid) return;
    setAppBanner((existing) => existing || {
      type: "error",
      title: "Share link not configured",
      message: publicAppUrlStatus.message,
    });
  }, [publicAppUrlStatus]);

  useEffect(() => {
    if (!appBanner || appBanner.type === "error") return undefined;
    const timeout = setTimeout(() => setAppBanner(null), 3200);
    return () => clearTimeout(timeout);
  }, [appBanner]);

  useEffect(() => {
    if (!routeVesselId || routeVesselId === activeVesselId) return;
    const targetVessel = vesselsForPersistence.find((vessel) => vessel.id === routeVesselId);
    if (!targetVessel) {
      const seededVessel =
        routeVesselId === "contessa"
          ? createFleetVesselWorkspace({
            id: "contessa",
            name: "M/Y Contessa",
            details: {
              length: 35,
              vesselType: "Motor Yacht",
              flag: "Cayman Islands",
              homePort: "Fort Lauderdale / LMC Safe Harbor",
              crewNumber: 5,
              notes: "Independent yard and refit workspace.",
              status: "Yard / Refit",
            },
          })
          : routeVesselId === "octopussy"
            ? createFleetVesselWorkspace({
              id: "octopussy",
              name: "M/Y Octopussy",
              details: {
                length: 30,
                vesselType: "Motor Yacht",
                flag: "Cayman Islands",
                homePort: "Oracabessa, Jamaica",
                crewNumber: 6,
                notes: "Independent Jamaica guest-ready workspace.",
                status: "Guest Ready",
              },
            })
            : null;

      if (!seededVessel) {
        setRouteNotFound(true);
        setAppBanner({
          type: "error",
          title: "Vessel not found",
          message: `No vessel workspace exists for "${formatVesselNameFromId(routeVesselId)}". Choose an available vessel from Fleet.`,
        });
        return;
      }

      const nextFleet = [...vesselsForPersistence, seededVessel];
      setRouteNotFound(false);
      setVessels(nextFleet);
      setActiveVesselId(seededVessel.id);
      loadVesselWorkspace(seededVessel, currency);
      return;
    }

    setRouteNotFound(false);
    setVessels(vesselsForPersistence);
    setActiveVesselId(routeVesselId);
    loadVesselWorkspace(targetVessel, currency);
    setFleetOpen(false);
  }, [routeVesselId, activeVesselId, vesselsForPersistence, currency]);

  const selectedTask = useMemo(() => {
    return visibleTasks.find((task) => task.id === selectedId) || null;
  }, [visibleTasks, selectedId]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();

    return visibleTasks.filter((task) => {
      const matchesSearch = !q || [
        task.id,
        task.name,
        task.area,
        task.assignee,
        task.priority,
        task.department,
        task.notes,
        ...(task.comments || []).map((comment) => comment.text),
        ...(task.quotes || []).map((quote) => quote.supplier),
      ].some((field) => String(field).toLowerCase().includes(q));

      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [visibleTasks, search, statusFilter]);

  const boatExpenses = useMemo(() => {
    return buildBoatExpenseSummaryItems(visibleTasks);
  }, [visibleTasks]);

  const selectedCrewProfile = useMemo(
    () => visibleCrewProfiles.find((profile) => profile.id === selectedCrewId) || visibleCrewProfiles[0] || null,
    [visibleCrewProfiles, selectedCrewId]
  );
  const visibleTaskIds = useMemo(() => new Set(visibleTasks.map((task) => task.id)), [visibleTasks]);

  const visibleCertificates = useMemo(
    () =>
      visibleCrewProfiles.flatMap((profile) =>
        (profile.certificates || []).map((certificate) => ({
          ...certificate,
          crewId: profile.id,
          crewName: profile.fullName,
          crewRank: profile.rank,
          department: profile.department,
        }))
      ),
    [visibleCrewProfiles]
  );

  const certificateAlerts = useMemo(() => buildCertificateAlerts(visibleCrewProfiles), [visibleCrewProfiles]);
  const operationalNotifications = useMemo(
    () =>
      buildOperationalNotifications({
        tasks: visibleTasks,
        boatExpenses,
        crewExpenses,
        maintenanceAlerts,
        certificateAlerts,
      }),
    [visibleTasks, boatExpenses, crewExpenses, maintenanceAlerts, certificateAlerts]
  );
  const accessibleNotifications = useMemo(
    () =>
      operationalNotifications.filter((item) => {
        if (!item?.section || !canAccessSection(item.section)) return false;
        if (item.section === "tasks") return !item.targetId || visibleTaskIds.has(item.targetId);
        if (item.section === "expenses" && item.bucket === "boat") {
          return !item.taskId || visibleTaskIds.has(item.taskId);
        }
        if (item.section === "certificates") {
          return !item.targetId || visibleCrewProfiles.some((profile) => profile.id === item.targetId);
        }
        return true;
      }),
    [operationalNotifications, visibleModuleKeys, visibleTaskIds, visibleCrewProfiles]
  );
  const currentRoleLabel = useMemo(() => {
    const roleLabels = {
      owner: "Owner",
      manager: "Manager",
      captain: "Captain",
      first_mate: "First Mate",
      engineer: "Engineer",
      bosun: "Bosun",
      deckhand: "Deckhand",
      stewardess: "Stewardess",
      guest: "Guest",
    };

    return roleLabels[effectiveRole] || titleCase(effectiveRole || "captain");
  }, [effectiveRole]);
  const visibleHistory = useMemo(() => {
    const sectionModuleMap = {
      Objectives: "tasks",
      "Expenses and Quotations": "expenses",
      "Crew Expenses": "expenses",
      Maintenance: "maintenance",
      "Route Planning": "route",
      Crew: "crew",
      Certificates: "certificates",
    };

    return history.filter((entry) => {
      const moduleKey = sectionModuleMap[entry.section];
      return !moduleKey || canAccessSection(moduleKey);
    });
  }, [history, visibleModuleKeys]);
  const dashboard = useMemo(
    () => ({
      ...buildDashboardSnapshot({
        tasks: visibleTasks,
        boatExpenses,
        crewExpenses,
        maintenanceAlerts,
        certificateAlerts,
        history: visibleHistory,
      }),
      highlightItems: accessibleNotifications.slice(0, 6),
      notificationCount: accessibleNotifications.length,
    }),
    [visibleTasks, boatExpenses, crewExpenses, maintenanceAlerts, certificateAlerts, visibleHistory, accessibleNotifications]
  );
  const todayOperations = useMemo(
    () =>
      buildTodayOperationsSnapshot({
        tasks: visibleTasks.map((task) =>
          prototypeTaskApprovals[task.id]
            ? { ...task, approvalStatus: prototypeTaskApprovals[task.id] }
            : task
        ),
        maintenanceItems,
        certificates: visibleCertificates,
        boatExpenses: approvalScopedBoatItems,
        crewExpenses,
      }),
    [visibleTasks, prototypeTaskApprovals, maintenanceItems, visibleCertificates, approvalScopedBoatItems, crewExpenses]
  );
  const expiringCertificates = todayOperations?.expiringCertificates || [];
  const routeSummary = useMemo(
    () => calculateRoutePassageSummary({ waypoints: routePlanning?.waypoints || [], vesselProfile: routePlanning?.vesselProfile || {} }),
    [routePlanning]
  );
  const routeAlerts = useMemo(() => {
    const alerts = [];
    if ((routePlanning?.waypoints || []).length < 2) {
      alerts.push({
        id: "route-plan-missing",
        level: "warning",
        title: "Route not fully planned",
        detail: "Add at least two waypoints to produce distance, ETA, and safety review.",
      });
    }
    if (routeSummary.minimumSafeDepth > 0) {
      alerts.push({
        id: "route-depth-review",
        level: "warning",
        title: "Depth review required",
        detail: `Minimum safe depth target is ${routeSummary.minimumSafeDepth.toFixed(1)} m. Official certified navigation data is still required.`,
      });
    }
    if (routeSummary.remainingFuelAfterReserve < 0) {
      alerts.push({
        id: "route-fuel-risk",
        level: "critical",
        title: "Fuel reserve below safe margin",
        detail: "Current route estimate exceeds the fuel available after reserve.",
      });
    }
    return alerts.slice(0, 3);
  }, [routePlanning, routeSummary]);

  const stats = useMemo(() => {
    const pending = visibleTasks.filter((task) => task.status === "pending").length;
    const ongoing = visibleTasks.filter((task) => task.status === "ongoing").length;
    const completed = visibleTasks.filter((task) => task.status === "completed").length;
    const approved = visibleTasks.filter((task) => task.status === "approved").length;
    const totalObjectives = visibleTasks.length;
    const boatTotal = boatExpenses.reduce((sum, quote) => sum + convertMoney(quote.amount, quote.currency || "USD", currency, exchangeRates), 0);
    const crewTotal = crewExpenses.reduce((sum, item) => sum + convertMoney(item.amount, item.currency || "USD", currency, exchangeRates), 0);
    const totalExpenses = boatTotal + crewTotal;
    const maintenanceDue = maintenanceAlerts.length;
    const crewProfileCount = visibleCrewProfiles.length;
    const certificateDue = certificateAlerts.length;
    const dashboardItems = dashboard.todayTasks.length + dashboard.overdueTasks.length + dashboard.urgentTasks.length;
    const notificationCount = accessibleNotifications.length;
    const todayAttentionCount =
      todayOperations.overdueTasks.length +
      todayOperations.dueTodayMaintenance.length +
      todayOperations.expiringCertificates.length +
      todayOperations.pendingApprovals.length;
    return {
      pending,
      ongoing,
      completed,
      approved,
      totalObjectives,
      boatTotal,
      crewTotal,
      totalExpenses,
      maintenanceDue,
      crewProfiles: crewProfileCount,
      certificateDue,
      overdueTasks: todayOperations.overdueTasks.length,
      dueTodayMaintenance: todayOperations.dueTodayMaintenance.length,
      pendingApprovals: todayOperations.pendingApprovals.length,
      dashboardItems,
      notificationCount,
      todayAttentionCount,
      documentCount: documents.length,
      routeWaypoints: routePlanning?.waypoints?.length || 0,
      routeDistanceNm: routeSummary.totalDistanceNm,
      routeReviewCount: routeAlerts.length,
    };
  }, [visibleTasks, boatExpenses, crewExpenses, maintenanceAlerts, currency, exchangeRates, visibleCrewProfiles, certificateAlerts, dashboard, accessibleNotifications, todayOperations, routePlanning, routeSummary, documents.length, routeAlerts.length]);
  const vesselOperations = useMemo(() => {
    const crewBase = Math.max(stats.crewProfiles || 0, 1);
    const crewReadyPercent = Math.max(
      0,
      Math.min(100, Math.round(((crewBase - (stats.certificateDue || 0)) / crewBase) * 100))
    );

    return {
      slug: activeVesselWorkspace?.id || activeVesselId,
      name: activeVesselWorkspace?.name || vesselProfile?.vesselName || routePlanning?.vesselProfile?.vesselName || APP_BRAND_NAME,
      location: activeVesselWorkspace?.details?.homePort || "Home port not set",
      status: activeVesselWorkspace?.details?.status || "Operational",
      syncStatus: isOffline ? "Offline mode active" : "Live connection active",
      metrics: {
        activeTasks: stats.totalObjectives || 0,
        alerts: accessibleNotifications.length,
        pendingApprovals: stats.pendingApprovals || 0,
        crewReady: `${crewReadyPercent}%`,
        certificatesExpiring: stats.certificateDue || 0,
        openExposure: formatMoney(stats.totalExpenses || 0, currency),
      },
      items: [
        ...todayOperations.overdueTasks.map((task) => ({
          id: task.id,
          type: "task",
          title: task.name,
          subtitle: `${task.area || "General"} / ${task.department || "General"}`,
          status: titleCase(task.status || "pending"),
          priority: titleCase(task.priority || "medium"),
          assignedTo: task.assignee || "Unassigned",
          requester: task.requester || "Captain",
          dueDate: task.dueDate || "Not set",
          amount: (task.quotes || []).length ? formatMoney((task.quotes || []).reduce((sum, quote) => sum + Number(quote.amount || 0), 0), task.quotes?.[0]?.currency || currency) : "",
          description: task.notes || "",
          checklist: [],
          activity: (task.comments || []).slice(0, 3).map((comment) => comment.text),
        })),
        ...todayOperations.dueTodayMaintenance.map((item) => ({
          id: item.id,
          type: "maintenance",
          title: item.title,
          subtitle: item.system || item.area || "Maintenance",
          status: item.statusLabel || "Due today",
          priority: "Planned",
          assignedTo: item.responsiblePerson || "Operations",
          requester: "System",
          dueDate: item.dueDate || "Today",
          amount: "",
          description: item.notes || "",
          checklist: [],
          activity: [],
        })),
        ...todayOperations.pendingApprovals.map((item) => ({
          id: item.id,
          type: item.sourceType === "task" ? "approval" : "quote",
          title: item.title,
          subtitle: `Requested by ${item.requestedBy || "Operations"}`,
          status: titleCase(item.approvalStatus || "requested"),
          priority: "Review",
          assignedTo: item.assignedTo || currentRoleLabel,
          requester: item.requestedBy || "Operations",
          dueDate: "Awaiting decision",
          amount: item.amount !== null && item.amount !== undefined ? formatMoney(item.amount, item.currency || currency) : "",
          description: "",
          checklist: [],
          activity: [],
        })),
        ...expiringCertificates.map((certificate) => ({
          id: `${certificate.crewId}-${certificate.id}`,
          type: "certificate",
          title: certificate.name,
          subtitle: `${certificate.crewName} / ${certificate.department || certificate.crewRank || "Crew"}`,
          status: certificate.statusLabel || "Certificate",
          priority: certificate.daysRemaining <= 7 ? "Urgent" : "Upcoming",
          assignedTo: certificate.crewName || "Crew",
          requester: "Compliance",
          dueDate: certificate.expiryDate || "Unknown",
          amount: "",
          description: certificate.statusText || "",
          checklist: [],
          activity: [],
        })),
        ...routeAlerts.map((alert, index) => ({
          id: alert.id || `route-${index + 1}`,
          type: "alert",
          title: alert.title,
          subtitle: "Route planning",
          status: titleCase(alert.level || "warning"),
          priority: titleCase(alert.level || "warning"),
          assignedTo: "Bridge",
          requester: "Route planning",
          dueDate: "Immediate review",
          amount: "",
          description: alert.detail,
          checklist: [],
          activity: [],
        })),
      ],
    };
  }, [
    activeVesselWorkspace,
    activeVesselId,
    vesselProfile,
    routePlanning,
    isOffline,
    stats,
    accessibleNotifications.length,
    currency,
    todayOperations,
    expiringCertificates,
    routeAlerts,
    currentRoleLabel,
  ]);

  const maintenancePopupItem = useMemo(() => {
    return maintenanceAlerts.find((item) => {
      const reminder = maintenanceReminderState[item.id];
      if (!reminder) return true;
      if (reminder.dueDate !== item.nextDueDate) return true;
      return maintenancePopupTick >= safeNumber(reminder.nextPopupAt);
    }) || null;
  }, [maintenanceAlerts, maintenanceReminderState, maintenancePopupTick]);

  const activateModuleForSection = (moduleName = "", options = {}) => {
    switch (moduleName) {
      case "command":
        setExpenseView("command");
        break;
      case "tasks-maintenance":
        setExpenseView("tasks-maintenance");
        if (options.panel) setTasksMaintenancePanel(options.panel);
        if (options.panel === "tasks") setStatusFilter("all");
        break;
      case "route":
        setExpenseView("route");
        break;
      case "crew-certificates":
        setExpenseView("crew-certificates");
        if (options.panel) setCrewCertificatesPanel(options.panel);
        break;
      case "expenses-approvals":
        setExpenseView("expenses-approvals");
        if (options.bucket) setExpenseBucket(options.bucket);
        break;
      case "documents":
        setExpenseView("documents");
        break;
      case "settings":
        setExpenseView("settings");
        break;
      case "notifications":
        setExpenseView("notifications");
        break;
      default:
        break;
    }
  };

  const navigateToSection = (sectionId, moduleName = "", options = {}) => {
    if (!sectionId) return;
    if (moduleName) {
      activateModuleForSection(moduleName, options);
    }
    setPendingSectionNavigation({ sectionId, moduleName, options, requestedAt: Date.now() });
  };

  const mobileSectionForModule = (moduleName = "", options = {}) => {
    if (options?.panel === "maintenance") return "tasks";
    if (options?.panel === "certificates") return "crew";

    switch (moduleName) {
      case "tasks-maintenance":
        return "tasks";
      case "expenses-approvals":
        return "approvals";
      case "crew-certificates":
        return "crew";
      case "route":
        return "route";
      case "documents":
        return "docs";
      case "settings":
      case "notifications":
        return "tools";
      case "command":
      default:
        return "today";
    }
  };

  const scrollToMobileSection = (section) => {
    if (typeof window === "undefined" || !section) return;
    window.requestAnimationFrame(() => {
      document.getElementById(`mobile-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const openMobileSectionById = (section) => {
    if (!section) return;
    setOpenMobileSection(section);
    scrollToMobileSection(section);
  };

  const openMobileWorkspace = (moduleName = "command", options = {}) => {
    activateModuleForSection(moduleName, options);
    openMobileSectionById(mobileSectionForModule(moduleName, options));
  };

  const commandSearchResults = useMemo(() => {
    const vesselName = activeVesselWorkspace?.name || vesselProfile?.vesselName || APP_BRAND_NAME;
    const sectionResults = [
      { id: "section-dashboard", type: "Section", title: "Dashboard", context: "Main command overview", targetId: "dashboard-section", moduleName: "command" },
      { id: "section-tasks", type: "Section", title: "Tasks", context: "Task board and active work", targetId: "tasks-section", moduleName: "tasks-maintenance", options: { panel: "tasks" } },
      { id: "section-maintenance", type: "Section", title: "Maintenance", context: "Due service and upkeep plan", targetId: "maintenance-section", moduleName: "tasks-maintenance", options: { panel: "maintenance" } },
      { id: "section-approvals", type: "Section", title: "Approvals", context: "Quotes, expenses, and decisions", targetId: "approvals-section", moduleName: "expenses-approvals", options: { bucket: "boat" } },
      { id: "section-crew", type: "Section", title: "Crew", context: "Crew roster and readiness", targetId: "crew-section", moduleName: "crew-certificates", options: { panel: "crew" } },
      { id: "section-crew-list", type: "Document", title: "Crew List", context: `Printable crew list for ${vesselName}`, targetId: "crew-section", moduleName: "crew-certificates", options: { panel: "crew" }, action: "crew-list", searchText: buildCommandSearchText(["crew list", "print crew list", "crew print", "vessel crew", "official crew list", "documents", vesselName]) },
      { id: "section-certificates", type: "Section", title: "Certificates", context: "Crew certificates and expiry reviews", targetId: "certificates-section", moduleName: "crew-certificates", options: { panel: "certificates" } },
      { id: "section-documents", type: "Section", title: "Documents", context: "Vessel document vault", targetId: "docs-section", moduleName: "documents" },
      { id: "section-route", type: "Section", title: "Route Planning", context: "Waypoints, chart review, ETA, and fuel", targetId: "route-section", moduleName: "route" },
      { id: "section-alerts", type: "Section", title: "Alerts", context: "Operational warnings and notifications", targetId: "alerts-section", moduleName: "notifications" },
    ];

    const operationalItems = Array.isArray(vesselOperations?.items) ? vesselOperations.items : [];
    const itemResults = operationalItems.map((item) => ({
      id: `command-item-${item?.id || item?.title}`,
      type: titleCase(item?.type || "Item"),
      title: item?.title || "Untitled item",
      context: [vesselName, item?.status, item?.assignedTo || item?.requester, item?.dueDate, item?.amount].filter(Boolean).join(" · "),
      targetId: item?.id ? `item-${item.id}` : "dashboard-section",
      item,
      searchText: buildCommandSearchText([
        item?.id,
        item?.type,
        item?.title,
        item?.subtitle,
        item?.status,
        item?.priority,
        item?.assignedTo,
        item?.requester,
        item?.description,
        item?.dueDate,
        item?.amount,
        item?.checklist,
        item?.activity,
      ]),
    }));

    const crewResults = (Array.isArray(visibleCrewProfiles) ? visibleCrewProfiles : []).map((profile) => ({
      id: `command-crew-${profile?.id || profile?.fullName}`,
      type: "Crew",
      title: profile?.fullName || "Crew member",
      context: [vesselName, profile?.rank, profile?.department, `${profile?.certificates?.length || 0} certificates`].filter(Boolean).join(" · "),
      targetId: "crew-section",
      moduleName: "crew-certificates",
      options: { panel: "crew" },
      searchText: buildCommandSearchText([profile?.id, profile?.fullName, profile?.rank, profile?.department, profile?.notes, "crew readiness certificates"]),
    }));

    const documentResults = (Array.isArray(documents) ? documents : []).map((document) => ({
      id: `command-document-${document?.id || document?.title}`,
      type: "Document",
      title: document?.title || document?.name || "Document",
      context: [vesselName, document?.category || document?.type || "Document vault", document?.status].filter(Boolean).join(" · "),
      targetId: "docs-section",
      moduleName: "documents",
      searchText: buildCommandSearchText([document?.id, document?.title, document?.name, document?.category, document?.type, document?.status, "documents docs vault"]),
    }));

    return [...sectionResults, ...itemResults, ...crewResults, ...documentResults].map((result) => ({
      ...result,
      searchText: result.searchText || buildCommandSearchText([result.id, result.type, result.title, result.context]),
    }));
  }, [activeVesselWorkspace?.name, vesselProfile?.vesselName, vesselOperations, visibleCrewProfiles, documents]);

  const handleCommandSearchJump = (result) => {
    if (!result) return;

    if (result.action === "crew-list") {
      navigateToSection(result.targetId || "crew-section", result.moduleName || "crew-certificates", result.options || { panel: "crew" });
      openMobileSectionById("crew");
      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent("contessa:open-crew-list"));
        }, 260);
      }
      return;
    }

    if (result.item) {
      setExpenseView("command");
      openMobileSectionById(result.item.type === "quote" || result.item.type === "approval" ? "approvals" : result.item.type === "certificate" ? "crew" : "tasks");
      setMobileDetailItem(result.item);
      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent("contessa:open-command-item", { detail: { id: result.item.id } }));
        }, 140);
      }
      return;
    }

    openMobileSectionById(mobileSectionForModule(result.moduleName || "", result.options || {}));
    navigateToSection(result.targetId || "dashboard-section", result.moduleName || "", result.options || {});
  };

  useEffect(() => {
    if (!pendingSectionNavigation) return undefined;

    let attempts = 0;
    const maxAttempts = 18;

    const tryScroll = () => {
      const element = typeof document !== "undefined" ? document.getElementById(pendingSectionNavigation.sectionId) : null;
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        setPendingSectionNavigation(null);
        sectionNavigationTimeoutRef.current = null;
        return;
      }

      if (attempts >= maxAttempts) {
        setPendingSectionNavigation(null);
        sectionNavigationTimeoutRef.current = null;
        return;
      }

      attempts += 1;
      sectionNavigationTimeoutRef.current = setTimeout(tryScroll, 90);
    };

    sectionNavigationTimeoutRef.current = setTimeout(tryScroll, 60);

    return () => {
      if (sectionNavigationTimeoutRef.current) {
        clearTimeout(sectionNavigationTimeoutRef.current);
        sectionNavigationTimeoutRef.current = null;
      }
    };
  }, [pendingSectionNavigation, expenseView, tasksMaintenancePanel, crewCertificatesPanel]);

  const maintenancePopupReminder = maintenancePopupItem ? maintenanceReminderState[maintenancePopupItem.id] : null;
  const maintenancePopupFollowUp = Boolean(maintenancePopupReminder?.followUp);

  const blockReadOnlyAction = (actionLabel = "This action") => {
    setAppBanner({
      type: "error",
      title: "Editor access required",
      message: `${actionLabel} is only available in Editor Mode.`,
    });
    return false;
  };

  const requireAdminEdit = (actionLabel) => {
    if (canEditApp) return true;
    return blockReadOnlyAction(actionLabel);
  };

  const handleAppModeChange = (nextMode) => {
    const normalizedMode = nextMode === "editor" ? "editor" : "view";
    setAppMode(normalizedMode);
    setAppBanner({
      type: "info",
      title: normalizedMode === "editor" ? "Editor Mode enabled" : "View Mode enabled",
      message: normalizedMode === "editor"
        ? "Editing, approvals, and management controls are available in this demo view."
        : "Editing controls are hidden and inputs stay read-only in this demo view.",
    });
  };

  const loadVesselWorkspace = (nextVessel, nextCurrency = currency) => {
    const vesselWorkspace = normalizeFleetVessel(nextVessel, nextVessel?.id || activeVesselId);
    const nextTasks = vesselWorkspace.tasks || [];
    const nextCrewProfiles = vesselWorkspace.crewProfiles || [];

    setVesselProfile(vesselWorkspace.vesselProfile || vesselWorkspace.routePlanning?.vesselProfile || {});
    setDocuments(vesselWorkspace.documents || []);
    setTasks(nextTasks);
    setHistory(vesselWorkspace.history || []);
    setDeclinedTasks(vesselWorkspace.declinedTasks || []);
    setCrewExpenses(vesselWorkspace.crewExpenses || []);
    setCrewProfiles(nextCrewProfiles);
    setMaintenanceItems(vesselWorkspace.maintenanceItems || []);
    setRoutePlanning(vesselWorkspace.routePlanning);
    setSelectedId(nextTasks[0]?.id ?? "");
    setSelectedCrewId(nextCrewProfiles[0]?.id ?? "");
    setSearch("");
    setStatusFilter("all");
    setExpenseView("command");
    setExpenseBucket("boat");
    setTasksMaintenancePanel("tasks");
    setCrewCertificatesPanel("crew");
    setNewTask({ name: "", area: "", department: TASK_DEPARTMENT_OPTIONS[0], status: "pending", priority: "medium", assignee: ASSIGNEE_OPTIONS[0], dueDate: "", notes: "" });
    setNewExpense({ taskId: nextTasks[0]?.id ?? "", supplier: "", amount: 0, currency: nextCurrency, status: "requested" });
    setNewCrewExpense({ title: "", amount: 0, currency: nextCurrency, status: "requested" });
    setNewCrewProfile({ fullName: "", rank: CREW_RANK_OPTIONS[0], department: CREW_DEPARTMENT_OPTIONS[0], nationality: "", roleKey: "captain", notes: "" });
    setNewCertificate(createEmptyCertificateDraft());
    setNewCertificateCrewId(nextCrewProfiles[0]?.id ?? "");
    setNewMaintenance({
      title: "",
      area: MAINTENANCE_AREA_OPTIONS[0],
      areaOption: MAINTENANCE_AREA_OPTIONS[0],
      customArea: "",
      frequencyMonths: 1,
      nextDueDate: todayDateString(),
      notes: "",
    });
    setMaintenanceError("");
    setQuoteDeleteRequest(null);
    setTaskDeleteRequest(null);
    setCrewExpenseDeleteRequest(null);
  };

  const openVesselWorkspace = (vesselId) => {
    const nextFleet = vesselsForPersistence;
    const nextVessel = nextFleet.find((vessel) => vessel.id === vesselId);
    if (!nextVessel) return;

    setVessels(nextFleet);
    setActiveVesselId(vesselId);
    setRouteNotFound(false);
    loadVesselWorkspace(nextVessel, currency);
    setFleetOpen(false);
    onNavigateVessel?.(vesselId);
    setAppBanner({
      type: "success",
      title: "Vessel opened",
      message: `${nextVessel.name} is now the active workspace.`,
    });
  };

  const handleAddFleetVessel = (draft) => {
    if (!requireAdminEdit("Adding vessels")) return false;
    const vesselName = String(draft?.vesselName || "").trim();
    if (!vesselName) {
      setAppBanner({ type: "error", title: "Vessel name required", message: "Enter a vessel name before creating a new boat." });
      return false;
    }

    const vesselId = buildFleetVesselId(vesselName, vesselsForPersistence.map((vessel) => vessel.id));
    const newVessel = createFleetVesselWorkspace({
      id: vesselId,
      name: vesselName,
      theme: getNextFleetTheme(vesselsForPersistence),
      details: {
        length: draft?.vesselLength || "",
        type: draft?.vesselType || "",
        flag: draft?.flag || "",
        homePort: draft?.homePort || "",
        crewNumber: Number(draft?.crewNumber || 0) || 0,
        notes: draft?.notes || "",
        status: "Operational",
      },
      workspace: {
        documents: [],
        tasks: [],
        crewExpenses: [],
        crewProfiles: [],
        workers: [],
        maintenanceItems: [],
        routePlanning: {},
      },
    });
    const nextFleet = [...vesselsForPersistence, newVessel];

    setVessels(nextFleet);
    setActiveVesselId(vesselId);
    loadVesselWorkspace(newVessel, currency);
    setFleetOpen(false);
    onNavigateVessel?.(vesselId);
    setAppBanner({
      type: "success",
      title: "Boat added",
      message: `${vesselName} is ready as a separate vessel workspace.`,
    });
    return true;
  };

  const logChange = (section, action, detail) => {
    const entry = {
      id: `H-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      at: new Date().toISOString(),
      by: actorName.trim() || "User",
      section,
      action,
      detail,
    };
    setHistory((prev) => [entry, ...prev].slice(0, 300));
  };

  const updateTaskStatus = (taskId, status) => {
    if (!requireAdminEdit("Changing task status")) return;
    const task = tasks.find((item) => item.id === taskId);
    logChange("Objectives", "Status changed", `${task?.name || taskId} moved to ${titleCase(status)}.`);
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status, declinedAt: status === "declined" ? task.declinedAt || Date.now() : null }
          : task
      )
    );
  };

  const retrieveDeclinedTask = (taskId) => {
    if (!requireAdminEdit("Retrieving declined tasks")) return;
    const task = declinedTasks.find((item) => item.id === taskId);
    if (!task) return;
    const restored = { ...task, status: "pending", declinedAt: null, archivedAt: null };
    setTasks((prev) => [restored, ...prev.filter((item) => item.id !== taskId)]);
    setDeclinedTasks((prev) => prev.filter((item) => item.id !== taskId));
    setSelectedId(taskId);
    setExpenseView("tasks-maintenance");
    setTasksMaintenancePanel("tasks");
    setStatusFilter("all");
    logChange("History", "Declined task retrieved", `${task.name} was returned to Objectives as Pending.`);
  };

  const updateTask = (taskId, patch) => {
    if (!requireAdminEdit("Updating tasks")) return;
    const task = tasks.find((item) => item.id === taskId);
    logChange("Objectives", "Task updated", `${task?.name || taskId}: ${describePatch(patch)}`);
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task)));
  };

  const updateQuote = (taskId, quoteId, patch) => {
    if (!requireAdminEdit("Updating quotations")) return;
    const task = tasks.find((item) => item.id === taskId);
    const quote = task?.quotes.find((item) => item.id === quoteId);
    logChange("Expenses and Quotations", "Quote updated", `${task?.name || taskId} / ${quote?.supplier || quoteId}: ${describePatch(patch)}`);
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          quotes: task.quotes.map((quote) => (quote.id === quoteId ? normalizeMoneyItem({ ...quote, ...patch }) : quote)),
        };
      })
    );
  };

  const removeQuote = (taskId, quoteId) => {
    if (!requireAdminEdit("Removing quotations")) return;
    const task = tasks.find((item) => item.id === taskId);
    const quote = task?.quotes.find((item) => item.id === quoteId);
    logChange("Expenses and Quotations", "Quote removed", `${quote?.supplier || quoteId} was removed from ${task?.name || taskId}.`);
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, quotes: task.quotes.filter((quote) => quote.id !== quoteId) } : task))
    );
    setQuoteDeleteRequest(null);
  };

  const handleReceiptUpload = (taskId, quoteId, files) => {
    if (!requireAdminEdit("Uploading quotation attachments")) return;
    readFilesAsAttachmentPayloads(files).then((attachments) => {
      if (!attachments.length) return;
      const task = tasks.find((item) => item.id === taskId);
      logChange("Expenses and Quotations", "Attachment added", `${attachments.length} attachment(s) added to ${task?.name || taskId}.`);
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;
          return {
            ...task,
            quotes: task.quotes.map((quote) =>
              quote.id === quoteId ? normalizeMoneyItem({ ...quote, attachments: [...(quote.attachments || []), ...attachments] }) : quote
            ),
          };
        })
      );
    });
  };

  const handleCrewExpenseAttachmentUpload = (expenseId, files) => {
    if (!requireAdminEdit("Uploading crew expense attachments")) return;
    readFilesAsAttachmentPayloads(files).then((attachments) => {
      if (!attachments.length) return;
      const item = crewExpenses.find((expense) => expense.id === expenseId);
      logChange("Crew Expenses", "Attachment added", `${attachments.length} attachment(s) added to ${item?.title || expenseId}.`);
      setCrewExpenses((prev) =>
        prev.map((expense) =>
          expense.id === expenseId
            ? normalizeMoneyItem({ ...expense, attachments: [...(expense.attachments || []), ...attachments] })
            : expense
        )
      );
    });
  };

  const handleTaskPhotoUpload = (taskId, files) => {
    if (!requireAdminEdit("Uploading task photos")) return;
    readFilesAsDataUrls(files).then((images) => {
      if (!images.length) return;
      const task = tasks.find((item) => item.id === taskId);
      logChange("Objectives", "Task photo added", `${images.length} photo(s) added to ${task?.name || taskId}.`);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, photos: [...(task.photos || []), ...images] } : task))
      );
    });
  };

  const handleTaskAttachmentUpload = (taskId, files) => {
    if (!requireAdminEdit("Uploading task attachments")) return;
    readFilesAsAttachmentPayloads(files).then((attachments) => {
      if (!attachments.length) return;
      const task = tasks.find((item) => item.id === taskId);
      logChange("Objectives", "Task attachment added", `${attachments.length} attachment(s) added to ${task?.name || taskId}.`);
      setTasks((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? { ...item, attachments: [...(item.attachments || []), ...attachments] }
            : item
        )
      );
    });
  };

  const removeTaskAttachment = (taskId, attachmentId) => {
    if (!requireAdminEdit("Removing task attachments")) return;
    const task = tasks.find((item) => item.id === taskId);
    const attachment = task?.attachments?.find((item) => item.id === attachmentId);
    logChange("Objectives", "Task attachment removed", `${attachment?.name || "Attachment"} removed from ${task?.name || taskId}.`);
    setTasks((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? { ...item, attachments: (item.attachments || []).filter((attachmentItem) => attachmentItem.id !== attachmentId) }
          : item
      )
    );
  };

  const addTaskComment = (taskId, text) => {
    if (!requireAdminEdit("Adding task comments")) return;
    const commentText = String(text || "").trim();
    if (!commentText) return;
    const task = tasks.find((item) => item.id === taskId);
    const comment = {
      id: `COM-${Date.now()}`,
      text: commentText,
      by: actorName.trim() || "User",
      at: new Date().toISOString(),
    };
    logChange("Objectives", "Task comment added", `${task?.name || taskId}: ${commentText}`);
    setTasks((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? { ...item, comments: [comment, ...(item.comments || [])] }
          : item
      )
    );
    setAppBanner({ type: "success", title: "Comment added", message: `A new comment was added to ${task?.name || taskId}.` });
  };

  const removeTaskPhoto = (taskId, photoIndex) => {
    if (!requireAdminEdit("Removing task photos")) return;
    const task = tasks.find((item) => item.id === taskId);
    logChange("Objectives", "Task photo removed", `Photo ${photoIndex + 1} removed from ${task?.name || taskId}.`);
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, photos: (task.photos || []).filter((_, index) => index !== photoIndex) } : task
      )
    );
  };

  const applyAppState = (nextState) => {
    setDarkMode(nextState.darkMode);
    setCurrency(nextState.currency);
    setActorName(nextState.actorName);
    setCurrentRole(nextState.currentRole || "captain");
    setAppMode(nextState.appMode === "editor" ? "editor" : "view");
    setHistory(nextState.history);
    setDeclinedTasks(nextState.declinedTasks);
    const nextFleet = (nextState.vessels || []).map((vessel, index) =>
      normalizeFleetVessel(vessel, vessel?.id || `vessel-${index + 1}`)
    );
    const nextActiveVesselId = nextState.activeVesselId || nextFleet[0]?.id || "contessa";
    const nextActiveVessel =
      nextFleet.find((vessel) => vessel.id === nextActiveVesselId) ||
      normalizeFleetVessel(
        {
          id: nextActiveVesselId,
          name: nextState.vesselProfile?.vesselName || APP_BRAND_NAME,
          vesselProfile: nextState.vesselProfile,
          documents: nextState.documents || [],
          tasks: nextState.tasks,
          crewExpenses: nextState.crewExpenses,
          crewProfiles: nextState.crewProfiles || [],
          workers: nextState.crewProfiles || [],
          maintenanceItems: nextState.maintenanceItems,
          routePlanning: nextState.routePlanning,
        },
        nextActiveVesselId
      );

    setVessels(nextFleet.length ? nextFleet : [nextActiveVessel]);
    setActiveVesselId(nextActiveVessel.id);
    loadVesselWorkspace(nextActiveVessel, nextState.currency);
    setSearch("");
    setStatusFilter("all");
    setExpenseView("command");
    setExpenseBucket("boat");
    setTasksMaintenancePanel("tasks");
    setCrewCertificatesPanel("crew");
    setNewTaskOpen(false);
    setNewExpenseOpen(false);
    setHistoryOpen(false);
    setRetrieveOpen(false);
    setSharingOpen(false);
    setFleetOpen(false);
    setNewCrewExpenseOpen(false);
    setNewCrewProfileOpen(false);
    setNewCertificateOpen(false);
    setNewMaintenanceOpen(false);
    setMaintenanceError("");
    setAppBanner(null);
    setQuoteDeleteRequest(null);
    setTaskDeleteRequest(null);
    setCrewExpenseDeleteRequest(null);
    setMaintenanceReminderState({});
    setPostponeDate(dateStringFromNow(1));
    removeStoredKey(`${STORAGE_KEY}-maintenance-reminders`);
    removeStoredKey(`${STORAGE_KEY}-maintenance-notified`);
  };

  const resetDemoData = () => {
    if (!requireAdminEdit("Resetting demo data")) return;
    const resetState = createEmptyAppState({ darkMode, currency, actorName, currentRole, appMode });
    applyAppState(resetState);
    setAppBanner({ type: "success", title: "Demo data reset", message: "The app was reset to a clean local state." });
  };

  const exportAppStateJson = () => {
    downloadFile("contessa-app-state.json", createFullStateExport(persistedAppState), "application/json;charset=utf-8");
  };

  const openJsonImportPicker = () => {
    jsonImportInputRef.current?.click();
  };

  const importAppStateJson = async (event) => {
    if (!requireAdminEdit("Importing app data")) {
      event.target.value = "";
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedState = normalizeImportedAppState(JSON.parse(text), createEmptyAppState({ darkMode, currency, actorName }));
      const importEntry = {
        id: `H-${Date.now()}-import`,
        at: new Date().toISOString(),
        by: importedState.actorName || actorName || "User",
        section: "History",
        action: "State imported",
        detail: `Imported ${importedState.tasks.length} task(s), ${importedState.crewExpenses.length} crew expense(s), and ${importedState.maintenanceItems.length} maintenance item(s).`,
      };
      applyAppState({ ...importedState, history: [importEntry, ...importedState.history].slice(0, 300) });
      setAppBanner({ type: "success", title: "Import complete", message: `Loaded ${importedState.tasks.length} task(s), ${importedState.crewExpenses.length} crew expense(s), and ${importedState.maintenanceItems.length} maintenance item(s).` });
    } catch {
      setAppBanner({ type: "error", title: "Import failed", message: `Please choose a valid ${APP_BRAND_NAME} JSON export.` });
      if (typeof window !== "undefined") {
        window.alert(`Import failed. Please choose a valid ${APP_BRAND_NAME} JSON export.`);
      }
    } finally {
      event.target.value = "";
    }
  };

  const deleteTask = (taskId) => {
    if (!requireAdminEdit("Deleting tasks")) return;
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    logChange("Objectives", "Task deleted", `${task.name} was removed from Objectives.`);
    setTasks((prev) => prev.filter((item) => item.id !== taskId));
    setTaskDeleteRequest(null);
    setAppBanner({ type: "info", title: "Task deleted", message: `${task.name} was removed.` });
  };

  const deleteCrewExpense = (expenseId) => {
    if (!requireAdminEdit("Deleting crew expenses")) return;
    const item = crewExpenses.find((expense) => expense.id === expenseId);
    if (!item) return;
    logChange("Crew Expenses", "Crew expense deleted", `${item.title} was removed.`);
    setCrewExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));
    setCrewExpenseDeleteRequest(null);
    setAppBanner({ type: "info", title: "Crew expense deleted", message: `${item.title} was removed.` });
  };

  const addTask = () => {
    if (!requireAdminEdit("Adding tasks")) return;
    const name = newTask.name.trim();
    const area = newTask.area.trim();
    if (!name || !area) return;

    const task = {
      id: createNextTaskId(tasks),
      name,
      area,
      department: TASK_DEPARTMENT_OPTIONS.includes(newTask.department) ? newTask.department : TASK_DEPARTMENT_OPTIONS[0],
      status: STATUS_OPTIONS.includes(newTask.status) ? newTask.status : "pending",
      priority: PRIORITY_OPTIONS.includes(newTask.priority) ? newTask.priority : "medium",
      assignee: newTask.assignee.trim() || "Unassigned",
      dueDate: newTask.dueDate,
      notes: newTask.notes.trim(),
      photos: [],
      attachments: [],
      comments: [],
      expenses: [],
      quotes: [],
    };

    setTasks((prev) => [task, ...prev]);
    logChange("Objectives", "Task added", `${task.name} added in ${task.area}.`);
    setSelectedId(task.id);
    setNewTask({ name: "", area: "", department: TASK_DEPARTMENT_OPTIONS[0], status: "pending", priority: "medium", assignee: ASSIGNEE_OPTIONS[0], dueDate: "", notes: "" });
    setNewTaskOpen(false);
    setAppBanner({ type: "success", title: "Task added", message: `${task.name} was created in ${task.area}.` });
  };

  const addQuote = (taskId) => {
    if (!requireAdminEdit("Adding quotations")) return;
    const quote = {
      id: `Q-${Date.now()}`,
      supplier: "New Quote",
      amount: 0,
      currency,
      status: "requested",
      includeInSummary: false,
      rejectedAt: null,
      attachments: [],
      confirmed: false,
    };

    const task = tasks.find((item) => item.id === taskId);
    logChange("Expenses and Quotations", "Quote added", `New quote added to ${task?.name || taskId}.`);
    setTasks((prev) => prev.map((task) => (task.id !== taskId ? task : { ...task, quotes: [...task.quotes, quote] })));
  };

  const addExpense = () => {
    if (!requireAdminEdit("Adding boat expenses")) return;
    const taskId = newExpense.taskId || selectedId || visibleTasks[0]?.id;
    if (!taskId) return;
    const quote = {
      id: `Q-${Date.now()}`,
      supplier: newExpense.supplier.trim() || "New Expense",
      amount: safeNumber(newExpense.amount),
      currency: newExpense.currency,
      status: MONEY_STATUS_OPTIONS.includes(newExpense.status) ? newExpense.status : "requested",
      includeInSummary: false,
      rejectedAt: null,
      attachments: [],
    };
    const task = tasks.find((item) => item.id === taskId);
    logChange("Expenses and Quotations", "Expense added", `${quote.supplier} added to ${task?.name || taskId}.`);
    setTasks((prev) => prev.map((task) => (task.id !== taskId ? task : { ...task, quotes: [...task.quotes, quote] })));
    setNewExpense({ taskId, supplier: "", amount: 0, currency, status: "requested" });
    setExpenseView("expenses-approvals");
    setExpenseBucket("boat");
    setNewExpenseOpen(false);
    setAppBanner({ type: "success", title: "Expense added", message: `${quote.supplier} was added to ${task?.name || taskId}.` });
  };

  const addCrewExpense = () => {
    if (!requireAdminEdit("Adding crew expenses")) return;
    const title = newCrewExpense.title.trim();
    if (!title) return;
    const item = {
      id: `CE-${Date.now()}`,
      title,
      amount: safeNumber(newCrewExpense.amount),
      currency: newCrewExpense.currency,
      status: MONEY_STATUS_OPTIONS.includes(newCrewExpense.status) ? newCrewExpense.status : "requested",
      attachments: [],
    };
    logChange("Crew Expenses", "Crew expense added", `${item.title}: ${formatMoney(item.amount, item.currency)}.`);
    setCrewExpenses((prev) => [item, ...prev]);
    setNewCrewExpense({ title: "", amount: 0, currency, status: "requested" });
    setNewCrewExpenseOpen(false);
    setAppBanner({ type: "success", title: "Crew expense added", message: `${item.title} was added.` });
  };

  const updateCrewExpense = (expenseId, patch) => {
    if (!requireAdminEdit("Updating crew expenses")) return;
    const item = crewExpenses.find((expense) => expense.id === expenseId);
    logChange("Crew Expenses", "Crew expense updated", `${item?.title || expenseId}: ${describePatch(patch)}`);
    setCrewExpenses((prev) => prev.map((item) => (item.id === expenseId ? { ...item, ...patch } : item)));
  };

  const addCrewProfile = () => {
    if (!requireAdminEdit("Adding crew profiles")) return;
    const fullName = newCrewProfile.fullName.trim();
    if (!fullName) return;
    const profile = normalizeCrewProfile({
      id: `CRW-${Date.now()}`,
      ...newCrewProfile,
      fullName,
    });
    setCrewProfiles((prev) => [profile, ...prev]);
    setSelectedCrewId(profile.id);
    setNewCrewProfile({ fullName: "", rank: CREW_RANK_OPTIONS[0], department: CREW_DEPARTMENT_OPTIONS[0], nationality: "", roleKey: "captain", notes: "" });
    setNewCrewProfileOpen(false);
    logChange("Crew", "Crew profile added", `${profile.fullName} added as ${profile.rank}.`);
    setAppBanner({ type: "success", title: "Crew profile added", message: `${profile.fullName} was added.` });
  };

  const updateCrewProfile = (profileId, patch) => {
    if (!requireAdminEdit("Updating crew profiles")) return;
    const profile = crewProfiles.find((item) => item.id === profileId);
    logChange("Crew", "Crew profile updated", `${profile?.fullName || profileId}: ${describePatch(patch)}`);
    setCrewProfiles((prev) => prev.map((item) => (item.id === profileId ? normalizeCrewProfile({ ...item, ...patch }) : item)));
  };

  const handleNewCertificateAttachmentUpload = (files) => {
    if (!requireAdminEdit("Uploading certificate files")) return;
    readFilesAsAttachmentPayloads(files)
      .then((attachments) => {
        if (!attachments.length) return;
        setNewCertificate((prev) => ({
          ...prev,
          attachments: [...(prev.attachments || []), ...attachments],
          extractionReviewed: false,
        }));
        setAppBanner({ type: "info", title: "Certificate file added", message: `${attachments.length} file(s) ready for extraction review.` });
      })
      .catch(() => {
        setAppBanner({ type: "error", title: "File read failed", message: "The certificate file could not be read. Try another PDF or image." });
      });
  };

  const extractNewCertificate = async () => {
    if (!requireAdminEdit("Extracting certificate data")) return;
    if (!newCertificate.attachments?.length) {
      setAppBanner({ type: "error", title: "No certificate file", message: "Upload an image or PDF certificate before extracting." });
      return;
    }

    setIsExtractingCertificate(true);
    try {
      const extractedDraft = await extractCertificateDraft({ attachments: newCertificate.attachments });
      setNewCertificate((prev) => ({
        ...prev,
        ...extractedDraft,
        notes: prev.notes || extractedDraft.notes,
      }));
      setAppBanner({
        type: extractedDraft.needsManualReview ? "info" : "success",
        title: extractedDraft.needsManualReview ? "Review certificate draft" : "Certificate draft parsed",
        message: extractedDraft.needsManualReview
          ? "Check the extracted fields before saving."
          : "Review the extracted fields, then confirm the parsed draft before saving.",
      });
    } catch {
      setAppBanner({ type: "error", title: "Extraction failed", message: "The certificate could not be parsed. You can still fill it in manually." });
    } finally {
      setIsExtractingCertificate(false);
    }
  };

  const confirmNewCertificateDraft = () => {
    if (!requireAdminEdit("Confirming certificate drafts")) return;
    setNewCertificate((prev) => ({ ...prev, extractionReviewed: true }));
    setAppBanner({ type: "success", title: "Parsed draft confirmed", message: "You can now save this certificate record." });
  };

  const addCertificate = (profileId) => {
    if (!requireAdminEdit("Adding certificates")) return;
    if (!profileId) {
      setAppBanner({ type: "error", title: "Crew member required", message: "Select a crew member before saving the certificate." });
      return;
    }
    const name = newCertificate.name.trim();
    if (!name) return;
    if (newCertificate.extractedAt && !newCertificate.extractionReviewed) {
      setAppBanner({ type: "error", title: "Review parsed draft first", message: "Confirm the parsed draft or edit the fields before saving the certificate." });
      return;
    }
    const certificate = {
      id: `CERT-${Date.now()}`,
      ...newCertificate,
      name,
      qrPlaceholder: "QR profile access coming soon",
    };
    const profile = crewProfiles.find((item) => item.id === profileId);
    setCrewProfiles((prev) =>
      prev.map((item) =>
        item.id === profileId
          ? normalizeCrewProfile({ ...item, certificates: [...(item.certificates || []), certificate] })
          : item
      )
    );
    setNewCertificate(createEmptyCertificateDraft());
    setNewCertificateCrewId(profileId);
    setNewCertificateOpen(false);
    logChange("Certificates", "Certificate added", `${name} added to ${profile?.fullName || profileId}.`);
    setAppBanner({ type: "success", title: "Certificate added", message: `${name} was added to ${profile?.fullName || "crew profile"}.` });
  };

  const updateCertificate = (profileId, certificateId, patch) => {
    if (!requireAdminEdit("Updating certificates")) return;
    const profile = crewProfiles.find((item) => item.id === profileId);
    const certificate = profile?.certificates?.find((item) => item.id === certificateId);
    logChange("Certificates", "Certificate updated", `${profile?.fullName || profileId} / ${certificate?.name || certificateId}: ${describePatch(patch)}`);
    setCrewProfiles((prev) =>
      prev.map((item) =>
        item.id === profileId
          ? normalizeCrewProfile({
            ...item,
            certificates: (item.certificates || []).map((entry) => (entry.id === certificateId ? { ...entry, ...patch } : entry)),
          })
          : item
      )
    );
  };

  const deleteCertificate = (profileId, certificateId) => {
    if (!requireAdminEdit("Deleting certificates")) return;
    const profile = crewProfiles.find((item) => item.id === profileId);
    const certificate = profile?.certificates?.find((item) => item.id === certificateId);
    logChange("Certificates", "Certificate removed", `${certificate?.name || certificateId} removed from ${profile?.fullName || profileId}.`);
    setCrewProfiles((prev) =>
      prev.map((item) =>
        item.id === profileId
          ? normalizeCrewProfile({ ...item, certificates: (item.certificates || []).filter((entry) => entry.id !== certificateId) })
          : item
      )
    );
  };

  const handleCertificateAttachmentUpload = (profileId, certificateId, files) => {
    if (!requireAdminEdit("Uploading certificate files")) return;
    readFilesAsAttachmentPayloads(files)
      .then((attachments) => {
        if (!attachments.length) return;
        setCrewProfiles((prev) =>
          prev.map((profile) =>
            profile.id !== profileId
              ? profile
              : normalizeCrewProfile({
                ...profile,
                certificates: (profile.certificates || []).map((certificate) =>
                  certificate.id !== certificateId
                    ? certificate
                    : {
                      ...certificate,
                      attachments: [...(certificate.attachments || []), ...attachments],
                      extractionReviewed: false,
                    }
                ),
              })
          )
        );
        setAppBanner({ type: "info", title: "Certificate file added", message: `${attachments.length} file(s) were added to the certificate.` });
      })
      .catch(() => {
        setAppBanner({ type: "error", title: "File read failed", message: "The certificate file could not be read. Try another PDF or image." });
      });
  };

  const reextractCertificate = async (profileId, certificateId) => {
    if (!requireAdminEdit("Re-extracting certificate data")) return;
    const profile = crewProfiles.find((item) => item.id === profileId);
    const certificate = profile?.certificates?.find((item) => item.id === certificateId);
    if (!certificate?.attachments?.length) {
      setAppBanner({ type: "error", title: "No certificate file", message: "Upload an image or PDF certificate before extracting again." });
      return null;
    }

    try {
      const extractedDraft = await extractCertificateDraft({ attachments: certificate.attachments });
      setAppBanner({
        type: extractedDraft.needsManualReview ? "info" : "success",
        title: extractedDraft.needsManualReview ? "Review certificate draft" : "Certificate draft refreshed",
        message: "Review the extracted fields in the certificate row, then press Confirm to save them.",
      });
      return extractedDraft;
    } catch {
      setAppBanner({ type: "error", title: "Extraction failed", message: "The certificate could not be parsed from the uploaded file." });
      return null;
    }
  };

  const updateMaintenanceItem = (itemId, patch) => {
    if (!requireAdminEdit("Updating maintenance items")) return;
    const item = maintenanceItems.find((maintenance) => maintenance.id === itemId);
    logChange("Maintenance", "Maintenance updated", `${item?.title || itemId}: ${describePatch(patch)}`);
    setMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const nextItem = normalizeMaintenanceItem({ ...item, ...patch });
        if (hasMaintenanceDuplicate(prev, nextItem, itemId)) {
          setMaintenanceError("This maintenance already exists on that due date.");
          return item;
        }
        setMaintenanceError("");
        return nextItem;
      })
    );
  };

  const addMaintenanceItem = () => {
    if (!requireAdminEdit("Adding maintenance items")) return;
    const title = newMaintenance.title.trim();
    const area = (newMaintenance.areaOption === "Other" ? newMaintenance.customArea : newMaintenance.area).trim();
    if (!title || !area || !newMaintenance.nextDueDate) return;

    const item = normalizeMaintenanceItem({
      id: `MI-${Date.now()}`,
      title,
      area,
      frequencyMonths: safeNumber(newMaintenance.frequencyMonths),
      nextDueDate: newMaintenance.nextDueDate,
      notes: newMaintenance.notes.trim(),
      alertEnabled: true,
      extensionUsed: false,
      logs: [],
      removedLogs: [],
    });

    if (hasMaintenanceDuplicate(maintenanceItems, item)) {
      setMaintenanceError("This maintenance already exists on that due date.");
      return;
    }

    setMaintenanceError("");
    logChange("Maintenance", "Maintenance added", `${item.title} in ${item.area}, due ${item.nextDueDate}.`);
    setMaintenanceItems((prev) => [item, ...prev]);
    setNewMaintenance({
      title: "",
      area: MAINTENANCE_AREA_OPTIONS[0],
      areaOption: MAINTENANCE_AREA_OPTIONS[0],
      customArea: "",
      frequencyMonths: 1,
      nextDueDate: todayDateString(),
      notes: "",
    });
    setNewMaintenanceOpen(false);
    setAppBanner({ type: "success", title: "Maintenance added", message: `${item.title} was scheduled for ${item.nextDueDate}.` });
  };

  const completeMaintenanceItem = (itemId) => {
    if (!requireAdminEdit("Completing maintenance items")) return;
    const current = maintenanceItems.find((item) => item.id === itemId);
    logChange("Maintenance", "Maintenance completed", `${current?.title || itemId} marked done.`);
    setMaintenanceItems((prev) =>
      prev.map((item) => (item.id !== itemId ? item : completeMaintenanceCycle(item, todayDateString(), Date.now())))
    );
    setMaintenanceReminderState((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const requestMaintenanceNotifications = () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    Notification.requestPermission();
  };

  const noteMaintenanceReminder = (item) => {
    if (!requireAdminEdit("Updating maintenance reminders")) return;
    logChange("Maintenance", "Reminder noted", `${item.title} noted; follow-up scheduled.`);
    setMaintenanceReminderState((prev) => ({
      ...prev,
      [item.id]: {
        dueDate: item.nextDueDate,
        nextPopupAt: Date.now() + 7 * 60 * 60 * 1000,
        followUp: true,
      },
    }));
    setMaintenancePopupTick(Date.now());
  };

  const remindMaintenanceLater = (item) => {
    if (!requireAdminEdit("Updating maintenance reminders")) return;
    logChange("Maintenance", "Reminder delayed", `${item.title} reminder moved 1 hour later.`);
    setMaintenanceReminderState((prev) => ({
      ...prev,
      [item.id]: {
        dueDate: item.nextDueDate,
        nextPopupAt: Date.now() + 60 * 60 * 1000,
        followUp: false,
      },
    }));
    setMaintenancePopupTick(Date.now());
  };

  const postponeMaintenanceReminder = (item, date) => {
    if (!requireAdminEdit("Postponing maintenance")) return;
    if (item.extensionUsed) {
      setMaintenanceReminderState((prev) => ({
        ...prev,
        [item.id]: {
          dueDate: item.nextDueDate,
          nextPopupAt: Date.now() + 60 * 60 * 1000,
          followUp: false,
        },
      }));
      setMaintenancePopupTick(Date.now());
      return;
    }

    const nextDueDate = clampMaintenanceDueDate(item, date);
    logChange("Maintenance", "Reminder postponed", `${item.title} postponed to ${nextDueDate}.`);
    updateMaintenanceItem(item.id, { nextDueDate, extensionUsed: true });
    setMaintenanceReminderState((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    setPostponeDate(dateStringFromNow(1));
    setMaintenancePopupTick(Date.now());
  };

  const postponeMaintenanceTomorrow = (item) => {
    if (!requireAdminEdit("Postponing maintenance")) return;
    postponeMaintenanceReminder(item, dateStringFromNow(1));
  };

  const removeMaintenanceLog = (itemId, logId) => {
    if (!requireAdminEdit("Removing maintenance logs")) return;
    const item = maintenanceItems.find((maintenance) => maintenance.id === itemId);
    logChange("Maintenance", "Log removed", `A maintenance log was removed from ${item?.title || itemId}.`);
    setMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const log = (item.logs || []).find((entry) => entry.id === logId);
        if (!log) return item;

        return normalizeMaintenanceItem({
          ...item,
          logs: (item.logs || []).filter((entry) => entry.id !== logId),
          removedLogs: sortMaintenanceLogs([log, ...(item.removedLogs || [])]),
        });
      })
    );
  };

  const restoreMaintenanceLog = (itemId, logId) => {
    if (!requireAdminEdit("Restoring maintenance logs")) return;
    const item = maintenanceItems.find((maintenance) => maintenance.id === itemId);
    logChange("Maintenance", "Log restored", `A maintenance log was restored to ${item?.title || itemId}.`);
    setMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const log = (item.removedLogs || []).find((entry) => entry.id === logId);
        if (!log) return item;
        const activeLogs = (item.logs || []).filter((entry) => entry.completedDate !== log.completedDate);

        return normalizeMaintenanceItem({
          ...item,
          logs: sortMaintenanceLogs([log, ...activeLogs]),
          removedLogs: (item.removedLogs || []).filter((entry) => entry.id !== logId),
        });
      })
    );
  };

  const exportCsv = () => {
    const headers = [
      "Task ID",
      "Name",
      "Area",
      "Status",
      "Priority",
      "Assignee",
      "Due Date",
      "Notes",
      "Currency",
      "Money Type",
      "Description",
      "Amount",
      "Original Currency",
      `Amount in ${currency}`,
      "Status",
      "Paid",
    ];

    const rows = tasks.flatMap((task) => {
      const moneyItems = [
        ...task.quotes.map((quote) => ({
          type: "Quotation",
          description: quote.supplier,
          amount: quote.amount,
          originalCurrency: quote.currency || "USD",
          status: quote.status,
          paid: isPaidMoneyStatus(quote.status) ? "Yes" : "No",
        })),
      ];
      const exportItems = moneyItems.length ? moneyItems : [{ type: "", description: "", amount: "", originalCurrency: "", status: "", paid: "" }];

      return exportItems.map((item) => [
        task.id,
        task.name,
        task.area,
        task.status,
        task.priority,
        task.assignee,
        task.dueDate,
        task.notes,
        currency,
        item.type,
        item.description,
        item.amount,
        item.originalCurrency,
        item.amount === "" ? "" : convertMoney(item.amount, item.originalCurrency || currency, currency, exchangeRates),
        item.status,
        item.paid,
      ]);
    });

    const csv = [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
    downloadFile("contessa-tasks-export.csv", csv, "text/csv;charset=utf-8");
  };

  const printSummary = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleShareToast = (toast) => {
    if (!toast) return;
    setAppBanner(toast);
  };

  const openLinkedTaskFromExpense = (taskId) => {
      setExpenseView("tasks-maintenance");
      setTasksMaintenancePanel("tasks");
    setStatusFilter("all");
    setSelectedId(taskId);
  };

  const openTodayTask = (taskId) => {
    if (!taskId) {
      setAppBanner({ type: "info", title: "Task view coming soon", message: "Task detail routing will connect here when a dedicated detail route exists." });
      return;
    }
    openLinkedTaskFromExpense(taskId);
  };

  const handleTodayApprovalAction = (item, decision) => {
    if (!item?.sourceType) return;

    if (item.sourceType === "boat" && item.taskId && item.itemId) {
      updateQuote(item.taskId, item.itemId, { status: decision });
      return;
    }

    if (item.sourceType === "crew" && item.itemId) {
      updateCrewExpense(item.itemId, { status: decision });
      return;
    }

    if (item.sourceType === "task" && item.taskId) {
      setPrototypeTaskApprovals((prev) => ({ ...prev, [item.taskId]: decision }));
      setAppBanner({
        type: "success",
        title: decision === "approved" ? "Task approved" : "Task rejected",
        message: "Prototype task approval state was updated locally.",
      });
    }
  };

  const openNotificationItem = (item) => {
    if (!item) return;
    if (!canAccessSection(item.section)) {
      setAppBanner({ type: "error", title: "Section not available", message: "This item is not available for the current role." });
      return;
    }
    if (item.section === "tasks") {
      if (item.targetId && !visibleTaskIds.has(item.targetId)) {
        setAppBanner({ type: "error", title: "Task not available", message: "This task is outside the current role visibility." });
        return;
      }
      setExpenseView("tasks-maintenance");
      setTasksMaintenancePanel("tasks");
      setStatusFilter("all");
      setSelectedId(item.targetId);
      return;
    }
    if (item.section === "expenses") {
      setExpenseView("expenses-approvals");
      setExpenseBucket(item.bucket === "crew" ? "crew" : "boat");
      if (item.taskId && visibleTaskIds.has(item.taskId)) {
        setSelectedId(item.taskId);
      } else if (item.targetId?.startsWith?.("CT-") && visibleTaskIds.has(item.targetId)) {
        setSelectedId(item.targetId);
      }
      return;
    }
    if (item.section === "maintenance") {
      setExpenseView("tasks-maintenance");
      setTasksMaintenancePanel("maintenance");
      return;
    }
    if (item.section === "certificates") {
      setSelectedCrewId(item.targetId);
      setExpenseView("crew-certificates");
      setCrewCertificatesPanel("certificates");
    }
  };

  const requestDeviceNotifications = () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setAppBanner({ type: "error", title: "Alerts unavailable", message: "Push alerts are not supported on this device." });
      return;
    }

    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
      if (permission === "granted") {
        setAppBanner({ type: "success", title: "Alerts enabled", message: "This device is now ready for operational alert delivery." });
        return;
      }

      if (permission === "denied") {
        setAppBanner({ type: "error", title: "Alerts blocked", message: "Browser notifications are blocked for this device." });
        return;
      }

      setAppBanner({ type: "info", title: "Alerts not enabled", message: "Notification permission can be enabled later from your browser settings." });
    });
  };

  const mobileCommandActions = useMemo(() => {
    const captainTaskAction = {
      id: "qa-tasks",
      label: "Review overdue tasks",
      meta: `${todayOperations.overdueTasks.length} open`,
      onClick: () => {
        setExpenseView("tasks-maintenance");
        setTasksMaintenancePanel("tasks");
        setStatusFilter("all");
      },
    };
    const routeAction = {
      id: "qa-route",
      label: "Check planned route",
      meta: `${stats.routeWaypoints || 0} wpts`,
      onClick: () => setExpenseView("route"),
    };
    const approvalsAction = {
      id: "qa-approvals",
      label: "Open pending approvals",
      meta: `${todayOperations.pendingApprovals.length} waiting`,
      onClick: () => {
        setExpenseView("expenses-approvals");
        setExpenseBucket("boat");
      },
    };
    const maintenanceAction = {
      id: "qa-maintenance",
      label: "Due today maintenance",
      meta: `${todayOperations.dueTodayMaintenance.length} due`,
      onClick: () => {
        setExpenseView("tasks-maintenance");
        setTasksMaintenancePanel("maintenance");
      },
    };
    const certificatesAction = {
      id: "qa-certificates",
      label: "Check expiring certificates",
      meta: `${todayOperations.expiringCertificates.length} expiring`,
      onClick: () => {
        setExpenseView("crew-certificates");
        setCrewCertificatesPanel("certificates");
      },
    };
    const crewAction = {
      id: "qa-crew",
      label: "Open crew readiness",
      meta: `${stats.crewProfiles || 0} crew`,
      onClick: () => {
        setExpenseView("crew-certificates");
        setCrewCertificatesPanel("crew");
      },
    };

    switch (effectiveRole) {
      case "owner":
      case "manager":
        return [approvalsAction, captainTaskAction, certificatesAction];
      case "first_mate":
        return [routeAction, captainTaskAction, maintenanceAction];
      case "engineer":
        return [maintenanceAction, captainTaskAction, approvalsAction];
      case "bosun":
      case "deckhand":
        return [captainTaskAction, routeAction, maintenanceAction];
      case "stewardess":
        return [captainTaskAction, crewAction, approvalsAction];
      case "guest":
        return [routeAction, crewAction, certificatesAction];
      case "captain":
      default:
        return [captainTaskAction, routeAction, approvalsAction];
    }
  }, [effectiveRole, stats.crewProfiles, stats.routeWaypoints, todayOperations.dueTodayMaintenance.length, todayOperations.expiringCertificates.length, todayOperations.overdueTasks.length, todayOperations.pendingApprovals.length]);

  const mobileHomeConfig = useMemo(() => {
    const configs = {
      owner: {
        title: "Owner command panel",
        summary: "Approvals, spend visibility, and vessel readiness in one fast control surface.",
        status: "Executive oversight",
      },
      manager: {
        title: "Manager command panel",
        summary: "Keep approvals, crew readiness, and cost exposure moving without losing operational context.",
        status: "Fleet coordination",
      },
      captain: {
        title: "Captain command panel",
        summary: "Fast access to tasks, route checks, and approvals with local save always active onboard.",
        status: "Bridge priority",
      },
      first_mate: {
        title: "First Mate panel",
        summary: "Deck execution, route review, and daily maintenance in a faster one-handed flow.",
        status: "Deck operations",
      },
      engineer: {
        title: "Engineering panel",
        summary: "Maintenance, technical backlog, and approvals prioritized for engine room execution.",
        status: "Engineering focus",
      },
      bosun: {
        title: "Bosun panel",
        summary: "Task execution, route awareness, and deck checks kept tight and practical.",
        status: "Deck leadership",
      },
      deckhand: {
        title: "Deck panel",
        summary: "Assigned work, route awareness, and maintenance cues without extra clutter.",
        status: "Assigned work",
      },
      stewardess: {
        title: "Interior panel",
        summary: "Fast access to assigned work, service readiness, and active approvals.",
        status: "Interior workflow",
      },
      guest: {
        title: "Guest overview",
        summary: "A calm view of route, vessel status, and key readiness information.",
        status: "View only",
      },
    };

    return configs[effectiveRole] || configs.captain;
  }, [effectiveRole]);

  const mobileQuickActionItems = useMemo(() => {
    if (!canEditApp) return null;

    return [
      {
        id: "mobile-action-task",
        label: "Add Task",
        onClick: () => {
          setExpenseView("tasks-maintenance");
          setTasksMaintenancePanel("tasks");
          setNewTaskOpen(true);
        },
      },
      {
        id: "mobile-action-expense",
        label: "Add Expense",
        onClick: () => {
          setExpenseView("expenses-approvals");
          setExpenseBucket("boat");
          setNewExpenseOpen(true);
        },
      },
      {
        id: "mobile-action-waypoint",
        label: "Add Waypoint",
        onClick: () => {
          setExpenseView("route");
          addRouteWaypoint();
        },
      },
      {
        id: "mobile-action-crew-note",
        label: "Crew Note",
        onClick: () => {
          setExpenseView("crew-certificates");
          setCrewCertificatesPanel("crew");
          setAppBanner({ type: "info", title: "Crew notes", message: "Open a crew profile to add or review notes." });
        },
      },
      {
        id: "mobile-action-certificate",
        label: "Upload Certificate",
        onClick: () => {
          setExpenseView("crew-certificates");
          setCrewCertificatesPanel("certificates");
          setNewCertificateOpen(true);
        },
      },
    ];
  }, [canEditApp]);

  const updateRouteVesselProfile = (patch) => {
    if (!requireAdminEdit("Updating route planning vessel profile")) return;
    setVesselProfile((prev) => ({ ...(prev || {}), ...patch }));
    setRoutePlanning((prev) =>
      normalizeRoutePlanningState({
        ...prev,
        vesselProfile: {
          ...(prev?.vesselProfile || {}),
          ...patch,
        },
      })
    );
  };

  const updateRouteSafetyMargin = (value) => {
    if (!requireAdminEdit("Updating route planning safety margin")) return;
    setRoutePlanning((prev) =>
      normalizeRoutePlanningState({
        ...prev,
        safetyMargin: value,
      })
    );
  };

  const addRouteWaypoint = (point) => {
    if (!requireAdminEdit("Adding route waypoints")) return;
    const nextWaypoint = createRouteWaypoint(point, routePlanning?.waypoints?.length || 0);
    logChange("Route Planning", "Waypoint added", `${nextWaypoint.name} added to the planning route.`);
    setRoutePlanning((prev) =>
      normalizeRoutePlanningState({
        ...prev,
        waypoints: [...(prev?.waypoints || []), nextWaypoint],
      })
    );
  };

  const updateRouteWaypoint = (waypointId, patch) => {
    if (!requireAdminEdit("Updating route waypoints")) return;
    setRoutePlanning((prev) =>
      normalizeRoutePlanningState({
        ...prev,
        waypoints: (prev?.waypoints || []).map((waypoint) => (waypoint.id === waypointId ? { ...waypoint, ...patch } : waypoint)),
      })
    );
  };

  const deleteRouteWaypoint = (waypointId) => {
    if (!requireAdminEdit("Deleting route waypoints")) return;
    const waypoint = (routePlanning?.waypoints || []).find((item) => item.id === waypointId);
    if (waypoint) {
      logChange("Route Planning", "Waypoint removed", `${waypoint.name} was removed from the route.`);
    }
    setRoutePlanning((prev) =>
      normalizeRoutePlanningState({
        ...prev,
        waypoints: (prev?.waypoints || []).filter((entry) => entry.id !== waypointId),
      })
    );
  };

  const reorderWaypoints = (fromIndex, toIndex) => {
    if (!requireAdminEdit("Reordering route waypoints")) return;
    if (fromIndex === toIndex) return;
    logChange("Route Planning", "Waypoints reordered", "Waypoint order updated for the planning route.");
    setRoutePlanning((prev) =>
      normalizeRoutePlanningState({
        ...prev,
        waypoints: reorderRouteWaypoints(prev?.waypoints || [], fromIndex, toIndex),
      })
    );
  };

  if (routeNotFound) {
    return (
      <div
        className={`min-h-screen max-w-full overflow-x-hidden px-4 py-6 transition-colors sm:px-6 lg:px-8 ${theme.page}`}
        style={vesselThemeVars}
      >
        <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <section className="w-full rounded-[28px] border border-slate-200/70 bg-white/80 p-6 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
            <p className="app-compact-label text-blue-700 dark:text-cyan-200">Fleet</p>
            <h1 className={`mt-3 text-2xl font-semibold tracking-tight ${theme.textPrimary}`}>Vessel not found</h1>
            <p className={`mx-auto mt-2 max-w-lg text-sm leading-6 ${theme.textSecondary}`}>
              No separate workspace exists for "{formatVesselNameFromId(routeVesselId || "vessel")}". Choose an available vessel below.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {vesselsForPersistence.map((vessel) => (
                <button
                  key={vessel.id}
                  type="button"
                  onClick={() => openVesselWorkspace(vessel.id)}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-slate-900/85 dark:hover:border-cyan-300/40 dark:hover:bg-slate-800/80"
                >
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{vessel.name}</span>
                  <span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">{vessel.details?.status || "Operational"}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  const commandSearchView = (
    <DashboardCommandSearch
      darkMode={darkMode}
      currentVesselName={activeVesselWorkspace?.name || vesselProfile?.vesselName || APP_BRAND_NAME}
      searchResults={commandSearchResults}
      onJump={handleCommandSearchJump}
    />
  );

  return (
    <div
      className={`min-h-screen max-w-full overflow-x-hidden px-4 pb-[calc(120px+env(safe-area-inset-bottom))] pt-4 transition-colors sm:px-5 md:px-6 md:pt-5 lg:px-8 xl:px-10 ${theme.page}`}
      style={vesselThemeVars}
    >
      <AppDialogs
        darkMode={darkMode}
        quoteDeleteRequest={quoteDeleteRequest}
        onConfirmRemoveQuote={() => removeQuote(quoteDeleteRequest.taskId, quoteDeleteRequest.quoteId)}
        onCancelRemoveQuote={() => setQuoteDeleteRequest(null)}
        taskDeleteRequest={taskDeleteRequest}
        onConfirmDeleteTask={() => deleteTask(taskDeleteRequest.id)}
        onCancelDeleteTask={() => setTaskDeleteRequest(null)}
        crewExpenseDeleteRequest={crewExpenseDeleteRequest}
        onConfirmDeleteCrewExpense={() => deleteCrewExpense(crewExpenseDeleteRequest.id)}
        onCancelDeleteCrewExpense={() => setCrewExpenseDeleteRequest(null)}
      />
      <div className="app-page-frame">
        <AppBanner banner={appBanner} onDismiss={() => setAppBanner(null)} darkMode={darkMode} />
        <div className="md:hidden">
          <TopCommandBar
            darkMode={darkMode}
            vesselName={activeVesselWorkspace?.name || vesselProfile?.vesselName || routePlanning?.vesselProfile?.vesselName || APP_BRAND_NAME}
            vesselStatus={activeVesselWorkspace?.details?.status || "Operational"}
            vesselLocation={activeVesselWorkspace?.details?.homePort || "Home port not set"}
            currentRole={effectiveRole}
            currentRoleLabel={currentRoleLabel}
            onCurrentRoleChange={setCurrentRole}
            appMode={appMode}
            onAppModeChange={handleAppModeChange}
            isOffline={isOffline}
            alertCount={accessibleNotifications.length}
            commandSearchView={commandSearchView}
            onOpenFleet={() => setFleetOpen(true)}
            onOpenAlerts={() => navigateToSection("alerts-section", "notifications")}
            onToggleDarkMode={() => setDarkMode((prev) => !prev)}
            onOpenHistory={() => setHistoryOpen(true)}
            onOpenShare={() => setSharingOpen(true)}
            onOpenSettings={() => openMobileWorkspace("settings")}
          />
        </div>
        <div className="hidden">
        <AppShellHeader
          darkMode={darkMode}
          isOffline={isOffline}
          onToggleDarkMode={() => setDarkMode((prev) => !prev)}
          currentVesselName={activeVesselWorkspace?.name || vesselProfile?.vesselName || routePlanning?.vesselProfile?.vesselName || APP_BRAND_NAME}
          currentRole={effectiveRole}
          onCurrentRoleChange={setCurrentRole}
          appMode={appMode}
          onAppModeChange={handleAppModeChange}
          visibleModuleKeys={visibleModuleKeys}
          canEditApp={canEditApp}
          historyOpen={historyOpen}
          onHistoryOpenChange={setHistoryOpen}
          actorName={actorName}
          onActorNameChange={setActorName}
          retrieveOpen={retrieveOpen}
          onToggleRetrieve={() => setRetrieveOpen((prev) => !prev)}
          declinedTasks={declinedTasks}
          onRetrieveDeclinedTask={retrieveDeclinedTask}
          history={history}
          sharingOpen={sharingOpen}
          onSharingOpenChange={setSharingOpen}
          jsonImportInputRef={jsonImportInputRef}
          onImportAppStateJson={importAppStateJson}
          onExportCsv={exportCsv}
          onExportAppStateJson={exportAppStateJson}
          onOpenJsonImportPicker={openJsonImportPicker}
          onPrintSummary={printSummary}
          onResetDemoData={resetDemoData}
          shareUrlStatus={publicAppUrlStatus}
          localShareWarning={localShareWarning}
          onShareToast={handleShareToast}
          fleetOpen={fleetOpen}
          onFleetOpenChange={setFleetOpen}
          fleetVessels={vesselsForPersistence}
          fleetMetricsByVessel={fleetMetricsByVessel}
          activeVesselId={activeVesselId}
          onOpenFleet={() => setFleetOpen(true)}
          onSwitchFleetVessel={openVesselWorkspace}
          onAddFleetVessel={handleAddFleetVessel}
          stats={stats}
          currency={currency}
          routeWarningCount={routeAlerts.length}
          quickActionItems={mobileQuickActionItems || []}
          onOpenCommand={() => setExpenseView("command")}
          onOpenTasksMaintenance={() => {
            navigateToSection("tasks-section", "tasks-maintenance", { panel: "tasks" });
          }}
          onOpenApprovals={() => {
            navigateToSection("approvals-section", "expenses-approvals", { bucket: "boat" });
          }}
          onOpenRoute={() => navigateToSection("route-section", "route")}
          onOpenCrewCertificates={() => {
            navigateToSection("certificates-section", "crew-certificates", { panel: "certificates" });
          }}
          onOpenDocuments={() => navigateToSection("docs-section", "documents")}
          onOpenSettingsWorkspace={() => navigateToSection("settings-section", "settings")}
          notificationCount={accessibleNotifications.length}
          onOpenNotifications={() => navigateToSection("alerts-section", "notifications")}
          commandSearchView={commandSearchView}
        />
        </div>

        <MobileFocusedDashboard
          darkMode={darkMode}
          vesselName={activeVesselWorkspace?.name || vesselProfile?.vesselName || routePlanning?.vesselProfile?.vesselName || APP_BRAND_NAME}
          vesselStatus={activeVesselWorkspace?.details?.status || "Operational"}
          vesselLocation={activeVesselWorkspace?.details?.homePort || "Home port not set"}
          currentRoleLabel={currentRoleLabel}
          appMode={appMode}
          isOffline={isOffline}
          stats={stats}
          currency={currency}
          tasks={visibleTasks}
          maintenanceItems={maintenanceItems}
          approvals={approvalScopedBoatItems}
          crewExpenses={crewExpenses}
          crewProfiles={visibleCrewProfiles}
          documents={documents}
          routePlanning={routePlanning}
          routeSummary={routeSummary}
          routeAlerts={routeAlerts}
          fleetVessels={vesselsForPersistence}
          activeVesselId={activeVesselId}
          fleetMetricsByVessel={fleetMetricsByVessel}
          commandSearchView={commandSearchView}
          openSection={openMobileSection}
          onOpenSection={openMobileSectionById}
          onOpenDetail={setMobileDetailItem}
          onOpenTaskModule={() => openMobileWorkspace("tasks-maintenance", { panel: "tasks" })}
          onOpenApprovals={() => openMobileWorkspace("expenses-approvals", { bucket: "boat" })}
          onOpenCrew={() => openMobileWorkspace("crew-certificates", { panel: "crew" })}
          onOpenRoute={() => openMobileWorkspace("route")}
          onOpenDocuments={() => openMobileWorkspace("documents")}
          onOpenTools={() => openMobileWorkspace("settings")}
          onSwitchFleetVessel={openVesselWorkspace}
          onAddTask={() => {
            openMobileWorkspace("tasks-maintenance", { panel: "tasks" });
            setNewTaskOpen(true);
          }}
          onAddCrew={() => {
            openMobileWorkspace("crew-certificates", { panel: "crew" });
            setNewCrewProfileOpen(true);
          }}
          onOpenCrewList={() => {
            if (typeof window !== "undefined") {
              window.open(`/vessels/${activeVesselId}/crew-list/print`, "_blank");
            }
          }}
        />

        <div className="md:hidden">
        <AppSectionCards
          darkMode={darkMode}
          expenseView={expenseView}
          stats={stats}
          currency={currency}
          visibleModuleKeys={visibleModuleKeys}
          fleetCount={vesselsForPersistence.length}
          routeWarningCount={routeAlerts.length}
          quickActionItems={mobileQuickActionItems || []}
          onShowCommand={() => openMobileWorkspace("command")}
          onShowRoute={() => {
            openMobileWorkspace("route");
            navigateToSection("route-section", "route");
          }}
          onShowTasksMaintenance={() => {
            openMobileWorkspace("tasks-maintenance", { panel: "tasks" });
            navigateToSection("tasks-section", "tasks-maintenance", { panel: "tasks" });
          }}
          onShowCrewCertificates={() => {
            openMobileWorkspace("crew-certificates", { panel: "crew" });
            navigateToSection("crew-section", "crew-certificates", { panel: "crew" });
          }}
          onShowExpenses={() => {
            openMobileWorkspace("expenses-approvals", { bucket: "boat" });
            navigateToSection("approvals-section", "expenses-approvals", { bucket: "boat" });
          }}
          onShowDocuments={() => {
            openMobileWorkspace("documents");
            navigateToSection("docs-section", "documents");
          }}
          onShowFleet={() => setFleetOpen(true)}
          onShowSettings={() => {
            openMobileWorkspace("settings");
            navigateToSection("settings-section", "settings");
          }}
        />
        </div>

        <div className="hidden min-w-0 gap-4 md:grid md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_310px]">
          <DesktopMissionSidebar
            darkMode={darkMode}
            expenseView={expenseView}
            stats={stats}
            routeWarningCount={routeAlerts.length}
            onShowCommand={() => openMobileWorkspace("command")}
            onShowTasks={() => openMobileWorkspace("tasks-maintenance", { panel: "tasks" })}
            onShowApprovals={() => openMobileWorkspace("expenses-approvals", { bucket: "boat" })}
            onShowCrew={() => openMobileWorkspace("crew-certificates", { panel: "crew" })}
            onShowRoute={() => openMobileWorkspace("route")}
            onShowDocuments={() => openMobileWorkspace("documents")}
            onShowMore={() => openMobileWorkspace("settings")}
          />
          <main className="min-w-0 space-y-4">
            <TopCommandBar
              darkMode={darkMode}
              vesselName={activeVesselWorkspace?.name || vesselProfile?.vesselName || routePlanning?.vesselProfile?.vesselName || APP_BRAND_NAME}
              vesselStatus={activeVesselWorkspace?.details?.status || "Operational"}
              vesselLocation={activeVesselWorkspace?.details?.homePort || "Home port not set"}
              currentRole={effectiveRole}
              currentRoleLabel={currentRoleLabel}
              onCurrentRoleChange={setCurrentRole}
              appMode={appMode}
              onAppModeChange={handleAppModeChange}
              isOffline={isOffline}
              alertCount={accessibleNotifications.length}
              commandSearchView={commandSearchView}
              onOpenFleet={() => setFleetOpen(true)}
              onOpenAlerts={() => navigateToSection("alerts-section", "notifications")}
              onToggleDarkMode={() => setDarkMode((prev) => !prev)}
              onOpenHistory={() => setHistoryOpen(true)}
              onOpenShare={() => setSharingOpen(true)}
              onOpenSettings={() => openMobileWorkspace("settings")}
            />
            <div className="min-w-0">
        {expenseView === "command" ? (
          <TodayOperationsView
            darkMode={darkMode}
            canEdit={canEditApp}
            todayOperations={todayOperations}
            currency={currency}
            currentRole={effectiveRole}
            currentRoleLabel={currentRoleLabel}
            currentVesselName={activeVesselWorkspace?.name || vesselProfile?.vesselName || routePlanning?.vesselProfile?.vesselName || APP_BRAND_NAME}
            stats={stats}
            vesselOperations={vesselOperations}
            isOffline={isOffline}
            lastSyncAt={prototypeSyncState.lastSyncAt}
            unsyncedItemsCount={prototypeSyncState.unsyncedItemsCount}
            notificationPermission={notificationPermission}
            onRequestNotifications={requestDeviceNotifications}
            mobileHomeConfig={mobileHomeConfig}
            routeAlerts={routeAlerts}
            recentActivity={visibleHistory.slice(0, 6)}
            quickActions={mobileCommandActions}
            fleetVessels={vesselsForPersistence}
            fleetMetricsByVessel={fleetMetricsByVessel}
            activeVesselId={activeVesselId}
            onOpenFleet={() => setFleetOpen(true)}
            onSwitchFleetVessel={openVesselWorkspace}
            onOpenTask={openTodayTask}
            onApprovalAction={handleTodayApprovalAction}
            onNavigateToTasks={() => navigateToSection("tasks-section", "tasks-maintenance", { panel: "tasks" })}
            onNavigateToMaintenance={() => navigateToSection("maintenance-section", "tasks-maintenance", { panel: "maintenance" })}
            onNavigateToCrew={() => navigateToSection("crew-section", "crew-certificates", { panel: "crew" })}
            onNavigateToCertificates={() => navigateToSection("certificates-section", "crew-certificates", { panel: "certificates" })}
            onNavigateToApprovals={() => navigateToSection("approvals-section", "expenses-approvals", { bucket: "boat" })}
            onNavigateToRoute={() => navigateToSection("route-section", "route")}
            onNavigateToAlerts={() => navigateToSection("alerts-section", "notifications")}
            onNavigateToDocuments={() => navigateToSection("docs-section", "documents")}
          />
        ) : expenseView === "route" ? (
          <div id="route-section" className="scroll-mt-24 md:scroll-mt-28">
            <RoutePlanningView
              darkMode={darkMode}
              canEdit={canEditApp}
              routePlanning={routePlanning}
              onUpdateVesselProfile={updateRouteVesselProfile}
              onUpdateSafetyMargin={updateRouteSafetyMargin}
              onAddWaypoint={addRouteWaypoint}
              onUpdateWaypoint={updateRouteWaypoint}
              onDeleteWaypoint={deleteRouteWaypoint}
              onReorderWaypoints={reorderWaypoints}
            />
          </div>
        ) : expenseView === "tasks-maintenance" ? (
          <TaskMaintenanceWorkspace
            darkMode={darkMode}
            activePanel={tasksMaintenancePanel}
            onChangePanel={setTasksMaintenancePanel}
            tasksView={<div id="tasks-section" className="scroll-mt-24 md:scroll-mt-28"><ObjectivesView
              darkMode={darkMode}
              canEdit={canEditApp}
              stats={stats}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              newTaskOpen={newTaskOpen}
              onNewTaskOpenChange={setNewTaskOpen}
              newTask={newTask}
              onNewTaskChange={(patch) => setNewTask((prev) => ({ ...prev, ...patch }))}
              onAddTask={addTask}
              search={search}
              onSearchChange={setSearch}
              filteredTasks={filteredTasks}
              selectedId={selectedId}
              onSelectTask={setSelectedId}
              onUpdateTaskStatus={updateTaskStatus}
              selectedTask={selectedTask}
              currency={currency}
              exchangeRates={exchangeRates}
              onDeleteTaskRequest={setTaskDeleteRequest}
              onUpdateTask={updateTask}
              onTaskPhotoUpload={handleTaskPhotoUpload}
              onRemoveTaskPhoto={removeTaskPhoto}
              onTaskAttachmentUpload={handleTaskAttachmentUpload}
              onRemoveTaskAttachment={removeTaskAttachment}
              onAddTaskComment={addTaskComment}
              onAddQuote={addQuote}
              onUpdateQuote={(taskId, quoteId, patch) => updateQuote(taskId, quoteId, patch.amount !== undefined ? { ...patch, amount: parseAmountInput(patch.amount) } : patch)}
              onQuoteReceiptUpload={handleReceiptUpload}
              onQuoteRemoveRequest={setQuoteDeleteRequest}
            /></div>}
            maintenanceView={<div id="maintenance-section" className="scroll-mt-24 md:scroll-mt-28"><MaintenanceView
              darkMode={darkMode}
              canEdit={canEditApp}
              maintenanceError={maintenanceError}
              maintenanceAlerts={maintenanceAlerts}
              maintenanceItems={maintenanceItems}
              newMaintenanceOpen={newMaintenanceOpen}
              onNewMaintenanceOpenChange={setNewMaintenanceOpen}
              newMaintenance={newMaintenance}
              onNewMaintenanceChange={(patch) => setNewMaintenance((prev) => ({ ...prev, ...patch }))}
              onAddMaintenanceItem={addMaintenanceItem}
              onRequestMaintenanceNotifications={requestMaintenanceNotifications}
              onUpdateMaintenanceItem={updateMaintenanceItem}
              onCompleteMaintenanceItem={completeMaintenanceItem}
              onRemoveMaintenanceLog={removeMaintenanceLog}
              onRestoreMaintenanceLog={restoreMaintenanceLog}
            /></div>}
          />
        ) : expenseView === "crew-certificates" ? (
          <CrewCertificatesWorkspace
            darkMode={darkMode}
            activePanel={crewCertificatesPanel}
            onChangePanel={setCrewCertificatesPanel}
            crewView={<div id="crew-section" className="scroll-mt-24 md:scroll-mt-28"><CrewView
              darkMode={darkMode}
              canEdit={canEditApp}
              currentRole={effectiveRole}
              onCurrentRoleChange={setCurrentRole}
              actorName={actorName}
              canViewCrew={canAccessModule(effectiveRole, "crew")}
              visibleCrewProfiles={visibleCrewProfiles}
              selectedCrewProfile={selectedCrewProfile}
              onSelectCrewProfile={setSelectedCrewId}
              newCrewProfileOpen={newCrewProfileOpen}
              onNewCrewProfileOpenChange={setNewCrewProfileOpen}
              newCrewProfile={newCrewProfile}
              onNewCrewProfileChange={(patch) => setNewCrewProfile((prev) => ({ ...prev, ...patch }))}
              onAddCrewProfile={addCrewProfile}
              onUpdateCrewProfile={updateCrewProfile}
              newCertificateOpen={newCertificateOpen}
              onNewCertificateOpenChange={setNewCertificateOpen}
              newCertificate={newCertificate}
              onNewCertificateChange={(patch) => setNewCertificate((prev) => ({ ...prev, ...patch, extractionReviewed: prev.extractedAt ? true : prev.extractionReviewed }))}
              onAddCertificate={addCertificate}
              newCertificateCrewId={newCertificateCrewId}
              onNewCertificateCrewIdChange={setNewCertificateCrewId}
              onExtractNewCertificate={extractNewCertificate}
              isExtractingCertificate={isExtractingCertificate}
              onConfirmNewCertificateDraft={confirmNewCertificateDraft}
              onNewCertificateAttachmentUpload={handleNewCertificateAttachmentUpload}
              onUpdateCertificate={updateCertificate}
              onCertificateAttachmentUpload={handleCertificateAttachmentUpload}
              onReextractCertificate={reextractCertificate}
              onDeleteCertificate={deleteCertificate}
              crewListPrintHref={`/vessels/${activeVesselId}/crew-list/print`}
            /></div>}
            certificatesView={<div id="certificates-section" className="scroll-mt-24 md:scroll-mt-28"><CertificatesView
              darkMode={darkMode}
              canEdit={canEditApp}
              currentRole={effectiveRole}
              onCurrentRoleChange={setCurrentRole}
              canViewCertificates={canAccessModule(effectiveRole, "certificates")}
              certificateAlerts={certificateAlerts}
              visibleCertificates={visibleCertificates}
              visibleCrewProfiles={visibleCrewProfiles}
              newCertificateOpen={newCertificateOpen}
              onNewCertificateOpenChange={setNewCertificateOpen}
              newCertificate={newCertificate}
              onNewCertificateChange={(patch) => setNewCertificate((prev) => ({ ...prev, ...patch, extractionReviewed: prev.extractedAt ? true : prev.extractionReviewed }))}
              newCertificateCrewId={newCertificateCrewId}
              onNewCertificateCrewIdChange={setNewCertificateCrewId}
              onExtractNewCertificate={extractNewCertificate}
              isExtractingCertificate={isExtractingCertificate}
              onConfirmNewCertificateDraft={confirmNewCertificateDraft}
              onNewCertificateAttachmentUpload={handleNewCertificateAttachmentUpload}
              onAddCertificate={addCertificate}
              onOpenCrewProfile={(crewId) => {
                setSelectedCrewId(crewId);
                setExpenseView("crew-certificates");
                setCrewCertificatesPanel("crew");
              }}
            /></div>}
          />
        ) : expenseView === "documents" ? (
          <div id="docs-section" className="scroll-mt-24 md:scroll-mt-28">
            <DocumentsView
              darkMode={darkMode}
              documents={documents}
              vesselName={vesselProfile?.vesselName || APP_BRAND_NAME}
            />
          </div>
        ) : expenseView === "settings" ? (
          <div id="settings-section" className="scroll-mt-24 md:scroll-mt-28">
            <SettingsWorkspaceView
              darkMode={darkMode}
              vesselProfile={vesselProfile}
              currentRole={effectiveRole}
              appMode={appMode}
              shareUrlStatus={publicAppUrlStatus}
              localShareWarning={localShareWarning}
              canEdit={canEditApp}
              jsonImportInputRef={jsonImportInputRef}
              onImportAppStateJson={importAppStateJson}
              onExportCsv={exportCsv}
              onExportAppStateJson={exportAppStateJson}
              onOpenJsonImportPicker={openJsonImportPicker}
              onPrintSummary={printSummary}
              onResetDemoData={resetDemoData}
              onOpenHistory={() => setHistoryOpen(true)}
            />
          </div>
        ) : expenseView === "notifications" ? (
          <div id="alerts-section" className="scroll-mt-24 md:scroll-mt-28">
            <NotificationsView
              darkMode={darkMode}
              notifications={accessibleNotifications}
              onOpenNotification={openNotificationItem}
            />
          </div>
        ) : (
          <div id="approvals-section" className="scroll-mt-24 md:scroll-mt-28">
            <ExpensesView
              darkMode={darkMode}
              canEdit={canEditApp}
              expenseBucket={expenseBucket}
              onExpenseBucketChange={setExpenseBucket}
              stats={stats}
              currency={currency}
              onCurrencyChange={setCurrency}
              tasks={visibleTasks}
              newExpenseOpen={newExpenseOpen}
              onNewExpenseOpenChange={setNewExpenseOpen}
              newExpense={newExpense}
              onNewExpenseChange={(patch) => setNewExpense((prev) => ({ ...prev, ...patch, amount: patch.amount !== undefined ? parseAmountInput(patch.amount) : prev.amount }))}
              onAddExpense={addExpense}
              boatExpenses={boatExpenses}
              exchangeRates={exchangeRates}
              onUpdateQuote={(taskId, quoteId, patch) => updateQuote(taskId, quoteId, patch.amount !== undefined ? { ...patch, amount: parseAmountInput(patch.amount) } : patch)}
              onQuoteReceiptUpload={handleReceiptUpload}
              onQuoteRemoveRequest={setQuoteDeleteRequest}
              onOpenLinkedTask={openLinkedTaskFromExpense}
              crewExpenses={crewExpenses}
              newCrewExpenseOpen={newCrewExpenseOpen}
              onNewCrewExpenseOpenChange={setNewCrewExpenseOpen}
              newCrewExpense={newCrewExpense}
              onNewCrewExpenseChange={(patch) => setNewCrewExpense((prev) => ({ ...prev, ...patch, amount: patch.amount !== undefined ? parseAmountInput(patch.amount) : prev.amount }))}
              onAddCrewExpense={addCrewExpense}
              onUpdateCrewExpense={(expenseId, patch) => updateCrewExpense(expenseId, patch.amount !== undefined ? { ...patch, amount: parseAmountInput(patch.amount) } : patch)}
              onCrewExpenseAttachmentUpload={handleCrewExpenseAttachmentUpload}
              onCrewExpenseDeleteRequest={setCrewExpenseDeleteRequest}
            />
          </div>
        )}
            </div>
          </main>
          <DesktopMissionInspector
            darkMode={darkMode}
            selectedTask={selectedTask}
            selectedCrewProfile={selectedCrewProfile}
            routeSummary={routeSummary}
            stats={stats}
            currency={currency}
            expenseView={expenseView}
            onOpenTask={() => openMobileWorkspace("tasks-maintenance", { panel: "tasks" })}
            onOpenCrew={() => openMobileWorkspace("crew-certificates", { panel: "crew" })}
            onOpenRoute={() => openMobileWorkspace("route")}
          />
        </div>
      </div>
      <MobileDetailSheet item={mobileDetailItem} onClose={() => setMobileDetailItem(null)} />
      <MaintenanceReminderModal
        darkMode={darkMode}
        maintenancePopupItem={maintenancePopupItem}
        maintenancePopupFollowUp={maintenancePopupFollowUp}
        postponeDate={postponeDate}
        onPostponeDateChange={setPostponeDate}
        onCompleteMaintenanceItem={completeMaintenanceItem}
        onPostponeMaintenanceTomorrow={postponeMaintenanceTomorrow}
        onNoteMaintenanceReminder={noteMaintenanceReminder}
        onRemindMaintenanceLater={remindMaintenanceLater}
        onPostponeMaintenanceReminder={postponeMaintenanceReminder}
      />
      <div className="hidden print:fixed print:bottom-0 print:left-0 print:right-0 print:block print:border-t print:border-[#d8e7df] print:bg-white print:px-6 print:py-2 print:text-center print:text-[11px] print:text-[#64756b]">
        {APP_FOOTER_NOTICE}
      </div>
    </div>
  );
}

function DesktopMissionSidebar({
  darkMode,
  expenseView,
  stats,
  routeWarningCount,
  onShowCommand,
  onShowTasks,
  onShowApprovals,
  onShowCrew,
  onShowRoute,
  onShowDocuments,
  onShowMore,
}) {
  const items = [
    { key: "command", themeKey: "dashboard", label: "Dashboard", meta: `${stats.todayAttentionCount || 0}`, onClick: onShowCommand },
    { key: "tasks-maintenance", themeKey: "tasks", label: "Tasks", meta: `${stats.totalObjectives || 0}`, onClick: onShowTasks },
    { key: "expenses-approvals", themeKey: "approvals", label: "Approvals", meta: `${stats.pendingApprovals || 0}`, onClick: onShowApprovals },
    { key: "crew-certificates", themeKey: "crew", label: "Crew", meta: `${stats.crewProfiles || 0}`, onClick: onShowCrew },
    { key: "route", themeKey: "route", label: "Route", meta: `${routeWarningCount || 0}`, onClick: onShowRoute },
    { key: "documents", themeKey: "documents", label: "Docs", meta: `${stats.documentCount || 0}`, onClick: onShowDocuments },
    { key: "settings", themeKey: "fleet", label: "More", meta: "Tools", onClick: onShowMore },
  ];

  return (
    <aside className="sticky top-5 h-[calc(100vh-2.5rem)] min-w-0 overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/88 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/78 dark:shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
          <ContessaUiLogo className="h-10 w-10" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-50">Contessa</p>
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Yacht Ops</p>
        </div>
      </div>

      <nav className="mt-7 space-y-2" aria-label="Primary vessel workspace">
        {items.map((item) => (
          <DesktopMissionNavButton
            key={item.key}
            active={expenseView === item.key}
            themeKey={item.themeKey}
            label={item.label}
            meta={item.meta}
            onClick={item.onClick}
            darkMode={darkMode}
          />
        ))}
      </nav>

      <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-900/80">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700 dark:text-cyan-200">Bridge mode</p>
        <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">Focused module view with details kept in the inspector.</p>
      </div>
    </aside>
  );
}

function DesktopMissionNavButton({ active, themeKey = "dashboard", label, meta, onClick }) {
  const moduleTheme = getModuleTheme(themeKey);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
        active
          ? moduleTheme.active
          : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white/70 hover:text-slate-950 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/[0.05] dark:hover:text-slate-50"
      }`}
    >
      <span className="min-w-0 truncate text-sm font-semibold">{label}</span>
      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${active ? moduleTheme.chip : "border-slate-200 bg-slate-100 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"}`}>
        {meta}
      </span>
    </button>
  );
}

function TopCommandBar({
  vesselName,
  vesselStatus,
  vesselLocation,
  currentRole,
  currentRoleLabel,
  onCurrentRoleChange,
  appMode,
  onAppModeChange,
  isOffline,
  alertCount,
  commandSearchView,
  onOpenFleet,
  onOpenAlerts,
  onToggleDarkMode,
  onOpenHistory,
  onOpenShare,
  onOpenSettings,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const dashboardTheme = getModuleTheme("dashboard");
  const alertTheme = getModuleTheme("alerts");

  return (
    <header className="rounded-[32px] border border-slate-200/80 bg-white/88 p-4 shadow-[0_18px_54px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/78 dark:shadow-[0_18px_54px_rgba(0,0,0,0.34)]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${dashboardTheme.chip}`}>
              {isOffline ? "Offline sync" : "Live"}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
              {currentRoleLabel}
            </span>
          </div>
          <h1 className="mt-3 truncate text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{vesselName}</h1>
          <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{vesselStatus} · {vesselLocation}</p>
        </div>

        <div className="relative z-[70] min-w-0">
          {commandSearchView}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button type="button" onClick={onOpenAlerts} className={`relative flex h-11 min-w-11 items-center justify-center rounded-2xl border px-3 text-sm font-semibold ${alertTheme.chip}`} aria-label={`${alertCount} alerts`}>
          <span aria-hidden="true">○</span>
          {alertCount ? <span className="ml-1 rounded-full bg-current/12 px-1.5 py-0.5 text-[10px] leading-none">{alertCount}</span> : null}
        </button>
        <button type="button" onClick={onToggleDarkMode} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100" aria-label="Toggle dark mode">
          ◐
        </button>
        <button type="button" onClick={() => setSettingsOpen((open) => !open)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100" aria-label="Open settings menu" aria-expanded={settingsOpen}>
          ⚙
        </button>
      </div>

      {settingsOpen ? (
        <>
          <button type="button" className="fixed inset-0 z-[82] bg-black/30 md:hidden" aria-label="Close settings menu" onClick={() => setSettingsOpen(false)} />
          <div className="fixed inset-x-3 bottom-3 z-[83] max-h-[82vh] overflow-y-auto rounded-[30px] border border-slate-200/80 bg-white/96 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/96 md:absolute md:bottom-auto md:left-auto md:right-0 md:top-[calc(100%+12px)] md:w-[380px]">
            <TopCommandSettingsMenu
              currentRole={currentRole}
              onCurrentRoleChange={onCurrentRoleChange}
              appMode={appMode}
              onAppModeChange={onAppModeChange}
              currentRoleLabel={currentRoleLabel}
              onOpenFleet={() => {
                setSettingsOpen(false);
                onOpenFleet?.();
              }}
              onOpenHistory={() => {
                setSettingsOpen(false);
                onOpenHistory?.();
              }}
              onOpenShare={() => {
                setSettingsOpen(false);
                onOpenShare?.();
              }}
              onOpenSettings={() => {
                setSettingsOpen(false);
                onOpenSettings?.();
              }}
              onOpenLegal={() => setLegalOpen(true)}
              onClose={() => setSettingsOpen(false)}
            />
          </div>
        </>
      ) : null}

      {legalOpen ? (
        <div className="fixed inset-0 z-[95] flex items-end bg-black/45 p-3 md:items-center md:justify-center">
          <div className="w-full rounded-[28px] border border-slate-200/80 bg-white p-5 text-slate-900 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-slate-50 md:max-w-lg">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-cyan-200">Legal</p>
            <h2 className="mt-2 text-xl font-semibold">Contessa Core</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{APP_FOOTER_NOTICE}</p>
            <button type="button" onClick={() => setLegalOpen(false)} className="mt-5 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function TopCommandSettingsMenu({
  currentRole,
  onCurrentRoleChange,
  appMode,
  onAppModeChange,
  currentRoleLabel,
  onOpenFleet,
  onOpenHistory,
  onOpenShare,
  onOpenSettings,
  onOpenLegal,
  onClose,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-cyan-200">Command Settings</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Role, mode, fleet, and secondary tools.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
          Close
        </button>
      </div>

      <div className="grid gap-3">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Operating As</span>
          <select
            value={currentRole}
            onChange={(event) => onCurrentRoleChange?.(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
          >
            {DEMO_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Mode</span>
          <select
            value={appMode}
            onChange={(event) => onAppModeChange?.(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="view">View Mode</option>
            <option value="editor">Editor Mode</option>
          </select>
        </label>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-900/80">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Status</p>
          <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-50">{currentRoleLabel} · {appMode === "editor" ? "Editor Mode" : "View Mode"}</p>
        </div>
      </div>

      <div className="grid gap-2">
        <SettingsMenuButton onClick={onOpenFleet}>Fleet management</SettingsMenuButton>
        <SettingsMenuButton onClick={onOpenHistory}>History</SettingsMenuButton>
        <SettingsMenuButton onClick={onOpenShare}>Share</SettingsMenuButton>
        <SettingsMenuButton onClick={onOpenLegal}>Legal</SettingsMenuButton>
        <SettingsMenuButton onClick={onOpenSettings}>App settings</SettingsMenuButton>
      </div>
    </div>
  );
}

function SettingsMenuButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-2 text-left text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-300/30 dark:hover:bg-cyan-300/10">
      <span>{children}</span>
      <span aria-hidden="true">→</span>
    </button>
  );
}

function DesktopMissionInspector({
  selectedTask,
  selectedCrewProfile,
  routeSummary,
  stats,
  currency,
  expenseView,
  onOpenTask,
  onOpenCrew,
  onOpenRoute,
}) {
  const moduleTheme = getModuleTheme(moduleThemeKeyForView(expenseView));
  const context =
    expenseView === "crew-certificates"
      ? {
        label: "Crew Detail",
        title: selectedCrewProfile?.fullName || "Crew profile",
        meta: selectedCrewProfile?.rank || selectedCrewProfile?.department || "Crew",
        action: "Open crew",
        onAction: onOpenCrew,
      }
      : expenseView === "route"
        ? {
          label: "Route Detail",
          title: `${Math.round(routeSummary?.totalDistanceNm || 0)} nm passage`,
          meta: `${routeSummary?.estimatedHours ? routeSummary.estimatedHours.toFixed(1) : "0"} h estimate`,
          action: "Open route",
          onAction: onOpenRoute,
        }
        : {
          label: "Task Detail",
          title: selectedTask?.name || "Select a task",
          meta: selectedTask?.area || selectedTask?.assignee || "No item selected",
          action: "Open tasks",
          onAction: onOpenTask,
        };

  return (
    <aside className={`sticky top-5 hidden h-[calc(100vh-2.5rem)] min-w-0 overflow-hidden rounded-[32px] border bg-white/88 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:bg-slate-950/78 dark:shadow-[0_24px_70px_rgba(0,0,0,0.36)] xl:block ${moduleTheme.border}`}>
      <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${moduleTheme.accent}`}>Inspector</p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{context.title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{context.meta}</p>

      <div className="mt-5 grid gap-3">
        <InspectorMetric label="Pending spend" value={formatMoney(stats.totalExpenses || 0, currency)} />
        <InspectorMetric label="Approvals" value={stats.pendingApprovals || 0} />
        <InspectorMetric label="Crew" value={stats.crewProfiles || 0} />
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-900/80">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{context.label}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Details stay here so the main workspace remains calm, focused, and operational.</p>
        <button type="button" onClick={context.onAction} className={`mt-4 min-h-10 w-full rounded-2xl border px-4 py-2 text-sm font-semibold ${moduleTheme.chip}`}>
          {context.action}
        </button>
      </div>
    </aside>
  );
}

function InspectorMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-900/80">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-slate-950 dark:text-slate-50">{value}</p>
    </div>
  );
}

function MobileFocusedDashboard({
  vesselName,
  vesselStatus,
  vesselLocation,
  currentRoleLabel,
  appMode,
  isOffline,
  stats,
  currency,
  tasks = [],
  maintenanceItems = [],
  approvals = [],
  crewExpenses = [],
  crewProfiles = [],
  documents = [],
  routePlanning,
  routeSummary,
  routeAlerts = [],
  fleetVessels = [],
  activeVesselId,
  fleetMetricsByVessel = {},
  commandSearchView,
  openSection,
  onOpenSection,
  onOpenDetail,
  onOpenTaskModule,
  onOpenApprovals,
  onOpenCrew,
  onOpenRoute,
  onOpenDocuments,
  onOpenTools,
  onSwitchFleetVessel,
  onAddTask,
  onAddCrew,
  onOpenCrewList,
}) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeMaintenance = Array.isArray(maintenanceItems) ? maintenanceItems : [];
  const safeApprovals = Array.isArray(approvals) ? approvals : [];
  const safeCrewExpenses = Array.isArray(crewExpenses) ? crewExpenses : [];
  const safeCrew = Array.isArray(crewProfiles) ? crewProfiles : [];
  const safeDocuments = Array.isArray(documents) ? documents : [];
  const waypoints = Array.isArray(routePlanning?.waypoints) ? routePlanning.waypoints : [];
  const approvalItems = [...safeApprovals, ...safeCrewExpenses].slice(0, 3);
  const routeFrom = waypoints[0]?.name || routePlanning?.route?.from || "Departure";
  const routeTo = waypoints[waypoints.length - 1]?.name || routePlanning?.route?.to || "Destination";
  const currentVessel = fleetVessels.find((vessel) => vessel?.id === activeVesselId);
  const otherVessels = fleetVessels.filter((vessel) => vessel?.id !== activeVesselId);

  const openItem = (item, section) => {
    onOpenSection?.(section);
    onOpenDetail?.(item);
  };

  return (
    <div className="md:hidden">
      <div className="space-y-4 px-0 pb-3 pt-1">
        <section
          id="mobile-command-brief"
          className="w-full min-w-0 max-w-full overflow-visible rounded-[30px] border border-slate-200/80 bg-white/90 p-4 text-slate-950 shadow-[0_18px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-50"
        >
          <div className="mb-3 min-w-0">
            <p className="max-w-full truncate text-[11px] font-bold uppercase tracking-[0.1em] text-blue-700 dark:text-cyan-200">Today Brief</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">{stats.todayAttentionCount || 0} items need attention</h2>
          </div>
          <div className="hidden">
            <div className="min-w-0">
              <p className="max-w-full truncate text-[11px] font-bold uppercase tracking-[0.1em] text-blue-700 dark:text-cyan-200">Today</p>
              <h1 className="mt-1 max-w-full truncate text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{vesselName}</h1>
              <p className="mt-1 max-w-full truncate text-sm text-slate-600 dark:text-slate-300">
                {vesselStatus} · {vesselLocation}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-100">
              {isOffline ? "Offline" : "Live"}
            </span>
          </div>

          <div className="hidden">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
              {currentRoleLabel}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
              {appMode === "editor" ? "Editor" : "View"}
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-300/30 dark:bg-amber-300/15 dark:text-amber-100">
              {stats.todayAttentionCount || 0} need attention
            </span>
          </div>

          <div className="hidden">
            {commandSearchView}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <MobileMetric label="Urgent" value={stats.overdueTasks || 0} themeKey="alerts" />
            <MobileMetric label="Approvals" value={stats.pendingApprovals || 0} tone="gold" />
            <MobileMetric label="Crew" value={stats.crewProfiles || 0} themeKey="crew" />
            <MobileMetric label="Tasks" value={stats.totalObjectives || 0} themeKey="tasks" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => onOpenSection?.("tasks")} className="min-h-11 rounded-2xl border border-blue-300/70 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm dark:border-cyan-300/35 dark:bg-cyan-300/15 dark:text-cyan-100">
              Review
            </button>
            <button type="button" onClick={onAddTask} className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-100">
              Add task
            </button>
          </div>
        </section>

        <MobileSection
          id="today"
          themeKey="dashboard"
          title="Today"
          subtitle={`${stats.todayAttentionCount || 0} items need attention`}
          count={stats.todayAttentionCount || 0}
          open={openSection === "today"}
          onOpen={onOpenSection}
        >
          <div className="space-y-3">
            {safeTasks.slice(0, 3).map((task) => (
              <MobileTaskCard key={task.id} task={task} onOpen={() => openItem(taskToMobileDetail(task, currency), "tasks")} />
            ))}
            {!safeTasks.length ? <MobileEmptyState>No urgent tasks today.</MobileEmptyState> : null}
          </div>
        </MobileSection>

        <MobileSection
          id="tasks"
          themeKey="tasks"
          title="Tasks"
          subtitle={`${safeTasks.length} active work items`}
          count={safeTasks.length}
          open={openSection === "tasks"}
          onOpen={onOpenSection}
        >
          <div className="space-y-3">
            {safeTasks.slice(0, 3).map((task) => (
              <MobileTaskCard key={task.id} task={task} onOpen={() => openItem(taskToMobileDetail(task, currency), "tasks")} />
            ))}
            <button type="button" onClick={onOpenTaskModule} className="min-h-11 w-full rounded-2xl border border-blue-300/70 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 dark:border-cyan-300/35 dark:bg-cyan-300/15 dark:text-cyan-100">
              Open task board
            </button>
          </div>
        </MobileSection>

        <MobileSection
          id="approvals"
          themeKey="approvals"
          title="Approvals"
          subtitle={`${approvalItems.length} decisions visible`}
          count={stats.pendingApprovals || approvalItems.length}
          open={openSection === "approvals"}
          onOpen={onOpenSection}
        >
          <div className="space-y-3">
            {approvalItems.length ? approvalItems.map((item) => (
              <MobileApprovalCard key={item.id || item.title} item={item} currency={currency} onOpen={() => openItem(approvalToMobileDetail(item, currency), "approvals")} />
            )) : <MobileEmptyState>No approvals waiting.</MobileEmptyState>}
            <button type="button" onClick={onOpenApprovals} className="min-h-11 w-full rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 dark:border-amber-300/35 dark:bg-amber-300/15 dark:text-amber-100">
              Open approvals
            </button>
          </div>
        </MobileSection>

        <MobileSection
          id="crew"
          themeKey="crew"
          title="Crew"
          subtitle={`${safeCrew.length} onboard profiles`}
          count={safeCrew.length}
          open={openSection === "crew"}
          onOpen={onOpenSection}
        >
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={onAddCrew} className="min-h-11 rounded-2xl border border-blue-300/70 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 dark:border-cyan-300/35 dark:bg-cyan-300/15 dark:text-cyan-100">
                Add Crew
              </button>
              <button type="button" onClick={onOpenCrewList} className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100">
                Crew List
              </button>
            </div>
            {safeCrew.slice(0, 4).map((person) => (
              <MobileCrewCard key={person.id || person.fullName} person={person} onOpen={() => openItem(crewToMobileDetail(person), "crew")} />
            ))}
            {!safeCrew.length ? <MobileEmptyState>No crew profiles yet.</MobileEmptyState> : null}
            <button type="button" onClick={onOpenCrew} className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100">
              Open crew workspace
            </button>
          </div>
        </MobileSection>

        <MobileSection
          id="route"
          themeKey="route"
          title="Route"
          subtitle={`${routeFrom} to ${routeTo}`}
          count={routeAlerts.length}
          open={openSection === "route"}
          onOpen={onOpenSection}
        >
          <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-800/70">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-700 dark:text-cyan-200">Route preview</p>
            <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{routeFrom} → {routeTo}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <MobileMetric label="Distance" value={`${Math.round(routeSummary?.totalDistanceNm || 0)} nm`} themeKey="route" />
              <MobileMetric label="ETA" value={routeSummary?.estimatedHours ? `${routeSummary.estimatedHours.toFixed(1)} h` : "Review"} themeKey="route" />
            </div>
            <button type="button" onClick={onOpenRoute} className="mt-4 min-h-11 w-full rounded-2xl border border-blue-300/70 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 dark:border-cyan-300/35 dark:bg-cyan-300/15 dark:text-cyan-100">
              View route
            </button>
          </div>
        </MobileSection>

        <MobileSection
          id="fleet"
          themeKey="fleet"
          title="Fleet"
          subtitle={`${fleetVessels.length} vessel workspaces`}
          count={fleetVessels.length}
          open={openSection === "fleet"}
          onOpen={onOpenSection}
        >
          <div className="grid w-full min-w-0 gap-3">
            {[currentVessel, ...otherVessels].filter(Boolean).map((vessel) => (
              <MobileFleetCard
                key={vessel.id}
                vessel={vessel}
                current={vessel.id === activeVesselId}
                metrics={fleetMetricsByVessel[vessel.id] || {}}
                onOpen={() => onSwitchFleetVessel?.(vessel.id)}
              />
            ))}
          </div>
        </MobileSection>

        <MobileSection
          id="docs"
          themeKey="documents"
          title="Docs"
          subtitle={`${safeDocuments.length} vessel files`}
          count={safeDocuments.length}
          open={openSection === "docs"}
          onOpen={onOpenSection}
        >
          <div className="space-y-3">
            {safeDocuments.slice(0, 4).map((document) => (
              <MobileSimpleRow key={document.id || document.title} title={document.title || document.name || "Document"} meta={document.category || document.type || "Document"} />
            ))}
            {!safeDocuments.length ? <MobileEmptyState>No documents uploaded yet.</MobileEmptyState> : null}
            <button type="button" onClick={onOpenDocuments} className="min-h-11 w-full rounded-2xl border border-blue-300/70 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 dark:border-cyan-300/35 dark:bg-cyan-300/15 dark:text-cyan-100">
              Open documents
            </button>
          </div>
        </MobileSection>

        <MobileSection
          id="tools"
          themeKey="fleet"
          title="Tools"
          subtitle="History, legal, share, settings"
          open={openSection === "tools"}
          onOpen={onOpenSection}
        >
          <button type="button" onClick={onOpenTools} className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100">
            Open secondary tools
          </button>
        </MobileSection>
      </div>
    </div>
  );
}

function MobileMetric({ label, value, tone = "default", themeKey }) {
  const moduleTheme = getModuleTheme(themeKey || (tone === "gold" ? "approvals" : "documents"));
  const toneClass = tone === "gold" ? getModuleTheme("approvals").accent : moduleTheme.accent;

  return (
    <div className={`min-w-0 rounded-2xl border p-3 ${moduleTheme.bg} ${moduleTheme.border}`}>
      <p className={`max-w-full truncate whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.08em] ${toneClass}`}>{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">{value}</p>
    </div>
  );
}

function MobileTaskCard({ task, onOpen }) {
  return (
    <button type="button" onClick={onOpen} className="w-full min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm dark:border-white/10 dark:bg-slate-800/70">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-950 dark:text-slate-50">{task.name || "Untitled task"}</p>
          <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{task.assignee || "Unassigned"} · {task.dueDate || "No due date"}</p>
        </div>
        <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:border-rose-300/30 dark:bg-rose-400/15 dark:text-rose-200">
          {titleCase(task.priority || "Normal")}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{titleCase(task.status || "Pending")}</span>
        <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-100">Open</span>
      </div>
    </button>
  );
}

function MobileApprovalCard({ item, currency, onOpen }) {
  const amount = item.amount !== undefined && item.amount !== null ? formatMoney(item.amount, item.currency || currency) : "";
  return (
    <button type="button" onClick={onOpen} className="w-full min-w-0 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left shadow-sm dark:border-amber-300/25 dark:bg-amber-300/15">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-950 dark:text-slate-50">{item.displayName || item.title || item.supplier || "Approval"}</p>
          <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{item.taskName || item.requester || "Decision item"}</p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-300 bg-white/80 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:border-amber-300/30 dark:bg-slate-900/60 dark:text-amber-100">
          {amount}
        </span>
      </div>
    </button>
  );
}

function MobileCrewCard({ person, onOpen }) {
  return (
    <button type="button" onClick={onOpen} className="w-full min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm dark:border-white/10 dark:bg-slate-800/70">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-950 dark:text-slate-50">{person.fullName || person.name || "Unnamed crew"}</p>
          <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{person.rank || person.position || person.role || "Crew"} · {person.department || "General"}</p>
        </div>
        <span className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-100">Open</span>
      </div>
    </button>
  );
}

function MobileFleetCard({ vessel, current, metrics, onOpen }) {
  return (
    <div className={`w-full min-w-0 max-w-full overflow-hidden rounded-2xl border p-4 ${current ? "border-blue-300 bg-blue-50/60 dark:border-cyan-300/35 dark:bg-cyan-300/10" : "border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-800/70"}`}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-300">Vessel</p>
          <p className="mt-1 truncate text-lg font-semibold text-slate-950 dark:text-slate-50">{vessel.name}</p>
          <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{vessel.details?.status || "Operational"} · {vessel.details?.homePort || "Home port not set"}</p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          {current ? "Current" : "Available"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <MobileMetric label="Tasks" value={metrics.taskCount || 0} themeKey="tasks" />
        <MobileMetric label="Alerts" value={metrics.alertCount || 0} themeKey="alerts" />
      </div>
      {current ? (
        <button type="button" disabled className="mt-3 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400">
          Current Workspace
        </button>
      ) : (
        <button type="button" onClick={onOpen} className="mt-3 min-h-11 w-full rounded-2xl border border-blue-300/70 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 dark:border-cyan-300/35 dark:bg-cyan-300/15 dark:text-cyan-100">
          Open Vessel
        </button>
      )}
    </div>
  );
}

function MobileSimpleRow({ title, meta }) {
  return (
    <div className="w-full min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-slate-800/70">
      <p className="truncate text-base font-semibold text-slate-950 dark:text-slate-50">{title}</p>
      <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{meta}</p>
    </div>
  );
}

function MobileEmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300">
      {children}
    </div>
  );
}

function taskToMobileDetail(task, currency) {
  const amount = (task.quotes || []).reduce((sum, quote) => sum + Number(quote.amount || 0), 0);
  return {
    id: task.id,
    type: "Task",
    title: task.name || "Untitled task",
    subtitle: task.area || task.department || "Operations",
    status: titleCase(task.status || "pending"),
    priority: titleCase(task.priority || "normal"),
    assignedTo: task.assignee || "Unassigned",
    dueDate: task.dueDate || "Not set",
    amount: amount ? formatMoney(amount, task.quotes?.[0]?.currency || currency) : "",
    description: task.notes || "",
  };
}

function approvalToMobileDetail(item, currency) {
  return {
    id: item.id,
    type: "Approval",
    title: item.displayName || item.title || item.supplier || "Approval",
    subtitle: item.taskName || item.requester || "Decision item",
    status: titleCase(item.status || "requested"),
    priority: "Review",
    assignedTo: item.requester || "Captain",
    dueDate: "Awaiting decision",
    amount: item.amount !== undefined && item.amount !== null ? formatMoney(item.amount, item.currency || currency) : "",
    description: item.reason || item.notes || "",
  };
}

function crewToMobileDetail(person) {
  return {
    id: person.id,
    type: "Crew",
    title: person.fullName || person.name || "Unnamed crew",
    subtitle: person.department || "General",
    status: `${person.certificates?.length || 0} certificates`,
    priority: person.rank || person.position || person.role || "Crew",
    assignedTo: person.fullName || person.name || "Crew",
    dueDate: person.dateOfBirth || person.dob || "",
    description: person.notes || "",
  };
}







