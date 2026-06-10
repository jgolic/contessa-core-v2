export const STATUS_OPTIONS = ["pending", "ongoing", "completed"];
export const TASK_STATUS_OPTIONS = ["pending", "ongoing", "waiting-approval", "blocked", "completed", "approved", "declined"];
export const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
export const ASSIGNEE_OPTIONS = ["Captain Graham Ellis", "Oliver Reed", "Marko Vukovic", "Daniel Price", "Elena Kovac", "Marcus Bell", "Nina Hayes", "Adrian Cole", "Leo Grant", "Mia Laurent", "Tomas Reed"];
export const TASK_DEPARTMENT_OPTIONS = ["General", "Deck", "Engineering", "Interior", "Bridge", "Admin"];
export const CREW_DEPARTMENT_OPTIONS = ["Deck", "Engineering", "Interior", "Bridge", "Admin"];
export const CREW_RANK_OPTIONS = [
  "Owner",
  "Manager",
  "Captain",
  "Chief Engineer",
  "Engineer",
  "Chief Mate",
  "First Mate",
  "Bosun",
  "Chief Stewardess",
  "Stewardess",
  "Deckhand",
  "Junior Crew",
];
import { getCertificateExpiryMeta, normalizeCertificateRecord } from "./contessa_certificate_extraction.mjs";
import {
  calculateRoutePassageSummary,
  createEmptyRoutePlanningState,
  normalizeVesselProfile,
  normalizeRoutePlanningState,
  routePlanningHasContent,
} from "./lib/route_planning.mjs";
import { getStoredJson, getStoredString } from "./lib/browser_storage.mjs";
import { getRuntimePublicAppUrl } from "./lib/runtime_config.mjs";

export const CERTIFICATE_ALERT_WINDOWS = [90, 60, 30];
export const YACHT_AREA_OPTIONS = [
  "Bow",
  "Stern",
  "Port Side",
  "Starboard Side",
  "Foredeck",
  "Aft Deck",
  "Main Deck",
  "Upper Deck",
  "Sun Deck",
  "Swim Platform",
  "Bridge",
  "Wheelhouse",
  "Engine Room",
  "Lazarette",
  "Crew Quarters",
  "Guest Cabin",
  "Master Cabin",
  "Galley",
  "Saloon",
  "Tender Garage",
];
export const MONEY_STATUS_OPTIONS = ["requested", "received", "approved", "declined", "paid"];
export const APPROVAL_OPTIONS = ["pending", "approved", "rejected"];
export const VESSEL_STATE_MODE_OPTIONS = [
  { value: "guest-arrival", label: "Guest Arrival" },
  { value: "yard-refit", label: "Yard / Refit" },
  { value: "underway", label: "Underway" },
  { value: "standby", label: "Standby" },
  { value: "critical", label: "Critical" },
];

export function getCrewDisplayName(person = {}) {
  return (
    person.name ||
    person.fullName ||
    [person.firstName, person.lastName].filter(Boolean).join(" ") ||
    ""
  ).trim();
}

function getCrewRoleLabel(person = {}) {
  return person.position || person.title || person.rank || person.role || "Crew";
}

function getScopedCrewList(vessel = {}) {
  if (Array.isArray(vessel?.crew)) return vessel.crew;
  if (Array.isArray(vessel?.crewProfiles)) return vessel.crewProfiles;
  if (Array.isArray(vessel?.workers)) return vessel.workers;
  return [];
}

function normalizeCrewMatchValue(value = "") {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function getCrewOptionsForVessel(vessel = {}) {
  return getScopedCrewList(vessel)
    .map((person) => {
      const label = getCrewDisplayName(person) || "Unnamed crew";
      return {
        id: person.id || label,
        label,
        value: label,
        role: getCrewRoleLabel(person),
        department: person.department || "General",
      };
    })
    .filter((option) => option.value);
}

export function findCrewByName(vessel = {}, assignedTo = "") {
  const normalizedAssignedTo = normalizeCrewMatchValue(assignedTo);
  if (!normalizedAssignedTo) return null;

  return getScopedCrewList(vessel).find((person) => {
    const name = getCrewDisplayName(person);
    const role = getCrewRoleLabel(person);
    const normalizedName = normalizeCrewMatchValue(name);
    const normalizedRoleName = normalizeCrewMatchValue(`${role} ${name}`);
    return normalizedAssignedTo === normalizedName || normalizedAssignedTo === normalizedRoleName || normalizedAssignedTo === normalizeCrewMatchValue(person.id);
  }) || null;
}

export function validateAssignedCrewBelongsToVessel(vessel = {}, assignedTo = "") {
  if (!String(assignedTo || "").trim()) return true;
  return Boolean(findCrewByName(vessel, assignedTo));
}

export function getVesselScopedOptions(currentVessel = {}) {
  return {
    crew: getScopedCrewList(currentVessel),
    tasks: Array.isArray(currentVessel?.tasks) ? currentVessel.tasks : [],
    maintenance: Array.isArray(currentVessel?.maintenanceItems) ? currentVessel.maintenanceItems : Array.isArray(currentVessel?.maintenance) ? currentVessel.maintenance : [],
    approvals: Array.isArray(currentVessel?.approvals) ? currentVessel.approvals : [],
    expenses: Array.isArray(currentVessel?.expenses) ? currentVessel.expenses : Array.isArray(currentVessel?.crewExpenses) ? currentVessel.crewExpenses : [],
    documents: Array.isArray(currentVessel?.documents) ? currentVessel.documents : [],
    certificates: Array.isArray(currentVessel?.certificates) ? currentVessel.certificates : [],
    route: currentVessel?.route || currentVessel?.routePlanning || null,
  };
}
export const PAYMENT_OPTIONS = ["unpaid", "paid"];
export const REJECTION_HOLD_MS = 24 * 60 * 60 * 1000;
export const DECLINED_HOLD_MS = 10 * 60 * 1000;
export const MAINTENANCE_FREQUENCIES = [
  { months: 1, label: "Every month" },
  { months: 2, label: "Every 2 months" },
  { months: 3, label: "Every 3 months" },
  { months: 6, label: "Every 6 months" },
  { months: 12, label: "Every year" },
];
export const MAINTENANCE_AREA_OPTIONS = [
  "Bow",
  "Stern",
  "Foredeck",
  "Aft deck",
  "Swim platform",
  "Flybridge",
  "Bridge / Wheelhouse",
  "Main deck",
  "Upper deck",
  "Engine room",
  "Generator room",
  "Lazarette",
  "Garage",
  "Tender garage",
  "Crew area",
  "Crew cabins",
  "Guest cabins",
  "Master cabin",
  "Galley",
  "Pantry",
  "Salon",
  "Dining area",
  "Interior",
  "Exterior",
  "Hull",
  "Superstructure",
  "Waterline",
  "Bilge",
  "Anchor locker",
  "Chain locker",
  "Thruster tunnel",
  "HVAC",
  "Electrical room",
  "Navigation equipment",
  "Safety equipment",
  "Plumbing",
  "Tanks",
  "Other",
];
export const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$", label: "USD $" },
  { code: "EUR", symbol: "EUR ", label: "EUR" },
  { code: "GBP", symbol: "GBP ", label: "GBP" },
  { code: "AED", symbol: "AED ", label: "AED" },
];
export const FALLBACK_USD_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.6725,
};
export const APP_STATE_VERSION = 3;
export const STORAGE_KEY = "contessa-mobile-task-app-v4";
export const PUBLIC_APP_URL_OVERRIDE_KEY = `${STORAGE_KEY}-public-app-url-override`;
export const APP_LEGAL_SHORT_COPY = "© 2026 Josip Golic · Proprietary";
export const APP_LEGAL_COPY = "This application, including its design, workflows, structure, content, and source code, is proprietary intellectual property of Josip Golic. Unauthorized copying, reproduction, modification, distribution, reverse engineering, or use is prohibited without prior written permission.";
export const APP_FOOTER_NOTICE = "Proprietary software © 2026 Josip Golic";
const DEFAULT_FLEET_VESSEL_ID = "contessa";
const CONTESSA_DEMO_SEED_VERSION = 4;
const OCTOPUSSY_DEMO_SEED_VERSION = 4;
const DEFAULT_VESSEL_STATES = {
  contessa: {
    mode: "yard-refit",
    mood: "pressure",
    ownerVisibility: "calm-summary",
    captainStyle: "strict-maintenance",
    primaryFocus: "Yard works and departure readiness",
    confidenceScore: 74,
  },
  octopussy: {
    mode: "guest-arrival",
    mood: "calm",
    ownerVisibility: "calm-summary",
    captainStyle: "strict-maintenance",
    primaryFocus: "Guest arrival preparation",
    confidenceScore: 89,
  },
  default: {
    mode: "standby",
    mood: "calm",
    ownerVisibility: "calm-summary",
    captainStyle: "strict-maintenance",
    primaryFocus: "Routine vessel readiness",
    confidenceScore: 86,
  },
};
const VESSEL_THEME_PRESETS = {
  contessa: {
    name: "Contessa",
    primary: "#16786e",
    secondary: "#2d8f82",
    accent: "#59b697",
    primarySoft: "rgba(22, 120, 110, 0.12)",
    primaryMuted: "#2d8f82",
    accentSoft: "rgba(89, 182, 151, 0.14)",
    border: "rgba(22, 120, 110, 0.22)",
    ring: "rgba(89, 182, 151, 0.28)",
    bgStart: "#eef7f3",
    bgEnd: "#f8fbf9",
    card: "rgba(255,255,255,0.68)",
    cardStrong: "rgba(255,255,255,0.78)",
    textAccent: "#166155",
    backgroundLight: "radial-gradient(circle at top left, rgba(69, 161, 141, 0.14), transparent 28%), radial-gradient(circle at 84% 4%, rgba(213, 188, 124, 0.12), transparent 20%), linear-gradient(180deg, #f7fbf9 0%, #eef5f1 48%, #e8f0eb 100%)",
    backgroundDark: "radial-gradient(circle at top left, rgba(24, 114, 102, 0.24), transparent 24%), radial-gradient(circle at 86% 4%, rgba(198, 163, 91, 0.09), transparent 14%), linear-gradient(180deg, #071015 0%, #0b141a 42%, #091118 100%)",
    cardLight: "rgba(255,255,255,0.68)",
    cardDark: "rgba(8,18,24,0.72)",
    bgDarkStart: "#03130f",
    bgDarkEnd: "#061c1a",
    cardDarkStrong: "rgba(8,31,28,0.88)",
    borderDark: "rgba(45, 212, 191, 0.16)",
    textAccentDark: "#5eead4",
    textPrimaryDark: "#ecf7f4",
    textSecondaryDark: "rgba(226, 240, 236, 0.88)",
    primaryDark: "#2dd4bf",
    primarySoftDark: "rgba(45, 212, 191, 0.11)",
    glowDark: "rgba(20, 184, 166, 0.20)",
  },
  octopussy: {
    name: "Octopussy",
    primary: "#2563eb",
    secondary: "#3b82f6",
    accent: "#0ea5e9",
    primarySoft: "rgba(37, 99, 235, 0.12)",
    primaryMuted: "#3b82f6",
    accentSoft: "rgba(14, 165, 233, 0.14)",
    border: "rgba(37, 99, 235, 0.22)",
    ring: "rgba(14, 165, 233, 0.28)",
    bgStart: "#eef6ff",
    bgEnd: "#f8fbff",
    card: "rgba(255,255,255,0.7)",
    cardStrong: "rgba(255,255,255,0.8)",
    textAccent: "#1e5f99",
    backgroundLight: "radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 30%), radial-gradient(circle at 82% 6%, rgba(14, 165, 233, 0.12), transparent 20%), linear-gradient(180deg, #eef6ff 0%, #f3f8ff 48%, #f8fbff 100%)",
    backgroundDark: "radial-gradient(circle at top left, rgba(30,64,175,0.08), transparent 35%), linear-gradient(135deg, #010814 0%, #04111f 45%, #061626 100%)",
    cardLight: "rgba(255,255,255,0.7)",
    cardDark: "rgba(6, 18, 34, 0.82)",
    bgDarkStart: "#010814",
    bgDarkEnd: "#04111f",
    cardDarkStrong: "rgba(5, 20, 38, 0.90)",
    borderDark: "rgba(96, 165, 250, 0.18)",
    textAccentDark: "#93c5fd",
    textPrimaryDark: "#e5edf8",
    textSecondaryDark: "rgba(226, 232, 240, 0.88)",
    primaryDark: "#3b82f6",
    primarySoftDark: "rgba(59, 130, 246, 0.08)",
    glowDark: "rgba(37, 99, 235, 0.10)",
  },
  burgundy: {
    name: "Burgundy",
    primary: "#7e4657",
    secondary: "#94606f",
    accent: "#c6919a",
    primarySoft: "rgba(126, 70, 87, 0.12)",
    primaryMuted: "#94606f",
    accentSoft: "rgba(198, 145, 154, 0.14)",
    border: "rgba(126, 70, 87, 0.22)",
    ring: "rgba(198, 145, 154, 0.28)",
    bgStart: "#f8f1f3",
    bgEnd: "#fcf7f8",
    card: "rgba(255,255,255,0.69)",
    cardStrong: "rgba(255,255,255,0.79)",
    textAccent: "#7e4657",
    backgroundLight: "radial-gradient(circle at top left, rgba(180, 115, 132, 0.16), transparent 30%), radial-gradient(circle at 84% 6%, rgba(232, 206, 214, 0.18), transparent 22%), linear-gradient(180deg, #fcf7f8 0%, #f6edef 48%, #f0e6e8 100%)",
    backgroundDark: "radial-gradient(circle at top left, rgba(126, 70, 87, 0.26), transparent 24%), radial-gradient(circle at 84% 4%, rgba(198, 145, 154, 0.12), transparent 16%), linear-gradient(180deg, #140d12 0%, #1b1117 44%, #120b10 100%)",
    cardLight: "rgba(255,255,255,0.69)",
    cardDark: "rgba(24,14,20,0.74)",
    bgDarkStart: "#160a0f",
    bgDarkEnd: "#261018",
    cardDarkStrong: "rgba(42,18,28,0.88)",
    borderDark: "rgba(190, 113, 136, 0.17)",
    textAccentDark: "#f0bdc9",
    textPrimaryDark: "#f2e7eb",
    textSecondaryDark: "rgba(233, 221, 226, 0.88)",
    primaryDark: "#d38ca0",
    primarySoftDark: "rgba(211, 140, 160, 0.12)",
    glowDark: "rgba(168, 85, 107, 0.20)",
  },
  champagne: {
    name: "Champagne",
    primary: "#9a7a3f",
    secondary: "#b39152",
    accent: "#d7be82",
    primarySoft: "rgba(154, 122, 63, 0.12)",
    primaryMuted: "#b39152",
    accentSoft: "rgba(215, 190, 130, 0.14)",
    border: "rgba(154, 122, 63, 0.22)",
    ring: "rgba(215, 190, 130, 0.28)",
    bgStart: "#f8f1e6",
    bgEnd: "#fcfaf5",
    card: "rgba(255,255,255,0.72)",
    cardStrong: "rgba(255,255,255,0.82)",
    textAccent: "#8d6b34",
    backgroundLight: "radial-gradient(circle at top left, rgba(215, 190, 130, 0.18), transparent 28%), radial-gradient(circle at 84% 6%, rgba(245, 234, 201, 0.22), transparent 22%), linear-gradient(180deg, #fcfaf5 0%, #f7f1e6 48%, #f1eadc 100%)",
    backgroundDark: "radial-gradient(circle at top left, rgba(154, 122, 63, 0.22), transparent 24%), radial-gradient(circle at 84% 4%, rgba(215, 190, 130, 0.11), transparent 16%), linear-gradient(180deg, #15110b 0%, #1c1710 44%, #141009 100%)",
    cardLight: "rgba(255,255,255,0.72)",
    cardDark: "rgba(24,20,14,0.74)",
    bgDarkStart: "#161108",
    bgDarkEnd: "#261c10",
    cardDarkStrong: "rgba(43,32,18,0.88)",
    borderDark: "rgba(217, 190, 120, 0.16)",
    textAccentDark: "#f2dfac",
    textPrimaryDark: "#f5efe0",
    textSecondaryDark: "rgba(236, 226, 207, 0.88)",
    primaryDark: "#d9be78",
    primarySoftDark: "rgba(217, 190, 120, 0.11)",
    glowDark: "rgba(180, 131, 54, 0.18)",
  },
  violet: {
    name: "Violet",
    primary: "#635d8f",
    secondary: "#7c76a8",
    accent: "#a7a1d4",
    primarySoft: "rgba(99, 93, 143, 0.12)",
    primaryMuted: "#7c76a8",
    accentSoft: "rgba(167, 161, 212, 0.14)",
    border: "rgba(99, 93, 143, 0.22)",
    ring: "rgba(167, 161, 212, 0.28)",
    bgStart: "#f0edf8",
    bgEnd: "#f8f7fc",
    card: "rgba(255,255,255,0.7)",
    cardStrong: "rgba(255,255,255,0.8)",
    textAccent: "#5c5890",
    backgroundLight: "radial-gradient(circle at top left, rgba(124, 118, 168, 0.16), transparent 30%), radial-gradient(circle at 84% 6%, rgba(224, 220, 245, 0.22), transparent 22%), linear-gradient(180deg, #f8f7fc 0%, #efedf8 48%, #e7e5f1 100%)",
    backgroundDark: "radial-gradient(circle at top left, rgba(99, 93, 143, 0.22), transparent 24%), radial-gradient(circle at 84% 4%, rgba(167, 161, 212, 0.11), transparent 16%), linear-gradient(180deg, #0f1018 0%, #151624 44%, #0d0e16 100%)",
    cardLight: "rgba(255,255,255,0.7)",
    cardDark: "rgba(16,17,30,0.74)",
    bgDarkStart: "#0b0c17",
    bgDarkEnd: "#17192d",
    cardDarkStrong: "rgba(25,27,47,0.88)",
    borderDark: "rgba(167, 161, 212, 0.17)",
    textAccentDark: "#d7d1ff",
    textPrimaryDark: "#ece9fb",
    textSecondaryDark: "rgba(227, 223, 243, 0.88)",
    primaryDark: "#b8b0ff",
    primarySoftDark: "rgba(184, 176, 255, 0.11)",
    glowDark: "rgba(124, 118, 168, 0.20)",
  },
};
const ADDITIONAL_VESSEL_THEME_SEQUENCE = ["burgundy", "champagne", "violet"];
const REQUIRED_FLEET_VESSELS = [
  {
    id: "contessa",
    name: "M/Y Contessa",
    details: {
      length: 32,
      vesselType: "Motor Yacht",
      flag: "Jamaica",
      homePort: "Fort Lauderdale / LMC Safe Harbor",
      status: "Yard / Refit",
      notes: "Independent Fort Lauderdale refit workspace.",
    },
    vesselPrintInfo: {
      displayName: "M/Y CONTESSA",
      flag: "Jamaica",
      imo: "",
      officialNumber: "",
      mmsi: "",
      callSign: "",
      identifierStatus: "pending-verification",
      portOfRegistry: "KINGSTON",
      date: "14 MAY 2026",
    },
  },
  {
    id: "octopussy",
    name: "M/Y Octopussy",
    details: {
      length: 30,
      vesselType: "Motor Yacht",
      flag: "Cayman Islands",
      homePort: "Oracabessa, Jamaica",
      status: "Guest Ready",
      notes: "Independent Jamaica guest-ready workspace.",
    },
    vesselPrintInfo: {
      displayName: "M/Y OCTOPUSSY",
      flag: "Cayman Islands",
      imo: "",
      officialNumber: "",
      mmsi: "",
      callSign: "",
      identifierStatus: "pending-verification",
      portOfRegistry: "GEORGE TOWN",
      date: "14 MAY 2026",
    },
  },
];

function cloneVesselThemePreset(name = "contessa") {
  return { ...(VESSEL_THEME_PRESETS[name] || VESSEL_THEME_PRESETS.contessa) };
}

function hexToRgbChannels(hex = "") {
  const normalized = String(hex || "").trim().replace("#", "");
  if (!/^[\da-f]{6}$/i.test(normalized)) return "22 120 110";
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `${red} ${green} ${blue}`;
}

function getImplicitThemeNameForVessel(vesselId = DEFAULT_FLEET_VESSEL_ID, customIndex = 0) {
  if (vesselId === DEFAULT_FLEET_VESSEL_ID) return "contessa";
  if (vesselId === "octopussy") return "octopussy";
  return ADDITIONAL_VESSEL_THEME_SEQUENCE[customIndex % ADDITIONAL_VESSEL_THEME_SEQUENCE.length];
}

export function normalizeVesselTheme(theme = {}, fallbackThemeName = "contessa") {
  const fallback = cloneVesselThemePreset(fallbackThemeName);
  return {
    ...fallback,
    ...(theme && typeof theme === "object" ? theme : {}),
  };
}

export function getNextFleetTheme(vessels = []) {
  const customCount = (Array.isArray(vessels) ? vessels : []).filter(
    (vessel) => vessel?.id && vessel.id !== DEFAULT_FLEET_VESSEL_ID && vessel.id !== "octopussy"
  ).length;
  return cloneVesselThemePreset(
    ADDITIONAL_VESSEL_THEME_SEQUENCE[customCount % ADDITIONAL_VESSEL_THEME_SEQUENCE.length]
  );
}

export function buildVesselThemeCssVars(theme = {}) {
  const normalizedTheme = normalizeVesselTheme(theme, "contessa");
  return {
    "--vessel-primary": normalizedTheme.primary,
    "--vessel-primary-soft": normalizedTheme.primarySoft,
    "--vessel-primary-muted": normalizedTheme.primaryMuted,
    "--vessel-secondary": normalizedTheme.secondary,
    "--vessel-accent": normalizedTheme.accent,
    "--vessel-accent-soft": normalizedTheme.accentSoft,
    "--vessel-border": normalizedTheme.border,
    "--vessel-ring": normalizedTheme.ring,
    "--vessel-primary-rgb": hexToRgbChannels(normalizedTheme.primary),
    "--vessel-secondary-rgb": hexToRgbChannels(normalizedTheme.secondary),
    "--vessel-accent-rgb": hexToRgbChannels(normalizedTheme.accent),
    "--vessel-bg-start": normalizedTheme.bgStart,
    "--vessel-bg-end": normalizedTheme.bgEnd,
    "--vessel-bg-light": normalizedTheme.backgroundLight,
    "--vessel-bg-dark": normalizedTheme.backgroundDark,
    "--vessel-card": normalizedTheme.card,
    "--vessel-card-strong": normalizedTheme.cardStrong,
    "--vessel-card-light": normalizedTheme.cardLight,
    "--vessel-card-dark": normalizedTheme.cardDark,
    "--vessel-bg-dark-start": normalizedTheme.bgDarkStart,
    "--vessel-bg-dark-end": normalizedTheme.bgDarkEnd,
    "--vessel-card-dark-strong": normalizedTheme.cardDarkStrong,
    "--vessel-border-dark": normalizedTheme.borderDark,
    "--vessel-text-accent-dark": normalizedTheme.textAccentDark,
    "--vessel-text-primary-dark": normalizedTheme.textPrimaryDark,
    "--vessel-text-secondary-dark": normalizedTheme.textSecondaryDark,
    "--vessel-primary-dark": normalizedTheme.primaryDark,
    "--vessel-primary-soft-dark": normalizedTheme.primarySoftDark,
    "--vessel-glow-dark": normalizedTheme.glowDark,
    "--vessel-text-accent": normalizedTheme.textAccent,
  };
}

function createFallbackVesselProfile(name = "Vessel") {
  return normalizeVesselProfile({ vesselName: name });
}

function getDefaultVesselPrintInfo(vesselId = DEFAULT_FLEET_VESSEL_ID, name = "M/Y Contessa") {
  if (vesselId === "octopussy") {
    return {
      displayName: "M/Y OCTOPUSSY",
      flag: "Cayman Islands",
      imo: "",
      officialNumber: "",
      mmsi: "",
      callSign: "",
      identifierStatus: "pending-verification",
      portOfRegistry: "GEORGE TOWN",
      date: "14 MAY 2026",
    };
  }

  if (vesselId === DEFAULT_FLEET_VESSEL_ID) {
    return {
      displayName: "M/Y CONTESSA",
      flag: "Jamaica",
      imo: "",
      officialNumber: "",
      mmsi: "",
      callSign: "",
      identifierStatus: "pending-verification",
      portOfRegistry: "KINGSTON",
      date: "14 MAY 2026",
    };
  }

  return {
    displayName: String(name || "VESSEL").toUpperCase(),
    flag: "",
    imo: "",
    officialNumber: "",
    mmsi: "",
    callSign: "",
    identifierStatus: "pending-verification",
    portOfRegistry: "",
    date: "14 MAY 2026",
  };
}

function normalizeVesselPrintInfo(info = {}, vesselId = DEFAULT_FLEET_VESSEL_ID, name = "M/Y Contessa") {
  const fallback = getDefaultVesselPrintInfo(vesselId, name);
  return {
    displayName: info.displayName || fallback.displayName,
    flag: info.flag || fallback.flag,
    imo: info.imo || fallback.imo,
    officialNumber: info.officialNumber || fallback.officialNumber,
    mmsi: info.mmsi || fallback.mmsi,
    callSign: info.callSign || fallback.callSign,
    identifierStatus: info.identifierStatus || fallback.identifierStatus,
    portOfRegistry: info.portOfRegistry || fallback.portOfRegistry,
    date: info.date || fallback.date,
  };
}

function buildContessaWorkspace(name = "M/Y Contessa") {
  const vesselProfile = normalizeVesselProfile({
    vesselName: name,
    draft: 2.3,
    beam: 7.4,
    cruisingSpeedKnots: 16,
    fuelBurnPerHour: 260,
    fuelCapacity: 18200,
    fuelReservePercentage: 18,
  });
  const routeSpecs = {
    lengthFeet: 97,
    beamFeet: 21,
    draftMeters: 1.95,
    cruisingSpeedKnots: 18,
    maxSpeedKnots: 28,
    fuelCapacityLitres: 8500,
    fuelBurnLitresPerHour: 260,
    reservePercent: 20,
    safeDepthMeters: 5,
    cautionDepthMeters: 3,
  };

  const crewProfiles = [
    {
      id: "CON-CRW-001",
      fullName: "Graham Ellis",
      rank: "Captain",
      department: "Bridge",
      nationality: "British",
      dateOfBirth: "12 Mar 1978",
      passportNumber: "GB1234567",
      seamansBookNumber: "SB-GB-78421",
      demoPiratePortraitUrl: "/demo-crew-pirates/graham-ellis.jpg",
      roleKey: "captain",
      notes: "Captain overseeing Fort Lauderdale yard/refit decisions.",
      certificates: [{ id: "CON-CERT-001", name: "Master 3000 GT", holderName: "Graham Ellis", issuingAuthority: "MCA", expiryDate: dateStringFromNow(84), issueDate: dateStringFromNow(-920) }],
    },
    {
      id: "CON-CRW-002",
      fullName: "Oliver Reed",
      rank: "First Mate",
      department: "Deck",
      nationality: "British",
      dateOfBirth: "04 Feb 1988",
      passportNumber: "GB7654321",
      seamansBookNumber: "SB-GB-66218",
      demoPiratePortraitUrl: "/demo-crew-pirates/oliver-reed.jpg",
      roleKey: "first_mate",
      notes: "Deck lead for hull inspection, Bahamas departure prep, and yard coordination.",
      certificates: [{ id: "CON-CERT-002", name: "STCW", holderName: "Oliver Reed", issuingAuthority: "RYA", expiryDate: dateStringFromNow(63), issueDate: dateStringFromNow(-760) }],
    },
    {
      id: "CON-CRW-003",
      fullName: "Marko Vukovic",
      rank: "Chief Engineer",
      department: "Engineering",
      nationality: "Croatian",
      dateOfBirth: "19 Sep 1982",
      passportNumber: "HR4482190",
      seamansBookNumber: "SB-HR-90314",
      demoPiratePortraitUrl: "/demo-crew-pirates/marko-vukovic.jpg",
      roleKey: "engineer",
      notes: "Engineering lead for generator load testing and shore power review.",
      certificates: [{ id: "CON-CERT-003", name: "EOOW Unlimited", holderName: "Marko Vukovic", issuingAuthority: "Liberia", expiryDate: dateStringFromNow(118), issueDate: dateStringFromNow(-860) }],
    },
    {
      id: "CON-CRW-004",
      fullName: "Daniel Price",
      rank: "Bosun",
      department: "Deck",
      nationality: "South African",
      dateOfBirth: "27 Jun 1990",
      passportNumber: "ZA9023471",
      seamansBookNumber: "SB-ZA-11873",
      demoPiratePortraitUrl: "/demo-crew-pirates/daniel-price.jpg",
      roleKey: "bosun",
      notes: "Hull photo capture, bottom paint quality, and deck readiness.",
      certificates: [{ id: "CON-CERT-004", name: "Powerboat Level 2", holderName: "Daniel Price", issuingAuthority: "RYA", expiryDate: dateStringFromNow(42), issueDate: dateStringFromNow(-510) }],
    },
    {
      id: "CON-CRW-005",
      fullName: "Elena Kovac",
      rank: "Stewardess",
      department: "Interior",
      nationality: "Croatian",
      dateOfBirth: "15 Jan 1994",
      passportNumber: "HR7712045",
      seamansBookNumber: "SB-HR-55402",
      demoPiratePortraitUrl: "/demo-crew-pirates/elena-kovac.jpg",
      roleKey: "stewardess",
      notes: "Document folder preparation and interior departure support.",
      certificates: [{ id: "CON-CERT-005", name: "ENG1", holderName: "Elena Kovac", issuingAuthority: "MCA", expiryDate: dateStringFromNow(25), issueDate: dateStringFromNow(-690) }],
    },
  ].map(normalizeCrewProfile);

  const tasks = [
    {
      id: "CON-TASK-001",
      name: "Inspect thruster tunnel coating",
      area: "Thruster tunnel",
      department: "Deck",
      assignee: "Oliver Reed",
      status: "pending",
      priority: "urgent",
      dueDate: todayDateString(),
      approvalStatus: "pending",
      notes: "Critical yard/refit decision. Confirm bow thruster tunnel coating quality before further coating work is accepted.",
      comments: [{ id: "CON-COM-001", text: "Possible coating issue flagged during hull inspection.", by: "Oliver Reed", at: new Date().toISOString() }],
    },
    {
      id: "CON-TASK-002",
      name: "Photograph barnacle paint-over areas",
      area: "Hull",
      department: "Deck",
      assignee: "Daniel Price",
      status: "ongoing",
      priority: "high",
      dueDate: todayDateString(),
      approvalStatus: "approved",
      notes: "Document all barnacle paint-over areas with clear before/after reference photos for yard review.",
    },
    {
      id: "CON-TASK-003",
      name: "Review LMC waterline paint quote",
      area: "Waterline",
      department: "Admin",
      assignee: "Captain Graham Ellis",
      status: "pending",
      priority: "high",
      dueDate: dateStringFromNow(1),
      approvalStatus: "pending",
      notes: "Review LMC quote and prepare owner recommendation before approving yard scope.",
      quotes: [{ id: "CON-Q-001", supplier: "LMC waterline paint quote", amount: 50000, currency: "USD", status: "requested", displayStatus: "Waiting Approval", includeInSummary: true, requestedBy: "Graham Ellis" }],
    },
    {
      id: "CON-TASK-004",
      name: "Check shore power connection logs",
      area: "Electrical room",
      department: "Engineering",
      assignee: "Marko Vukovic",
      status: "pending",
      priority: "medium",
      dueDate: dateStringFromNow(7),
      approvalStatus: "approved",
      notes: "Review LMC Safe Harbor shore power logs for anomalies during yard period.",
    },
    {
      id: "CON-TASK-005",
      name: "Prepare Bahamas departure document folder",
      area: "Bridge",
      department: "Admin",
      assignee: "Elena Kovac",
      status: "pending",
      priority: "medium",
      dueDate: dateStringFromNow(4),
      approvalStatus: "approved",
      notes: "Prepare Bahamas clearance packet, crew documents, EPIRB registration, and route paperwork.",
    },
  ].map((task) => normalizeTask(task));

  const crewExpenses = [
    { id: "CON-EXP-001", title: "Yard daily labor access", amount: 1250, currency: "USD", status: "requested", requester: "Graham Ellis", reason: "Daily LMC access and coordination labor.", attachments: [] },
    { id: "CON-EXP-002", title: "Paint inspection supplies", amount: 340, currency: "USD", status: "received", requester: "Daniel Price", reason: "Inspection tape, markers, lights, and photo labels.", attachments: [] },
    { id: "CON-EXP-003", title: "Shore power usage", amount: 780, currency: "USD", status: "requested", requester: "Marko Vukovic", reason: "Yard shore power usage during refit period.", attachments: [] },
  ].map(normalizeCrewExpense);

  const workers = [
    { id: "CON-WRK-001", fullName: "LMC Paint Supervisor", rank: "Contractor", department: "Deck", notes: "Waterline paint quote and rework decision." },
    { id: "CON-WRK-002", fullName: "Thruster Coating Inspector", rank: "Surveyor", department: "Engineering", notes: "Bow thruster tunnel coating review." },
    { id: "CON-WRK-003", fullName: "Electrical Yard Lead", rank: "Contractor", department: "Engineering", notes: "Shore power log support." },
  ].map(normalizeCrewProfile);

  const documents = [
    { id: "CON-DOC-001", title: "Bahamas clearance packet", category: "Clearance", status: "Draft", owner: "Elena Kovac", notes: "Departure document folder for Fort Lauderdale to Nassau." },
    { id: "CON-DOC-002", title: "Yard work order", category: "Yard", status: "Active", owner: "Graham Ellis", notes: "LMC Safe Harbor work order and scope reference." },
    { id: "CON-DOC-003", title: "EPIRB registration", category: "Safety", status: "Review", owner: "Marko Vukovic", notes: "Registration check before Bahamas departure." },
    { id: "CON-DOC-004", title: "Paint quote PDF", category: "Quote", status: "Waiting Approval", owner: "Graham Ellis", notes: "LMC waterline paint quote for owner approval." },
  ].map(normalizeDocumentRecord);

  const maintenanceItems = [
    { id: "CON-MNT-001", title: "Bow thruster tunnel inspection", area: "Thruster tunnel", frequencyMonths: 12, nextDueDate: todayDateString(), responsiblePerson: "Oliver Reed", notes: "Critical coating inspection before yard sign-off.", alertEnabled: true },
    { id: "CON-MNT-002", title: "Bottom paint quality review", area: "Hull", frequencyMonths: 12, nextDueDate: todayDateString(), responsiblePerson: "Daniel Price", notes: "Review barnacle paint-over areas and document defects.", alertEnabled: true },
    { id: "CON-MNT-003", title: "Generator load test", area: "Engine room", frequencyMonths: 3, nextDueDate: dateStringFromNow(1), responsiblePerson: "Marko Vukovic", notes: "Warm-up and load test before departure planning.", alertEnabled: true },
    { id: "CON-MNT-004", title: "Anchor chain paint marking", area: "Anchor locker", frequencyMonths: 6, nextDueDate: dateStringFromNow(5), responsiblePerson: "Daniel Price", notes: "Mark chain before Bahamas anchoring program.", alertEnabled: true },
    { id: "CON-MNT-005", title: "EPIRB registration check", area: "Safety equipment", frequencyMonths: 12, nextDueDate: dateStringFromNow(2), responsiblePerson: "Elena Kovac", notes: "Confirm EPIRB registration and emergency contact details.", alertEnabled: true },
  ].map(normalizeMaintenanceItem);

  const routePlanning = normalizeRoutePlanningState({
    vesselProfile,
    routeSpecs,
    safetyMargin: 1.2,
    status: "Planning",
    riskNote: "Gulf Stream weather window required",
    depthLayer: { connected: false, provider: "", samples: [], zones: [] },
    waypoints: [
      { id: "CON-RWP-001", name: "Fort Lauderdale", lng: -80.1183, lat: 26.1224 },
      { id: "CON-RWP-002", name: "Gulf Stream Weather Gate", lng: -79.6, lat: 26.35 },
      { id: "CON-RWP-003", name: "Bimini weather check", lng: -79.28, lat: 25.73 },
      { id: "CON-RWP-004", name: "Nassau, Bahamas", lng: -77.3554, lat: 25.0443 },
    ],
  });

  const history = [
    { id: "CON-HIS-001", at: new Date().toISOString(), section: "Maintenance", action: "Coating issue flagged", detail: "Oliver flagged possible coating issue in bow thruster tunnel." },
    { id: "CON-HIS-002", at: new Date(Date.now() - 1000 * 60 * 43).toISOString(), section: "Tasks", action: "Hull photos uploaded", detail: "Daniel uploaded photos from hull inspection." },
    { id: "CON-HIS-003", at: new Date(Date.now() - 1000 * 60 * 97).toISOString(), section: "Expenses and Quotations", action: "Paint quote review requested", detail: "Graham requested review of waterline paint quote." },
    { id: "CON-HIS-004", at: new Date(Date.now() - 1000 * 60 * 148).toISOString(), section: "Maintenance", action: "Generator test completed", detail: "Marko completed generator warm-up test." },
  ];

  return {
    history,
    declinedTasks: [],
    vesselState: normalizeVesselState({
      mode: "yard-refit",
      mood: "pressure",
      primaryFocus: "Yard works and departure readiness",
      confidenceScore: 74,
    }, "contessa"),
    vesselProfile,
    documents,
    tasks,
    crewExpenses,
    crewProfiles,
    workers,
    maintenanceItems,
    routePlanning,
  };
}

function createDefaultWorkspaceData() {
  return buildContessaWorkspace();
}

function normalizeWorkspaceState(state = {}) {
  const routePlanning = normalizeRoutePlanningState({
    ...(pickFirstDefined(state.routePlanning, state.routePlan, state.route) || createEmptyRoutePlanningState()),
    vesselProfile: pickFirstDefined(
      state.routePlanning?.vesselProfile,
      state.routePlan?.vesselProfile,
      state.routePlan?.vessel,
      state.route?.vesselProfile,
      state.route?.vessel,
      state.vesselProfile,
      state.vessel,
      createFallbackVesselProfile()
    ),
  });
  const vesselProfile = normalizeVesselProfile(
    state.vesselProfile ||
    state.vessel ||
    (
      !state.vesselProfile && !state.vessel
        ? routePlanning.vesselProfile
        : null
    ) ||
    createFallbackVesselProfile()
  );

  return {
    history: Array.isArray(state.history) ? state.history : [],
    declinedTasks: Array.isArray(state.declinedTasks) ? state.declinedTasks.map((task) => normalizeTask(task)) : [],
    vesselProfile,
    documents: Array.isArray(state.documents) ? state.documents.map(normalizeDocumentRecord) : [],
    tasks: Array.isArray(state.tasks) ? state.tasks.map((task) => normalizeTask(task)) : [],
    crewExpenses: Array.isArray(state.crewExpenses) ? state.crewExpenses.map(normalizeCrewExpense) : [],
    crewProfiles: Array.isArray(state.crewProfiles) ? state.crewProfiles.map(normalizeCrewProfile) : [],
    workers: Array.isArray(state.workers) ? state.workers.map(normalizeCrewProfile) : [],
    maintenanceItems: Array.isArray(state.maintenanceItems) ? state.maintenanceItems.map(normalizeMaintenanceItem) : [],
    routePlanning,
    vesselState: normalizeVesselState(state.vesselState, state.id || state.slug || DEFAULT_FLEET_VESSEL_ID),
  };
}

export function buildFleetVesselId(name = "", existingIds = []) {
  const normalized = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "vessel";

  let candidate = normalized;
  let suffix = 2;
  const taken = new Set(existingIds || []);
  while (taken.has(candidate)) {
    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function formatVesselNameFromId(vesselId = "") {
  return String(vesselId || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Vessel";
}

function buildOctopussyWorkspace(name = "M/Y Octopussy") {
  const vesselProfile = normalizeVesselProfile({
    vesselName: name,
    draft: 2.1,
    beam: 6.7,
    cruisingSpeedKnots: 16,
    fuelBurnPerHour: 339,
    fuelCapacity: 14200,
    fuelReservePercentage: 18,
  });
  const routeSpecs = {
    lengthFeet: 143,
    beamFeet: 27,
    draftMeters: 2.2,
    cruisingSpeedKnots: 14,
    maxSpeedKnots: 21,
    fuelCapacityLitres: 16000,
    fuelBurnLitresPerHour: 310,
    reservePercent: 18,
    safeDepthMeters: 6,
    cautionDepthMeters: 3.5,
  };

  const crewProfiles = [
    {
      id: "OCT-CRW-001",
      fullName: "Marcus Bell",
      rank: "Captain",
      department: "Bridge",
      nationality: "British",
      dateOfBirth: "08 May 1979",
      passportNumber: "GB5529013",
      seamansBookNumber: "SB-GB-41872",
      demoPiratePortraitUrl: "/demo-crew-pirates/marcus-bell.jpg",
      roleKey: "captain",
      notes: "Captain for the Oracabessa operations workspace.",
      certificates: [
        { id: "OCT-CERT-001", name: "Yachtmaster Offshore", holderName: "Marcus Bell", issuingAuthority: "MCA", expiryDate: "2026-08-18", issueDate: dateStringFromNow(-900) },
      ],
    },
    {
      id: "OCT-CRW-002",
      fullName: "Adrian Cole",
      rank: "Chief Engineer",
      department: "Engineering",
      nationality: "Australian",
      dateOfBirth: "21 Oct 1985",
      passportNumber: "AU3348102",
      seamansBookNumber: "SB-AU-22041",
      demoPiratePortraitUrl: "/demo-crew-pirates/adrian-cole.jpg",
      roleKey: "engineer",
      notes: "Engineering lead for generator, hydraulics, and technical readiness.",
      certificates: [
        { id: "OCT-CERT-002", name: "ENG1", holderName: "Adrian Cole", issuingAuthority: "MCA", expiryDate: "2026-06-05", issueDate: dateStringFromNow(-640), notes: "Medical certificate due soon." },
      ],
    },
    {
      id: "OCT-CRW-003",
      fullName: "Nina Hayes",
      rank: "First Mate",
      department: "Deck",
      nationality: "Canadian",
      dateOfBirth: "03 Mar 1989",
      passportNumber: "CA8842019",
      seamansBookNumber: "SB-CA-77519",
      demoPiratePortraitUrl: "/demo-crew-pirates/nina-hayes.jpg",
      roleKey: "first_mate",
      notes: "Deck lead, bridge support, and arrival preparation.",
      certificates: [
        { id: "OCT-CERT-003", name: "STCW", holderName: "Nina Hayes", issuingAuthority: "RYA", expiryDate: "2026-07-12", issueDate: dateStringFromNow(-780) },
      ],
    },
    {
      id: "OCT-CRW-004",
      fullName: "Leo Grant",
      rank: "Bosun",
      department: "Deck",
      nationality: "New Zealander",
      dateOfBirth: "30 Dec 1991",
      passportNumber: "NZ9912304",
      seamansBookNumber: "SB-NZ-58204",
      demoPiratePortraitUrl: "/demo-crew-pirates/leo-grant.jpg",
      roleKey: "bosun",
      notes: "Deck standards, watersports inventory, and exterior readiness.",
      certificates: [],
    },
    {
      id: "OCT-CRW-005",
      fullName: "Mia Laurent",
      rank: "Stewardess",
      department: "Interior",
      nationality: "French",
      dateOfBirth: "14 Apr 1993",
      passportNumber: "FR4409812",
      seamansBookNumber: "SB-FR-31092",
      demoPiratePortraitUrl: "/demo-crew-pirates/mia-laurent.jpg",
      roleKey: "stewardess",
      notes: "Guest arrival setup, interior readiness, and provisioning requests.",
      certificates: [],
    },
    {
      id: "OCT-CRW-006",
      fullName: "Tomas Reed",
      rank: "Deckhand",
      department: "Deck",
      nationality: "British",
      dateOfBirth: "17 Aug 1992",
      passportNumber: "GB7201456",
      seamansBookNumber: "SB-GB-69110",
      demoPiratePortraitUrl: "/demo-crew-pirates/tomas-reed.jpg",
      roleKey: "deckhand",
      notes: "Exterior detailing, stainless care, and deck support.",
      certificates: [],
    },
  ].map(normalizeCrewProfile);

  const tasks = [
    {
      id: "OCT-TASK-001",
      name: "Prepare guest welcome setup",
      area: "Main Salon",
      department: "Interior",
      assignee: "Mia Laurent",
      status: "pending",
      priority: "high",
      dueDate: todayDateString(),
      approvalStatus: "pending",
      notes: "Guest welcome setup needs final approval before provisioning is confirmed.",
      quotes: [
        { id: "OCT-Q-001", supplier: "Guest welcome provisions", amount: 680, currency: "USD", status: "requested", displayStatus: "Waiting Approval", includeInSummary: true, requestedBy: "Mia Laurent" },
      ],
    },
    {
      id: "OCT-TASK-002",
      name: "Inspect tender davit hydraulic leak",
      area: "Tender Garage",
      department: "Engineering",
      assignee: "Adrian Cole",
      status: "ongoing",
      priority: "high",
      dueDate: todayDateString(),
      approvalStatus: "pending",
      notes: "Adrian reported hydraulic residue near the tender davit. Confirm source, photograph residue, and check seal kit requirements.",
      quotes: [
        { id: "OCT-Q-002", supplier: "Tender davit hydraulic seal kit", amount: 1240, currency: "USD", status: "requested", displayStatus: "Waiting Approval", includeInSummary: true, requestedBy: "Adrian Cole" },
      ],
    },
    {
      id: "OCT-TASK-003",
      name: "Inventory snorkel and watersports equipment",
      area: "Watersports Locker",
      department: "Deck",
      assignee: "Leo Grant",
      status: "pending",
      priority: "medium",
      dueDate: dateStringFromNow(1),
      approvalStatus: "approved",
      notes: "Count snorkel sets, fins, masks, paddleboards, and tender safety gear for Oracabessa guest program.",
      quotes: [
        { id: "OCT-Q-003", supplier: "Watersports replacement masks", amount: 360, currency: "USD", status: "requested", displayStatus: "Requested", includeInSummary: true, requestedBy: "Leo Grant" },
      ],
    },
    {
      id: "OCT-TASK-004",
      name: "Polish aft deck stainless railings",
      area: "Aft Deck",
      department: "Deck",
      assignee: "Tomas Reed",
      status: "pending",
      priority: "low",
      dueDate: dateStringFromNow(7),
      approvalStatus: "approved",
      notes: "Polish aft deck stainless railings before guest arrival setup begins.",
    },
    {
      id: "OCT-TASK-005",
      name: "Confirm Port Antonio berth request",
      area: "Bridge",
      department: "Bridge",
      assignee: "Nina Hayes",
      status: "pending",
      priority: "medium",
      dueDate: dateStringFromNow(1),
      approvalStatus: "approved",
      notes: "Confirm Port Antonio berth request and arrival window with marina office.",
    },
  ].map((task) => normalizeTask(task));

  const crewExpenses = [
    { id: "OCT-EXP-001", title: "Fresh provisioning", amount: 540, currency: "USD", status: "requested", requester: "Mia Laurent", reason: "Fresh produce and guest arrival supplies.", attachments: [] },
    { id: "OCT-EXP-002", title: "Hydraulic oil and seals", amount: 310, currency: "USD", status: "requested", requester: "Adrian Cole", reason: "Tender davit hydraulic service support.", attachments: [] },
    { id: "OCT-EXP-003", title: "Snorkel equipment replacement", amount: 360, currency: "USD", status: "requested", requester: "Leo Grant", reason: "Replacement masks for watersports inventory.", attachments: [] },
  ].map(normalizeCrewExpense);

  const workers = [
    { id: "OCT-WRK-001", fullName: "Hydraulic Technician", rank: "Contractor", department: "Engineering", notes: "Seal kit quote requested" },
    { id: "OCT-WRK-002", fullName: "Deck Detail Crew", rank: "Contractor", department: "Deck", notes: "Standing by for stainless finish" },
    { id: "OCT-WRK-003", fullName: "Provisioning Agent", rank: "Contractor", department: "Interior", notes: "Guest welcome approval pending" },
  ].map(normalizeCrewProfile);

  const documents = [
    { id: "OCT-DOC-001", title: "Guest preference sheet", category: "Guest", status: "Active", owner: "Mia Laurent", notes: "Guest arrival preferences for Oracabessa program." },
    { id: "OCT-DOC-002", title: "Jamaica cruising permit", category: "Permit", status: "Current", owner: "Marcus Bell", notes: "Jamaica cruising permit for local operations." },
    { id: "OCT-DOC-003", title: "Port Antonio berth confirmation", category: "Route", status: "Requested", owner: "Nina Hayes", notes: "Berth request and marina timing." },
    { id: "OCT-DOC-004", title: "Tender service log", category: "Maintenance", status: "Review", owner: "Adrian Cole", notes: "Tender davit and fuel line service notes." },
  ].map(normalizeDocumentRecord);

  const maintenanceItems = [
    {
      id: "OCT-MNT-001",
      title: "Tender davit hydraulic service",
      area: "Tender Garage",
      frequencyMonths: 1,
      nextDueDate: todayDateString(),
      responsiblePerson: "Adrian Cole",
      statusLabel: "In Progress",
      notes: "In Progress. Trace hydraulic residue and confirm seal kit requirement.",
      alertEnabled: true,
    },
    {
      id: "OCT-MNT-002",
      title: "Port generator coolant inspection",
      area: "Engine room",
      frequencyMonths: 1,
      nextDueDate: todayDateString(),
      responsiblePerson: "Adrian Cole",
      statusLabel: "Due Today",
      notes: "Due Today. Confirm coolant level and log condition before evening standby.",
      alertEnabled: true,
    },
    {
      id: "OCT-MNT-003",
      title: "AC chilled water filter check",
      area: "Guest cabins",
      frequencyMonths: 3,
      nextDueDate: dateStringFromNow(2),
      responsiblePerson: "Leo Grant",
      statusLabel: "Due in 2 days",
      notes: "Due in 2 days. Check chilled water filter after guest cabin load test.",
      alertEnabled: true,
    },
    {
      id: "OCT-MNT-004",
      title: "Navigation light test",
      area: "Bridge",
      frequencyMonths: 1,
      nextDueDate: dateStringFromNow(5),
      responsiblePerson: "Nina Hayes",
      statusLabel: "Scheduled",
      notes: "Scheduled. Complete pre-departure navigation light test.",
      alertEnabled: true,
    },
    {
      id: "OCT-MNT-005",
      title: "Tender fuel line inspection",
      area: "Tender Garage",
      frequencyMonths: 3,
      nextDueDate: dateStringFromNow(3),
      responsiblePerson: "Adrian Cole",
      statusLabel: "Scheduled",
      notes: "Inspect tender fuel line before guest watersports schedule.",
      alertEnabled: true,
    },
  ].map(normalizeMaintenanceItem);

  const routePlanning = normalizeRoutePlanningState({
    vesselProfile,
    routeSpecs,
    safetyMargin: 1.1,
    depthLayer: {
      connected: false,
      provider: "",
      samples: [],
      zones: [],
    },
    status: "Confirmed",
    riskNote: "Afternoon squalls possible near coastline",
    waypoints: [
      { id: "OCT-RWP-001", name: "Oracabessa", lng: -76.9436, lat: 18.4031 },
      { id: "OCT-RWP-002", name: "North coast squall watch", lng: -76.78, lat: 18.56 },
      { id: "OCT-RWP-003", name: "Port Antonio", lng: -76.4500, lat: 18.1830 },
    ],
  });

  const history = [
    { id: "OCT-HIS-001", at: new Date().toISOString(), section: "Maintenance", action: "Hydraulic residue reported", detail: "Adrian reported hydraulic residue near tender davit." },
    { id: "OCT-HIS-002", at: new Date(Date.now() - 1000 * 60 * 41).toISOString(), section: "Crew", action: "Deck walkaround completed", detail: "Nina completed pre-arrival deck walkaround." },
    { id: "OCT-HIS-003", at: new Date(Date.now() - 1000 * 60 * 97).toISOString(), section: "Expenses and Quotations", action: "Guest welcome approval requested", detail: "Mia requested approval for guest welcome setup." },
    { id: "OCT-HIS-004", at: new Date(Date.now() - 1000 * 60 * 155).toISOString(), section: "Maintenance", action: "Generator inspection added", detail: "Generator coolant inspection added for today." },
    { id: "OCT-HIS-005", at: new Date(Date.now() - 1000 * 60 * 214).toISOString(), section: "Maintenance", action: "AC filter check scheduled", detail: "Leo scheduled AC chilled water filter check." },
  ];

  return {
    history,
    declinedTasks: [],
    vesselState: normalizeVesselState({
      mode: "guest-arrival",
      mood: "calm",
      primaryFocus: "Guest arrival preparation",
      confidenceScore: 89,
    }, "octopussy"),
    vesselProfile,
    documents,
    tasks,
    crewExpenses,
    crewProfiles,
    workers,
    maintenanceItems,
    routePlanning,
  };
}

export function createFleetVesselWorkspace({
  id = DEFAULT_FLEET_VESSEL_ID,
  name = "Vessel",
  details = {},
  workspace = {},
  theme = null,
} = {}) {
  const normalizedName = String(name || "").trim().toLowerCase();
  const isOctopussyPreset = id === "octopussy" || normalizedName === "octopussy" || normalizedName === "m/y octopussy";
  const isContessaPreset = id === DEFAULT_FLEET_VESSEL_ID || normalizedName === "contessa" || normalizedName === "m/y contessa";
  const displayName = isOctopussyPreset ? "M/Y Octopussy" : isContessaPreset ? "M/Y Contessa" : name;
  const presetWorkspace = isOctopussyPreset ? buildOctopussyWorkspace(displayName) : isContessaPreset ? buildContessaWorkspace(displayName) : normalizeWorkspaceState(workspace);
  const normalizedProfile = normalizeVesselProfile({
    ...(presetWorkspace.vesselProfile || normalizeVesselProfile({ vesselName: displayName })),
    ...(workspace.vesselProfile || {}),
    vesselName: displayName,
  });
  const normalizedWorkspace = normalizeWorkspaceState({
    ...presetWorkspace,
    ...workspace,
    vesselProfile: normalizedProfile,
    routePlanning: {
      ...((workspace.routePlanning || presetWorkspace.routePlanning || createEmptyRoutePlanningState())),
      vesselProfile: normalizedProfile,
    },
  });
  const vesselState = normalizeVesselState(workspace.vesselState || presetWorkspace.vesselState || details.vesselState, id);
  const calculatedConfidenceScore = calculateConfidenceScore(normalizedWorkspace);
  const vesselPrintInfo = normalizeVesselPrintInfo(details.vesselPrintInfo || workspace.vesselPrintInfo || {}, id, displayName);

  return {
    id,
    name: displayName,
    details: {
      length: details.length ?? details.lengthFeet ?? (isOctopussyPreset ? 30 : isContessaPreset ? 32 : 0),
      lengthFeet: Number(details.lengthFeet ?? details.length ?? (isOctopussyPreset ? 30 : isContessaPreset ? 32 : 0)) || 0,
      vesselType: details.vesselType || "Motor Yacht",
      flag: details.flag || (isContessaPreset ? "Jamaica" : "Cayman Islands"),
      homePort: details.homePort || (isOctopussyPreset ? "Oracabessa, Jamaica" : isContessaPreset ? "Fort Lauderdale / LMC Safe Harbor" : ""),
      crewNumber: details.crewNumber ?? normalizedWorkspace.crewProfiles.length,
      notes: details.notes || "",
      status: details.status || (isOctopussyPreset ? "Guest Ready" : isContessaPreset ? "Yard / Refit" : "Operational"),
      demoSeeded: isOctopussyPreset || isContessaPreset,
      demoSeedVersion: isOctopussyPreset ? OCTOPUSSY_DEMO_SEED_VERSION : isContessaPreset ? CONTESSA_DEMO_SEED_VERSION : undefined,
    },
    theme: normalizeVesselTheme(theme || details.theme || {}, getImplicitThemeNameForVessel(id)),
    ...normalizedWorkspace,
    displayName: vesselPrintInfo.displayName,
    flag: vesselPrintInfo.flag || details.flag || "",
    imo: vesselPrintInfo.imo,
    officialNumber: vesselPrintInfo.officialNumber,
    mmsi: vesselPrintInfo.mmsi,
    callSign: vesselPrintInfo.callSign,
    identifierStatus: vesselPrintInfo.identifierStatus,
    vesselPrintInfo,
    vesselState: {
      ...vesselState,
      confidenceScore: Number.isFinite(Number(vesselState.confidenceScore)) ? vesselState.confidenceScore : calculatedConfidenceScore,
    },
  };
}

export function normalizeFleetVessel(vessel = {}, fallbackId = DEFAULT_FLEET_VESSEL_ID) {
  const vesselId = vessel.id || fallbackId;
  const fallbackName = vesselId === DEFAULT_FLEET_VESSEL_ID
    ? "M/Y Contessa"
    : vesselId === "octopussy"
      ? "M/Y Octopussy"
      : formatVesselNameFromId(vesselId);
  const name = vessel.name || vessel.vesselProfile?.vesselName || fallbackName;
  const isRequiredDemoVessel = vesselId === DEFAULT_FLEET_VESSEL_ID || vesselId === "octopussy";
  const requiredSeedVersion = vesselId === "octopussy" ? OCTOPUSSY_DEMO_SEED_VERSION : CONTESSA_DEMO_SEED_VERSION;
  if (
    isRequiredDemoVessel &&
    (vessel.details?.demoSeeded !== true || vessel.details?.demoSeedVersion !== requiredSeedVersion)
  ) {
    return createFleetVesselWorkspace({
      id: vesselId,
      name: vesselId === "octopussy" ? "M/Y Octopussy" : "M/Y Contessa",
      details: {
        demoSeeded: true,
        demoSeedVersion: requiredSeedVersion,
      },
      workspace: {},
    });
  }
  const normalizedWorkspace = normalizeWorkspaceState({
    ...vessel,
    vesselProfile: {
      ...(vessel.vesselProfile || createFallbackVesselProfile(name)),
      vesselName: name,
    },
    routePlanning: {
      ...(vessel.routePlanning || vessel.routePlan || vessel.route || createEmptyRoutePlanningState()),
      vesselProfile: {
        ...(vessel.routePlanning?.vesselProfile || vessel.routePlan?.vesselProfile || vessel.route?.vesselProfile || vessel.vesselProfile || createFallbackVesselProfile(name)),
        vesselName: name,
      },
    },
  });
  const vesselState = normalizeVesselState(vessel.vesselState || vessel.details?.vesselState, vesselId);
  const calculatedConfidenceScore = calculateConfidenceScore(normalizedWorkspace);
  const vesselPrintInfo = normalizeVesselPrintInfo(vessel.vesselPrintInfo || vessel.details?.vesselPrintInfo || {}, vesselId, name);

  return {
    id: vesselId,
    name,
    details: {
      length: Number(vessel.details?.length ?? vessel.length ?? 0) || 0,
      lengthFeet: Number(vessel.details?.lengthFeet ?? vessel.details?.length ?? vessel.length ?? 0) || 0,
      vesselType: vessel.details?.vesselType || vessel.vesselType || "Motor Yacht",
      flag: vessel.details?.flag || vessel.flag || "",
      homePort: vessel.details?.homePort || vessel.homePort || "",
      crewNumber: Number(vessel.details?.crewNumber ?? vessel.crewNumber ?? normalizedWorkspace.crewProfiles.length) || 0,
      notes: vessel.details?.notes || vessel.notes || "",
      status: vessel.details?.status || vessel.status || "Operational",
      demoSeeded: vessel.details?.demoSeeded === true,
      demoSeedVersion: vessel.details?.demoSeedVersion,
    },
    theme: normalizeVesselTheme(vessel.theme || vessel.details?.theme || {}, getImplicitThemeNameForVessel(vesselId)),
    ...normalizedWorkspace,
    displayName: vesselPrintInfo.displayName,
    flag: vesselPrintInfo.flag || vessel.details?.flag || vessel.flag || "",
    imo: vesselPrintInfo.imo,
    officialNumber: vesselPrintInfo.officialNumber,
    mmsi: vesselPrintInfo.mmsi,
    callSign: vesselPrintInfo.callSign,
    identifierStatus: vesselPrintInfo.identifierStatus,
    vesselPrintInfo,
    vesselState: {
      ...vesselState,
      confidenceScore: Number.isFinite(Number(vesselState.confidenceScore)) ? vesselState.confidenceScore : calculatedConfidenceScore,
    },
  };
}

function ensureRequiredFleetVessels(vessels = [], fallbackState = null) {
  const normalizedFleet = Array.isArray(vessels) ? [...vessels] : [];

  REQUIRED_FLEET_VESSELS.forEach((requiredVessel) => {
    const exists = normalizedFleet.some((vessel) => vessel?.id === requiredVessel.id);
    if (exists) return;

    const fallbackWorkspace =
      requiredVessel.id === DEFAULT_FLEET_VESSEL_ID
        ? fallbackState
        : undefined;

    normalizedFleet.push(
      createFleetVesselWorkspace({
        id: requiredVessel.id,
        name: requiredVessel.name,
        details: {
          ...requiredVessel.details,
          crewNumber: requiredVessel.id === DEFAULT_FLEET_VESSEL_ID
            ? fallbackWorkspace?.crewProfiles?.length ?? requiredVessel.details.crewNumber
            : requiredVessel.details.crewNumber,
        },
        workspace: fallbackWorkspace || undefined,
      })
    );
  });

  return normalizedFleet;
}

export function normalizeFleetState(vessels = [], fallback = null) {
  const fallbackState = fallback || createDefaultWorkspaceData();
  const seedFleet = Array.isArray(vessels) && vessels.length
    ? ensureRequiredFleetVessels(vessels, fallbackState)
    : ensureRequiredFleetVessels([], fallbackState);
  let customIndex = 0;

  return seedFleet.map((vessel, index) => {
    const vesselId = vessel?.id || (index === 0 ? DEFAULT_FLEET_VESSEL_ID : `vessel-${index + 1}`);
    const fallbackThemeName = getImplicitThemeNameForVessel(vesselId, customIndex);

    if (vesselId !== DEFAULT_FLEET_VESSEL_ID && vesselId !== "octopussy") {
      customIndex += 1;
    }

    return normalizeFleetVessel(
      {
        ...vessel,
        theme: normalizeVesselTheme(vessel?.theme || vessel?.details?.theme || {}, fallbackThemeName),
      },
      vesselId
    );
  });
}

export function getVesselCounts(vessel = {}) {
  const items = Array.isArray(vessel?.items) ? vessel.items : [];
  const tasks = Array.isArray(vessel?.tasks) ? vessel.tasks : [];
  const maintenanceItems = Array.isArray(vessel?.maintenanceItems) ? vessel.maintenanceItems : [];
  const alerts = Array.isArray(vessel?.alerts) ? vessel.alerts : [];
  const notifications = Array.isArray(vessel?.notifications) ? vessel.notifications : [];

  const taskCount = tasks.length || items.filter((item) => ["task", "maintenance"].includes(item?.type)).length;
  const highPriorityTasks = tasks.filter((task) => ["high", "urgent", "critical"].includes(String(task?.priority || "").toLowerCase()));
  const overdueTasks = tasks.filter((task) => {
    const remaining = daysUntil(task?.dueDate);
    return remaining !== null && remaining < 0;
  });
  const dueMaintenanceAlerts = maintenanceItems.filter((item) => {
    const remaining = daysUntil(item?.nextDueDate);
    return remaining !== null && remaining <= 2;
  });
  const itemAlerts = items.filter((item) => {
    const priority = String(item?.priority || "").toLowerCase();
    const status = String(item?.status || "").toLowerCase();
    return item?.type === "alert" || ["high", "critical", "urgent"].includes(priority) || status === "overdue";
  });
  const notificationAlerts = notifications.filter((item) => ["critical", "warning"].includes(String(item?.level || "").toLowerCase()));

  const alertCount = alerts.length || itemAlerts.length || notificationAlerts.length || (highPriorityTasks.length + overdueTasks.length + dueMaintenanceAlerts.length);

  return {
    taskCount,
    alertCount,
  };
}

export function getVesselMetrics(vesselId, vessels = []) {
  const vessel = Array.isArray(vessels)
    ? vessels.find((item) => item?.id === vesselId)
    : null;

  if (!vessel) {
    return {
      taskCount: 0,
      crewCount: 0,
      certificateDue: 0,
      documentCount: 0,
      expenseCount: 0,
      quoteCount: 0,
      approvalCount: 0,
      notificationCount: 0,
      routeWaypoints: 0,
      routeDistanceNm: 0,
      alertCount: 0,
      activeModules: 0,
      workerCount: 0,
      status: "No data",
    };
  }

  const normalizedVessel = normalizeFleetVessel(vessel, vesselId);
  const tasks = Array.isArray(normalizedVessel.tasks) ? normalizedVessel.tasks : [];
  const crewProfiles = Array.isArray(normalizedVessel.crewProfiles) ? normalizedVessel.crewProfiles : [];
  const crewExpenses = Array.isArray(normalizedVessel.crewExpenses) ? normalizedVessel.crewExpenses : [];
  const maintenanceItems = Array.isArray(normalizedVessel.maintenanceItems) ? normalizedVessel.maintenanceItems : [];
  const documents = Array.isArray(normalizedVessel.documents) ? normalizedVessel.documents : [];
  const workers = Array.isArray(normalizedVessel.workers) ? normalizedVessel.workers : [];
  const routePlanning = normalizeRoutePlanningState(normalizedVessel.routePlanning || {});
  const boatExpenses = buildBoatExpenseSummaryItems(tasks);
  const certificateAlerts = buildCertificateAlerts(crewProfiles);
  const maintenanceAlerts = buildMaintenanceAlerts(maintenanceItems);
  const notifications = buildOperationalNotifications({
    tasks,
    boatExpenses,
    crewExpenses,
    maintenanceAlerts,
    certificateAlerts,
  });
  const routeSummary = calculateRoutePassageSummary({
    waypoints: routePlanning.waypoints || [],
    vesselProfile: routePlanning.vesselProfile || normalizedVessel.vesselProfile || {},
    safetyMargin: routePlanning.safetyMargin,
  });
  const quoteCount = tasks.reduce((sum, task) => sum + (Array.isArray(task.quotes) ? task.quotes.length : 0), 0);
  const approvalCount = notifications.filter((item) => item.section === "expenses").length;
  const counts = getVesselCounts({
    ...normalizedVessel,
    notifications,
  });
  const activeModules = [
    tasks.length > 0,
    crewProfiles.length > 0,
    documents.length > 0,
    maintenanceItems.length > 0,
    crewExpenses.length > 0 || boatExpenses.length > 0,
    (routePlanning.waypoints || []).length > 0,
    notifications.length > 0,
  ].filter(Boolean).length;

  return {
    taskCount: counts.taskCount,
    crewCount: crewProfiles.length,
    certificateDue: certificateAlerts.length,
    documentCount: documents.length,
    expenseCount: crewExpenses.length + boatExpenses.length,
    quoteCount,
    approvalCount,
    notificationCount: notifications.length,
    routeWaypoints: routePlanning.waypoints?.length || 0,
    routeDistanceNm: routeSummary.totalDistanceNm || 0,
    alertCount: counts.alertCount,
    activeModules,
    workerCount: workers.length,
    status: normalizedVessel.details?.status || "Operational",
  };
}

export const statusStyles = {
  pending: "border border-slate-300 bg-white text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-100",
  ongoing: "border border-amber-300 bg-amber-50 text-amber-800 shadow-sm dark:border-amber-300/40 dark:bg-amber-300/15 dark:text-amber-100",
  "waiting-approval": "border border-blue-300 bg-blue-50 text-blue-800 shadow-sm dark:border-cyan-300/40 dark:bg-cyan-300/15 dark:text-cyan-100",
  blocked: "border border-rose-300 bg-rose-50 text-rose-800 shadow-sm dark:border-rose-300/40 dark:bg-rose-300/15 dark:text-rose-100",
  completed: "border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-300/40 dark:bg-emerald-300/15 dark:text-emerald-100",
  approved: "border border-amber-300 bg-amber-50 text-amber-800 shadow-sm dark:border-amber-300/40 dark:bg-amber-300/15 dark:text-amber-100",
  declined: "border border-rose-300 bg-rose-50 text-rose-800 shadow-sm dark:border-rose-300/40 dark:bg-rose-300/15 dark:text-rose-100",
};

export const priorityStyles = {
  low: "border border-slate-300 bg-white text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-100",
  medium: "border border-blue-300 bg-blue-50 text-blue-800 shadow-sm dark:border-cyan-300/40 dark:bg-cyan-300/15 dark:text-cyan-100",
  high: "border border-amber-300 bg-amber-50 text-amber-800 shadow-sm dark:border-amber-300/40 dark:bg-amber-300/15 dark:text-amber-100",
  urgent: "border border-rose-300 bg-rose-50 text-rose-800 shadow-sm dark:border-rose-300/40 dark:bg-rose-300/15 dark:text-rose-100",
};

export const departmentStyles = {
  General: "border border-slate-300 bg-white text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-100",
  Deck: "border border-teal-300 bg-teal-50 text-teal-800 shadow-sm dark:border-teal-300/40 dark:bg-teal-300/15 dark:text-teal-100",
  Engineering: "border border-amber-300 bg-amber-50 text-amber-800 shadow-sm dark:border-amber-300/40 dark:bg-amber-300/15 dark:text-amber-100",
  Interior: "border border-violet-300 bg-violet-50 text-violet-800 shadow-sm dark:border-violet-300/40 dark:bg-violet-300/15 dark:text-violet-100",
  Bridge: "border border-blue-300 bg-blue-50 text-blue-800 shadow-sm dark:border-cyan-300/40 dark:bg-cyan-300/15 dark:text-cyan-100",
  Admin: "border border-slate-300 bg-white text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-100",
};

export const moneyStatusStyles = {
  requested: "border border-amber-300 bg-amber-50 text-amber-800 shadow-sm dark:border-amber-300/40 dark:bg-amber-300/15 dark:text-amber-100",
  received: "border border-blue-300 bg-blue-50 text-blue-800 shadow-sm dark:border-cyan-300/40 dark:bg-cyan-300/15 dark:text-cyan-100",
  approved: "border border-amber-300 bg-amber-50 text-amber-800 shadow-sm dark:border-amber-300/40 dark:bg-amber-300/15 dark:text-amber-100",
  declined: "border border-rose-300 bg-rose-50 text-rose-800 shadow-sm dark:border-rose-300/40 dark:bg-rose-300/15 dark:text-rose-100",
  paid: "border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-300/40 dark:bg-emerald-300/15 dark:text-emerald-100",
};

export function neutralBadgeClass(darkMode = false) {
  return darkMode
    ? "border border-white/10 bg-slate-800 text-slate-100 shadow-sm"
    : "border border-slate-300 bg-white text-slate-800 shadow-sm";
}

export function infoBadgeClass(darkMode = false) {
  return darkMode
    ? "border border-cyan-300/40 bg-cyan-300/15 text-cyan-100 shadow-sm"
    : "border border-blue-300 bg-blue-50 text-blue-800 shadow-sm";
}

export function successBadgeClass(darkMode = false) {
  return darkMode
    ? "border border-teal-300/40 bg-teal-300/15 text-teal-100 shadow-sm"
    : "border border-teal-300 bg-teal-50 text-teal-800 shadow-sm";
}

export function warningBadgeClass(darkMode = false) {
  return darkMode
    ? "border border-amber-300/40 bg-amber-300/15 text-amber-100 shadow-sm"
    : "border border-amber-300 bg-amber-50 text-amber-800 shadow-sm";
}

export function criticalBadgeClass(darkMode = false) {
  return darkMode
    ? "border border-rose-300/40 bg-rose-300/15 text-rose-100 shadow-sm"
    : "border border-rose-300 bg-rose-50 text-rose-800 shadow-sm";
}

export function filePreviewCardClass(darkMode = false) {
  return darkMode ? "overflow-hidden rounded-lg border border-[#31443a] bg-[#111a16] p-3" : "overflow-hidden rounded-lg border border-[#d8e7df] bg-white p-3";
}

export function filePreviewPlaceholderClass(darkMode = false) {
  return darkMode ? "flex h-24 items-center justify-center rounded-md bg-[#162119] text-center text-xs font-medium text-[#d5e4dd]" : "flex h-24 items-center justify-center rounded-md bg-[#f3faf6] text-center text-xs font-medium text-[#40534a]";
}

export function normalizeDocumentRecord(item = {}) {
  return {
    id: item.id || createId("DOC"),
    title: item.title || "Document",
    category: item.category || "General",
    status: item.status || "Placeholder",
    owner: item.owner || "Operations",
    notes: item.notes || "",
  };
}

export function titleCase(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatTaskStatusLabel(value) {
  if (value === "ongoing") return "In Progress";
  if (value === "pending") return "To Do";
  if (value === "waiting-approval") return "Waiting Approval";
  return titleCase(value);
}

export function formatTaskPriorityLabel(value) {
  if (value === "medium") return "Normal";
  if (value === "urgent") return "Critical";
  return titleCase(value);
}

export function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function parseAmountInput(value) {
  return value === "" ? "" : safeNumber(value);
}

export function getRejectedAt(item) {
  return item.rejectedAt ? Number(item.rejectedAt) : null;
}

export function isRejectedExpired(item, now = Date.now()) {
  const rejectedAt = getRejectedAt(item);
  const status = item.status || (item.payment === "paid" ? "paid" : item.approval === "rejected" ? "declined" : item.approval === "approved" ? "approved" : "requested");
  return status === "declined" && rejectedAt !== null && now - rejectedAt >= REJECTION_HOLD_MS;
}

export function deriveMoneyStatus(item = {}) {
  if (MONEY_STATUS_OPTIONS.includes(item.status)) return item.status;
  if (item.payment === "paid") return "paid";
  if (item.approval === "rejected") return "declined";
  if (item.approval === "approved") return "approved";
  if (item.approval === "pending") return "requested";
  return "requested";
}

export function isPaidMoneyStatus(status) {
  return status === "paid";
}

export function normalizeMoneyItem(item = {}, defaults = {}, now = Date.now()) {
  const status = deriveMoneyStatus({ ...defaults, ...item });
  const next = {
    ...defaults,
    ...item,
    status,
    approval: status === "declined" ? "rejected" : status === "approved" || status === "paid" ? "approved" : "pending",
    payment: status === "paid" ? "paid" : "unpaid",
    currency: CURRENCY_OPTIONS.some((option) => option.code === item.currency) ? item.currency : defaults.currency || "USD",
    attachments: Array.isArray(item.attachments)
      ? item.attachments
      : Array.isArray(item.receipts)
        ? item.receipts.map((receipt, index) => ({
          id: createId(`MATT-${index}`),
          name: `Attachment ${index + 1}`,
          type: "image/*",
          dataUrl: receipt,
          addedAt: new Date(now).toISOString(),
        }))
        : [],
    includeInSummary: item.includeInSummary === undefined
      ? Boolean(defaults.includeInSummary)
      : Boolean(item.includeInSummary),
  };
  next.receipts = next.attachments.map((attachment) => attachment.dataUrl).filter(Boolean);

  if (next.status === "declined" && !next.rejectedAt) {
    next.rejectedAt = now;
  }

  if (next.status !== "declined") {
    next.rejectedAt = null;
  }

  if (isRejectedExpired(next, now)) {
    next.amount = 0;
  }

  return next;
}

export function normalizeCrewExpense(item = {}) {
  const status = deriveMoneyStatus(item);
  return {
    ...item,
    title: item.title || "Crew expense",
    amount: item.amount ?? 0,
    status,
    payment: status === "paid" ? "paid" : "unpaid",
    currency: CURRENCY_OPTIONS.some((option) => option.code === item.currency) ? item.currency : "USD",
    attachments: Array.isArray(item.attachments)
      ? item.attachments
      : Array.isArray(item.receipts)
        ? item.receipts.map((receipt, index) => ({
          id: createId(`CATT-${index}`),
          name: `Attachment ${index + 1}`,
          type: "image/*",
          dataUrl: receipt,
          addedAt: new Date().toISOString(),
        }))
        : [],
  };
}

export function normalizeCertificate(item = {}) {
  return normalizeCertificateRecord({
    ...item,
    id: item.id || createId("CERT"),
  });
}

export function normalizeCrewProfile(item = {}) {
  const fullName = item.fullName || item.name || "Crew Member";
  const rank = item.rank || item.title || "Crew";
  const [derivedFirstName = "", ...derivedLastNameParts] = fullName.split(" ").filter(Boolean);

  return {
    ...item,
    id: item.id || createId("CRW"),
    firstName: item.firstName || derivedFirstName,
    lastName: item.lastName || derivedLastNameParts.join(" "),
    fullName,
    name: item.name || fullName,
    position: item.position || rank,
    rank,
    title: item.title || rank,
    department: CREW_DEPARTMENT_OPTIONS.includes(item.department) ? item.department : CREW_DEPARTMENT_OPTIONS[0],
    nationality: item.nationality || "",
    dateOfBirth: item.dateOfBirth || "",
    passportNumber: item.passportNumber || "",
    seamansBookNumber: item.seamansBookNumber || "",
    roleKey: item.roleKey || "",
    notes: item.notes || "",
    qrPlaceholder: item.qrPlaceholder || "Future crew QR / CV access",
    certificates: Array.isArray(item.certificates) ? item.certificates.map(normalizeCertificate) : [],
  };
}

export function getCurrencySymbol(currency) {
  return CURRENCY_OPTIONS.find((option) => option.code === currency)?.symbol || "$";
}

export function formatMoney(value, currency) {
  const symbol = getCurrencySymbol(currency);
  const amount = safeNumber(value);
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function getVesselStateDefaults(vesselId = "") {
  const normalizedId = String(vesselId || "").trim().toLowerCase();
  if (normalizedId === "octopussy") return { ...DEFAULT_VESSEL_STATES.octopussy };
  if (normalizedId === DEFAULT_FLEET_VESSEL_ID || normalizedId === "contessa") return { ...DEFAULT_VESSEL_STATES.contessa };
  return { ...DEFAULT_VESSEL_STATES.default };
}

export function getVesselStateMoodForMode(mode = "standby") {
  const normalizedMode = String(mode || "").toLowerCase();
  if (normalizedMode === "critical") return "critical";
  if (normalizedMode === "yard-refit" || normalizedMode === "underway") return "pressure";
  return "calm";
}

export function normalizeVesselState(state = {}, vesselId = "") {
  const defaults = getVesselStateDefaults(vesselId);
  const requestedMode = String(state?.mode || defaults.mode || "standby");
  const validMode = VESSEL_STATE_MODE_OPTIONS.some((option) => option.value === requestedMode) ? requestedMode : defaults.mode;
  const mood = ["calm", "pressure", "critical"].includes(state?.mood)
    ? state.mood
    : getVesselStateMoodForMode(validMode);
  const confidenceScore = Number.isFinite(Number(state?.confidenceScore))
    ? Math.max(0, Math.min(100, Math.round(Number(state.confidenceScore))))
    : defaults.confidenceScore;

  return {
    ...defaults,
    ...state,
    mode: validMode,
    mood,
    ownerVisibility: state?.ownerVisibility || defaults.ownerVisibility,
    captainStyle: state?.captainStyle || defaults.captainStyle,
    primaryFocus: state?.primaryFocus || defaults.primaryFocus,
    confidenceScore,
  };
}

export function calculateConfidenceScore(vessel = {}) {
  let score = 100;
  const tasks = Array.isArray(vessel.tasks) ? vessel.tasks : [];
  const crewProfiles = Array.isArray(vessel.crewProfiles) ? vessel.crewProfiles : [];
  const certificates = [
    ...(Array.isArray(vessel.certificates) ? vessel.certificates : []),
    ...crewProfiles.flatMap((profile) => (Array.isArray(profile.certificates) ? profile.certificates : [])),
  ];
  const approvals = [
    ...(Array.isArray(vessel.approvals) ? vessel.approvals : []),
    ...(Array.isArray(vessel.crewExpenses) ? vessel.crewExpenses : []),
    ...tasks.flatMap((task) => (Array.isArray(task.quotes) ? task.quotes : [])),
  ];

  score -= tasks.filter((task) => String(task.status || "").toLowerCase().includes("overdue") || isOverdue(task.dueDate, task.status)).length * 8;
  score -= tasks.filter((task) => /critical|urgent/.test(String(task.priority || "").toLowerCase())).length * 6;
  score -= certificates.filter((certificate) => /expired/.test(String(certificate.status || certificate.statusLabel || "").toLowerCase()) || daysUntil(certificate.expiryDate) < 0).length * 10;
  score -= approvals.filter((approval) => /waiting approval|requested|pending|received/.test(String(approval.status || approval.approval || approval.approvalStatus || "").toLowerCase())).length * 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function convertMoney(value, fromCurrency, toCurrency, exchangeRates) {
  const amount = safeNumber(value);
  if (!amount || fromCurrency === toCurrency) return amount;

  const fromRate = exchangeRates.rates[fromCurrency] || FALLBACK_USD_RATES[fromCurrency] || 1;
  const toRate = exchangeRates.rates[toCurrency] || FALLBACK_USD_RATES[toCurrency] || 1;
  return (amount / fromRate) * toRate;
}

export function convertedMoney(value, fromCurrency, toCurrency, exchangeRates) {
  return formatMoney(convertMoney(value, fromCurrency, toCurrency, exchangeRates), toCurrency);
}

export function formatHistoryTime(value) {
  if (!value) return "Unknown time";
  return new Date(value).toLocaleString();
}

export function describePatch(patch) {
  return Object.entries(patch || {})
    .map(([key, value]) => `${titleCase(key)}: ${value === "" ? "blank" : String(value)}`)
    .join(", ");
}

export function formatLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDateString() {
  return formatLocalDateString(new Date());
}

export function dateStringFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatLocalDateString(date);
}

export function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function daysUntil(dateString) {
  const dueDate = parseLocalDate(dateString);
  if (!dueDate) return null;
  const today = parseLocalDate(todayDateString());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((dueDate.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / msPerDay);
}

export function formatDaysRemaining(daysRemaining, { expiredPrefix = "Expired" } = {}) {
  if (daysRemaining === null || daysRemaining === undefined) return "No expiry";
  const value = Number(daysRemaining);
  if (!Number.isFinite(value)) return "No expiry";
  if (value < 0) return `${expiredPrefix} ${Math.abs(value)} day${Math.abs(value) === 1 ? "" : "s"} ago`;
  if (value === 0) return "Expires today";
  if (value === 1) return "1 day remaining";
  return `${value} days remaining`;
}

export function isOverdue(dateString, status = "") {
  const remaining = daysUntil(dateString);
  return !["completed", "approved"].includes(status) && remaining !== null && remaining < 0;
}

export function isDueToday(dateString) {
  return daysUntil(dateString) === 0;
}

export function getUrgencyLevel(daysRemaining) {
  if (daysRemaining === null) return "normal";
  if (daysRemaining < 0) return "critical";
  if (daysRemaining <= 7) return "urgent";
  if (daysRemaining <= 30) return "warning";
  return "normal";
}

export function addMonthsToDate(dateString, months) {
  const date = parseLocalDate(dateString) || new Date();
  date.setMonth(date.getMonth() + safeNumber(months));
  return formatLocalDateString(date);
}

export function getScheduledNextDue(item, completedDate = todayDateString()) {
  return addMonthsToDate(completedDate, item.frequencyMonths);
}

export function clampMaintenanceDueDate(item, nextDueDate, completedDate = todayDateString()) {
  const maxDate = getScheduledNextDue(item, completedDate);
  if (!nextDueDate) return maxDate;
  return nextDueDate > maxDate ? maxDate : nextDueDate;
}

export function loadReminderState() {
  return getStoredJson(`${STORAGE_KEY}-maintenance-reminders`, {}) || {};
}

export function normalizeMaintenanceItem(item = {}) {
  return {
    ...item,
    title: item.title || "Maintenance item",
    area: item.area || "General",
    frequencyMonths: MAINTENANCE_FREQUENCIES.some((option) => option.months === safeNumber(item.frequencyMonths))
      ? safeNumber(item.frequencyMonths)
      : 1,
    nextDueDate: item.nextDueDate || "",
    notes: item.notes || "",
    alertEnabled: item.alertEnabled !== false,
    extensionUsed: Boolean(item.extensionUsed),
    logs: Array.isArray(item.logs) ? item.logs : [],
    removedLogs: Array.isArray(item.removedLogs) ? item.removedLogs : [],
  };
}

export function sortMaintenanceLogs(logs) {
  return [...logs].sort((a, b) => String(b.completedDate).localeCompare(String(a.completedDate)));
}

export function maintenanceKey(item) {
  return `${String(item.title || "").trim().toLowerCase()}|${String(item.area || "").trim().toLowerCase()}|${item.nextDueDate || ""}`;
}

export function hasMaintenanceDuplicate(items, candidate, ignoreId = "") {
  const key = maintenanceKey(candidate);
  if (!candidate.title || !candidate.area || !candidate.nextDueDate) return false;
  return items.some((item) => item.id !== ignoreId && maintenanceKey(item) === key);
}

export function normalizeTask(task = {}, now = Date.now()) {
  const normalizedDepartment = TASK_DEPARTMENT_OPTIONS.includes(task.department) ? task.department : "General";
  const normalizedStatus = task.status === "approved"
    ? "approved"
    : task.status || "pending";

  return {
    ...task,
    assignee: task.assignee || "Unassigned",
    department: normalizedDepartment,
    dueDate: task.dueDate || "",
    notes: task.notes || "",
    photos: Array.isArray(task.photos) ? task.photos : [],
    attachments: Array.isArray(task.attachments)
      ? task.attachments
        .filter((attachment) => attachment && typeof attachment === "object")
        .map((attachment) => ({
          id: attachment.id || createId("ATT"),
          name: attachment.name || "Attachment",
          type: attachment.type || "application/octet-stream",
          dataUrl: attachment.dataUrl || attachment.url || "",
          addedAt: attachment.addedAt || new Date(now).toISOString(),
        }))
        .filter((attachment) => attachment.dataUrl)
      : [],
    comments: Array.isArray(task.comments)
      ? task.comments
        .filter((comment) => comment && typeof comment === "object")
        .map((comment) => ({
          id: comment.id || createId("COM"),
          text: String(comment.text || "").trim(),
          by: comment.by || "User",
          at: comment.at || new Date(now).toISOString(),
        }))
        .filter((comment) => comment.text)
      : [],
    status: TASK_STATUS_OPTIONS.includes(normalizedStatus) ? normalizedStatus : "pending",
    declinedAt: task.declinedAt || null,
    priority: PRIORITY_OPTIONS.includes(task.priority) ? task.priority : "medium",
    expenses: Array.isArray(task.expenses)
      ? task.expenses.map((expense) => normalizeMoneyItem(expense, { title: "Expense", amount: 0, approval: "pending", payment: "unpaid" }, now))
      : [],
    quotes: Array.isArray(task.quotes)
      ? task.quotes.map((quote) => normalizeMoneyItem(quote, { supplier: "Quote", amount: 0, approval: "pending", payment: "unpaid", includeInSummary: true }, now))
      : [],
  };
}

export function buildBoatExpenseSummaryItems(tasks, now = Date.now()) {
  return (tasks || []).flatMap((task) =>
    (task.quotes || [])
      .map((quote) => ({
        ...quote,
        kind: "quote",
        displayName: quote.supplier,
        taskId: task.id,
        taskName: task.name,
        taskArea: task.area,
      }))
      .filter((item) => item.includeInSummary && !isRejectedExpired(item, now))
  );
}

export function createEmptyAppState(overrides = {}) {
  const baseWorkspace = createDefaultWorkspaceData();
  const fleet = normalizeFleetState(
    overrides.vessels,
    { ...baseWorkspace, ...(overrides || {}) }
  );
  const requestedActiveVesselId = overrides.activeVesselId || fleet[0]?.id || DEFAULT_FLEET_VESSEL_ID;
  const activeVessel = fleet.find((vessel) => vessel.id === requestedActiveVesselId) || fleet[0];

  return {
    darkMode: false,
    currency: "USD",
    actorName: "Captain Graham Ellis",
    currentRole: "captain",
    appMode: "editor",
    activeVesselId: activeVessel?.id || DEFAULT_FLEET_VESSEL_ID,
    vessels: fleet,
    history: activeVessel.history,
    declinedTasks: activeVessel.declinedTasks,
    vesselProfile: activeVessel.vesselProfile,
    documents: activeVessel.documents,
    tasks: activeVessel.tasks,
    crewExpenses: activeVessel.crewExpenses,
    crewProfiles: activeVessel.crewProfiles,
    workers: activeVessel.workers,
    maintenanceItems: activeVessel.maintenanceItems,
    routePlanning: activeVessel.routePlanning,
    ...overrides,
  };
}

export function createPersistedAppState(state) {
  const baseWorkspace = normalizeWorkspaceState(state);
  const fleet = normalizeFleetState(
    state.vessels,
    baseWorkspace
  );
  const activeVesselId = state.activeVesselId || fleet[0]?.id || DEFAULT_FLEET_VESSEL_ID;
  const activeVessel = fleet.find((vessel) => vessel.id === activeVesselId) || fleet[0];

  return {
    darkMode: Boolean(state.darkMode),
    currency: CURRENCY_OPTIONS.some((option) => option.code === state.currency) ? state.currency : "USD",
    actorName: state.actorName || "User",
    currentRole: state.currentRole || "captain",
    appMode: state.appMode === "editor" ? "editor" : "view",
    activeVesselId,
    vessels: fleet,
    history: activeVessel.history,
    declinedTasks: activeVessel.declinedTasks,
    vesselProfile: activeVessel.vesselProfile,
    documents: activeVessel.documents,
    tasks: activeVessel.tasks,
    crewExpenses: activeVessel.crewExpenses,
    crewProfiles: activeVessel.crewProfiles,
    workers: activeVessel.workers,
    maintenanceItems: activeVessel.maintenanceItems,
    routePlanning: activeVessel.routePlanning,
  };
}

export function buildObjectivesFilterTabs(stats, activeFilter = "all") {
  return [
    { value: "all", label: "All", count: stats.totalObjectives, active: activeFilter === "all" },
    { value: "pending", label: "To Do", count: stats.pending, active: activeFilter === "pending" },
    { value: "ongoing", label: "In Progress", count: stats.ongoing, active: activeFilter === "ongoing" },
    { value: "waiting-approval", label: "Waiting Approval", count: stats.waitingApproval || 0, active: activeFilter === "waiting-approval" },
    { value: "blocked", label: "Blocked", count: stats.blocked || 0, active: activeFilter === "blocked" },
    { value: "completed", label: "Done", count: stats.completed, active: activeFilter === "completed" },
  ];
}

function isPrivateOrLocalHost(hostname = "") {
  const normalized = String(hostname || "").trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === "localhost" || normalized === "::1" || normalized.endsWith(".local")) return true;
  if (/^[a-z]:$/i.test(normalized)) return true;
  if (/^127\./.test(normalized)) return true;
  if (/^10\./.test(normalized)) return true;
  if (/^192\.168\./.test(normalized)) return true;

  const private172 = normalized.match(/^172\.(\d+)\./);
  if (private172) {
    const secondOctet = Number(private172[1]);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }

  return false;
}

function isReservedDemoHost(hostname = "") {
  const normalized = String(hostname || "").trim().toLowerCase();
  if (!normalized) return true;
  return normalized === "example.com" ||
    normalized === "example.org" ||
    normalized === "example.net" ||
    normalized.endsWith(".example.com") ||
    normalized.endsWith(".example.org") ||
    normalized.endsWith(".example.net") ||
    normalized === "invalid" ||
    normalized.endsWith(".invalid") ||
    normalized === "test" ||
    normalized.endsWith(".test");
}

export function isLocalRuntimeLocation(locationLike = {}) {
  const protocol = String(locationLike.protocol || "").toLowerCase();
  const hostname = String(locationLike.hostname || "").toLowerCase();

  if (protocol === "file:") return true;
  if (protocol === "http:" && isPrivateOrLocalHost(hostname)) return true;
  if (protocol === "https:" && isPrivateOrLocalHost(hostname)) return true;
  return false;
}

export function getPublicAppUrlConfig(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) {
    return {
      isValid: false,
      url: "",
      reason: "missing",
      message: "Set NEXT_PUBLIC_APP_URL in .env.local or .env to your public HTTPS app address before sharing from the app.",
    };
  }

  if (/^file:/i.test(value)) {
    return {
      isValid: false,
      url: value,
      reason: "invalid",
      message: "NEXT_PUBLIC_APP_URL must be a public web URL, not a file:// path.",
    };
  }

  if (/^[A-Za-z]:[\\/]/.test(value)) {
    return {
      isValid: false,
      url: value,
      reason: "invalid",
      message: "NEXT_PUBLIC_APP_URL must be a public web URL, not a Windows C:\\ path.",
    };
  }

  try {
    const parsed = new URL(value);
    if (!["https:", "http:"].includes(parsed.protocol)) {
      return {
        isValid: false,
        url: value,
        reason: "invalid",
        message: "NEXT_PUBLIC_APP_URL must start with http:// or https://.",
      };
    }

    if (parsed.protocol === "http:" && parsed.hostname.toLowerCase() === "localhost") {
      return {
        isValid: false,
        url: value,
        reason: "invalid",
        message: "NEXT_PUBLIC_APP_URL must not use localhost. Use your real public HTTPS app domain for sharing.",
      };
    }

    if (parsed.protocol === "https:" && isPrivateOrLocalHost(parsed.hostname)) {
      return {
        isValid: false,
        url: value,
        reason: "invalid",
        message: "NEXT_PUBLIC_APP_URL must be a public web address, not localhost or a machine-local host.",
      };
    }

    if (isReservedDemoHost(parsed.hostname)) {
      return {
        isValid: false,
        url: value,
        reason: "invalid",
        message: "NEXT_PUBLIC_APP_URL must be a real hosted domain, not a placeholder example/test address.",
      };
    }

    return {
      isValid: true,
      url: parsed.toString(),
      reason: isPrivateOrLocalHost(parsed.hostname) ? "development" : null,
      message: isPrivateOrLocalHost(parsed.hostname)
        ? "Using a local or private development URL. Use your HTTPS public domain for production sharing."
        : "",
    };
  } catch {
    return {
      isValid: false,
      url: value,
      reason: "invalid",
      message: "NEXT_PUBLIC_APP_URL is invalid. Use a full public URL such as https://app.example.com.",
    };
  }
}

export function getCanonicalPublicAppUrlStatus(envValue = "", options = {}) {
  const configuredValue = String(envValue || "").trim();
  const configuredStatus = getPublicAppUrlConfig(configuredValue);
  if (configuredStatus.isValid || configuredValue) {
    return { ...configuredStatus, source: "env" };
  }

  const runtimeOrigin = options.locationLike?.origin || "";
  if (runtimeOrigin) {
    return {
      isValid: true,
      url: runtimeOrigin.endsWith("/") ? runtimeOrigin : `${runtimeOrigin}/`,
      reason: isLocalRuntimeLocation(options.locationLike || {}) ? "development" : null,
      source: "runtime-origin-fallback",
      message: "Using the current browser origin because NEXT_PUBLIC_APP_URL is not set.",
    };
  }

  return { ...configuredStatus, source: "env" };
}

export function getConfiguredPublicAppUrlEnvValue() {
  return getRuntimePublicAppUrl();
}

export function buildAbsolutePublicAppUrl(pathname = "/", envValue = "", options = {}) {
  const status = getCanonicalPublicAppUrlStatus(envValue, options);
  if (!status.isValid) return status;

  try {
    const nextUrl = new URL(pathname || "/", status.url);
    return {
      ...status,
      url: nextUrl.toString(),
    };
  } catch {
    return {
      ...status,
      isValid: false,
      reason: "invalid",
      message: "NEXT_PUBLIC_APP_URL is invalid. Use a full public URL such as https://app.example.com.",
    };
  }
}

export function loadPublicAppUrlOverride() {
  return String(getStoredString(PUBLIC_APP_URL_OVERRIDE_KEY, "") || "").trim();
}

function getPublicRuntimeUrl(locationLike) {
  if (!locationLike) return "";

  try {
    const candidate = String(locationLike.href || "").trim();
    if (!candidate) return "";

    const parsed = new URL(candidate);
    if (!["https:", "http:"].includes(parsed.protocol)) return "";
    if (isPrivateOrLocalHost(parsed.hostname)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

export function resolvePublicAppUrlConfig({
  envValue = "",
  overrideValue = "",
  locationLike = null,
} = {}) {
  const candidates = [
    { source: "env", value: String(envValue || "").trim() },
    { source: "override", value: String(overrideValue || "").trim() },
    { source: "runtime", value: getPublicRuntimeUrl(locationLike) },
  ];

  for (const candidate of candidates) {
    if (!candidate.value) continue;

    const status = getPublicAppUrlConfig(candidate.value);
    if (status.isValid) {
      return { ...status, source: candidate.source };
    }
  }

  if (candidates[0].value) {
    return { ...getPublicAppUrlConfig(candidates[0].value), source: "env" };
  }

  if (candidates[1].value) {
    return { ...getPublicAppUrlConfig(candidates[1].value), source: "override" };
  }

  return { ...getPublicAppUrlConfig(""), source: null };
}

function pickFirstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function pickFirstArray(...values) {
  return values.find((value) => Array.isArray(value)) || [];
}

function applyKnownStateAliases(state = {}) {
  return {
    ...state,
    actorName: pickFirstDefined(state.actorName, state.actor, state.userName, "User"),
    currentRole: pickFirstDefined(state.currentRole, state.viewerRole, "captain"),
    appMode: pickFirstDefined(state.appMode, state.mode, state.editorMode ? "editor" : undefined, "view"),
    tasks: pickFirstArray(state.tasks, state.objectives),
    declinedTasks: pickFirstArray(state.declinedTasks, state.declined, state.archivedDeclinedTasks),
    crewExpenses: pickFirstArray(state.crewExpenses, state.crew, state.crewCosts),
    crewProfiles: pickFirstArray(state.crewProfiles, state.crewMembers, state.profiles),
    maintenanceItems: pickFirstArray(state.maintenanceItems, state.maintenance, state.maintenanceRecords),
    routePlanning: pickFirstDefined(state.routePlanning, state.routePlan, state.route),
  };
}

function migrateStateShapeToVersion2(state = {}) {
  return {
    ...applyKnownStateAliases(state),
  };
}

function migrateStateShapeToVersion3(state = {}) {
  const preferences = state.preferences && typeof state.preferences === "object"
    ? state.preferences
    : state.appPreferences && typeof state.appPreferences === "object"
      ? state.appPreferences
      : {};

  return {
    ...applyKnownStateAliases(state),
    darkMode: Boolean(pickFirstDefined(state.darkMode, preferences.darkMode, state.uiTheme === "dark")),
    currency: pickFirstDefined(state.currency, preferences.currency, preferences.summaryCurrency, "USD"),
    history: pickFirstArray(state.history, state.activityLog, state.auditTrail),
  };
}

const APP_STATE_MIGRATIONS = {
  0(payload) {
    return {
      ...payload,
      version: 1,
      state: { ...payload.state },
    };
  },
  1(payload) {
    return {
      ...payload,
      version: 2,
      state: migrateStateShapeToVersion2(payload.state),
    };
  },
  2(payload) {
    return {
      ...payload,
      version: 3,
      state: migrateStateShapeToVersion3(payload.state),
    };
  },
};

export function migrateImportedAppStatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { version: APP_STATE_VERSION, state: createEmptyAppState() };
  }

  const wrapped = payload.state && typeof payload.state === "object"
    ? { ...payload, state: payload.state }
    : { app: "M/Y Contessa", version: 0, state: payload };

  let nextPayload = wrapped;
  let version = Number.isFinite(Number(wrapped.version)) ? Number(wrapped.version) : 0;

  while (version < APP_STATE_VERSION) {
    const migrate = APP_STATE_MIGRATIONS[version];
    if (!migrate) break;
    nextPayload = migrate(nextPayload);
    version = Number.isFinite(Number(nextPayload.version)) ? Number(nextPayload.version) : version + 1;
  }

  return {
    ...nextPayload,
    version,
    state: migrateStateShapeToVersion3(
      applyKnownStateAliases(
        migrateStateShapeToVersion2(nextPayload.state && typeof nextPayload.state === "object" ? nextPayload.state : {})
      )
    ),
  };
}

export function normalizeImportedAppState(payload, fallback = createEmptyAppState()) {
  if (!payload || typeof payload !== "object") return fallback;
  const migratedPayload = migrateImportedAppStatePayload(payload);
  const nextState = migratedPayload.state && typeof migratedPayload.state === "object" ? migratedPayload.state : migratedPayload;
  const mergedState = { ...fallback, ...nextState };

  if (!Array.isArray(nextState.vessels)) {
    delete mergedState.vessels;
    delete mergedState.activeVesselId;
  }

  if (!nextState.vesselProfile && (nextState.routePlanning || nextState.routePlan || nextState.route)) {
    delete mergedState.vesselProfile;
  }

  return createPersistedAppState(mergedState);
}

export function getInitialAppState() {
  const fallback = createEmptyAppState();

  try {
    const stored = getStoredJson(STORAGE_KEY, null);
    if (!stored) return fallback;
    const normalized = normalizeImportedAppState(stored, fallback);
    const isEssentiallyEmpty =
      !normalized.tasks.length &&
      !normalized.declinedTasks.length &&
      !normalized.crewExpenses.length &&
      !normalized.crewProfiles.length &&
      !normalized.maintenanceItems.length &&
      !normalized.history.length &&
      !routePlanningHasContent(normalized.routePlanning);
    return isEssentiallyEmpty ? fallback : { ...normalized, appMode: "editor" };
  } catch {
    return fallback;
  }
}

export function createFullStateExport(state) {
  return JSON.stringify(
    {
      app: "M/Y Contessa",
      version: APP_STATE_VERSION,
      exportedAt: new Date().toISOString(),
      state: createPersistedAppState(state),
    },
    null,
    2
  );
}

export function readFilesAsDataUrls(files) {
  const fileList = Array.from(files || []);
  if (!fileList.length) return Promise.resolve([]);

  return Promise.all(
    fileList.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}

export function readFilesAsAttachmentPayloads(files) {
  const fileList = Array.from(files || []);
  if (!fileList.length) return Promise.resolve([]);

  return Promise.all(
    fileList.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              id: createId("ATT"),
              name: file.name || "Attachment",
              type: file.type || "application/octet-stream",
              dataUrl: reader.result,
              addedAt: new Date().toISOString(),
            });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}

export function csvValue(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function downloadFile(filename, content, type) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function themeClasses(darkMode) {
  return {
    page: "bg-vessel-page",
    card: darkMode
      ? "app-dark-panel border border-white/10 bg-slate-900/90 text-slate-50 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      : "border border-slate-200/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl",
    textPrimary: darkMode ? "text-slate-50 drop-shadow-none" : "text-slate-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.15)]",
    textSecondary: darkMode ? "text-slate-200" : "text-slate-700",
    input: darkMode
      ? "border-[var(--vessel-border-dark)] bg-[var(--vessel-card-dark)] text-[#f1ece4] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:ring-2 focus:ring-[var(--vessel-ring)] focus:border-[var(--vessel-border-dark)]"
      : "border-slate-200/80 bg-white/90 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] focus:ring-2 focus:ring-[var(--vessel-ring)] focus:border-[var(--vessel-border)]",
    selectedTask: darkMode
      ? "border-[var(--vessel-border-dark)] bg-[linear-gradient(135deg,var(--vessel-card-dark-strong),rgba(8,18,24,0.98))] text-white shadow-[0_22px_48px_-28px_rgba(0,0,0,0.72),0_0_20px_var(--vessel-glow-dark)]"
      : "border-[#2f7771] bg-[linear-gradient(135deg,rgba(23,86,84,0.92),rgba(14,58,61,0.96))] text-white shadow-[0_18px_40px_-24px_rgba(20,71,89,0.22)]",
    unselectedTask: darkMode ? "app-dark-card border-white/10 bg-slate-900/80 text-slate-50 shadow-[0_18px_50px_rgba(0,0,0,0.35)]" : "border-slate-200/80 bg-white/90 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.06)]",
    ring: "ring-vessel",
    subtle: darkMode ? "app-dark-inner bg-slate-800/70" : "bg-slate-50/80",
  };
}

export function createNextTaskId(tasks) {
  const numericIds = tasks.map((task) => Number(String(task.id || "").replace("CT-", ""))).filter((num) => Number.isFinite(num));
  const nextNumber = (numericIds.length ? Math.max(...numericIds) : 0) + 1;
  return `CT-${String(nextNumber).padStart(3, "0")}`;
}

export function archiveDeclinedTasks(tasks, now = Date.now()) {
  const ready = tasks.filter((task) => task.status === "declined" && task.declinedAt && now - Number(task.declinedAt) >= DECLINED_HOLD_MS);
  const archivedTasks = ready.map((task) => ({ ...task, archivedAt: new Date(now).toISOString() }));
  const remainingTasks = tasks.filter((task) => !ready.some((declined) => declined.id === task.id));
  return { archivedTasks, remainingTasks };
}

export function buildMaintenanceAlerts(maintenanceItems) {
  return maintenanceItems
    .map((item) => ({ ...item, daysRemaining: daysUntil(item.nextDueDate) }))
    .filter((item) => item.alertEnabled && item.daysRemaining !== null && item.daysRemaining <= 1)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function completeMaintenanceCycle(item, completedDate = todayDateString(), now = Date.now()) {
  const nextDueDate = getScheduledNextDue(item, completedDate);
  const existingLogIndex = (item.logs || []).findIndex((log) => log.completedDate === completedDate);
  const log = {
    id: existingLogIndex >= 0 ? item.logs[existingLogIndex].id : `ML-${now}`,
    completedDate,
    previousDueDate: item.nextDueDate,
    nextDueDate,
    notes: item.notes || "",
  };
  const logs = existingLogIndex >= 0
    ? item.logs.map((entry, index) => (index === existingLogIndex ? log : entry))
    : [log, ...(item.logs || [])];

  return normalizeMaintenanceItem({
    ...item,
    nextDueDate,
    extensionUsed: false,
    logs: sortMaintenanceLogs(logs),
  });
}

export function buildCertificateAlerts(crewProfiles, windows = CERTIFICATE_ALERT_WINDOWS) {
  return crewProfiles
    .flatMap((profile) =>
      (profile.certificates || []).map((certificate) => {
        const expiryMeta = getCertificateExpiryMeta(certificate.expiryDate);
        const daysRemaining = expiryMeta.daysRemaining;
        const alertWindow = windows.find((window) => daysRemaining !== null && daysRemaining <= window);
        return {
          ...certificate,
          crewId: profile.id,
          crewName: profile.fullName,
          crewRank: profile.rank,
          department: profile.department,
          daysRemaining,
          certificateStatus: certificate.status || expiryMeta.status,
          certificateStatusLabel: certificate.statusLabel || expiryMeta.statusLabel,
          alertWindow: alertWindow ?? null,
        };
      })
    )
    .filter((certificate) => certificate.daysRemaining !== null && certificate.daysRemaining <= Math.max(...windows))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function buildDashboardSnapshot({
  tasks = [],
  boatExpenses = [],
  crewExpenses = [],
  maintenanceAlerts = [],
  certificateAlerts = [],
  history = [],
} = {}) {
  const todayTasks = tasks.filter((task) => !["completed", "approved"].includes(task.status) && isDueToday(task.dueDate));
  const overdueTasks = tasks.filter((task) => isOverdue(task.dueDate, task.status));
  const urgentTasks = tasks.filter((task) => !["completed", "approved"].includes(task.status) && task.priority === "urgent");
  const pendingApprovals = boatExpenses.filter((item) => !isPaidMoneyStatus(item.status) && item.status !== "declined");
  const unpaidCrew = crewExpenses.filter((item) => !isPaidMoneyStatus(item.status) && item.status !== "declined");

  return {
    todayTasks,
    overdueTasks,
    urgentTasks,
    pendingApprovals,
    unpaidCrew,
    expiringCertificates: certificateAlerts,
    maintenanceAlerts,
    recentActivity: history.slice(0, 6),
  };
}

function inferMaintenanceLead(item = {}) {
  const explicitOwner = item.responsiblePerson || item.assignee || item.owner;
  if (explicitOwner) return explicitOwner;

  const area = String(item.area || "").toLowerCase();
  if (["engine room", "engine", "lazarette", "tender garage"].some((value) => area.includes(value))) return "Chief Engineer";
  if (["bridge", "wheelhouse"].some((value) => area.includes(value))) return "Captain";
  if (["crew quarters", "guest cabin", "master cabin", "galley", "saloon"].some((value) => area.includes(value))) return "Chief Stewardess";
  return "Chief Mate";
}

function getMaintenanceStatus(item = {}) {
  if (item.statusLabel) return item.statusLabel;
  const remaining = daysUntil(item.nextDueDate);
  if (remaining === null) return "Unscheduled";
  if (remaining < 0) return "Overdue";
  if (remaining === 0) return "Due today";
  return "Scheduled";
}

export function buildTodayOperationsSnapshot({
  tasks = [],
  maintenanceItems = [],
  certificates = [],
  boatExpenses = [],
  crewExpenses = [],
} = {}) {
  const overdueTasks = tasks
    .filter((task) => isOverdue(task.dueDate, task.status))
    .map((task) => ({
      ...task,
      daysRemaining: daysUntil(task.dueDate),
      urgencyLevel: task.priority === "urgent" || task.priority === "high" ? "urgent" : "warning",
    }))
    .sort((a, b) => {
      const priorityWeight = { urgent: 0, high: 1, medium: 2, low: 3 };
      const prioritySort = (priorityWeight[a.priority] ?? 9) - (priorityWeight[b.priority] ?? 9);
      if (prioritySort !== 0) return prioritySort;
      return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999);
    });

  const dueTodayMaintenance = maintenanceItems
    .filter((item) => isDueToday(item.nextDueDate))
    .map((item) => ({
      ...item,
      dueDate: item.nextDueDate,
      system: item.area || "General",
      responsiblePerson: inferMaintenanceLead(item),
      statusLabel: getMaintenanceStatus(item),
    }))
    .sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));

  const expiringCertificates = certificates
    .map((certificate) => ({
      ...certificate,
      daysRemaining: certificate.daysRemaining ?? daysUntil(certificate.expiryDate),
    }))
    .filter((certificate) => certificate.daysRemaining !== null && certificate.daysRemaining <= 30)
    .map((certificate) => ({
      ...certificate,
      urgencyLevel: getUrgencyLevel(certificate.daysRemaining),
    }))
    .sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999));

  const pendingApprovals = [
    ...boatExpenses
      .filter((item) => ["requested", "received"].includes(item.status) || item.approval === "pending")
      .map((item) => ({
        id: `boat-${item.taskId}-${item.id}`,
        sourceType: "boat",
        taskId: item.taskId,
        itemId: item.id,
        title: item.supplier || item.taskName || "Boat request",
        amount: item.amount ?? 0,
        currency: item.currency || "USD",
        requestedBy: item.requestedBy || item.taskName || item.taskId || "Operations",
        approvalStatus: item.displayStatus || item.status || item.approval || "requested",
      })),
    ...crewExpenses
      .filter((item) => ["requested", "received"].includes(item.status) || item.approval === "pending")
      .map((item) => ({
        id: `crew-${item.id}`,
        sourceType: "crew",
        itemId: item.id,
        title: item.title || "Crew expense",
        amount: item.amount ?? 0,
        currency: item.currency || "USD",
        requestedBy: item.requestedBy || "Crew",
        approvalStatus: item.displayStatus || item.status || item.approval || "requested",
      })),
    ...tasks
      .filter((task) => task.approvalStatus === "pending" || (task.requiresApproval && !task.approvalStatus))
      .map((task) => ({
        id: `task-${task.id}`,
        sourceType: "task",
        taskId: task.id,
        itemId: task.id,
        title: task.name,
        amount: null,
        currency: null,
        requestedBy: task.assignee || "Operations",
        approvalStatus: task.approvalStatus || "pending",
      })),
  ];

  return {
    overdueTasks,
    dueTodayMaintenance,
    expiringCertificates,
    pendingApprovals,
  };
}

export function buildOperationalNotifications({
  tasks = [],
  boatExpenses = [],
  crewExpenses = [],
  maintenanceAlerts = [],
  certificateAlerts = [],
} = {}) {
  const notifications = [];
  const describeStatus = (status) => titleCase(status || "requested");

  tasks.forEach((task) => {
    const remaining = daysUntil(task.dueDate);
    if (!["completed", "approved"].includes(task.status) && remaining !== null && remaining < 0) {
      notifications.push({
        id: `task-overdue-${task.id}`,
        level: "critical",
        title: `${task.name} is overdue`,
        detail: `${task.area} - ${Math.abs(remaining)} day(s) overdue`,
        section: "tasks",
        targetId: task.id,
      });
    } else if (!["completed", "approved"].includes(task.status) && task.priority === "urgent") {
      notifications.push({
        id: `task-urgent-${task.id}`,
        level: "warning",
        title: `${task.name} is urgent`,
        detail: `${task.area} - ${task.assignee || "Unassigned"}`,
        section: "tasks",
        targetId: task.id,
      });
    }
  });

  maintenanceAlerts.forEach((item) => {
    notifications.push({
      id: `maintenance-${item.id}`,
      level: item.daysRemaining < 0 ? "critical" : "warning",
      title: `${item.title} maintenance due`,
      detail: `${item.area} - ${item.daysRemaining < 0 ? `${Math.abs(item.daysRemaining)} day(s) overdue` : item.daysRemaining === 0 ? "Due today" : "Due tomorrow"}`,
      section: "maintenance",
      targetId: item.id,
    });
  });

  certificateAlerts.forEach((item) => {
    notifications.push({
      id: `certificate-${item.crewId}-${item.id}`,
      level: item.daysRemaining < 0 ? "critical" : item.daysRemaining <= 30 ? "warning" : "info",
      title: `${item.name} expiring for ${item.crewName}`,
      detail: formatDaysRemaining(item.daysRemaining),
      section: "certificates",
      targetId: item.crewId,
    });
  });

  boatExpenses
    .filter((item) => !isPaidMoneyStatus(item.status) && item.status !== "declined")
    .forEach((item) => {
      notifications.push({
        id: `boat-expense-${item.taskId}-${item.id}`,
        level: item.status === "approved" ? "info" : "warning",
        title: `${item.supplier || "Boat item"} is ${item.status}`,
        detail: `${item.taskName || item.taskId} - ${describeStatus(item.status)}`,
        section: "expenses",
        targetId: item.taskId,
        taskId: item.taskId,
        bucket: "boat",
      });
    });

  crewExpenses
    .filter((item) => !isPaidMoneyStatus(item.status) && item.status !== "declined")
    .forEach((item) => {
      notifications.push({
        id: `crew-expense-${item.id}`,
        level: item.status === "approved" ? "info" : "warning",
        title: `${item.title} is ${item.status}`,
        detail: `Crew expense - ${describeStatus(item.status)}`,
        section: "expenses",
        targetId: item.id,
        bucket: "crew",
      });
    });

  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return notifications.sort((a, b) => (severityOrder[a.level] ?? 9) - (severityOrder[b.level] ?? 9));
}

