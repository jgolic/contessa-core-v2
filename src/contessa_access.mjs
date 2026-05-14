export const APP_MODULES = [
  { key: "today", label: "Dashboard" },
  { key: "dashboard", label: "Dashboard Analytics" },
  { key: "route", label: "Route" },
  { key: "tasks", label: "Tasks" },
  { key: "expenses", label: "Approval" },
  { key: "maintenance", label: "Tasks" },
  { key: "crew", label: "Crew" },
  { key: "certificates", label: "Crew" },
  { key: "documents", label: "Docs" },
  { key: "notifications", label: "Notifications" },
  { key: "settings", label: "Settings" },
];

export const ROLE_DEFINITIONS = {
  owner: {
    label: "Owner",
    modules: APP_MODULES.map((module) => module.key),
    taskScope: "all",
    departments: ["all"],
  },
  manager: {
    label: "Manager",
    modules: ["today", "dashboard", "route", "tasks", "expenses", "maintenance", "crew", "certificates", "documents", "notifications", "settings"],
    taskScope: "all",
    departments: ["all"],
  },
  captain: {
    label: "Captain",
    modules: ["today", "dashboard", "route", "tasks", "expenses", "maintenance", "crew", "certificates", "documents", "notifications", "settings"],
    taskScope: "all",
    departments: ["all"],
  },
  chief_engineer: {
    label: "Chief Engineer",
    modules: ["today", "dashboard", "tasks", "expenses", "maintenance", "notifications"],
    taskScope: "department_or_assigned",
    departments: ["engineering"],
  },
  engineer: {
    label: "Engineer",
    modules: ["today", "dashboard", "tasks", "expenses", "maintenance", "notifications"],
    taskScope: "department_or_assigned",
    departments: ["engineering"],
  },
  first_mate: {
    label: "First Mate",
    modules: ["today", "dashboard", "route", "tasks", "maintenance", "notifications"],
    taskScope: "department_or_assigned",
    departments: ["deck"],
  },
  bosun: {
    label: "Bosun",
    modules: ["today", "dashboard", "tasks", "maintenance", "notifications"],
    taskScope: "department_or_assigned",
    departments: ["deck"],
  },
  chief_stewardess: {
    label: "Chief Stewardess",
    modules: ["today", "dashboard", "tasks", "maintenance", "notifications"],
    taskScope: "department_or_assigned",
    departments: ["interior"],
  },
  stewardess: {
    label: "Stewardess",
    modules: ["today", "dashboard", "tasks", "maintenance", "notifications"],
    taskScope: "department_or_assigned",
    departments: ["interior"],
  },
  guest: {
    label: "Guest",
    modules: ["today", "dashboard", "route", "documents", "notifications"],
    taskScope: "all",
    departments: ["all"],
  },
  deckhand: {
    label: "Deckhand",
    modules: ["today", "dashboard", "tasks", "maintenance", "notifications"],
    taskScope: "assigned_only",
    departments: ["deck"],
  },
  junior_crew: {
    label: "Junior Crew",
    modules: ["today", "dashboard", "tasks", "maintenance", "documents", "notifications"],
    taskScope: "assigned_only",
    departments: [],
  },
};

export const ROLE_OPTIONS = Object.entries(ROLE_DEFINITIONS).map(([value, definition]) => ({
  value,
  label: definition.label,
}));

export const DEMO_ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "captain", label: "Captain" },
  { value: "first_mate", label: "First Mate" },
  { value: "engineer", label: "Engineer" },
  { value: "bosun", label: "Bosun" },
  { value: "deckhand", label: "Deckhand" },
  { value: "stewardess", label: "Stewardess" },
  { value: "guest", label: "Guest" },
];

const ENGINEERING_AREAS = ["engine room", "engine", "lazarette", "tender garage"];
const DECK_AREAS = ["bow", "stern", "port side", "starboard side", "foredeck", "aft deck", "main deck", "upper deck", "sun deck", "swim platform"];
const INTERIOR_AREAS = ["crew quarters", "guest cabin", "master cabin", "galley", "saloon"];

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

export function inferTaskDepartment(task = {}) {
  const explicitDepartment = normalizeValue(task.department);
  if (explicitDepartment) return explicitDepartment;

  const area = normalizeValue(task.area);
  if (ENGINEERING_AREAS.includes(area)) return "engineering";
  if (DECK_AREAS.includes(area)) return "deck";
  if (INTERIOR_AREAS.includes(area)) return "interior";
  if (area === "bridge" || area === "wheelhouse") return "bridge";
  return "general";
}

export function getRoleDefinition(roleKey) {
  return ROLE_DEFINITIONS[normalizeValue(roleKey)] || null;
}

export function canAccessModule(roleKey, moduleKey) {
  const role = getRoleDefinition(roleKey);
  if (!role) return false;
  return role.modules.includes(normalizeValue(moduleKey));
}

export function getVisibleModulesForRole(roleKey) {
  const role = getRoleDefinition(roleKey);
  if (!role) return [];
  return APP_MODULES.filter((module) => role.modules.includes(module.key));
}

export function canAccessTask(roleKey, task = {}, actorName = "") {
  const role = getRoleDefinition(roleKey);
  if (!role) return false;
  if (role.taskScope === "all") return true;

  const normalizedActor = normalizeValue(actorName);
  const normalizedAssignee = normalizeValue(task.assignee);
  const isAssigned = Boolean(normalizedActor) && normalizedActor === normalizedAssignee;

  if (role.taskScope === "assigned_only") return isAssigned;

  const department = inferTaskDepartment(task);
  const departmentMatch = role.departments.includes("all") || role.departments.includes(department);
  return departmentMatch || isAssigned;
}

export function inferCrewDepartment(profile = {}) {
  return normalizeValue(profile.department) || "general";
}

export function canAccessCrewProfile(roleKey, profile = {}, actorName = "") {
  const role = getRoleDefinition(roleKey);
  if (!role) return false;

  const normalizedActor = normalizeValue(actorName);
  const profileName = normalizeValue(profile.fullName);
  const isOwnProfile = Boolean(normalizedActor) && normalizedActor === profileName;
  if (isOwnProfile) return true;

  if (!role.modules.includes("crew") && !role.modules.includes("certificates")) {
    return false;
  }

  if (role.taskScope === "all") return true;

  const department = inferCrewDepartment(profile);
  return role.departments.includes("all") || role.departments.includes(department);
}
