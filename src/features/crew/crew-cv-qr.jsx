"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getCrewId } from "../../lib/demo_crew_cv.mjs";
import { getCanonicalVesselSlug } from "../../lib/vessel_lookup.mjs";
import { useRevealHighlight } from "../../hooks/useRevealHighlight.js";

export function CrewCvQr({
  vesselSlug = "contessa",
  person,
  darkMode = false,
}) {
  const crewRouteId = useMemo(() => getCrewId(person), [person]);
  const canonicalVesselSlug = useMemo(() => getCanonicalVesselSlug(vesselSlug), [vesselSlug]);
  const relativeHref = `/vessels/${canonicalVesselSlug}/crew/${crewRouteId}/cv`;
  const [url, setUrl] = useState(relativeHref);
  const revealRef = useRevealHighlight(Boolean(person && crewRouteId), {
    radius: "24px",
    delay: 180,
    triggerKey: crewRouteId || "crew-cv",
  });
  const labelClass = darkMode ? "text-navy-50" : "text-[#071A3A]";
  const descriptionClass = darkMode ? "text-slate-100" : "text-slate-700";
  const actionButtonClass =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#071A3A] bg-[#071A3A] px-5 py-2.5 text-sm font-semibold text-white  transition-all duration-200 hover:border-navy-700 hover:bg-navy-900  focus:outline-none focus:ring-2 focus:ring-navy-400/30 dark:border-navy-300/40 dark:bg-navy-300/14 dark:text-navy-50 dark:hover:bg-navy-300/22";

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUrl(`${window.location.origin}${relativeHref}`);
  }, [relativeHref]);

  if (!person || !crewRouteId) return null;

  return (
    <div
      ref={revealRef}
      className={`ui-reveal-target rounded-[24px] border p-4 ${darkMode ? "border-navy-300/15 bg-slate-950/70" : "border-slate-200/90 bg-white/90"} `}
      style={{ "--reveal-radius": "24px" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={`text-xs font-extrabold uppercase tracking-[0.14em] ${labelClass}`}>
            Demo CV QR
          </p>
          <p className={`mt-2 text-sm font-medium leading-6 ${descriptionClass}`}>
            Scan to open this crew member's demo CV. Generated for testing only.
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 ">
          <QRCodeSVG value={url} size={104} fgColor="#071A3A" bgColor="#ffffff" />
        </div>
      </div>

      <a
        href={relativeHref}
        target="_blank"
        rel="noreferrer"
        className={`${actionButtonClass} mt-4 w-full`}
      >
        View Demo CV
      </a>
    </div>
  );
}
