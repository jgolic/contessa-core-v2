"use client";

import { useEffect } from "react";

function CompassMark() {
  return (
    <svg viewBox="0 0 64 64" className="crew-print-compass" aria-hidden="true">
      <path d="M32 6 39.5 24.5 58 32 39.5 39.5 32 58 24.5 39.5 6 32 24.5 24.5 32 6Z" />
      <path d="M32 16 35.5 28.5 48 32 35.5 35.5 32 48 28.5 35.5 16 32 28.5 28.5 32 16Z" />
    </svg>
  );
}

function FooterAnchorMark() {
  return (
    <svg viewBox="0 0 48 48" className="crew-print-footer-icon" aria-hidden="true">
      <path d="M24 10v24" />
      <path d="M16 18h16" />
      <path d="M18 34c-4 0-8-4-8-9" />
      <path d="M30 34c4 0 8-4 8-9" />
      <path d="M14 31l-4-6-4 6" />
      <path d="M34 31l4-6 4 6" />
      <circle cx="24" cy="8" r="3" />
    </svg>
  );
}

function PrintActions({ vesselId }) {
  return (
    <div className="crew-print-actions no-print">
      <a href={`/vessels/${vesselId}`} className="crew-print-action-link">
        Back to workspace
      </a>
      <button type="button" className="crew-print-action-button" onClick={() => window.print()}>
        Print / Save PDF
      </button>
    </div>
  );
}

function formatPrintDate() {
  return new Date()
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

function getCrewPrintName(person = {}) {
  return (
    person.name ||
    person.fullName ||
    [person.firstName, person.lastName].filter(Boolean).join(" ") ||
    "Unnamed crew"
  );
}

function getCrewPrintPosition(person = {}) {
  return person.position || person.title || person.rank || person.role || "Crew";
}

export function CrewListPrintView({ vessel }) {
  const vesselId = vessel?.id || "contessa";
  const info = vessel?.vesselPrintInfo || {};
  const crew = Array.isArray(vessel?.crew)
    ? vessel.crew
    : Array.isArray(vessel?.crewProfiles)
      ? vessel.crewProfiles
      : [];
  const printDate = info.date || formatPrintDate();
  const metadata = [
    ["FLAG", info.flag],
    ["IMO", info.imo],
    ["CALL SIGN", info.callSign],
    ["PORT OF REGISTRY", info.portOfRegistry],
    ["DATE", printDate],
  ];

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const shouldPrint = new URLSearchParams(window.location.search).get("print") === "1";
    if (!shouldPrint) return undefined;

    const timeout = window.setTimeout(() => window.print(), 450);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div className="crew-print-screen">
      <PrintActions vesselId={vesselId} />

      <main className="crew-print-page">
        <header className="crew-print-header">
          <CompassMark />
          <h1>{info.displayName || String(vessel?.name || "M/Y VESSEL").toUpperCase()}</h1>
          <div className="crew-print-subtitle">
            <span />
            <strong>CREW LIST</strong>
            <span />
          </div>
        </header>

        <section className="crew-print-meta" aria-label="Vessel metadata">
          {metadata.map(([label, value]) => (
            <div key={label} className="crew-print-meta-row">
              <dt>{label}</dt>
              <dd>{value || "-"}</dd>
            </div>
          ))}
        </section>

        <div className="crew-print-rule" />

        <table className="crew-print-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>POSITION / TITLE</th>
              <th>NATIONALITY</th>
              <th>DATE OF BIRTH</th>
            </tr>
          </thead>
          <tbody>
            {crew.map((person) => {
              const fullName = getCrewPrintName(person);

              return (
                <tr key={person.id || fullName}>
                  <td className="crew-print-name">{fullName}</td>
                  <td>{getCrewPrintPosition(person)}</td>
                  <td>{person.nationality || "-"}</td>
                  <td>{person.dateOfBirth || person.dob || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <footer className="crew-print-footer">
          <span />
          <FooterAnchorMark />
          <span />
        </footer>
      </main>
    </div>
  );
}
