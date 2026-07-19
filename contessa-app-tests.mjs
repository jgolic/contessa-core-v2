import assert from "node:assert/strict";
import test from "node:test";
import {
  APP_STATE_VERSION,
  archiveDeclinedTasks,
  buildAbsolutePublicAppUrl,
  buildMaintenanceAlerts,
  buildBoatExpenseSummaryItems,
  buildCertificateNotices,
  buildDashboardSnapshot,
  buildOperationalNotifications,
  buildPendingApprovalItems,
  calculateCrewReadinessPercent,
  clampMaintenanceDueDate,
  completeMaintenanceCycle,
  createEmptyAppState,
  createFleetVesselWorkspace,
  createFullStateExport,
  createNextTaskId,
  createPersistedAppState,
  deriveMoneyStatus,
  getCanonicalPublicAppUrlStatus,
  getPublicAppUrlConfig,
  getVesselMetrics,
  isPaidMoneyStatus,
  isLocalRuntimeLocation,
  migrateImportedAppStatePayload,
  normalizeImportedAppState,
  normalizeTask,
  resolvePublicAppUrlConfig,
} from "./src/contessa_app_data.mjs";
import {
  createEmptyCertificateDraft,
  extractCertificateDraft,
  getCertificateExpiryMeta,
  normalizeCertificateRecord,
} from "./src/contessa_certificate_extraction.mjs";
import {
  canAccessModule,
  canAccessCrewProfile,
  canAccessTask,
  getVisibleModulesForRole,
  inferTaskDepartment,
} from "./src/contessa_access.mjs";
import {
  buildDepthAwareRouteSegments,
  buildBathymetryContourGeoJson,
  buildBathymetryShadingGeoJson,
  buildRouteLegs,
  calculateRoutePassageSummary,
  checkDepthAlongRoute,
  createDefaultRouteOverlayToggles,
  findNearestDepthSample,
  getDepthVisualizationBand,
  getMinimumSafeDepth,
  getRouteMinimumAvailableDepthMeters,
  hasConnectedDepthLayer,
  haversineDistanceNm,
  normalizeRoutePlanningState,
} from "./src/lib/route_planning.mjs";
import {
  buildDepthSamplePoints,
  isLikelyUsWaters,
} from "./src/lib/public_bathymetry_sources.mjs";
import {
  getWorkspaceView,
  parseWorkspaceView,
  updateWorkspaceViewUrl,
} from "./src/lib/workspace_navigation.mjs";
import { getFleetVesselStatus } from "./src/lib/fleet_status.mjs";
import { buildFleetCommandModel } from "./src/lib/fleet_command.mjs";

test("empty app state defaults to editor mode", () => {
  const state = createEmptyAppState();

  assert.equal(state.appMode, "editor");
});

test("default fleet always includes Contessa and Octopussy", () => {
  const state = createEmptyAppState();

  assert.equal(state.vessels.some((vessel) => vessel.id === "contessa"), true);
  assert.equal(state.vessels.some((vessel) => vessel.id === "octopussy"), true);
});

test("fleet vessel status lamps prioritize critical, attention, and ready states", () => {
  assert.equal(getFleetVesselStatus({ alertCount: 3 }).level, "critical");
  assert.equal(getFleetVesselStatus({ approvalCount: 1 }).level, "attention");
  assert.equal(getFleetVesselStatus({ alertCount: 0, approvalCount: 0, certificateDue: 0 }).level, "ready");
});

test("workspace URLs preserve active modules and panel choices", () => {
  assert.deepEqual(parseWorkspaceView(""), {
    view: "fleet",
    moduleName: "fleet",
  });
  assert.deepEqual(parseWorkspaceView("?view=maintenance"), {
    view: "maintenance",
    moduleName: "tasks-maintenance",
    options: { panel: "maintenance" },
  });
  assert.equal(getWorkspaceView("crew-certificates", { panel: "certificates" }), "certificates");
  assert.equal(getWorkspaceView("fleet"), "fleet");
  assert.equal(
    updateWorkspaceViewUrl("https://contessa.test/vessels/contessa?view=bridge", "fleet"),
    "/vessels/contessa"
  );
  assert.equal(
    updateWorkspaceViewUrl("https://contessa.test/vessels/contessa?refresh=1", "route"),
    "/vessels/contessa?refresh=1&view=route"
  );
});

test("fleet command is visible only to vessel-wide leadership roles", () => {
  assert.equal(canAccessModule("owner", "fleet"), true);
  assert.equal(canAccessModule("manager", "fleet"), true);
  assert.equal(canAccessModule("captain", "fleet"), true);
  assert.equal(canAccessModule("deckhand", "fleet"), false);
});

test("fleet command combines vessel-tagged operational issues", () => {
  const model = buildFleetCommandModel([
    {
      id: "test-vessel",
      name: "Test Vessel",
      tasks: [{
        id: "T-OVERDUE",
        name: "Service anchor windlass",
        status: "pending",
        priority: "high",
        dueDate: "2000-01-01",
        area: "Foredeck",
        assignee: "Bosun",
        quotes: [],
      }],
      crewProfiles: [],
      crewExpenses: [],
      maintenanceItems: [],
      routePlanning: {
        riskNote: "Weather review required",
        waypoints: [
          { id: "WP-1", name: "Start", lng: 14.4, lat: 43.5 },
          { id: "WP-2", name: "Arrival", lng: 14.6, lat: 43.6 },
        ],
      },
    },
  ]);

  assert.equal(model.records.length, 1);
  assert.equal(model.totals.attention, 1);
  assert.equal(model.issues[0].vesselId, "test-vessel");
  assert.equal(model.issues[0].type, "task");
  assert.equal(model.issues[0].severity, "critical");
  assert.equal(model.issues.every((issue) => issue.vesselName === "Test Vessel"), true);
});

test("approval selector excludes received items and avoids quote task duplicates", () => {
  const approvals = buildPendingApprovalItems({
    tasks: [
      { id: "T-1", name: "Quoted task", approvalStatus: "pending" },
      { id: "T-2", name: "Standalone task", approvalStatus: "pending", priority: "urgent" },
    ],
    boatExpenses: [{ id: "Q-1", taskId: "T-1", supplier: "Yard", amount: 500, status: "requested" }],
    crewExpenses: [
      { id: "E-1", title: "Taxi", amount: 40, status: "requested" },
      { id: "E-2", title: "Received stores", amount: 60, status: "received" },
    ],
  });

  assert.deepEqual(approvals.map((item) => item.id), ["boat-T-1-Q-1", "crew-E-1", "task-T-2"]);
  assert.equal(approvals.reduce((sum, item) => sum + Number(item.amount || 0), 0), 540);
});

test("crew readiness weights certificate urgency instead of failing every due-soon record", () => {
  const readiness = calculateCrewReadinessPercent([
    { certificates: [{ expiryDate: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10) }] },
    { certificates: [{ expiryDate: new Date(Date.now() + 75 * 86400000).toISOString().slice(0, 10) }] },
    { certificates: [{ expiryDate: new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10) }] },
  ]);

  assert.equal(readiness, 82);
});

test("all fleet vessels use the canonical Manifest theme", () => {
  const state = createEmptyAppState();
  const contessa = state.vessels.find((vessel) => vessel.id === "contessa");
  const octopussy = state.vessels.find((vessel) => vessel.id === "octopussy");
  const aurora = createFleetVesselWorkspace({ id: "aurora", name: "Aurora" });

  assert.equal(contessa.theme.primary, "#E8442E");
  assert.equal(octopussy.theme.primary, "#E8442E");
  assert.equal(aurora.theme.primary, "#E8442E");
});

test("fleet metrics are calculated per vessel only", () => {
  const contessa = createEmptyAppState().vessels.find((vessel) => vessel.id === "contessa");
  const octopussy = createFleetVesselWorkspace({ id: "octopussy", name: "Octopussy" });

  const fleet = [contessa, octopussy];
  const contessaMetrics = getVesselMetrics("contessa", fleet);
  const octopussyMetrics = getVesselMetrics("octopussy", fleet);

  assert.notEqual(contessaMetrics.taskCount, octopussyMetrics.taskCount);
  assert.notEqual(contessaMetrics.routeDistanceNm, octopussyMetrics.routeDistanceNm);
  assert.notEqual(contessaMetrics.expenseCount, octopussyMetrics.expenseCount);
  assert.notEqual(contessaMetrics.approvalCount, octopussyMetrics.approvalCount);
});

test("imported vessel state adds missing required default vessels without removing custom ones", () => {
  const imported = createPersistedAppState({
    ...createEmptyAppState(),
    vessels: [
      createFleetVesselWorkspace({
        id: "aurora",
        name: "Aurora",
        workspace: {
          history: [],
          declinedTasks: [],
          documents: [],
          tasks: [],
          crewExpenses: [],
          crewProfiles: [],
          workers: [],
          maintenanceItems: [],
          routePlanning: {},
        },
      }),
    ],
    activeVesselId: "aurora",
  });

  const normalized = normalizeImportedAppState(imported, createEmptyAppState());

  assert.equal(normalized.vessels.some((vessel) => vessel.id === "contessa"), true);
  assert.equal(normalized.vessels.some((vessel) => vessel.id === "octopussy"), true);
  assert.equal(normalized.vessels.some((vessel) => vessel.id === "aurora"), true);
});

test("new fleet vessels can start with empty independent data", () => {
  const aurora = createFleetVesselWorkspace({
    id: "aurora",
    name: "Aurora",
    workspace: {
      history: [],
      declinedTasks: [],
      documents: [],
      tasks: [],
      crewExpenses: [],
      crewProfiles: [],
      workers: [],
      maintenanceItems: [],
      routePlanning: {},
    },
  });

  assert.equal(aurora.tasks.length, 0);
  assert.equal(aurora.crewExpenses.length, 0);
  assert.equal(aurora.crewProfiles.length, 0);
  assert.equal(aurora.documents.length, 0);
  assert.equal(aurora.routePlanning.waypoints.length, 0);
});

test("archives declined tasks after the hold window", () => {
  const now = Date.parse("2026-04-20T12:00:00.000Z");
  const tasks = [
    { id: "CT-001", name: "Ready", status: "declined", declinedAt: now - (11 * 60 * 1000) },
    { id: "CT-002", name: "Waiting", status: "declined", declinedAt: now - (5 * 60 * 1000) },
    { id: "CT-003", name: "Open", status: "pending" },
  ];

  const { archivedTasks, remainingTasks } = archiveDeclinedTasks(tasks, now);

  assert.equal(archivedTasks.length, 1);
  assert.equal(archivedTasks[0].id, "CT-001");
  assert.equal(remainingTasks.length, 2);
  assert.equal(remainingTasks.some((task) => task.id === "CT-001"), false);
});

test("completes a maintenance cycle and rolls the due date forward", () => {
  const item = {
    id: "MI-1",
    title: "Engine service",
    area: "Engine Room",
    frequencyMonths: 3,
    nextDueDate: "2026-04-20",
    notes: "Replace filters",
    extensionUsed: true,
    logs: [],
    removedLogs: [],
  };

  const completed = completeMaintenanceCycle(item, "2026-04-20", 1234);

  assert.equal(completed.nextDueDate, "2026-07-20");
  assert.equal(completed.extensionUsed, false);
  assert.equal(completed.logs.length, 1);
  assert.equal(completed.logs[0].previousDueDate, "2026-04-20");
  assert.equal(completed.logs[0].nextDueDate, "2026-07-20");
});

test("builds alerts only for due-soon enabled maintenance items", () => {
  const today = new Date();
  // Format in local time; toISOString() is UTC and rolls the date over in evening timezones,
  // which pushed "tomorrow" outside the <=1 day alert window.
  const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const later = new Date(today);
  later.setDate(later.getDate() + 5);

  const alerts = buildMaintenanceAlerts([
    { id: "MI-1", title: "Today", area: "Deck", nextDueDate: formatDate(today), alertEnabled: true },
    { id: "MI-2", title: "Tomorrow", area: "Bridge", nextDueDate: formatDate(tomorrow), alertEnabled: true },
    { id: "MI-3", title: "Later", area: "Galley", nextDueDate: formatDate(later), alertEnabled: true },
    { id: "MI-4", title: "Muted", area: "Crew", nextDueDate: formatDate(today), alertEnabled: false },
  ]);

  assert.deepEqual(alerts.map((item) => item.id), ["MI-1", "MI-2"]);
  assert.ok(alerts.every((item) => item.daysRemaining <= 1));
  assert.ok(alerts.every((item) => item.daysRemaining >= 0));
});

test("clamps maintenance postpones to the scheduled maximum", () => {
  const item = { frequencyMonths: 1 };
  assert.equal(clampMaintenanceDueDate(item, "2026-06-20", "2026-04-20"), "2026-05-20");
  assert.equal(clampMaintenanceDueDate(item, "2026-05-01", "2026-04-20"), "2026-05-01");
});

test("normalizes imported task and crew expense defaults", () => {
  const imported = normalizeImportedAppState(
    {
      state: {
        tasks: [{ id: "CT-004", name: "Imported", area: "Deck" }],
        crewExpenses: [{ id: "CE-1", title: "Taxi", amount: 20 }],
      },
    },
    createEmptyAppState()
  );

  assert.equal(imported.tasks.length, 1);
  assert.equal(imported.tasks[0].status, "pending");
  assert.equal(imported.crewExpenses[0].payment, "unpaid");
});

test("normalizes task department, comments, and attachments", () => {
  const normalized = normalizeTask({
    id: "CT-020",
    name: "Inspect bridge electronics",
    area: "Bridge",
    department: "Bridge",
    comments: [{ text: "Initial inspection scheduled.", by: "Captain" }],
    attachments: [{ name: "Checklist.pdf", type: "application/pdf", dataUrl: "data:application/pdf;base64,abc123" }],
  });

  assert.equal(normalized.department, "Bridge");
  assert.equal(normalized.comments.length, 1);
  assert.equal(normalized.comments[0].by, "Captain");
  assert.equal(normalized.attachments.length, 1);
  assert.equal(normalized.attachments[0].name, "Checklist.pdf");
});

test("normalizes quotes to preserve legacy summary inclusion and explicit opt-out", () => {
  const legacyQuoteTask = normalizeTask({
    id: "CT-021",
    name: "Review bridge supplier options",
    area: "Bridge",
    quotes: [{ id: "Q-1", supplier: "Legacy Quote", amount: 2500, currency: "USD" }],
  });
  const explicitQuoteTask = normalizeTask({
    id: "CT-022",
    name: "Review deck supplier options",
    area: "Aft Deck",
    quotes: [{ id: "Q-2", supplier: "Draft Quote", amount: 1200, currency: "USD", includeInSummary: false }],
  });

  assert.equal(legacyQuoteTask.quotes[0].includeInSummary, true);
  assert.equal(explicitQuoteTask.quotes[0].includeInSummary, false);
});

test("builds boat expense summary items from only checked quotations", () => {
  const tasks = [
    normalizeTask({
      id: "CT-030",
      name: "Tender service",
      area: "Tender Garage",
      quotes: [
        { id: "Q-1", supplier: "Vendor A", amount: 1800, currency: "USD", includeInSummary: true },
        { id: "Q-2", supplier: "Vendor B", amount: 2100, currency: "USD", includeInSummary: false },
        { id: "Q-3", supplier: "Vendor C", amount: 2400, currency: "USD", includeInSummary: true },
      ],
    }),
  ];

  const summaryItems = buildBoatExpenseSummaryItems(tasks);

  assert.equal(tasks[0].quotes.length, 3);
  assert.deepEqual(summaryItems.map((item) => item.id), ["Q-1", "Q-3"]);
  assert.ok(tasks[0].quotes.some((quote) => quote.id === "Q-2" && quote.includeInSummary === false));
});

test("normalizes route planning state from aliases and numeric strings", () => {
  const imported = normalizeImportedAppState(
    {
      state: {
        routePlan: {
          vessel: {
            vesselName: "Contessa",
            draft: "2.8",
            beam: "6.4",
            cruisingSpeedKnots: "18",
            fuelBurnPerHour: "210",
            fuelCapacity: "3200",
            fuelReservePercentage: "15",
          },
          safetyMargin: "1.2",
          depthLayer: {
            connected: true,
            provider: "Bathymetry API",
            samples: [
              { id: "DS-1", lng: "7.43", lat: "43.73", depthMeters: "6.4" },
            ],
          },
          waypoints: [
            { id: "RWP-1", name: "Departure", lng: "7.42", lat: "43.73" },
            { id: "RWP-2", name: "Arrival", lng: "7.91", lat: "43.56" },
          ],
        },
      },
    },
    createEmptyAppState()
  );

  assert.equal(imported.routePlanning.vesselProfile.vesselName, "Contessa");
  assert.equal(imported.routePlanning.vesselProfile.draft, 2.8);
  assert.equal(imported.routePlanning.safetyMargin, 1.2);
  assert.equal(imported.routePlanning.waypoints.length, 2);
  assert.equal(imported.routePlanning.depthLayer.connected, true);
  assert.equal(imported.routePlanning.depthLayer.samples.length, 1);
  assert.equal(typeof imported.routePlanning.waypoints[0].lng, "number");
});

test("calculates route passage summary in nautical miles, time, and fuel", () => {
  const distanceNm = haversineDistanceNm(
    { lat: 0, lng: 0 },
    { lat: 1, lng: 0 }
  );
  const summary = calculateRoutePassageSummary({
    waypoints: [
      { id: "RWP-1", name: "A", lat: 0, lng: 0 },
      { id: "RWP-2", name: "B", lat: 1, lng: 0 },
    ],
    vesselProfile: {
      vesselName: "Contessa",
      cruisingSpeedKnots: 20,
      fuelBurnPerHour: 100,
      fuelCapacity: 1000,
      fuelReservePercentage: 10,
    },
  });

  assert.ok(distanceNm > 59.9 && distanceNm < 60.2);
  assert.ok(summary.totalDistanceNm > 59.9 && summary.totalDistanceNm < 60.2);
  assert.ok(summary.estimatedHours > 2.9 && summary.estimatedHours < 3.1);
  assert.ok(summary.estimatedFuelBurn > 299 && summary.estimatedFuelBurn < 301);
  assert.ok(summary.remainingFuelAfterReserve > 599 && summary.remainingFuelAfterReserve < 601);
});

test("builds route legs with bearing and per-leg eta", () => {
  const legs = buildRouteLegs(
    [
      { id: "RWP-1", name: "A", lat: 0, lng: 0 },
      { id: "RWP-2", name: "B", lat: 1, lng: 0 },
      { id: "RWP-3", name: "C", lat: 1, lng: 1 },
    ],
    20
  );

  assert.equal(legs.length, 2);
  assert.ok(legs[0].bearingDegrees >= 0 && legs[0].bearingDegrees <= 360);
  assert.ok(legs[0].estimatedHours > 2.9 && legs[0].estimatedHours < 3.1);
  assert.ok(legs[1].cumulativeHours > legs[1].estimatedHours);
});

test("minimum safe depth adds draft and under-keel margin", () => {
  assert.equal(getMinimumSafeDepth(2.8, 1.2), 4);
});

test("depth warnings require a real depth connection when none is available", () => {
  const warnings = checkDepthAlongRoute(
    [
      { id: "RWP-1", name: "A", lat: 43.73, lng: 7.42 },
      { id: "RWP-2", name: "B", lat: 43.56, lng: 7.91 },
    ],
    2.8,
    1.2
  );

  assert.equal(warnings.length >= 1, true);
  assert.equal(warnings[0].severity, "warning");
  assert.equal(warnings[0].message, "Depth layer requires nautical chart or bathymetry data connection.");
});

test("depth helpers report nearest sample and unsafe route when data is connected", () => {
  const depthLayer = normalizeRoutePlanningState({
    depthLayer: {
      connected: true,
      provider: "Bathymetry API",
      samples: [
        { id: "DS-1", lng: 7.42, lat: 43.73, depthMeters: 3.6 },
        { id: "DS-2", lng: 7.91, lat: 43.56, depthMeters: 6.8 },
      ],
    },
  }).depthLayer;

  const nearest = findNearestDepthSample({ lng: 7.4205, lat: 43.7302 }, depthLayer);
  const minimumDepth = getRouteMinimumAvailableDepthMeters(
    [
      { id: "RWP-1", name: "A", lat: 43.73, lng: 7.42 },
      { id: "RWP-2", name: "B", lat: 43.56, lng: 7.91 },
    ],
    depthLayer
  );
  const warnings = checkDepthAlongRoute(
    [
      { id: "RWP-1", name: "A", lat: 43.73, lng: 7.42 },
      { id: "RWP-2", name: "B", lat: 43.56, lng: 7.91 },
    ],
    2.8,
    1.2,
    depthLayer
  );

  assert.equal(hasConnectedDepthLayer(depthLayer), true);
  assert.ok(nearest);
  assert.equal(nearest.depthMeters, 3.6);
  assert.equal(minimumDepth, 3.6);
  assert.equal(warnings[0].severity, "warning");
  assert.match(warnings[0].message, /Leg 1 crosses water below minimum safe depth/);
});

test("depth-aware route segments color only affected route sections", () => {
  const depthLayer = normalizeRoutePlanningState({
    depthLayer: {
      connected: true,
      provider: "Bathymetry API",
      samples: [
        { id: "DS-1", lng: 0, lat: 0, depthMeters: 6.5 },
        { id: "DS-2", lng: 0.25, lat: 0, depthMeters: 5.1 },
        { id: "DS-3", lng: 0.5, lat: 0, depthMeters: 3.2 },
        { id: "DS-4", lng: 0.75, lat: 0, depthMeters: 5.0 },
        { id: "DS-5", lng: 1, lat: 0, depthMeters: 6.4 },
      ],
    },
  }).depthLayer;

  const segmented = buildDepthAwareRouteSegments(
    [
      { id: "RWP-1", name: "A", lng: 0, lat: 0 },
      { id: "RWP-2", name: "B", lng: 1, lat: 0 },
    ],
    depthLayer,
    4
  );

  const statuses = segmented.geoJson.features.map((feature) => feature.properties.routeStatus);
  assert.ok(statuses.includes("safe"));
  assert.ok(statuses.includes("caution"));
  assert.ok(statuses.includes("unsafe"));
  assert.equal(segmented.legSummaries[0].status, "unsafe");
});

test("identifies likely US waters by route bounds", () => {
  assert.equal(
    isLikelyUsWaters([
      { lng: -80.12, lat: 25.77 },
      { lng: -79.95, lat: 26.14 },
    ]),
    true
  );

  assert.equal(
    isLikelyUsWaters([
      { lng: 7.42, lat: 43.73 },
      { lng: 6.63, lat: 43.27 },
    ]),
    false
  );
});

test("builds ordered public depth sample points across route legs", () => {
  const samples = buildDepthSamplePoints([
    { id: "RWP-1", name: "A", lng: 0, lat: 0 },
    { id: "RWP-2", name: "B", lng: 0.5, lat: 0 },
    { id: "RWP-3", name: "C", lng: 1, lat: 0 },
  ]);

  assert.ok(samples.length > 10);
  assert.equal(samples[0].legIndex, 1);
  assert.equal(samples[samples.length - 1].legIndex, 2);
  assert.equal(samples[0].lng, 0);
  assert.equal(samples[samples.length - 1].lng, 1);
});

test("depth visualization distinguishes deep water from normal safe water", () => {
  assert.equal(getDepthVisualizationBand(3.5, 4), "unsafe");
  assert.equal(getDepthVisualizationBand(4.4, 4), "caution");
  assert.equal(getDepthVisualizationBand(6.5, 4), "safe");
  assert.equal(getDepthVisualizationBand(10.5, 4), "deep");
});

test("default route overlay toggles include depth shading support", () => {
  const toggles = createDefaultRouteOverlayToggles();

  assert.equal(toggles.depth, false);
  assert.equal(toggles.depthShading, true);
  assert.equal(toggles.depthContours, true);
  assert.equal(toggles.route, true);
  assert.equal(toggles.waypoints, true);
  assert.equal(toggles.legend, true);
});

test("bathymetry shading builds visible corridor polygons with demo fallback", () => {
  const shading = buildBathymetryShadingGeoJson(
    [
      { id: "RWP-1", name: "A", lng: 0, lat: 0 },
      { id: "RWP-2", name: "B", lng: 1, lat: 0 },
    ],
    {},
    4,
    true
  );

  assert.equal(shading.isDemo, true);
  assert.ok(shading.geoJson.features.length > 0);
  assert.equal(shading.geoJson.features[0].geometry.type, "Polygon");
});

test("bathymetry contours build labeled line and point features", () => {
  const contours = buildBathymetryContourGeoJson(
    [
      { id: "RWP-1", name: "A", lng: 0, lat: 0 },
      { id: "RWP-2", name: "B", lng: 1, lat: 0 },
    ],
    {},
    true
  );

  assert.equal(contours.isDemo, true);
  assert.ok(contours.geoJson.features.some((feature) => feature.geometry.type === "LineString"));
  assert.ok(contours.geoJson.features.some((feature) => feature.geometry.type === "Point"));
});

test("derives new money statuses from legacy approval and payment fields", () => {
  assert.equal(deriveMoneyStatus({ approval: "pending", payment: "unpaid" }), "requested");
  assert.equal(deriveMoneyStatus({ approval: "approved", payment: "unpaid" }), "approved");
  assert.equal(deriveMoneyStatus({ approval: "rejected", payment: "unpaid" }), "declined");
  assert.equal(deriveMoneyStatus({ payment: "paid" }), "paid");
  assert.equal(isPaidMoneyStatus("paid"), true);
  assert.equal(isPaidMoneyStatus("approved"), false);
});

test("creates the next task id from the highest numeric suffix", () => {
  assert.equal(createNextTaskId([{ id: "CT-001" }, { id: "CT-009" }]), "CT-010");
  assert.equal(createNextTaskId([]), "CT-001");
});

test("round-trips exported state through full JSON import", () => {
  const sourceState = createPersistedAppState({
    darkMode: true,
    currency: "EUR",
    actorName: "Tester",
    history: [{ id: "H-1", at: "2026-04-20T12:00:00.000Z", by: "Tester", section: "History", action: "Seeded", detail: "Created fixture." }],
    declinedTasks: [{ id: "CT-099", name: "Archived task", area: "History", status: "declined", declinedAt: "2026-04-20T10:00:00.000Z" }],
    tasks: [
      {
        id: "CT-001",
        name: "Inspect teak",
        area: "Aft Deck",
        status: "pending",
        priority: "high",
        assignee: "Chief Mate",
        dueDate: "2026-04-22",
        notes: "Check seams and fasteners.",
        quotes: [{ id: "Q-1", supplier: "Deck Works", amount: 1250, currency: "USD", approval: "pending", payment: "unpaid", includeInSummary: false }],
      },
    ],
    crewExpenses: [{ id: "CE-1", title: "Taxi", amount: 48, currency: "USD", payment: "paid" }],
    maintenanceItems: [{ id: "MI-1", title: "Generator service", area: "Engine Room", frequencyMonths: 3, nextDueDate: "2026-04-21", notes: "Oil and filters", alertEnabled: true, extensionUsed: false }],
    routePlanning: normalizeRoutePlanningState({
      vesselProfile: {
        vesselName: "Contessa",
        draft: 2.8,
        beam: 6.4,
        cruisingSpeedKnots: 18,
        fuelBurnPerHour: 210,
        fuelCapacity: 3200,
        fuelReservePercentage: 15,
      },
      safetyMargin: 1.1,
      depthLayer: {
        connected: false,
        provider: "",
        samples: [],
      },
      waypoints: [
        { id: "RWP-1", name: "Monaco", lng: 7.4246, lat: 43.7384 },
        { id: "RWP-2", name: "St Tropez", lng: 6.639, lat: 43.2682 },
      ],
    }),
  });

  const exported = JSON.parse(createFullStateExport(sourceState));
  const imported = normalizeImportedAppState(exported, createEmptyAppState());

  assert.equal(exported.app, "M/Y Contessa");
  assert.equal(exported.version, APP_STATE_VERSION);
  assert.deepEqual(createPersistedAppState(imported), sourceState);
  assert.equal(imported.tasks[0].quotes[0].includeInSummary, false);
  assert.equal(imported.routePlanning.waypoints.length, 2);
});

test("reset behavior keeps chosen operator preferences while clearing data", () => {
  const resetState = createEmptyAppState({ darkMode: true, currency: "GBP", actorName: "Captain" });
  const baselineState = createEmptyAppState();

  assert.equal(resetState.darkMode, true);
  assert.equal(resetState.currency, "GBP");
  assert.equal(resetState.actorName, "Captain");
  assert.deepEqual(resetState.tasks, baselineState.tasks);
  assert.deepEqual(resetState.declinedTasks, []);
  assert.deepEqual(resetState.crewExpenses, baselineState.crewExpenses);
  assert.deepEqual(resetState.maintenanceItems, baselineState.maintenanceItems);
  assert.deepEqual(resetState.history, baselineState.history);
});

test("migrates raw legacy payloads to the current wrapped version", () => {
  const migrated = migrateImportedAppStatePayload({
    tasks: [{ id: "CT-200", name: "Legacy", area: "Bridge" }],
  });

  assert.equal(migrated.version, APP_STATE_VERSION);
  assert.equal(migrated.state.tasks[0].id, "CT-200");
});

test("migrates version 1 alias fields to the current schema", () => {
  const migrated = migrateImportedAppStatePayload({
    app: "M/Y Contessa",
    version: 1,
    state: {
      actor: "Captain",
      declined: [{ id: "CT-400", name: "Declined", area: "Bridge", status: "declined" }],
      maintenance: [{ id: "MI-8", title: "Pump service", area: "Engine Room", nextDueDate: "2026-04-20" }],
    },
  });

  assert.equal(migrated.version, APP_STATE_VERSION);
  assert.equal(migrated.state.actorName, "Captain");
  assert.equal(migrated.state.declinedTasks[0].id, "CT-400");
  assert.equal(migrated.state.maintenanceItems[0].id, "MI-8");
});

test("migrates version 2 preference and history aliases to version 3", () => {
  const migrated = migrateImportedAppStatePayload({
    app: "M/Y Contessa",
    version: 2,
    state: {
      appPreferences: { darkMode: true, summaryCurrency: "AED" },
      activityLog: [{ id: "H-22", action: "Imported" }],
    },
  });

  assert.equal(migrated.version, APP_STATE_VERSION);
  assert.equal(migrated.state.darkMode, true);
  assert.equal(migrated.state.currency, "AED");
  assert.equal(migrated.state.history[0].id, "H-22");
});

test("tolerates future-version imports while normalizing the shape", () => {
  const imported = normalizeImportedAppState(
    {
      app: "M/Y Contessa",
      version: APP_STATE_VERSION + 1,
      state: {
        tasks: [{ id: "CT-300", name: "Future", area: "Deck" }],
      },
    },
    createEmptyAppState()
  );

  assert.equal(imported.tasks[0].id, "CT-300");
});

test("accepts a realistic public app URL for sharing", () => {
  const config = getPublicAppUrlConfig("https://app.contessa-ops.com/app");

  assert.equal(config.isValid, true);
  assert.equal(config.url, "https://app.contessa-ops.com/app");
});

test("builds absolute public app URLs from NEXT_PUBLIC_APP_URL", () => {
  const config = buildAbsolutePublicAppUrl("/dashboard", "https://app.contessa-ops.com");

  assert.equal(config.isValid, true);
  assert.equal(config.url, "https://app.contessa-ops.com/dashboard");
});

test("rejects missing or localhost share URLs", () => {
  const missing = getPublicAppUrlConfig("");
  const localhost = getPublicAppUrlConfig("http://localhost:3000");
  const placeholder = getPublicAppUrlConfig("https://contessa.example.com");
  const filePath = getPublicAppUrlConfig("file:///Users/test/contessa/index.html");
  const windowsPath = getPublicAppUrlConfig("C:\\Users\\test\\contessa\\index.html");

  assert.equal(missing.isValid, false);
  assert.equal(missing.reason, "missing");
  assert.equal(localhost.isValid, false);
  assert.equal(localhost.reason, "invalid");
  assert.equal(placeholder.isValid, false);
  assert.equal(placeholder.reason, "invalid");
  assert.equal(filePath.isValid, false);
  assert.equal(filePath.reason, "invalid");
  assert.equal(windowsPath.isValid, false);
  assert.equal(windowsPath.reason, "invalid");
});

test("resolves a saved override when env is missing", () => {
  const config = resolvePublicAppUrlConfig({
    envValue: "",
    overrideValue: "https://app.contessa-ops.com/app",
  });

  assert.equal(config.isValid, true);
  assert.equal(config.source, "override");
  assert.equal(config.url, "https://app.contessa-ops.com/app");
});

test("falls back to the current public page URL when env is missing", () => {
  const config = resolvePublicAppUrlConfig({
    envValue: "",
    overrideValue: "",
    locationLike: { href: "https://app.contessa-ops.com/dashboard", protocol: "https:", hostname: "app.contessa-ops.com" },
  });

  assert.equal(config.isValid, true);
  assert.equal(config.source, "runtime");
  assert.equal(config.url, "https://app.contessa-ops.com/dashboard");
});

test("falls back to the current browser origin when env is missing in local development", () => {
  const config = getCanonicalPublicAppUrlStatus("", {
    locationLike: { href: "http://127.0.0.1:4173", origin: "http://127.0.0.1:4173", protocol: "http:", hostname: "127.0.0.1" },
  });

  assert.equal(config.isValid, true);
  assert.equal(config.source, "runtime-origin-fallback");
  assert.equal(config.url, "http://127.0.0.1:4173/");
  assert.equal(config.reason, "development");
});

test("detects local runtime locations without using them as share URLs", () => {
  assert.equal(isLocalRuntimeLocation({ protocol: "file:", hostname: "" }), true);
  assert.equal(isLocalRuntimeLocation({ protocol: "http:", hostname: "localhost" }), true);
  assert.equal(isLocalRuntimeLocation({ protocol: "https:", hostname: "app.contessa-ops.com" }), false);
});

test("role access helpers expose the correct module visibility", () => {
  assert.equal(canAccessModule("owner", "settings"), true);
  assert.equal(canAccessModule("captain", "route"), true);
  assert.equal(canAccessModule("first_mate", "route"), true);
  assert.equal(canAccessModule("engineer", "route"), false);
  assert.equal(canAccessModule("deckhand", "expenses"), false);
  assert.deepEqual(getVisibleModulesForRole("chief_engineer").map((module) => module.key), ["today", "dashboard", "tasks", "expenses", "maintenance", "notifications"]);
});

test("task access helpers respect department and assignee scope", () => {
  const engineeringTask = { area: "Engine Room", assignee: "Chief Engineer" };
  const deckTask = { area: "Bow", assignee: "Deckhand" };

  assert.equal(inferTaskDepartment(engineeringTask), "engineering");
  assert.equal(canAccessTask("chief_engineer", engineeringTask, "Chief Engineer"), true);
  assert.equal(canAccessTask("chief_engineer", deckTask, "Chief Engineer"), false);
  assert.equal(canAccessTask("deckhand", deckTask, "Deckhand"), true);
  assert.equal(canAccessTask("deckhand", engineeringTask, "Deckhand"), false);
});

test("certificate alerts surface items inside the configured alert windows", () => {
  const today = new Date();
  const formatDate = (date) => date.toISOString().slice(0, 10);
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 10);
  const later = new Date(today);
  later.setDate(later.getDate() + 120);

  const alerts = buildCertificateNotices([
    {
      id: "CRW-1",
      fullName: "Chief Mate",
      rank: "Chief Mate",
      department: "Deck",
      certificates: [
        { id: "CERT-1", name: "STCW", expiryDate: formatDate(soon) },
        { id: "CERT-2", name: "Medical", expiryDate: formatDate(later) },
      ],
    },
  ]);

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].crewName, "Chief Mate");
  assert.equal(alerts[0].name, "STCW");
});

test("certificate normalization derives expiry status and manual review flags", () => {
  const normalized = normalizeCertificateRecord({
    name: "STCW",
    expiryDate: "2099-04-21",
    attachments: [{ id: "ATT-1", name: "stcw.pdf", type: "application/pdf", dataUrl: "data:application/pdf;base64,JVBERi0xLjQ=" }],
    confidenceScore: 0.85,
  });

  assert.equal(normalized.status, "valid");
  assert.equal(normalized.needsManualReview, false);
  assert.equal(normalized.daysUntilExpiration > 0, true);
});

test("certificate extraction flags missing expiry for manual review", async () => {
  const extracted = await extractCertificateDraft({
    attachments: [
      {
        id: "ATT-1",
        name: "medical-certificate.png",
        type: "image/png",
        dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ",
      },
    ],
  });

  assert.equal(extracted.needsManualReview, true);
  assert.equal(extracted.expiryDate, "");
  assert.ok(extracted.reviewReasons.some((reason) => reason.includes("Manual review")));
});

test("certificate extraction prefills review fields without auto-saving", async () => {
  const sourceText = [
    "Certificate: STCW Basic Training",
    "Holder: Jane Crew",
    "Certificate Number: STCW-7788",
    "Issue Date: 2026-01-15",
    "Expiry Date: 2027-01-15",
    "Issuing Authority: MCA",
  ].join("\n");
  const extracted = await extractCertificateDraft({
    attachments: [
      {
        id: "ATT-2",
        name: "stcw.txt",
        type: "text/plain",
        dataUrl: `data:text/plain;base64,${Buffer.from(sourceText).toString("base64")}`,
      },
    ],
  });

  assert.equal(extracted.name, "STCW");
  assert.equal(extracted.holderName, "Jane Crew");
  assert.equal(Boolean(extracted.certificateNumber), true);
  assert.equal(extracted.issueDate, "2026-01-15");
  assert.equal(extracted.expiryDate, "2027-01-15");
  assert.equal(extracted.issuingAuthority, "MCA");
  assert.equal(extracted.extractionReviewed, false);
  assert.equal(typeof extracted.confidenceScore, "number");
});

test("certificate expiry meta marks urgent and expired correctly", () => {
  const urgent = getCertificateExpiryMeta("2026-05-01");
  const expired = getCertificateExpiryMeta("2020-01-01");

  assert.equal(["urgent", "expiring soon", "valid", "expired", "review"].includes(urgent.status), true);
  assert.equal(expired.status, "expired");
});

test("crew profile access respects role scope and own-profile access", () => {
  const engineerProfile = { fullName: "Chief Engineer", department: "Engineering" };
  const stewProfile = { fullName: "Chief Stewardess", department: "Interior" };

  assert.equal(canAccessCrewProfile("chief_engineer", engineerProfile, "Different User"), false);
  assert.equal(canAccessCrewProfile("chief_engineer", engineerProfile, "Chief Engineer"), true);
  assert.equal(canAccessCrewProfile("chief_engineer", stewProfile, "Chief Engineer"), false);
  assert.equal(canAccessCrewProfile("stewardess", stewProfile, "Chief Stewardess"), true);
  assert.equal(canAccessCrewProfile("captain", stewProfile, "Captain"), true);
});

test("dashboard snapshot surfaces urgent, overdue, and approval totals", () => {
  const snapshot = buildDashboardSnapshot({
    tasks: [
      { id: "CT-1", name: "Urgent", status: "pending", priority: "urgent", dueDate: "2099-04-20" },
      { id: "CT-2", name: "Overdue", status: "ongoing", priority: "medium", dueDate: "2026-04-19" },
    ],
    boatExpenses: [{ id: "Q-1", status: "requested" }],
    crewExpenses: [{ id: "CE-1", status: "approved" }],
    maintenanceAlerts: [{ id: "MI-1" }],
    certificateNotices: [{ id: "CERT-1" }],
    history: [{ id: "H-1", at: "2026-04-20T12:00:00.000Z", action: "Updated", detail: "Something changed", section: "History" }],
  });

  assert.equal(snapshot.urgentTasks.length, 1);
  assert.equal(snapshot.overdueTasks.length, 1);
  assert.equal(snapshot.pendingApprovals.length, 1);
  assert.equal(snapshot.unpaidCrew.length, 1);
  assert.equal(snapshot.recentActivity.length, 1);
});

test("operational notifications prioritize critical items first", () => {
  const notifications = buildOperationalNotifications({
    tasks: [{ id: "CT-1", name: "Overdue Task", area: "Bridge", status: "pending", dueDate: "2026-04-19" }],
    maintenanceAlerts: [{ id: "MI-1", title: "Generator", area: "Engine Room", daysRemaining: -1 }],
    certificateNotices: [{ id: "CERT-1", crewId: "CRW-1", crewName: "Captain", name: "Medical", daysRemaining: 20 }],
  });

  assert.equal(notifications[0].level, "critical");
  assert.ok(notifications.some((item) => item.section === "certificates"));
});

test("operational notifications keep boat and crew expense routing separate", () => {
  const notifications = buildOperationalNotifications({
    boatExpenses: [{ id: "Q-1", taskId: "CT-9", taskName: "Watermaker service", status: "approved", supplier: "Marine Systems" }],
    crewExpenses: [{ id: "CE-1", title: "Airport transfer", status: "requested" }],
  });

  const boatNotification = notifications.find((item) => item.id === "boat-expense-CT-9-Q-1");
  const crewNotification = notifications.find((item) => item.id === "crew-expense-CE-1");

  assert.equal(boatNotification.bucket, "boat");
  assert.equal(boatNotification.taskId, "CT-9");
  assert.equal(crewNotification.bucket, "crew");
});
