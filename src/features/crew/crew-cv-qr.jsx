"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getCrewId } from "../../lib/demo_crew_cv.mjs";

export function CrewCvQr({
  vesselSlug = "contessa",
  person,
  darkMode = false,
  primaryActionClass = "",
}) {
  const crewRouteId = useMemo(() => getCrewId(person), [person]);
  const relativeHref = `/vessels/${vesselSlug}/crew/${crewRouteId}/cv`;
  const [url, setUrl] = useState(relativeHref);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUrl(`${window.location.origin}${relativeHref}`);
  }, [relativeHref]);

  if (!person || !crewRouteId) return null;

  return (
    <div className={`rounded-[24px] border p-4 ${darkMode ? "border-cyan-300/15 bg-slate-950/70" : "border-slate-200/90 bg-white/90"} shadow-sm`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
            Demo CV QR
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Scan to open this crew member's demo CV. Generated for testing only.
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <QRCodeSVG value={url} size={104} fgColor="#071A3A" bgColor="#ffffff" />
        </div>
      </div>

      <a
        href={relativeHref}
        target="_blank"
        rel="noreferrer"
        className={`${primaryActionClass || "inline-flex min-h-11 items-center justify-center rounded-2xl border border-blue-300 bg-blue-50 px-4 text-sm font-semibold text-blue-800"} mt-4 w-full`}
      >
        View Demo CV
      </a>

      <a
        href={relativeHref}
        target="_blank"
        rel="noreferrer"
        className="mt-3 block max-w-full truncate text-xs font-semibold text-blue-700 dark:text-cyan-200"
        title={relativeHref}
      >
        {relativeHref}
      </a>
    </div>
  );
}
