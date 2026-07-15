export const WORKSPACE_VIEW_PARAM = "view";

const VIEW_CONFIG = {
  bridge: { moduleName: "command" },
  tasks: { moduleName: "tasks-maintenance", options: { panel: "tasks" } },
  maintenance: { moduleName: "tasks-maintenance", options: { panel: "maintenance" } },
  approve: { moduleName: "expenses-approvals", options: { bucket: "boat" } },
  "crew-expenses": { moduleName: "expenses-approvals", options: { bucket: "crew" } },
  crew: { moduleName: "crew-certificates", options: { panel: "crew" } },
  certificates: { moduleName: "crew-certificates", options: { panel: "certificates" } },
  vault: { moduleName: "documents" },
  route: { moduleName: "route" },
  alerts: { moduleName: "notifications" },
  settings: { moduleName: "settings" },
};

export function parseWorkspaceView(search = "") {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  const view = String(params.get(WORKSPACE_VIEW_PARAM) || "bridge").toLowerCase();
  return VIEW_CONFIG[view] ? { view, ...VIEW_CONFIG[view] } : { view: "bridge", ...VIEW_CONFIG.bridge };
}

export function getWorkspaceView(moduleName = "command", options = {}) {
  if (moduleName === "tasks-maintenance") return options.panel === "maintenance" ? "maintenance" : "tasks";
  if (moduleName === "expenses-approvals") return options.bucket === "crew" ? "crew-expenses" : "approve";
  if (moduleName === "crew-certificates") return options.panel === "certificates" ? "certificates" : "crew";

  return {
    command: "bridge",
    documents: "vault",
    route: "route",
    notifications: "alerts",
    settings: "settings",
  }[moduleName] || "bridge";
}

export function updateWorkspaceViewUrl(currentUrl, moduleName, options = {}) {
  const url = new URL(currentUrl);
  const view = getWorkspaceView(moduleName, options);

  if (view === "bridge") url.searchParams.delete(WORKSPACE_VIEW_PARAM);
  else url.searchParams.set(WORKSPACE_VIEW_PARAM, view);

  return `${url.pathname}${url.search}${url.hash}`;
}
