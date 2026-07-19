"use client";

import { useState } from "react";
import { useRevealHighlight } from "../hooks/useRevealHighlight.js";

function getMetricToneClasses(tone = "neutral", darkMode = false) {
  if (tone === "critical") {
    return darkMode
      ? "border-accent-300/30 bg-accent-300/10 text-accent-100 hover:border-accent-300/45 hover:bg-accent-300/15"
      : "border-accent-200 bg-accent-50/90 text-accent-900 hover:border-accent-300 hover:bg-accent-50";
  }

  if (tone === "warning") {
    return darkMode
      ? "border-warn-300/30 bg-warn-300/10 text-warn-100 hover:border-warn-300/45 hover:bg-warn-300/15"
      : "border-warn-200 bg-warn-50/90 text-warn-900 hover:border-warn-300 hover:bg-warn-50";
  }

  return darkMode
    ? "border-white/10 bg-slate-800/80 text-slate-50 hover:border-navy-300/40 hover:bg-navy-300/10"
    : "border-slate-200 bg-white text-slate-950 hover:border-navy-300 hover:bg-navy-50/70";
}

function getDetailToneClasses(tone = "neutral", darkMode = false) {
  if (tone === "critical") {
    return darkMode
      ? "border-accent-300/30 bg-accent-300/10"
      : "border-accent-200 bg-accent-50/90";
  }

  if (tone === "warning") {
    return darkMode
      ? "border-warn-300/30 bg-warn-300/10"
      : "border-warn-200 bg-warn-50/90";
  }

  return darkMode
    ? "border-navy-300/25 bg-navy-300/10"
    : "border-navy-200 bg-navy-50/80";
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
    <section className={`w-full min-w-0 rounded-3xl border p-4  ${darkMode ? "border-white/10 bg-slate-900/90 text-slate-50 " : "border-slate-200/80 bg-white/90 text-slate-950 "}`}>
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
          className={`inline-flex min-h-9 items-center justify-center rounded-xl border ${expanded ? "w-10 px-0 text-lg leading-none" : "px-3 py-1.5 text-xs"} font-semibold transition-all duration-200 ${darkMode ? "border-white/10 bg-slate-800 text-slate-100 hover:border-navy-300/40 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:border-navy-300 hover:bg-navy-50"}`}
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
            className={`min-w-0 rounded-2xl border p-3 text-left  transition-all duration-200 hover:-translate-y-[1px]  ${getMetricToneClasses(metric.tone, darkMode)}`}
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
              <p className={`text-xs font-bold uppercase tracking-[0.14em] ${darkMode ? "text-navy-100" : "text-navy-800"}`}>
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
