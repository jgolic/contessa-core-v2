import { buildBoatExpenseSummaryItems } from "../../contessa_app_data.mjs";
import { getTasksForVessel } from "./tasks.js";
import { getVesselRecords, normalizeVesselSlug } from "./vessels.js";

export function getApprovalsForVessel(vesselSlug, source = {}) {
  const normalizedSlug = normalizeVesselSlug(vesselSlug);
  const taskApprovals = getTasksForVessel(normalizedSlug, source)
    .filter((task) => task.approvalStatus === "pending" || task.status === "waiting-approval")
    .map((task) => ({
      id: `task-approval-${task.id}`,
      vesselSlug: normalizedSlug,
      title: task.name,
      amount: null,
      requester: task.assignee || "Operations",
      status: task.status === "waiting-approval" ? "Waiting Approval" : "Pending",
      linkedTaskId: task.id,
      createdAt: task.createdAt || task.updatedAt || "",
    }));

  const quoteApprovals = buildBoatExpenseSummaryItems(getTasksForVessel(normalizedSlug, source))
    .filter((quote) => ["requested", "received"].includes(quote.status))
    .map((quote) => ({
      id: `quote-approval-${quote.taskId}-${quote.id}`,
      vesselSlug: normalizedSlug,
      title: quote.supplier || quote.taskName || "Quote approval",
      amount: quote.amount ?? 0,
      requester: quote.requestedBy || quote.taskName || "Operations",
      status: quote.displayStatus || quote.status || "Pending",
      linkedTaskId: quote.taskId,
      createdAt: quote.createdAt || quote.addedAt || "",
      item: quote,
    }));

  return [...taskApprovals, ...quoteApprovals];
}

export function getCrewExpenseApprovalsForVessel(vesselSlug, source = {}) {
  const normalizedSlug = normalizeVesselSlug(vesselSlug);
  return getVesselRecords(normalizedSlug, source, "crewExpenses")
    .filter((expense) => ["requested", "received"].includes(expense.status))
    .map((expense) => ({
      ...expense,
      vesselSlug: normalizedSlug,
    }));
}
