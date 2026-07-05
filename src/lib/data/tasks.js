import {
  PRIORITY_OPTIONS,
  TASK_DEPARTMENT_OPTIONS,
  TASK_STATUS_OPTIONS,
  createNextTaskId,
  normalizeTask,
} from "../../contessa_app_data.mjs";
import { resolveCrewAssignment } from "./crew.js";
import { getVesselBySlug, getVesselRecords, normalizeVesselSlug } from "./vessels.js";

export const TASK_LIFECYCLE_STATUSES = ["pending", "ongoing", "waiting-approval", "completed", "blocked"];

export function getTasksForVessel(vesselSlug, source) {
  return getVesselRecords(vesselSlug, source, "tasks").map((task) =>
    normalizeTask({
      ...task,
      vesselSlug: task.vesselSlug || normalizeVesselSlug(vesselSlug),
    })
  );
}

function normalizeTaskPayload(vesselSlug, payload = {}, source = {}) {
  const now = new Date().toISOString();
  const assignment = resolveCrewAssignment(vesselSlug, payload.assignee || payload.assignedTo, source);
  const status = TASK_STATUS_OPTIONS.includes(payload.status) ? payload.status : "pending";
  const priority = PRIORITY_OPTIONS.includes(payload.priority) ? payload.priority : "medium";
  const department = TASK_DEPARTMENT_OPTIONS.includes(payload.department) ? payload.department : TASK_DEPARTMENT_OPTIONS[0];

  return normalizeTask({
    ...payload,
    vesselSlug: normalizeVesselSlug(vesselSlug),
    name: String(payload.name || payload.title || "").trim(),
    title: String(payload.title || payload.name || "").trim(),
    area: String(payload.area || payload.location || "").trim(),
    department,
    status,
    priority,
    assignee: assignment.assignee,
    assignedTo: assignment.assignee,
    assignedCrewId: assignment.assignedCrewId,
    dueDate: payload.dueDate || "",
    notes: String(payload.notes || payload.description || "").trim(),
    description: String(payload.description || payload.notes || "").trim(),
    photos: Array.isArray(payload.photos) ? payload.photos : [],
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    comments: Array.isArray(payload.comments) ? payload.comments : [],
    expenses: Array.isArray(payload.expenses) ? payload.expenses : [],
    quotes: Array.isArray(payload.quotes) ? payload.quotes : [],
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now,
  });
}

export function createTask(vesselSlug, payload = {}, source = {}) {
  const vessel = getVesselBySlug(vesselSlug, source) || { id: normalizeVesselSlug(vesselSlug), tasks: [] };
  const currentTasks = getTasksForVessel(vesselSlug, vessel);
  const task = normalizeTaskPayload(vesselSlug, {
    ...payload,
    id: payload.id || createNextTaskId(currentTasks),
  }, vessel);
  const tasks = [task, ...currentTasks];

  return {
    task,
    tasks,
    vessel: { ...vessel, tasks },
  };
}

export function updateTask(vesselSlug, taskId, updates = {}, source = {}) {
  const vessel = getVesselBySlug(vesselSlug, source) || { id: normalizeVesselSlug(vesselSlug), tasks: [] };
  const currentTasks = getTasksForVessel(vesselSlug, vessel);
  const existing = currentTasks.find((task) => task.id === taskId);
  if (!existing) return { task: null, tasks: currentTasks, vessel };

  const nextUpdates = { ...updates };
  if (Object.prototype.hasOwnProperty.call(nextUpdates, "assignee")) {
    const assignment = resolveCrewAssignment(vesselSlug, nextUpdates.assignee, vessel);
    nextUpdates.assignee = assignment.assignee;
    nextUpdates.assignedTo = assignment.assignee;
    nextUpdates.assignedCrewId = assignment.assignedCrewId;
  }

  const task = normalizeTaskPayload(vesselSlug, {
    ...existing,
    ...nextUpdates,
    updatedAt: new Date().toISOString(),
    declinedAt: nextUpdates.status === "declined" ? existing.declinedAt || Date.now() : nextUpdates.status ? null : existing.declinedAt,
  }, vessel);
  const tasks = currentTasks.map((item) => (item.id === taskId ? task : item));

  return {
    task,
    previousTask: existing,
    tasks,
    vessel: { ...vessel, tasks },
  };
}

export function deleteTask(vesselSlug, taskId, source = {}) {
  const vessel = getVesselBySlug(vesselSlug, source) || { id: normalizeVesselSlug(vesselSlug), tasks: [] };
  const currentTasks = getTasksForVessel(vesselSlug, vessel);
  const task = currentTasks.find((item) => item.id === taskId) || null;
  const tasks = currentTasks.filter((item) => item.id !== taskId);

  return {
    task,
    tasks,
    vessel: { ...vessel, tasks },
  };
}
