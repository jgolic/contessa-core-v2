import { useState } from "react";

const SMART_LABELS = {
  certificates: { short: "CERTS", full: "CERTIFICATES" },
  maintenance: { short: "MAINT.", full: "MAINTENANCE" },
  documents: { short: "DOCS", full: "DOCUMENTS" },
  routePlanning: { short: "ROUTE", full: "ROUTE PLANNING" },
  approvals: { short: "APPROVAL", full: "APPROVALS" },
  expenses: { short: "SPEND", full: "EXPENSES" },
  crew: { short: "CREW", full: "CREW READINESS" },
};

const LABEL_ALIASES = {
  cert: "certificates",
  certs: "certificates",
  certificate: "certificates",
  certificates: "certificates",
  "maint.": "maintenance",
  maint: "maintenance",
  maintenance: "maintenance",
  doc: "documents",
  docs: "documents",
  document: "documents",
  documents: "documents",
  route: "routePlanning",
  "route planning": "routePlanning",
  approval: "approvals",
  approvals: "approvals",
  expense: "expenses",
  expenses: "expenses",
  spend: "expenses",
  crew: "crew",
  "crew readiness": "crew",
};

function resolveLabelKey(labelKey, label) {
  if (labelKey && SMART_LABELS[labelKey]) return labelKey;
  const normalized = String(label || labelKey || "")
    .trim()
    .toLowerCase();
  return LABEL_ALIASES[normalized] || "";
}

export function getSmartLabel(labelKey, label) {
  const resolvedKey = resolveLabelKey(labelKey, label);
  if (resolvedKey) return SMART_LABELS[resolvedKey];

  const fallback = String(label || labelKey || "");
  return { short: fallback, full: fallback };
}

export function SmartLabel({
  labelKey,
  label,
  active = false,
  className = "",
}) {
  const [revealed, setRevealed] = useState(false);
  const smartLabel = getSmartLabel(labelKey, label);
  const hasReveal = smartLabel.short !== smartLabel.full;
  const showFull = active || revealed;

  if (!hasReveal) {
    return (
      <span
        className={`app-smart-label ${className}`.trim()}
        title={smartLabel.full}
      >
        {smartLabel.full}
      </span>
    );
  }

  return (
    <span
      className={`app-smart-label ${className}`.trim()}
      title={smartLabel.full}
      onPointerEnter={() => setRevealed(true)}
      onPointerLeave={() => setRevealed(false)}
      onFocus={() => setRevealed(true)}
      onBlur={() => setRevealed(false)}
      onTouchStart={() => setRevealed(true)}
    >
      {showFull ? smartLabel.full : smartLabel.short}
    </span>
  );
}
