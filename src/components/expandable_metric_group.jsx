"use client";

import { useState } from "react";
import { useRevealHighlight } from "../hooks/useRevealHighlight.js";

function getMetricToneClasses(tone = "neutral", darkMode = false) {
  if (tone === "critical") {
    return darkMode
      ? "border-rose-300/30 bg-rose-300/10 text-rose-100 hover:border-rose-300/45 hover:bg-rose-300/15"
      : "border-rose-200 bg-rose-50/90 text-rose-900 hover:border-rose-300 hover:bg-rose-50";
  }

  if (tone === "warning") {
    return darkMode
      ? "border-amber-300/30 bg-amber-300/10 text-amber-100 hover:border-amber-300/45 hover:bg-amber-300/15"
      : "border-amber-200 bg-amber-50/90 text-amber-900 hover:border-amber-300 hover:bg-amber-50";
  }

  return darkMode
    ? "border-white/10 bg-slate-800/80 text-slate-50 hover:border-cyan-300/40 hover:bg-cyan-300/10"
    : "border-slate-200 bg-white text-slate-950 hover:border-blue-300 hover:bg-blue-50/70";
}

function getDetailToneClasses(tone = "neutral", darkMode = false) {
  if (tone === "critical") {
    return darkMode
      ? "border-rose-300/30 bg-rose-300/10"
      : "border-rose-200 bg-rose-50/90";
  }

  if (tone === "warning") {
    return darkMode
      ? "border-amber-300/30 bg-amber-300/10"
      : "border-amber-200 bg-amber-50/90";
  }

  return darkMode
    ? "border-cyan-300/25 bg-cyan-300/10"
    : "border-blue-200 bg-blue-50/80";
}

export function ExpandableMetricGroup({ title, metrics = [], darkMode = false }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const expandedRevealRef = useRevealHighlight(expanded, {
    radius: "22px",
    delay: 160,
    scrollIntoView: true,
    block: "nearest",
  });
  const detailRevealRef = useRevealHighlight(Boolean(selectedMetric), {
    radius: "22px",
    delay: 120,
    triggerKey: selectedMetric?.id || selectedMetric?.label || "metric-detail",
  });
  const safeMetrics = Array.isArray(metrics) ? metrics.filter(Boolean) : [];

  if (!safeMetrics.length) return null;

  return (
    <section className={`w-full min-w-0 rounded-3xl border p-4 shadow-sm ${darkMode ? "border-white/10 bg-slate-900/90 text-slate-50 shadow-[0_18px_50px_rgba(0,0,0,0.28)]" : "border-slate-200/80 bg-white/90 text-slate-950 shadow-[0_16px_45px_rgba(15,23,42,0.06)]"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title ? (
          <h3 className={`text-xs font-bold uppercase tracking-[0.14em] ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            {title}
          </h3>
        ) : null}

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? "Close section" : "Expand section"}
          className={`inline-flex min-h-9 items-center justify-center rounded-xl border ${expanded ? "w-10 px-0 text-lg leading-none" : "px-3 py-1.5 text-xs"} font-semibold transition-all duration-200 ${darkMode ? "border-white/10 bg-slate-800 text-slate-100 hover:border-cyan-300/40 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}
        >
          {expanded ? <span aria-hidden="true">&times;</span> : "Expand"}
        </button>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {safeMetrics.map((metric) => (
          <button
            key={metric.id || metric.label}
            type="button"
            onClick={() => setSelectedMetric(metric)}
            className={`min-w-0 rounded-2xl border p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md ${getMetricToneClasses(metric.tone, darkMode)}`}
          >
            <p className={`text-[10px] font-bold uppercase tracking-[0.1em] ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
              {metric.shortLabel || metric.label}
            </p>

            <div className="mt-2 flex min-w-0 flex-wrap items-end gap-x-1.5 gap-y-0.5">
              <p className={`text-2xl font-semibold tracking-tight ${darkMode ? "text-slate-50" : "text-slate-950"}`}>
                {metric.value}
              </p>
              {metric.unit ? (
                <p className={`pb-1 text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                  {metric.unit}
                </p>
              ) : null}
            </div>

            {metric.note ? (
              <p className={`mt-1 line-clamp-2 text-xs leading-5 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                {metric.note}
              </p>
            ) : null}
          </button>
        ))}
      </div>

      {expanded ? (
        <div
          ref={expandedRevealRef}
          className="ui-reveal-target mt-4 grid gap-3 rounded-2xl md:grid-cols-2"
          style={{ "--reveal-radius": "22px" }}
        >
          {safeMetrics.map((metric) => (
            <div
              key={`expanded-${metric.id || metric.label}`}
              className={`rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50/90"}`}
            >
              <p className={`text-xs font-bold uppercase tracking-[0.14em] ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                {metric.label}
              </p>
              <p className={`mt-2 text-2xl font-semibold ${darkMode ? "text-slate-50" : "text-slate-950"}`}>
                {metric.value}{metric.unit ? ` ${metric.unit}` : ""}
              </p>
              {metric.description ? (
                <p className={`mt-2 text-sm leading-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  {metric.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {selectedMetric ? (
        <div
          ref={detailRevealRef}
          className={`ui-reveal-target mt-4 rounded-2xl border p-4 ${getDetailToneClasses(selectedMetric.tone, darkMode)}`}
          style={{ "--reveal-radius": "22px" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-xs font-bold uppercase tracking-[0.14em] ${darkMode ? "text-cyan-100" : "text-blue-800"}`}>
                {selectedMetric.label}
              </p>
              <p className={`mt-2 text-2xl font-semibold ${darkMode ? "text-slate-50" : "text-slate-950"}`}>
                {selectedMetric.value}{selectedMetric.unit ? ` ${selectedMetric.unit}` : ""}
              </p>
              {selectedMetric.description ? (
                <p className={`mt-2 text-sm leading-6 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                  {selectedMetric.description}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setSelectedMetric(null)}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${darkMode ? "border-white/10 bg-slate-800 text-slate-100 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
