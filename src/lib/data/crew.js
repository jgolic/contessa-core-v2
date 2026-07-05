import {
  findCrewByName,
  getCrewDisplayName,
} from "../../contessa_app_data.mjs";
import { getVesselBySlug, getVesselRecords, normalizeVesselSlug } from "./vessels.js";

export function getCrewForVessel(vesselSlug, source) {
  return getVesselRecords(vesselSlug, source, "crewProfiles").map((person) => ({
    ...person,
    vesselSlug: person.vesselSlug || normalizeVesselSlug(vesselSlug),
  }));
}

export function getCrewMemberForVessel(vesselSlug, crewIdOrName, source) {
  const value = String(crewIdOrName || "").trim();
  if (!value) return null;

  const crew = getCrewForVessel(vesselSlug, source);
  return crew.find((person) => person.id === value) || crew.find((person) => getCrewDisplayName(person) === value) || null;
}

export function resolveCrewAssignment(vesselSlug, requestedAssignee, source) {
  const assignee = String(requestedAssignee || "").trim();
  if (!assignee) {
    return { assignee: "Unassigned", assignedCrewId: null };
  }

  const vessel = getVesselBySlug(vesselSlug, source);
  const assignedCrew = findCrewByName(vessel || {}, assignee) || getCrewMemberForVessel(vesselSlug, assignee, source);

  if (!assignedCrew) {
    return { assignee, assignedCrewId: null };
  }

  return {
    assignee: getCrewDisplayName(assignedCrew),
    assignedCrewId: assignedCrew.id || null,
  };
}

export function assertCrewBelongsToVessel(vesselSlug, requestedAssignee, source) {
  const assignee = String(requestedAssignee || "").trim();
  if (!assignee || assignee === "Unassigned") return true;

  const assignment = resolveCrewAssignment(vesselSlug, assignee, source);
  return Boolean(assignment.assignedCrewId);
}
