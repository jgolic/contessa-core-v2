"use client";

export function CrewCvPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-2xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-100"
    >
      Print CV
    </button>
  );
}
