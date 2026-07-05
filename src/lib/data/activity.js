import { createId } from "../../contessa_app_data.mjs";
import { normalizeVesselSlug } from "./vessels.js";

export function createActivityLog(vesselSlug, payload = {}) {
  const createdAt = payload.createdAt || payload.at || new Date().toISOString();
  const createdBy = payload.createdBy || payload.by || "User";
  const title = payload.title || payload.action || "Activity";
  const message = payload.message || payload.detail || title;

  return {
    id: payload.id || createId("ACT"),
    vesselSlug: normalizeVesselSlug(vesselSlug),
    type: payload.type || payload.section || "activity",
    title,
    message,
    createdBy,
    createdAt,
    linkedItemId: payload.linkedItemId || payload.taskId || payload.itemId || null,
    linkedItemType: payload.linkedItemType || payload.itemType || null,
    at: createdAt,
    by: createdBy,
    section: payload.section || payload.type || "Activity",
    action: title,
    detail: message,
  };
}

export function appendActivityLog(vesselSlug, payload, history = [], limit = 300) {
  return [createActivityLog(vesselSlug, payload), ...(Array.isArray(history) ? history : [])].slice(0, limit);
}
