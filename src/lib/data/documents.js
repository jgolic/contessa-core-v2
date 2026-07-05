import { getVesselRecords, normalizeVesselSlug } from "./vessels.js";

export function getDocumentsForVessel(vesselSlug, source = {}) {
  const normalizedSlug = normalizeVesselSlug(vesselSlug);
  return getVesselRecords(normalizedSlug, source, "documents").map((document) => ({
    ...document,
    vesselSlug: document.vesselSlug || normalizedSlug,
  }));
}
