import { useMemo, useState } from "react";
import {
  convertMoney,
  FALLBACK_USD_RATES,
  formatMoney,
} from "../../contessa_app_data.mjs";
import { buildFleetCommandModel } from "../../lib/fleet_command.mjs";

const ISSUE_FILTERS = [
  { id: "all", label: "All signals" },
  { id: "task", label: "Overdue work" },
  { id: "approval", label: "Decisions" },
  { id: "certificate", label: "Certificates" },
  { id: "route", label: "Route" },
];

function statusLabel(level) {
  if (level === "critical") return "Action needed";
  if (level === "attention") return "Needs review";
  return "Ready";
}

function FleetKpi({ label, value, note, tone = "neutral" }) {
  return (
    <div className={`fleet-home-kpi fleet-home-kpi--${tone}`}>
      <div className="fleet-home-kpi-value">{value}</div>
      <div className="fleet-home-kpi-label">{label}</div>
      <div className="fleet-home-kpi-note">{note}</div>
    </div>
  );
}

function VesselIssueLine({ issue }) {
  return (
    <span className="fleet-home-card-issue">
      <span className={`fleet-home-lamp fleet-home-lamp--${issue.severity}`} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{issue.title}</span>
      <span className="fleet-home-mono shrink-0">{issue.ageLabel}</span>
    </span>
  );
}

function VesselCard({ record, lead = false, active = false, onOpen }) {
  const topIssues = record.issues.slice(0, lead ? 3 : 1);

  return (
    <button
      type="button"
      onClick={() => onOpen?.(record.id)}
      className={`fleet-home-vessel-card fleet-home-vessel-card--${record.attentionLevel} ${lead ? "fleet-home-vessel-card--lead" : ""} ${active ? "fleet-home-vessel-card--active" : ""}`}
      aria-label={`Open ${record.name} bridge`}
    >
      <span className="fleet-home-vessel-card-topline">
        <span className={`fleet-home-lamp fleet-home-lamp--${record.attentionLevel}`} aria-hidden="true" />
        <span>{statusLabel(record.attentionLevel)}</span>
        {active ? <span className="fleet-home-current-label">Current vessel</span> : null}
      </span>

      <span className="fleet-home-vessel-name">{record.name}</span>
      <span className="fleet-home-vessel-descriptor">{record.descriptor}</span>

      <span className="fleet-home-vessel-metrics">
        <span><strong>{record.readiness}%</strong> readiness</span>
        <span><strong>{record.openTasks}</strong> open</span>
        <span><strong>{record.approvalCount}</strong> decisions</span>
      </span>

      {topIssues.length ? (
        <span className="fleet-home-card-issues">
          {topIssues.map((issue) => <VesselIssueLine key={issue.id} issue={issue} />)}
        </span>
      ) : (
        <span className="fleet-home-card-clear">No material operational signals.</span>
      )}

      <span className="fleet-home-open-link">
        Open bridge
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

function AttentionRow({ issue, currency, exchangeRates, onOpen }) {
  const amount = issue.amount === null || issue.amount === undefined
    ? ""
    : formatMoney(
        convertMoney(issue.amount, issue.currency || currency, currency, exchangeRates),
        currency
      );

  return (
    <button
      type="button"
      onClick={() => onOpen?.(issue)}
      className={`fleet-home-ledger-row fleet-home-ledger-row--${issue.severity}`}
      aria-label={`Open ${issue.title} for ${issue.vesselName}`}
    >
      <span className={`fleet-home-lamp fleet-home-lamp--${issue.severity}`} aria-hidden="true" />
      <span className="fleet-home-vessel-chip">{issue.vesselName}</span>
      <span className="min-w-0">
        <span className="fleet-home-ledger-title">{issue.title}</span>
        <span className="fleet-home-ledger-detail">{issue.detail}</span>
      </span>
      {amount ? <span className="fleet-home-ledger-amount">{amount}</span> : null}
      <span className="fleet-home-ledger-age">{issue.ageLabel}</span>
      <svg viewBox="0 0 16 16" fill="none" className="fleet-home-ledger-arrow" aria-hidden="true">
        <path d="M3 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function FleetOperationsOverview({
  vessels = [],
  metricsByVessel = {},
  activeVesselId,
  currentRole = "manager",
  currency = "USD",
  exchangeRates = FALLBACK_USD_RATES,
  onSwitchVessel,
  onOpenIssue,
  onOpenFleet,
  onQuickAddTask,
}) {
  const [vesselFilter, setVesselFilter] = useState("attention");
  const [issueFilter, setIssueFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showAllVessels, setShowAllVessels] = useState(false);
  const [showAllIssues, setShowAllIssues] = useState(false);

  const model = useMemo(
    () => buildFleetCommandModel(vessels, metricsByVessel),
    [metricsByVessel, vessels]
  );
  const pendingSpend = useMemo(() => model.records.reduce((total, record) => (
    total + record.pendingApprovals.reduce((subtotal, approval) => (
      subtotal + (approval.amount === null || approval.amount === undefined
        ? 0
        : convertMoney(approval.amount, approval.currency || currency, currency, exchangeRates))
    ), 0)
  ), 0), [currency, exchangeRates, model.records]);

  const filteredRecords = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return model.records.filter((record) => {
      if (vesselFilter === "attention" && !record.issues.length) return false;
      if (vesselFilter === "ready" && record.issues.length) return false;
      if (!cleanQuery) return true;
      return `${record.name} ${record.descriptor} ${record.status}`.toLowerCase().includes(cleanQuery);
    });
  }, [model.records, query, vesselFilter]);
  const visibleRecords = showAllVessels ? filteredRecords : filteredRecords.slice(0, 7);
  const filteredIssues = issueFilter === "all"
    ? model.issues
    : model.issues.filter((issue) => issue.type === issueFilter);
  const visibleIssues = showAllIssues ? filteredIssues : filteredIssues.slice(0, 10);
  const leadRecord = visibleRecords[0] || null;
  const remainingRecords = leadRecord ? visibleRecords.slice(1) : [];
  const roleLabel = String(currentRole).toLowerCase() === "owner" ? "Owner" : "Fleet manager";
  const handleIssueOpen = (issue) => {
    if (onOpenIssue) onOpenIssue(issue);
    else onSwitchVessel?.(issue.vesselId);
  };

  return (
    <section id="fleet-command-section" className="fleet-home" data-mb-reveal>
      <div className="fleet-home-hero">
        <div className="fleet-home-chart-lines" aria-hidden="true" />
        <div className="fleet-home-hero-content">
          <div className="fleet-home-eyebrow">
            <span className="fleet-home-live-dot" aria-hidden="true" />
            Fleet registry / {roleLabel}
          </div>
          <h1 className="fleet-home-headline">
            <span>{model.totals.vessels} hulls.</span>
            <span>{model.totals.attention} live signals.</span>
          </h1>
          <p className="fleet-home-intro">
            One watch ledger across yachts, tenders, and speedboats. Every open item is indexed by vessel, consequence, and the next decision required.
          </p>

          <div className="fleet-home-hero-actions">
            {onQuickAddTask ? (
              <button type="button" onClick={onQuickAddTask} className="fleet-home-primary-action">
                <span aria-hidden="true">+</span>
                New task
              </button>
            ) : null}
            <button type="button" onClick={onOpenFleet} className="fleet-home-secondary-action">Manage vessels</button>
          </div>
        </div>

        <div className="fleet-home-kpi-grid">
          <FleetKpi label="Fleet" value={model.totals.vessels} note="Vessels in command" />
          <FleetKpi label="Open work" value={model.totals.openTasks} note={`${model.totals.critical} critical signals`} tone={model.totals.critical ? "critical" : "neutral"} />
          <FleetKpi label="Decisions" value={model.totals.approvals} note="Awaiting approval" tone={model.totals.approvals ? "attention" : "ready"} />
          <FleetKpi label="Pending spend" value={formatMoney(pendingSpend, currency)} note="Across active requests" tone="money" />
        </div>
      </div>

      <div className="fleet-home-deck">
        <div className="fleet-home-section-heading">
          <div>
            <div className="fleet-home-kicker">Registry / readiness</div>
            <h2>Every hull, indexed by attention.</h2>
          </div>
          <label className="fleet-home-search">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find vessel, port, or type" />
          </label>
        </div>

        <div className="fleet-home-filter-row" aria-label="Filter vessels">
          {[
            { id: "attention", label: "Needs attention", count: model.totals.attention },
            { id: "all", label: "All vessels", count: model.totals.vessels },
            { id: "ready", label: "Ready", count: Math.max(model.totals.vessels - model.totals.attention, 0) },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => { setVesselFilter(filter.id); setShowAllVessels(false); }}
              aria-pressed={vesselFilter === filter.id}
              className="fleet-home-filter"
            >
              {filter.label}<span>{filter.count}</span>
            </button>
          ))}
        </div>

        {leadRecord ? (
          <div className="fleet-home-vessel-grid">
            <VesselCard record={leadRecord} lead active={leadRecord.id === activeVesselId} onOpen={onSwitchVessel} />
            {remainingRecords.map((record) => (
              <VesselCard key={record.id} record={record} active={record.id === activeVesselId} onOpen={onSwitchVessel} />
            ))}
          </div>
        ) : (
          <div className="fleet-home-empty">
            <strong>No vessels match this view.</strong>
            <span>Try another filter or search term.</span>
          </div>
        )}

        {filteredRecords.length > 7 ? (
          <button type="button" onClick={() => setShowAllVessels((value) => !value)} className="fleet-home-show-all">
            {showAllVessels ? "Show priority vessels" : `Show all ${filteredRecords.length} vessels`}
          </button>
        ) : null}

        <div className="fleet-home-ledger-section">
          <div className="fleet-home-section-heading fleet-home-section-heading--ledger">
            <div>
              <div className="fleet-home-kicker">Watch ledger / signals</div>
              <h2>One sequence. No blind spots.</h2>
            </div>
            <p>Operational signals stay tagged to their vessel and ordered by severity.</p>
          </div>

          <div className="fleet-home-filter-row" aria-label="Filter attention queue">
            {ISSUE_FILTERS.map((filter) => {
              const count = filter.id === "all" ? model.issues.length : model.issues.filter((issue) => issue.type === filter.id).length;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => { setIssueFilter(filter.id); setShowAllIssues(false); }}
                  aria-pressed={issueFilter === filter.id}
                  className="fleet-home-filter"
                >
                  {filter.label}<span>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="fleet-home-ledger">
            {visibleIssues.length ? visibleIssues.map((issue) => (
              <AttentionRow
                key={issue.id}
                issue={issue}
                currency={currency}
                exchangeRates={exchangeRates}
                onOpen={handleIssueOpen}
              />
            )) : (
              <div className="fleet-home-empty fleet-home-empty--ledger">
                <strong>No active signals in this category.</strong>
                <span>The queue will update as vessel records change.</span>
              </div>
            )}
          </div>

          {filteredIssues.length > 10 ? (
            <button type="button" onClick={() => setShowAllIssues((value) => !value)} className="fleet-home-show-all">
              {showAllIssues ? "Show priority signals" : `Show all ${filteredIssues.length} signals`}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
