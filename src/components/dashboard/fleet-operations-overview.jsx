import { useMemo, useState } from "react";

const COMPLETE_TASK_STATUSES = new Set(["completed", "declined"]);
const HIGH_PRIORITY_LEVELS = new Set(["high", "urgent", "critical"]);

function parseLocalDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function isTaskOverdue(task, today) {
  if (!task?.dueDate || COMPLETE_TASK_STATUSES.has(String(task.status || "").toLowerCase())) return false;
  const dueDate = parseLocalDate(task.dueDate);
  return Boolean(dueDate && dueDate < today);
}

function vesselDescriptor(vessel = {}) {
  const details = vessel.details || {};
  const profile = vessel.vesselProfile || {};
  const length = details.lengthMeters || profile.lengthMeters || details.lengthFeet || profile.lengthFeet;
  const lengthUnit = details.lengthMeters || profile.lengthMeters ? "m" : length ? "ft" : "";
  const type = details.vesselType || details.type || profile.vesselType || profile.type || "Vessel";
  const port = details.homePort || profile.homePort || "Port not set";
  return [length ? `${length}${lengthUnit}` : "", type, port].filter(Boolean).join(" / ");
}

function buildFleetRecord(vessel, metrics = {}, today) {
  const tasks = Array.isArray(vessel?.tasks) ? vessel.tasks : [];
  const openTasks = tasks.filter((task) => !COMPLETE_TASK_STATUSES.has(String(task?.status || "").toLowerCase()));
  const overdueCount = openTasks.filter((task) => isTaskOverdue(task, today)).length;
  const unassignedCount = openTasks.filter((task) => !String(task?.assignee || task?.assignedTo || "").trim()).length;
  const highPriorityCount = openTasks.filter((task) => HIGH_PRIORITY_LEVELS.has(String(task?.priority || "").toLowerCase())).length;
  const alertCount = Number(metrics.alertCount || 0);
  const approvalCount = Number(metrics.approvalCount || 0);
  const certificateDue = Number(metrics.certificateDue || 0);
  const attentionScore = overdueCount * 7 + alertCount * 4 + approvalCount * 3 + certificateDue * 2 + highPriorityCount * 2 + unassignedCount;
  const attentionLevel = overdueCount > 0 || alertCount >= 3
    ? "critical"
    : attentionScore > 0
      ? "watch"
      : "ready";

  return {
    vessel,
    id: vessel?.id,
    name: vessel?.name || vessel?.vesselProfile?.vesselName || "Unnamed vessel",
    descriptor: vesselDescriptor(vessel),
    status: metrics.status || vessel?.details?.status || "Operational",
    openTasks: openTasks.length,
    overdueCount,
    unassignedCount,
    highPriorityCount,
    alertCount,
    approvalCount,
    certificateDue,
    crewCount: Number(metrics.crewCount || 0),
    attentionScore,
    attentionLevel,
  };
}

function SummaryMetric({ label, value, note, tone = "neutral" }) {
  return (
    <div className={`fleet-summary-metric fleet-summary-metric--${tone}`}>
      <div className="fleet-summary-value">{value}</div>
      <div className="fleet-summary-label">{label}</div>
      <div className="fleet-summary-note">{note}</div>
    </div>
  );
}

function FleetVesselRow({ record, active = false, onOpen }) {
  const attentionLabel = record.attentionLevel === "critical"
    ? "Action needed"
    : record.attentionLevel === "watch"
      ? "Monitor"
      : "Ready";

  return (
    <button
      type="button"
      onClick={() => onOpen?.(record.id)}
      className={`fleet-vessel-row ${active ? "fleet-vessel-row--active" : ""}`}
      aria-label={`Open ${record.name} vessel workspace`}
    >
      <span className={`fleet-attention-marker fleet-attention-marker--${record.attentionLevel}`} aria-hidden="true" />
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="truncate text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--neo-ink)]">{record.name}</span>
          {active ? <span className="fleet-active-label">Current</span> : null}
        </span>
        <span className="mt-1 block truncate text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--mb-muted)]">
          {record.descriptor}
        </span>
      </span>

      <span className="fleet-row-status">
        <span className={`fleet-status-label fleet-status-label--${record.attentionLevel}`}>{attentionLabel}</span>
        <span className="mt-1 block truncate text-[11px] text-[var(--mb-muted)]">{record.status}</span>
      </span>

      <span className="fleet-row-counts">
        <span><strong>{record.openTasks}</strong> open</span>
        <span className={record.overdueCount ? "fleet-count-critical" : ""}><strong>{record.overdueCount}</strong> overdue</span>
        <span><strong>{record.approvalCount}</strong> decisions</span>
        <span><strong>{record.crewCount}</strong> crew</span>
      </span>

      <span className="fleet-row-arrow" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
          <path d="M3 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

export function FleetOperationsOverview({
  vessels = [],
  metricsByVessel = {},
  activeVesselId,
  currentRole = "manager",
  onSwitchVessel,
  onOpenFleet,
  onQuickAddTask,
}) {
  const [filter, setFilter] = useState("attention");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const records = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return (Array.isArray(vessels) ? vessels : [])
      .filter(Boolean)
      .map((vessel) => buildFleetRecord(vessel, metricsByVessel?.[vessel.id] || {}, today))
      .sort((left, right) => right.attentionScore - left.attentionScore || left.name.localeCompare(right.name));
  }, [metricsByVessel, vessels]);

  const totals = useMemo(() => records.reduce((summary, record) => ({
    attention: summary.attention + (record.attentionScore > 0 ? 1 : 0),
    openTasks: summary.openTasks + record.openTasks,
    overdue: summary.overdue + record.overdueCount,
    unassigned: summary.unassigned + record.unassignedCount,
    approvals: summary.approvals + record.approvalCount,
  }), { attention: 0, openTasks: 0, overdue: 0, unassigned: 0, approvals: 0 }), [records]);

  const filteredRecords = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return records.filter((record) => {
      if (filter === "attention" && record.attentionScore <= 0) return false;
      if (filter === "ready" && record.attentionScore > 0) return false;
      if (!cleanQuery) return true;
      return `${record.name} ${record.descriptor} ${record.status}`.toLowerCase().includes(cleanQuery);
    });
  }, [filter, query, records]);

  const visibleRecords = showAll ? filteredRecords : filteredRecords.slice(0, 8);
  const roleLabel = String(currentRole || "manager").toLowerCase() === "owner" ? "Owner" : "Fleet manager";

  return (
    <section id="fleet-command-section" className="fleet-command-overview" data-mb-reveal>
      <div className="fleet-command-heading">
        <div>
          <div className="fleet-command-kicker">{roleLabel} workspace</div>
          <h2 className="fleet-command-title">Your fleet, ordered by what needs you next.</h2>
          <p className="fleet-command-copy">
            One operational queue across large yachts, tenders, and speedboats. Open work, decisions, and compliance stay attached to the correct vessel.
          </p>
        </div>
        <div className="fleet-command-actions">
          {onQuickAddTask ? (
            <button type="button" onClick={onQuickAddTask} className="fleet-primary-action">
              <span className="text-lg leading-none">+</span>
              New task
            </button>
          ) : null}
          <button type="button" onClick={onOpenFleet} className="fleet-secondary-action">Manage fleet</button>
        </div>
      </div>

      <div className="fleet-summary-grid">
        <SummaryMetric label="Fleet" value={records.length} note="Vessels in view" />
        <SummaryMetric label="Need attention" value={totals.attention} note={`${totals.overdue} overdue`} tone={totals.overdue ? "critical" : totals.attention ? "watch" : "ready"} />
        <SummaryMetric label="Open work" value={totals.openTasks} note={`${totals.unassigned} unassigned`} tone={totals.unassigned ? "watch" : "neutral"} />
        <SummaryMetric label="Decisions" value={totals.approvals} note="Awaiting approval" tone={totals.approvals ? "watch" : "ready"} />
      </div>

      <div className="fleet-toolbar">
        <div className="fleet-filter-group" aria-label="Filter fleet">
          {[
            { id: "attention", label: "Needs attention", count: totals.attention },
            { id: "all", label: "All vessels", count: records.length },
            { id: "ready", label: "Ready", count: Math.max(records.length - totals.attention, 0) },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => { setFilter(option.id); setShowAll(false); }}
              aria-pressed={filter === option.id}
              className={`fleet-filter-button ${filter === option.id ? "fleet-filter-button--active" : ""}`}
            >
              {option.label}
              <span>{option.count}</span>
            </button>
          ))}
        </div>
        <label className="fleet-search-field">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find vessel, port, or type" />
        </label>
      </div>

      <div className="fleet-vessel-list">
        {visibleRecords.length ? visibleRecords.map((record) => (
          <FleetVesselRow
            key={record.id}
            record={record}
            active={record.id === activeVesselId}
            onOpen={onSwitchVessel}
          />
        )) : (
          <div className="fleet-empty-state">
            <strong>No vessels match this view.</strong>
            <span>Try another filter or search term.</span>
          </div>
        )}
      </div>

      {filteredRecords.length > 8 ? (
        <button type="button" onClick={() => setShowAll((current) => !current)} className="fleet-show-all">
          {showAll ? "Show priority vessels" : `Show all ${filteredRecords.length} vessels`}
        </button>
      ) : null}
    </section>
  );
}
