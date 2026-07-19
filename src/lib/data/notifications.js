import {
  buildBoatExpenseSummaryItems,
  buildCertificateNotices,
  buildMaintenanceAlerts,
  buildOperationalNotifications,
} from "../../contessa_app_data.mjs";
import { getTasksForVessel } from "./tasks.js";
import { getCrewForVessel } from "./crew.js";
import { getVesselBySlug, getVesselRecords, normalizeVesselSlug } from "./vessels.js";

export function getNotificationsForVessel(vesselSlug, source = {}) {
  const vessel = getVesselBySlug(vesselSlug, source) || source || {};
  const normalizedSlug = normalizeVesselSlug(vesselSlug);
  const tasks = getTasksForVessel(normalizedSlug, vessel);
  const crewProfiles = getCrewForVessel(normalizedSlug, vessel);
  const crewExpenses = getVesselRecords(normalizedSlug, vessel, "crewExpenses");
  const maintenanceItems = getVesselRecords(normalizedSlug, vessel, "maintenanceItems");
  const certificateNotices = buildCertificateNotices(crewProfiles);
  const maintenanceAlerts = buildMaintenanceAlerts(maintenanceItems);
  const boatExpenses = buildBoatExpenseSummaryItems(tasks);

  const generated = buildOperationalNotifications({
    tasks,
    boatExpenses,
    crewExpenses,
    maintenanceAlerts,
    certificateNotices,
  });

  const blockedTasks = tasks
    .filter((task) => task.status === "blocked")
    .map((task) => ({
      id: `blocked-${task.id}`,
      vesselSlug: normalizedSlug,
      level: "critical",
      section: "tasks",
      title: `${task.name || "Task"} is blocked`,
      detail: [task.area, task.assignee].filter(Boolean).join(" - "),
      targetId: task.id,
      taskId: task.id,
      item: task,
    }));

  const waitingApprovalTasks = tasks
    .filter((task) => task.status === "waiting-approval")
    .map((task) => ({
      id: `waiting-approval-${task.id}`,
      vesselSlug: normalizedSlug,
      level: "warning",
      section: "tasks",
      title: `${task.name || "Task"} is waiting approval`,
      detail: [task.area, task.assignee].filter(Boolean).join(" - "),
      targetId: task.id,
      taskId: task.id,
      item: task,
    }));

  return [...blockedTasks, ...waitingApprovalTasks, ...generated].map((item) => ({
    ...item,
    vesselSlug: item.vesselSlug || normalizedSlug,
  }));
}
