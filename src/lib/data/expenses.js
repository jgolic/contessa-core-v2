import { buildBoatExpenseSummaryItems } from "../../contessa_app_data.mjs";
import { getTasksForVessel } from "./tasks.js";
import { getVesselRecords, normalizeVesselSlug } from "./vessels.js";

export function getExpensesForVessel(vesselSlug, source = {}) {
  const normalizedSlug = normalizeVesselSlug(vesselSlug);
  const boatExpenses = buildBoatExpenseSummaryItems(getTasksForVessel(normalizedSlug, source)).map((expense) => ({
    ...expense,
    vesselSlug: normalizedSlug,
  }));
  const crewExpenses = getVesselRecords(normalizedSlug, source, "crewExpenses");

  return [...boatExpenses, ...crewExpenses];
}
