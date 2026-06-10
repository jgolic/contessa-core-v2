import { getVesselBySlug } from "./vessels.js";

export function getRouteSpecsForVessel(vesselSlug, source) {
  const vessel = getVesselBySlug(vesselSlug, source);
  return vessel?.routePlanning?.routeSpecs || vessel?.routeSpecs || {};
}
