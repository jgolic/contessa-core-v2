"use client";

import { useEffect } from "react";

function CrewPrintLogo() {
  return (
    <div className="crew-print-logo">
      <img src="/icon.svg" alt="Contessa" />
    </div>
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
          <CrewPrintLogo />
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
          <colgroup>
            <col className="crew-print-col-name" />
            <col className="crew-print-col-position" />
            <col className="crew-print-col-nationality" />
            <col className="crew-print-col-dob" />
            <col className="crew-print-col-passport" />
            <col className="crew-print-col-seamans" />
          </colgroup>
          <thead>
            <tr>
              <th>NAME</th>
              <th>POSITION / TITLE</th>
              <th>NATIONALITY</th>
              <th>DATE OF BIRTH</th>
              <th>PASSPORT NO.</th>
              <th>SEAMAN'S BOOK NO.</th>
            </tr>
          </thead>
          <tbody>
            {crew.map((person) => {
              const fullName = getCrewPrintName(person);

              return (
                <tr key={person.id || fullName}>
                  <td className="crew-print-name">{fullName}</td>
                  <td>{getCrewPrintPosition(person)}</td>
                  <td>{person.nationality || "—"}</td>
                  <td>{person.dateOfBirth || person.dob || "—"}</td>
                  <td>{person.passportNumber || "—"}</td>
                  <td>{person.seamansBookNumber || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <footer className="crew-print-footer">
          <span />
          <div className="crew-print-footer-logo">
            <img src="/icon.svg" alt="Contessa" />
          </div>
          <span />
        </footer>
        <p className="crew-print-footer-text">Generated from vessel crew records</p>
      </main>
    </div>
  );
}
