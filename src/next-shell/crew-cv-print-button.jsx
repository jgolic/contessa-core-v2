"use client";

export function CrewCvPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-2xl border border-navy-300 bg-navy-50 px-4 py-2 text-sm font-semibold text-navy-800  transition hover:bg-navy-100 dark:border-navy-300/30 dark:bg-navy-300/10 dark:text-navy-100"
    >
      Print CV
    </button>
  );
}
