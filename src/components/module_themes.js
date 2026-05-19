export const moduleThemes = {
  dashboard: {
    label: "Dashboard",
    accent: "text-cyan-700 dark:text-cyan-200",
    border: "border-cyan-300/45 dark:border-cyan-300/35",
    bg: "bg-cyan-50/70 dark:bg-cyan-300/10",
    glow: "shadow-[0_0_28px_rgba(34,211,238,0.14)]",
    active: "border-cyan-300/60 bg-cyan-50/80 text-cyan-900 shadow-[0_0_28px_rgba(34,211,238,0.14)] dark:border-cyan-300/40 dark:bg-cyan-300/10 dark:text-cyan-100",
    chip: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-100",
  },
  tasks: {
    label: "Tasks",
    accent: "text-blue-700 dark:text-blue-200",
    border: "border-blue-300/45 dark:border-blue-300/35",
    bg: "bg-blue-50/70 dark:bg-blue-300/10",
    glow: "shadow-[0_0_28px_rgba(59,130,246,0.14)]",
    active: "border-blue-300/60 bg-blue-50/80 text-blue-900 shadow-[0_0_28px_rgba(59,130,246,0.14)] dark:border-blue-300/40 dark:bg-blue-300/10 dark:text-blue-100",
    chip: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-300/30 dark:bg-blue-300/10 dark:text-blue-100",
  },
  approvals: {
    label: "Approvals",
    accent: "text-amber-700 dark:text-amber-200",
    border: "border-amber-300/50 dark:border-amber-300/35",
    bg: "bg-amber-50/75 dark:bg-amber-300/10",
    glow: "shadow-[0_0_28px_rgba(251,191,36,0.14)]",
    active: "border-amber-300/70 bg-amber-50/85 text-amber-900 shadow-[0_0_28px_rgba(251,191,36,0.14)] dark:border-amber-300/40 dark:bg-amber-300/10 dark:text-amber-100",
    chip: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100",
  },
  crew: {
    label: "Crew",
    accent: "text-teal-700 dark:text-teal-200",
    border: "border-teal-300/45 dark:border-teal-300/35",
    bg: "bg-teal-50/70 dark:bg-teal-300/10",
    glow: "shadow-[0_0_28px_rgba(45,212,191,0.14)]",
    active: "border-teal-300/60 bg-teal-50/80 text-teal-900 shadow-[0_0_28px_rgba(45,212,191,0.14)] dark:border-teal-300/40 dark:bg-teal-300/10 dark:text-teal-100",
    chip: "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-300/30 dark:bg-teal-300/10 dark:text-teal-100",
  },
  route: {
    label: "Route",
    accent: "text-sky-700 dark:text-sky-200",
    border: "border-sky-300/45 dark:border-sky-300/35",
    bg: "bg-sky-50/70 dark:bg-sky-300/10",
    glow: "shadow-[0_0_28px_rgba(56,189,248,0.14)]",
    active: "border-sky-300/60 bg-sky-50/80 text-sky-900 shadow-[0_0_28px_rgba(56,189,248,0.14)] dark:border-sky-300/40 dark:bg-sky-300/10 dark:text-sky-100",
    chip: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-300/30 dark:bg-sky-300/10 dark:text-sky-100",
  },
  documents: {
    label: "Documents",
    accent: "text-slate-700 dark:text-slate-200",
    border: "border-slate-300/50 dark:border-slate-300/25",
    bg: "bg-slate-50/80 dark:bg-slate-300/10",
    glow: "shadow-[0_0_28px_rgba(148,163,184,0.10)]",
    active: "border-slate-300/70 bg-slate-50/90 text-slate-950 shadow-[0_0_28px_rgba(148,163,184,0.12)] dark:border-slate-300/30 dark:bg-slate-300/10 dark:text-slate-100",
    chip: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-300/20 dark:bg-slate-300/10 dark:text-slate-200",
  },
  alerts: {
    label: "Alerts",
    accent: "text-rose-700 dark:text-rose-200",
    border: "border-rose-300/45 dark:border-rose-300/30",
    bg: "bg-rose-50/70 dark:bg-rose-400/10",
    glow: "shadow-[0_0_28px_rgba(244,63,94,0.12)]",
    active: "border-rose-300/60 bg-rose-50/80 text-rose-900 shadow-[0_0_28px_rgba(244,63,94,0.12)] dark:border-rose-300/35 dark:bg-rose-400/10 dark:text-rose-100",
    chip: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-100",
  },
  fleet: {
    label: "Fleet",
    accent: "text-indigo-700 dark:text-indigo-200",
    border: "border-indigo-300/40 dark:border-indigo-300/30",
    bg: "bg-indigo-50/60 dark:bg-indigo-300/10",
    glow: "shadow-[0_0_28px_rgba(99,102,241,0.12)]",
    active: "border-indigo-300/55 bg-indigo-50/75 text-indigo-900 shadow-[0_0_28px_rgba(99,102,241,0.12)] dark:border-indigo-300/35 dark:bg-indigo-300/10 dark:text-indigo-100",
    chip: "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-300/25 dark:bg-indigo-300/10 dark:text-indigo-100",
  },
};

export function getModuleTheme(key = "dashboard") {
  return moduleThemes[key] || moduleThemes.dashboard;
}

export function moduleThemeKeyForView(view = "command") {
  if (view === "tasks-maintenance") return "tasks";
  if (view === "expenses-approvals") return "approvals";
  if (view === "crew-certificates") return "crew";
  if (view === "route") return "route";
  if (view === "documents") return "documents";
  if (view === "notifications") return "alerts";
  if (view === "settings") return "fleet";
  return "dashboard";
}

export function moduleThemeKeyForResult(result = {}) {
  const text = `${result.type || ""} ${result.title || ""} ${result.context || ""}`.toLowerCase();
  if (/approval|quote|expense|spend|money/.test(text)) return "approvals";
  if (/crew|certificate|cert/.test(text)) return "crew";
  if (/route|waypoint|chart|navigation/.test(text)) return "route";
  if (/document|docs|file|manual|crew list/.test(text)) return "documents";
  if (/alert|warning|critical|danger/.test(text)) return "alerts";
  if (/task|maintenance|work order/.test(text)) return "tasks";
  return "dashboard";
}
