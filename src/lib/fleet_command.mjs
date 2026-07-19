import {
  buildBoatExpenseSummaryItems,
  buildCertificateNotices,
  buildTodayOperationsSnapshot,
  calculateConfidenceScore,
  calculateCrewReadinessPercent,
  daysUntil,
  normalizeFleetVessel,
} from "../contessa_app_data.mjs";
import {
  calculateRoutePassageSummary,
  checkDepthAlongRoute,
  hasConnectedDepthLayer,
  normalizeRoutePlanningState,
} from "./route_planning.mjs";

const CLOSED_TASK_STATUSES = new Set(["completed", "approved", "declined"]);
const CRITICAL_PRIORITIES = new Set(["critical", "urgent", "high"]);
const ROUTE_REVIEW_PATTERN = /\b(critical|unsafe|warning|review|required|blocked)\b/i;

function cleanText(value, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function vesselDescriptor(vessel = {}) {
  const details = vessel.details || {};
  const profile = vessel.vesselProfile || {};
  const length = details.lengthMeters || profile.lengthMeters || details.lengthFeet || profile.lengthFeet;
  const lengthUnit = details.lengthMeters || profile.lengthMeters ? "m" : length ? "ft" : "";
  const type = details.vesselType || details.type || profile.vesselType || profile.type || "Vessel";
  const port = details.homePort || profile.homePort || "Port not set";
  return [length ? `${length}${lengthUnit}` : "", type, port].filter(Boolean).join(" / ");
}

function ageInDays(value, now = new Date()) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const elapsed = now.getTime() - parsed.getTime();
  return Math.max(0, Math.floor(elapsed / 86400000));
}

function buildRouteIssues(vessel, routePlanning) {
  const route = normalizeRoutePlanningState(routePlanning || {});
  if (route.waypoints.length < 2) return [];

  const summary = calculateRoutePassageSummary({
    waypoints: route.waypoints,
    vesselProfile: route.vesselProfile,
    safetyMargin: route.safetyMargin,
  });
  const issues = [];
  const routeStatus = cleanText(route.status, "Planning");
  const routeRisk = cleanText(route.riskNote);

  if (summary.remainingFuelAfterReserve < 0) {
    issues.push({
      id: `${vessel.id}-route-fuel`,
      type: "route",
      severity: "critical",
      title: "Route exceeds protected fuel reserve",
      detail: `${route.waypoints.length} waypoints require a fuel review before departure.`,
      ageLabel: "Review now",
      moduleName: "route",
    });
  }

  if (routeRisk || ROUTE_REVIEW_PATTERN.test(routeStatus)) {
    issues.push({
      id: `${vessel.id}-route-review`,
      type: "route",
      severity: ROUTE_REVIEW_PATTERN.test(`${routeStatus} ${routeRisk}`) ? "attention" : "neutral",
      title: routeRisk || `Route status: ${routeStatus}`,
      detail: `${summary.totalDistanceNm.toFixed(1)} NM passage plan requires bridge review.`,
      ageLabel: "Route review",
      moduleName: "route",
    });
  }

  if (hasConnectedDepthLayer(route.depthLayer)) {
    const depthWarnings = checkDepthAlongRoute(
      route.waypoints,
      route.vesselProfile.draft,
      route.safetyMargin,
      route.depthLayer
    ).filter((warning) => warning.severity === "warning");

    depthWarnings.slice(0, 2).forEach((warning, index) => {
      issues.push({
        id: `${vessel.id}-route-depth-${warning.id || index}`,
        type: "route",
        severity: /unsafe|below minimum/i.test(warning.message) ? "critical" : "attention",
        title: "Route depth warning",
        detail: warning.message,
        ageLabel: "Depth review",
        moduleName: "route",
      });
    });
  }

  return issues;
}

function buildVesselIssues(vessel, snapshot, now) {
  const issues = [];

  snapshot.overdueTasks.forEach((task) => {
    const overdueDays = Math.abs(Number(task.daysRemaining || daysUntil(task.dueDate) || 0));
    issues.push({
      id: `${vessel.id}-task-${task.id}`,
      vesselId: vessel.id,
      vesselName: vessel.name,
      type: "task",
      severity: CRITICAL_PRIORITIES.has(String(task.priority || "").toLowerCase()) ? "critical" : "attention",
      title: cleanText(task.name || task.title, "Overdue task"),
      detail: [task.area || task.department, task.assignee || task.assignedTo || "Unassigned"].filter(Boolean).join(" / "),
      ageLabel: `${overdueDays}d overdue`,
      moduleName: "tasks-maintenance",
      options: { panel: "tasks" },
    });
  });

  snapshot.pendingApprovals.forEach((approval) => {
    const waitingDays = ageInDays(approval.requestedAt, now);
    issues.push({
      id: `${vessel.id}-approval-${approval.id}`,
      vesselId: vessel.id,
      vesselName: vessel.name,
      type: "approval",
      severity: CRITICAL_PRIORITIES.has(String(approval.priority || "").toLowerCase()) ? "critical" : "attention",
      title: cleanText(approval.title, "Approval waiting"),
      detail: cleanText(approval.requestedBy, "Operations"),
      ageLabel: waitingDays === null ? "Waiting" : `${waitingDays}d waiting`,
      amount: approval.amount,
      currency: approval.currency,
      moduleName: "expenses-approvals",
      options: { bucket: approval.sourceType === "crew" ? "crew" : "boat" },
    });
  });

  snapshot.expiringCertificates.forEach((certificate) => {
    const daysRemaining = Number(certificate.daysRemaining);
    const isExpired = daysRemaining < 0;
    issues.push({
      id: `${vessel.id}-certificate-${certificate.crewId || "crew"}-${certificate.id || certificate.certificateNumber || certificate.name}`,
      vesselId: vessel.id,
      vesselName: vessel.name,
      type: "certificate",
      severity: isExpired || daysRemaining <= 7 ? "critical" : "attention",
      title: cleanText(certificate.name || certificate.certificateName, "Certificate expiry"),
      detail: cleanText(certificate.crewName || certificate.holderName, "Crew certificate"),
      ageLabel: isExpired ? `${Math.abs(daysRemaining)}d expired` : `${daysRemaining}d left`,
      moduleName: "crew-certificates",
      options: { panel: "certificates" },
    });
  });

  const routeIssues = buildRouteIssues(vessel, vessel.routePlanning).map((issue) => ({
    ...issue,
    vesselId: vessel.id,
    vesselName: vessel.name,
  }));

  return [...issues, ...routeIssues];
}

function buildFleetRecord(rawVessel, metrics = {}, now = new Date()) {
  const vessel = normalizeFleetVessel(rawVessel, rawVessel?.id);
  const tasks = Array.isArray(vessel.tasks) ? vessel.tasks : [];
  const openTasks = tasks.filter((task) => !CLOSED_TASK_STATUSES.has(String(task?.status || "").toLowerCase()));
  const crewProfiles = Array.isArray(vessel.crewProfiles) ? vessel.crewProfiles : [];
  const crewExpenses = Array.isArray(vessel.crewExpenses) ? vessel.crewExpenses : [];
  const boatExpenses = buildBoatExpenseSummaryItems(tasks);
  const certificates = buildCertificateNotices(crewProfiles);
  const snapshot = buildTodayOperationsSnapshot({
    tasks: tasks.filter((task) => String(task?.status || "").toLowerCase() !== "declined"),
    maintenanceItems: vessel.maintenanceItems || [],
    certificates,
    boatExpenses,
    crewExpenses,
  });
  const issues = buildVesselIssues(vessel, snapshot, now);
  const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
  const readiness = Math.max(0, Math.min(100, Math.round(calculateConfidenceScore(vessel) || 0)));
  const attentionScore = criticalCount * 12 + issues.length * 4 + openTasks.length;
  const attentionLevel = criticalCount > 0 ? "critical" : issues.length > 0 ? "attention" : "ready";

  return {
    id: vessel.id,
    name: vessel.name || vessel.vesselProfile?.vesselName || "Unnamed vessel",
    descriptor: vesselDescriptor(vessel),
    status: metrics.status || vessel.details?.status || "Operational",
    readiness,
    crewReadiness: calculateCrewReadinessPercent(crewProfiles),
    openTasks: openTasks.length,
    overdueCount: snapshot.overdueTasks.length,
    approvalCount: snapshot.pendingApprovals.length,
    certificateDue: snapshot.expiringCertificates.length,
    routeDistanceNm: Number(metrics.routeDistanceNm || 0),
    attentionScore,
    attentionLevel,
    criticalCount,
    issues,
    pendingApprovals: snapshot.pendingApprovals,
  };
}

export function buildFleetCommandModel(vessels = [], metricsByVessel = {}, now = new Date()) {
  const records = (Array.isArray(vessels) ? vessels : [])
    .filter((vessel) => vessel?.id)
    .map((vessel) => buildFleetRecord(vessel, metricsByVessel?.[vessel.id] || {}, now))
    .sort((left, right) => right.attentionScore - left.attentionScore || left.name.localeCompare(right.name));
  const issues = records
    .flatMap((record) => record.issues)
    .sort((left, right) => {
      const severityWeight = { critical: 0, attention: 1, neutral: 2 };
      const severityOrder = (severityWeight[left.severity] ?? 9) - (severityWeight[right.severity] ?? 9);
      if (severityOrder !== 0) return severityOrder;
      return left.vesselName.localeCompare(right.vesselName);
    });

  return {
    records,
    issues,
    totals: records.reduce((summary, record) => ({
      vessels: summary.vessels + 1,
      attention: summary.attention + (record.issues.length ? 1 : 0),
      openTasks: summary.openTasks + record.openTasks,
      approvals: summary.approvals + record.approvalCount,
      critical: summary.critical + record.criticalCount,
    }), { vessels: 0, attention: 0, openTasks: 0, approvals: 0, critical: 0 }),
  };
}
