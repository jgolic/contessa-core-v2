import {
  createEmptyAppState,
  normalizeFleetVessel,
} from "../../contessa_app_data.mjs";

export function normalizeVesselSlug(slug = "") {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "contessa";
}

function getDefaultFleet() {
  const state = createEmptyAppState();
  return Array.isArray(state.vessels) ? state.vessels : [];
}

export function getFleet(source) {
  if (Array.isArray(source)) return source.filter(Boolean);
  if (Array.isArray(source?.vessels)) return source.vessels.filter(Boolean);
  if (source?.id || source?.slug) return [source];
  return getDefaultFleet();
}

export function getVesselBySlug(slug, source) {
  const vesselSlug = normalizeVesselSlug(slug);
  const fleet = getFleet(source);
  const vessel = fleet.find((item) => normalizeVesselSlug(item?.slug || item?.id) === vesselSlug);
  return vessel ? normalizeFleetVessel(vessel, vessel.id || vesselSlug) : null;
}

export function getVesselRecords(vesselSlug, source, key) {
  const vessel = getVesselBySlug(vesselSlug, source);
  const records = Array.isArray(vessel?.[key]) ? vessel[key] : [];

  return records.map((record) => ({
    ...record,
    vesselSlug: record?.vesselSlug || vessel?.id || normalizeVesselSlug(vesselSlug),
  }));
}

export function updateVesselInFleet(vesselSlug, source, updater) {
  const fleet = getFleet(source);
  const normalizedSlug = normalizeVesselSlug(vesselSlug);
  let changedVessel = null;

  const vessels = fleet.map((vessel) => {
    if (normalizeVesselSlug(vessel?.slug || vessel?.id) !== normalizedSlug) return vessel;
    changedVessel = normalizeFleetVessel(updater(normalizeFleetVessel(vessel, vessel.id || normalizedSlug)), vessel.id || normalizedSlug);
    return changedVessel;
  });

  return { vessels, vessel: changedVessel };
}
