const CRITICAL_STATUS_PATTERN = /\b(critical|grounded|out of service|unsafe)\b/i;

function count(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
}

export function getFleetVesselStatus(metrics = {}, vessel = {}) {
  const alertCount = count(metrics.alertCount);
  const approvalCount = count(metrics.approvalCount);
  const certificateDue = count(metrics.certificateDue);
  const status = String(metrics.status || vessel?.details?.status || "Operational").trim();

  if (CRITICAL_STATUS_PATTERN.test(status) || alertCount >= 3) {
    return {
      level: "critical",
      label: "Action needed",
      detail: status || `${alertCount} active alerts`,
    };
  }

  if (alertCount > 0 || approvalCount > 0 || certificateDue > 0) {
    return {
      level: "attention",
      label: "Needs attention",
      detail: status || "Review outstanding items",
    };
  }

  return {
    level: "ready",
    label: "Ready",
    detail: status || "Operational",
  };
}
