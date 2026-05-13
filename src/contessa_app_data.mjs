export const STATUS_OPTIONS = ["pending", "ongoing", "completed"];
export const TASK_STATUS_OPTIONS = [...STATUS_OPTIONS, "approved", "declined"];
export const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
export const ASSIGNEE_OPTIONS = ["Captain Luca Marin", "Chief Engineer Elena Voss", "First Mate Tomas Reed", "Bosun Nico Hale", "Chief Stewardess Sofia Vale", "Deckhand Leo Mercer"];
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
const OCTOPUSSY_DEMO_SEED_VERSION = 2;
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
    textSecondaryDark: "rgba(226, 240, 236, 0.70)",
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
    textSecondaryDark: "rgba(226, 232, 240, 0.68)",
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
    textSecondaryDark: "rgba(233, 221, 226, 0.68)",
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
    textSecondaryDark: "rgba(236, 226, 207, 0.68)",
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
    textSecondaryDark: "rgba(227, 223, 243, 0.68)",
    primaryDark: "#b8b0ff",
    primarySoftDark: "rgba(184, 176, 255, 0.11)",
    glowDark: "rgba(124, 118, 168, 0.20)",
  },
};
const ADDITIONAL_VESSEL_THEME_SEQUENCE = ["burgundy", "champagne", "violet"];
const REQUIRED_FLEET_VESSELS = [
  {
    id: "contessa",
    name: "Contessa",
    details: {
      length: 32,
      vesselType: "Motor Yacht",
      flag: "Cayman Islands",
      homePort: "Monaco",
      status: "Operational",
    },
  },
  {
    id: "octopussy",
    name: "Octopussy",
    details: {
      length: 30,
      vesselType: "Motor Yacht",
      flag: "Cayman Islands",
      homePort: "Fort Lauderdale",
      status: "Review",
      notes: "Bahamas passage demo workspace.",
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

export const initialVesselProfile = normalizeVesselProfile({
  vesselName: "Contessa",
  draft: 2.3,
  beam: 7.4,
  cruisingSpeedKnots: 12,
  fuelBurnPerHour: 245,
  fuelCapacity: 18200,
  fuelReservePercentage: 18,
});

export const initialDocuments = [
  {
    id: "DOC-REG-001",
    title: "Vessel Registration",
    category: "Registration",
    status: "Current",
    owner: "Owner Office",
    notes: "Primary registration placeholder for investor demo.",
  },
  {
    id: "DOC-INS-001",
    title: "Hull & Machinery Insurance",
    category: "Insurance",
    status: "Review due in 14 days",
    owner: "Manager",
    notes: "Renewal workflow placeholder with linked broker file slot.",
  },
  {
    id: "DOC-MAN-001",
    title: "Engine Room Operating Manual",
    category: "Manual",
    status: "Available",
    owner: "Chief Engineer",
    notes: "Document upload placeholder for OEM and service references.",
  },
  {
    id: "DOC-LEGAL-001",
    title: "IP & Legal Notice",
    category: "Legal",
    status: "Active",
    owner: "System",
    notes: APP_LEGAL_COPY,
  },
];

export const initialTasks = [
  {
    id: "TASK-001",
    name: "Starboard davit hydraulic seep",
    area: "Aft Deck",
    department: "Deck",
    assignee: "Bosun Nico Hale",
    status: "pending",
    priority: "high",
    dueDate: dateStringFromNow(-2),
    approvalStatus: "pending",
    notes: "Inspect seals before guest tender launch window.",
    comments: [{ id: "COM-001", text: "Observed minor seep after washdown.", by: "Captain Luca Marin", at: new Date().toISOString() }],
    quotes: [
      { id: "Q-001", supplier: "Ocean Service SRL", amount: 1650, currency: "EUR", status: "received", includeInSummary: true },
      { id: "Q-002", supplier: "Harbor Hydraulics", amount: 1420, currency: "EUR", status: "requested", includeInSummary: false },
    ],
  },
  {
    id: "TASK-002",
    name: "Port generator raw-water impeller service",
    area: "Engine Room",
    department: "Engineering",
    assignee: "Chief Engineer Elena Voss",
    status: "ongoing",
    priority: "urgent",
    dueDate: dateStringFromNow(0),
    approvalStatus: "approved",
    notes: "Parts onboard. Complete before next guest transit.",
  },
  {
    id: "TASK-003",
    name: "Bridge VHF handheld battery rotation",
    area: "Bridge",
    department: "Bridge",
    assignee: "First Mate Tomas Reed",
    status: "pending",
    priority: "medium",
    dueDate: dateStringFromNow(1),
    approvalStatus: "pending",
    notes: "Rotate emergency handheld packs and update log.",
  },
  {
    id: "TASK-004",
    name: "Master shower mixer replacement",
    area: "Master Cabin",
    department: "Interior",
    assignee: "Chief Stewardess Sofia Vale",
    status: "completed",
    priority: "medium",
    dueDate: dateStringFromNow(-1),
    approvalStatus: "approved",
    notes: "Replacement fitted; awaiting captain approval close-out.",
  },
  {
    id: "TASK-005",
    name: "Foredeck teak seam inspection",
    area: "Foredeck",
    department: "Deck",
    assignee: "Bosun Nico Hale",
    status: "approved",
    priority: "low",
    dueDate: dateStringFromNow(-3),
    approvalStatus: "approved",
    notes: "Survey complete and logged for next yard period.",
  },
  {
    id: "TASK-006",
    name: "Crew provisioning variance review",
    area: "Galley",
    department: "Admin",
    assignee: "Captain Luca Marin",
    status: "pending",
    priority: "medium",
    dueDate: dateStringFromNow(2),
    approvalStatus: "pending",
    notes: "Review weekly provisioning overage before owner summary.",
  },
  {
    id: "TASK-007",
    name: "Nav light lens polish and seal check",
    area: "Upper Deck",
    department: "Deck",
    assignee: "Deckhand Leo Mercer",
    status: "ongoing",
    priority: "high",
    dueDate: dateStringFromNow(3),
    approvalStatus: "pending",
    notes: "Complete before coastal night passage.",
  },
  {
    id: "TASK-008",
    name: "AIS antenna connector inspection",
    area: "Wheelhouse",
    department: "Bridge",
    assignee: "First Mate Tomas Reed",
    status: "pending",
    priority: "urgent",
    dueDate: dateStringFromNow(0),
    approvalStatus: "pending",
    notes: "Intermittent target dropout reported in harbor.",
    quotes: [
      { id: "Q-003", supplier: "Bridge Tech Monaco", amount: 980, currency: "EUR", status: "requested", includeInSummary: true },
    ],
  },
];

export const initialCrewExpenses = [
  {
    id: "CRX-001",
    title: "Crew transport reimbursement",
    amount: 180,
    currency: "EUR",
    status: "approved",
    attachments: [],
  },
];

export const initialCrewProfiles = [
  {
    id: "CRW-001",
    fullName: "Captain Luca Marin",
    rank: "Captain",
    department: "Bridge",
    nationality: "Italian",
    roleKey: "captain",
    notes: "Master of vessel and bridge lead.",
    certificates: [{ id: "CERT-001", name: "Master 3000 GT", holderName: "Captain Luca Marin", issuingAuthority: "MCA", expiryDate: dateStringFromNow(24), issueDate: dateStringFromNow(-700), notes: "Renewal already planned." }],
  },
  {
    id: "CRW-002",
    fullName: "Elena Voss",
    rank: "Chief Engineer",
    department: "Engineering",
    nationality: "German",
    roleKey: "engineer",
    notes: "Engineering lead and machinery approvals.",
    certificates: [{ id: "CERT-002", name: "EOOW Unlimited", holderName: "Elena Voss", issuingAuthority: "Liberia", expiryDate: dateStringFromNow(78), issueDate: dateStringFromNow(-820) }],
  },
  {
    id: "CRW-003",
    fullName: "Tomas Reed",
    rank: "First Mate",
    department: "Deck",
    nationality: "British",
    roleKey: "first_mate",
    notes: "Deck operations, bridge watch, and tender logistics.",
    certificates: [{ id: "CERT-003", name: "GMDSS", holderName: "Tomas Reed", issuingAuthority: "UK MCA", expiryDate: dateStringFromNow(12), issueDate: dateStringFromNow(-540) }],
  },
  {
    id: "CRW-004",
    fullName: "Sofia Vale",
    rank: "Chief Stewardess",
    department: "Interior",
    nationality: "Spanish",
    roleKey: "stewardess",
    notes: "Interior standards and guest readiness.",
    certificates: [{ id: "CERT-004", name: "STCW Basic Safety", holderName: "Sofia Vale", issuingAuthority: "Marshall Islands", expiryDate: dateStringFromNow(110), issueDate: dateStringFromNow(-960) }],
  },
  {
    id: "CRW-005",
    fullName: "Nico Hale",
    rank: "Bosun",
    department: "Deck",
    nationality: "South African",
    roleKey: "bosun",
    notes: "Deck maintenance lead.",
    certificates: [{ id: "CERT-005", name: "Powerboat Level 2", holderName: "Nico Hale", issuingAuthority: "RYA", expiryDate: dateStringFromNow(-6), issueDate: dateStringFromNow(-430) }],
  },
  {
    id: "CRW-006",
    fullName: "Leo Mercer",
    rank: "Deckhand",
    department: "Deck",
    nationality: "New Zealand",
    roleKey: "deckhand",
    notes: "Junior deck operator for exterior rounds.",
    certificates: [],
  },
];

export const initialMaintenanceItems = [
  {
    id: "MNT-001",
    title: "Port generator sea strainer clean",
    area: "Engine room",
    frequencyMonths: 1,
    nextDueDate: dateStringFromNow(0),
    notes: "Required before next guest turnaround.",
    alertEnabled: true,
  },
  {
    id: "MNT-002",
    title: "Life raft hydrostatic release inspection",
    area: "Safety equipment",
    frequencyMonths: 12,
    nextDueDate: dateStringFromNow(7),
    notes: "Class-critical safety inspection.",
    alertEnabled: true,
  },
  {
    id: "MNT-003",
    title: "Anchor windlass grease and brake check",
    area: "Foredeck",
    frequencyMonths: 2,
    nextDueDate: dateStringFromNow(-1),
    notes: "Heavy recent use during charter turn.",
    alertEnabled: true,
  },
];

export const initialHistory = [
  { id: "HIS-001", at: new Date().toISOString(), section: "Objectives", action: "Task escalated", detail: "AIS antenna connector inspection moved to critical." },
  { id: "HIS-002", at: new Date(Date.now() - 1000 * 60 * 38).toISOString(), section: "Expenses and Quotations", action: "Quote selected", detail: "Ocean Service SRL now included in vessel spend summary." },
  { id: "HIS-003", at: new Date(Date.now() - 1000 * 60 * 92).toISOString(), section: "Maintenance", action: "Maintenance due today", detail: "Port generator sea strainer clean flagged for command center." },
  { id: "HIS-004", at: new Date(Date.now() - 1000 * 60 * 160).toISOString(), section: "Certificates", action: "Certificate risk", detail: "GMDSS for Tomas Reed is inside the 30-day warning window." },
  { id: "HIS-005", at: new Date(Date.now() - 1000 * 60 * 245).toISOString(), section: "Route Planning", action: "Route updated", detail: "Monaco to St-Tropez passage recalculated with 12 kn cruise." },
  { id: "HIS-006", at: new Date(Date.now() - 1000 * 60 * 310).toISOString(), section: "Crew", action: "Crew profile updated", detail: "Captain contact and vessel role details confirmed." },
];

export const initialRoutePlanning = normalizeRoutePlanningState({
  vesselProfile: initialVesselProfile,
  safetyMargin: 1.2,
  depthLayer: {
    connected: false,
    provider: "",
    samples: [],
    zones: [],
  },
  waypoints: [
    { id: "RWP-001", name: "Monaco Departure", lng: 7.4246, lat: 43.7384 },
    { id: "RWP-002", name: "Cap Ferrat Clearance", lng: 7.3315, lat: 43.6854 },
    { id: "RWP-003", name: "St-Tropez Approach", lng: 6.6402, lat: 43.2729 },
  ],
});

function createDefaultWorkspaceData() {
  return {
    history: initialHistory,
    declinedTasks: [],
    vesselProfile: initialVesselProfile,
    documents: initialDocuments.map(normalizeDocumentRecord),
    tasks: initialTasks.map((task) => normalizeTask(task)),
    crewExpenses: initialCrewExpenses.map(normalizeCrewExpense),
    crewProfiles: initialCrewProfiles.map(normalizeCrewProfile),
    workers: initialCrewProfiles.map(normalizeCrewProfile),
    maintenanceItems: initialMaintenanceItems.map(normalizeMaintenanceItem),
    routePlanning: initialRoutePlanning,
  };
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
      initialVesselProfile
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
    initialVesselProfile
  );

  return {
    history: Array.isArray(state.history) ? state.history : [],
    declinedTasks: Array.isArray(state.declinedTasks) ? state.declinedTasks.map((task) => normalizeTask(task)) : [],
    vesselProfile,
    documents: Array.isArray(state.documents) ? state.documents.map(normalizeDocumentRecord) : initialDocuments.map(normalizeDocumentRecord),
    tasks: Array.isArray(state.tasks) ? state.tasks.map((task) => normalizeTask(task)) : [],
    crewExpenses: Array.isArray(state.crewExpenses) ? state.crewExpenses.map(normalizeCrewExpense) : [],
    crewProfiles: Array.isArray(state.crewProfiles) ? state.crewProfiles.map(normalizeCrewProfile) : [],
    workers: Array.isArray(state.workers) ? state.workers.map(normalizeCrewProfile) : [],
    maintenanceItems: Array.isArray(state.maintenanceItems) ? state.maintenanceItems.map(normalizeMaintenanceItem) : [],
    routePlanning,
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

function buildOctopussyWorkspace(name = "Octopussy") {
  const vesselProfile = normalizeVesselProfile({
    vesselName: name,
    draft: 2.1,
    beam: 6.7,
    cruisingSpeedKnots: 19,
    fuelBurnPerHour: 339,
    fuelCapacity: 14200,
    fuelReservePercentage: 18,
  });

  const crewProfiles = [
    {
      id: "OCT-CRW-001",
      fullName: "Marcus Reed",
      rank: "Captain",
      department: "Bridge",
      nationality: "British",
      roleKey: "captain",
      notes: "Commanding officer and passage lead.",
      certificates: [
        { id: "OCT-CERT-001", name: "Master 3000 GT", holderName: "Marcus Reed", issuingAuthority: "MCA", expiryDate: dateStringFromNow(320), issueDate: dateStringFromNow(-900) },
      ],
    },
    {
      id: "OCT-CRW-002",
      fullName: "Elena Voss",
      rank: "Chief Officer",
      department: "Deck",
      nationality: "German",
      roleKey: "first_mate",
      notes: "Deck lead and bridge support.",
      certificates: [
        { id: "OCT-CERT-002", name: "STCW Basic Safety", holderName: "Elena Voss", issuingAuthority: "Marshall Islands", expiryDate: dateStringFromNow(58), issueDate: dateStringFromNow(-640), notes: "Due for review this quarter." },
      ],
    },
    {
      id: "OCT-CRW-003",
      fullName: "Luka Marin",
      rank: "Engineer",
      department: "Engineering",
      nationality: "Croatian",
      roleKey: "engineer",
      notes: "Engine room operations and service coordination.",
      certificates: [
        { id: "OCT-CERT-003", name: "Engine Room Watchkeeping", holderName: "Luka Marin", issuingAuthority: "Liberia", expiryDate: dateStringFromNow(330), issueDate: dateStringFromNow(-780) },
      ],
    },
    {
      id: "OCT-CRW-004",
      fullName: "Adrian Cole",
      rank: "Deckhand",
      department: "Deck",
      nationality: "Australian",
      roleKey: "deckhand",
      notes: "Exterior rounds, tender prep, and anchor support.",
      certificates: [
        { id: "OCT-CERT-004", name: "STCW Basic Safety", holderName: "Adrian Cole", issuingAuthority: "RYA", expiryDate: dateStringFromNow(24), issueDate: dateStringFromNow(-410), notes: "Renewal booking pending." },
      ],
    },
    {
      id: "OCT-CRW-005",
      fullName: "Sofia Lane",
      rank: "Stewardess",
      department: "Interior",
      nationality: "Spanish",
      roleKey: "stewardess",
      notes: "Interior standards and guest-facing readiness.",
      certificates: [
        { id: "OCT-CERT-005", name: "Interior Safety Familiarisation", holderName: "Sofia Lane", issuingAuthority: "IYT", expiryDate: dateStringFromNow(150), issueDate: dateStringFromNow(-300) },
      ],
    },
    {
      id: "OCT-CRW-006",
      fullName: "Noah Bennett",
      rank: "Deckhand",
      department: "Deck",
      nationality: "American",
      roleKey: "deckhand",
      notes: "Tender prep, line handling, and exterior support.",
      certificates: [],
    },
  ].map(normalizeCrewProfile);

  const tasks = [
    {
      id: "OCT-TASK-001",
      name: "Inspect anchor windlass",
      area: "Foredeck",
      department: "Deck",
      assignee: "Adrian Cole",
      status: "pending",
      priority: "urgent",
      dueDate: dateStringFromNow(-3),
      approvalStatus: "pending",
      notes: "Crew reported uneven load on starboard side during morning test.",
    },
    {
      id: "OCT-TASK-002",
      name: "Polish stainless aft deck",
      area: "Aft Deck",
      department: "Deck",
      assignee: "Adrian Cole",
      status: "ongoing",
      priority: "medium",
      dueDate: dateStringFromNow(-1),
      approvalStatus: "pending",
      notes: "Finish before guest arrival photography.",
      quotes: [
        { id: "OCT-Q-002", supplier: "Hull Polish", amount: 4200, currency: "USD", status: "requested", includeInSummary: false },
      ],
    },
    {
      id: "OCT-TASK-003",
      name: "Check tender fuel level",
      area: "Tender Garage",
      department: "Deck",
      assignee: "Elena Voss",
      status: "pending",
      priority: "high",
      dueDate: dateStringFromNow(0),
      approvalStatus: "approved",
      notes: "Set for Bahamas crossing tender operations.",
      quotes: [
        { id: "OCT-Q-004", supplier: "Tender Service", amount: 2600, currency: "USD", status: "approved", includeInSummary: true },
      ],
    },
    {
      id: "OCT-TASK-004",
      name: "Replace galley water filter",
      area: "Galley",
      department: "Interior",
      assignee: "Sofia Lane",
      status: "pending",
      priority: "medium",
      dueDate: dateStringFromNow(2),
      approvalStatus: "approved",
      notes: "Filter pressure drop recorded during morning rounds.",
    },
    {
      id: "OCT-TASK-005",
      name: "Review Bahamas route",
      area: "Bridge",
      department: "Bridge",
      assignee: "Marcus Reed",
      status: "ongoing",
      priority: "high",
      dueDate: dateStringFromNow(1),
      approvalStatus: "pending",
      notes: "Depth review and customs timing check still required.",
    },
    {
      id: "OCT-TASK-006",
      name: "Service guest cabin AC",
      area: "Guest Cabin",
      department: "Engineering",
      assignee: "Luka Marin",
      status: "pending",
      priority: "high",
      dueDate: dateStringFromNow(-2),
      approvalStatus: "pending",
      notes: "Cabin 3 cooling variance reported overnight.",
      quotes: [
        { id: "OCT-Q-003", supplier: "AC Service", amount: 1950, currency: "USD", status: "requested", includeInSummary: true },
      ],
    },
    {
      id: "OCT-TASK-007",
      name: "Update safety checklist",
      area: "Bridge",
      department: "Admin",
      assignee: "Marcus Reed",
      status: "completed",
      priority: "medium",
      dueDate: dateStringFromNow(4),
      approvalStatus: "approved",
      notes: "Monthly bridge safety review completed and awaiting filing.",
      quotes: [
        { id: "OCT-Q-001", supplier: "Teak Repair", amount: 6800, currency: "USD", status: "requested", includeInSummary: false },
      ],
    },
    {
      id: "OCT-TASK-008",
      name: "Calibrate bridge radar overlay",
      area: "Bridge",
      department: "Bridge",
      assignee: "Marcus Reed",
      status: "pending",
      priority: "medium",
      dueDate: dateStringFromNow(3),
      approvalStatus: "pending",
      notes: "Overlay drift noted during last coastal run.",
    },
    {
      id: "OCT-TASK-009",
      name: "Inspect stern thruster alarm history",
      area: "Engine room",
      department: "Engineering",
      assignee: "Luka Marin",
      status: "pending",
      priority: "urgent",
      dueDate: dateStringFromNow(-4),
      approvalStatus: "pending",
      notes: "Alarm log needs review before next departure window.",
    },
  ].map((task) => normalizeTask(task));

  const crewExpenses = [
    { id: "OCT-EXP-001", title: "Fuel delivery", amount: 9675, currency: "USD", status: "requested", attachments: [] },
    { id: "OCT-EXP-002", title: "Provisioning", amount: 2640, currency: "USD", status: "approved", attachments: [] },
    { id: "OCT-EXP-003", title: "Engine filters", amount: 640, currency: "USD", status: "paid", attachments: [] },
    { id: "OCT-EXP-004", title: "Dockage", amount: 4210, currency: "USD", status: "requested", attachments: [] },
    { id: "OCT-EXP-005", title: "Cleaning supplies", amount: 525, currency: "USD", status: "approved", attachments: [] },
    { id: "OCT-EXP-006", title: "Crew launch transfer", amount: 860, currency: "USD", status: "requested", attachments: [] },
  ].map(normalizeCrewExpense);

  const workers = [
    { id: "OCT-WRK-001", fullName: "Marine Electrician", rank: "Contractor", department: "Engineering", notes: "Pending" },
    { id: "OCT-WRK-002", fullName: "Teak Specialist", rank: "Contractor", department: "Deck", notes: "Confirmed" },
    { id: "OCT-WRK-003", fullName: "Detail Crew", rank: "Contractor", department: "Deck", notes: "Scheduled" },
    { id: "OCT-WRK-004", fullName: "AC Technician", rank: "Contractor", department: "Engineering", notes: "Quote requested" },
  ].map(normalizeCrewProfile);

  const documents = [
    { id: "OCT-DOC-001", title: "Vessel Registration", category: "Registration", status: "Current", owner: "Owner Office", notes: "Octopussy registry pack." },
    { id: "OCT-DOC-002", title: "Insurance Binder", category: "Insurance", status: "Active", owner: "Manager", notes: "Annual cover confirmed." },
    { id: "OCT-DOC-003", title: "Bahamas Cruising Permit", category: "Legal", status: "Review", owner: "Captain", notes: "Supporting route review and customs timing." },
    { id: "OCT-DOC-004", title: "Engine Service Manual", category: "Manual", status: "Available", owner: "Engineer", notes: "Primary OEM service reference." },
    { id: "OCT-DOC-005", title: "IP & Legal Notice", category: "Legal", status: "Active", owner: "System", notes: APP_LEGAL_COPY },
    { id: "OCT-DOC-006", title: "Guest Tender Inventory", category: "Manual", status: "Updated", owner: "Deck", notes: "Seasonal watersports loadout confirmed." },
  ].map(normalizeDocumentRecord);

  const maintenanceItems = [
    {
      id: "OCT-MNT-001",
      title: "Guest cabin AC pressure check",
      area: "Guest cabins",
      frequencyMonths: 3,
      nextDueDate: dateStringFromNow(1),
      notes: "Follow-up after service task completion.",
      alertEnabled: true,
    },
    {
      id: "OCT-MNT-002",
      title: "Anchor windlass service review",
      area: "Foredeck",
      frequencyMonths: 2,
      nextDueDate: dateStringFromNow(6),
      notes: "Confirm lubrication schedule after inspection.",
      alertEnabled: true,
    },
    {
      id: "OCT-MNT-003",
      title: "Life raft service certificate review",
      area: "Safety equipment",
      frequencyMonths: 12,
      nextDueDate: dateStringFromNow(14),
      notes: "Align service window with Bahamas transit schedule.",
      alertEnabled: true,
    },
  ].map(normalizeMaintenanceItem);

  const routePlanning = normalizeRoutePlanningState({
    vesselProfile,
    safetyMargin: 1.1,
    depthLayer: {
      connected: false,
      provider: "",
      samples: [],
      zones: [],
    },
    status: "Review",
    waypoints: [
      { id: "OCT-RWP-001", name: "Fort Lauderdale", lng: -80.1041, lat: 26.0905 },
      { id: "OCT-RWP-002", name: "Bimini", lng: -79.2818, lat: 25.7281 },
      { id: "OCT-RWP-003", name: "Nassau", lng: -77.3431, lat: 25.0443 },
    ],
  });

  const history = [
    { id: "OCT-HIS-001", at: new Date().toISOString(), section: "Route Planning", action: "Route review opened", detail: "Fort Lauderdale to Nassau passage flagged for review." },
    { id: "OCT-HIS-002", at: new Date(Date.now() - 1000 * 60 * 41).toISOString(), section: "Expenses and Quotations", action: "Fuel invoice pending", detail: "Fuel delivery approval is waiting for captain sign-off." },
    { id: "OCT-HIS-003", at: new Date(Date.now() - 1000 * 60 * 97).toISOString(), section: "Certificates", action: "STCW review", detail: "Two crew certificates entered the review window." },
    { id: "OCT-HIS-004", at: new Date(Date.now() - 1000 * 60 * 155).toISOString(), section: "Crew", action: "Contractor scheduled", detail: "Detail crew scheduled for aft deck finish support." },
  ];

  return {
    history,
    declinedTasks: [],
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
  name = "Contessa",
  details = {},
  workspace = {},
  theme = null,
} = {}) {
  const isOctopussyPreset = id === "octopussy" || String(name || "").trim().toLowerCase() === "octopussy";
  const presetWorkspace = isOctopussyPreset ? buildOctopussyWorkspace(name) : createDefaultWorkspaceData();
  const normalizedProfile = normalizeVesselProfile({
    ...(presetWorkspace.vesselProfile || initialVesselProfile),
    ...workspace.vesselProfile,
    vesselName: name,
  });
  const normalizedWorkspace = normalizeWorkspaceState({
    ...presetWorkspace,
    ...workspace,
    vesselProfile: normalizedProfile,
    routePlanning: {
      ...((workspace.routePlanning || presetWorkspace.routePlanning || initialRoutePlanning)),
      vesselProfile: normalizedProfile,
    },
  });

  return {
    id,
    name,
    details: {
      length: details.length ?? (isOctopussyPreset ? 30 : 32),
      vesselType: details.vesselType || "Motor Yacht",
      flag: details.flag || "Cayman Islands",
      homePort: details.homePort || (isOctopussyPreset ? "Fort Lauderdale" : "Monaco"),
      crewNumber: details.crewNumber ?? normalizedWorkspace.crewProfiles.length,
      notes: details.notes || "",
      status: details.status || (isOctopussyPreset ? "Review" : "Operational"),
      demoSeeded: isOctopussyPreset,
      demoSeedVersion: isOctopussyPreset ? OCTOPUSSY_DEMO_SEED_VERSION : undefined,
    },
    theme: normalizeVesselTheme(theme || details.theme || {}, getImplicitThemeNameForVessel(id)),
    ...normalizedWorkspace,
  };
}

export function normalizeFleetVessel(vessel = {}, fallbackId = DEFAULT_FLEET_VESSEL_ID) {
  const vesselId = vessel.id || fallbackId;
  const name = vessel.name || vessel.vesselProfile?.vesselName || "Contessa";
  if (
    vesselId === "octopussy" &&
    (vessel.details?.demoSeeded !== true || vessel.details?.demoSeedVersion !== OCTOPUSSY_DEMO_SEED_VERSION)
  ) {
    return createFleetVesselWorkspace({
      id: vesselId,
      name,
      details: {
        ...vessel.details,
        demoSeeded: true,
        demoSeedVersion: OCTOPUSSY_DEMO_SEED_VERSION,
      },
      workspace: {},
    });
  }
  const normalizedWorkspace = normalizeWorkspaceState({
    ...vessel,
    vesselProfile: {
      ...(vessel.vesselProfile || initialVesselProfile),
      vesselName: name,
    },
    routePlanning: {
      ...(vessel.routePlanning || vessel.routePlan || vessel.route || createEmptyRoutePlanningState()),
      vesselProfile: {
        ...(vessel.routePlanning?.vesselProfile || vessel.routePlan?.vesselProfile || vessel.route?.vesselProfile || vessel.vesselProfile || initialVesselProfile),
        vesselName: name,
      },
    },
  });

  return {
    id: vesselId,
    name,
    details: {
      length: Number(vessel.details?.length ?? vessel.length ?? 0) || 0,
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
  const alertCount = notifications.filter((item) => item.level === "critical" || item.level === "warning").length;
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
    taskCount: tasks.length,
    crewCount: crewProfiles.length,
    certificateDue: certificateAlerts.length,
    documentCount: documents.length,
    expenseCount: crewExpenses.length + boatExpenses.length,
    quoteCount,
    approvalCount,
    notificationCount: notifications.length,
    routeWaypoints: routePlanning.waypoints?.length || 0,
    routeDistanceNm: routeSummary.totalDistanceNm || 0,
    alertCount,
    activeModules,
    workerCount: workers.length,
    status: normalizedVessel.details?.status || "Operational",
  };
}

export const statusStyles = {
  pending: "bg-[#e8eee9] text-[#40534a]",
  ongoing: "bg-[#fff3c4] text-[#7a5416]",
  completed: "bg-[#dff5ea] text-[#176342]",
  approved: "vessel-pill",
  declined: "bg-[#ffe0e0] text-[#8a1f2b]",
};

export const priorityStyles = {
  low: "bg-[#e8eee9] text-[#40534a]",
  medium: "vessel-pill",
  high: "bg-[#ffe1bd] text-[#8a4b13]",
  urgent: "bg-[#ffe0e0] text-[#8a1f2b]",
};

export const departmentStyles = {
  General: "bg-[#e8eee9] text-[#40534a]",
  Deck: "vessel-pill",
  Engineering: "bg-[#ffe1bd] text-[#8a4b13]",
  Interior: "bg-[#f4e5fb] text-[#6c2f74]",
  Bridge: "vessel-pill",
  Admin: "bg-[#f3e9de] text-[#7a5630]",
};

export const moneyStatusStyles = {
  requested: "bg-[#e8eee9] text-[#40534a]",
  received: "vessel-pill",
  approved: "vessel-pill",
  declined: "bg-[#ffe0e0] text-[#8a1f2b]",
  paid: "bg-[#dff5ea] text-[#176342]",
};

export function neutralBadgeClass(darkMode = false) {
  return darkMode ? "bg-[#1a262c] text-[#dbe8e4]" : "bg-[#e8eee9] text-[#40534a]";
}

export function infoBadgeClass(darkMode = false) {
  return "vessel-pill";
}

export function successBadgeClass(darkMode = false) {
  return darkMode ? "bg-[#173126] text-[#ccefdc]" : "bg-[#dff5ea] text-[#176342]";
}

export function warningBadgeClass(darkMode = false) {
  return darkMode ? "bg-[#332613] text-[#e3c590]" : "bg-[#fbf0d6] text-[#8b6729]";
}

export function criticalBadgeClass(darkMode = false) {
  return darkMode ? "bg-[#351b1d] text-[#e8c2c5]" : "bg-[#f9e6e4] text-[#8f3a35]";
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
  return {
    ...item,
    id: item.id || createId("CRW"),
    fullName: item.fullName || "Crew Member",
    rank: item.rank || "Crew",
    department: CREW_DEPARTMENT_OPTIONS.includes(item.department) ? item.department : CREW_DEPARTMENT_OPTIONS[0],
    nationality: item.nationality || "",
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
    actorName: "Captain Luca Marin",
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
    { value: "pending", label: "Pending", count: stats.pending, active: activeFilter === "pending" },
    { value: "ongoing", label: "In Progress", count: stats.ongoing, active: activeFilter === "ongoing" },
    { value: "completed", label: "Completed", count: stats.completed, active: activeFilter === "completed" },
    { value: "approved", label: "Approved", count: stats.approved, active: activeFilter === "approved" },
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
      ? "vessel-card-dark border shadow-[0_24px_70px_-40px_rgba(0,0,0,0.54)] backdrop-blur-xl"
      : "border border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.68)] shadow-[0_24px_60px_-38px_rgba(18,55,46,0.16)] backdrop-blur-xl",
    textPrimary: darkMode ? "text-[color:var(--vessel-text-primary-dark)] drop-shadow-[0_2px_8px_rgba(255,255,255,0.05)]" : "text-slate-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.15)]",
    textSecondary: darkMode ? "text-[color:var(--vessel-text-secondary-dark)]" : "text-slate-600",
    input: darkMode
      ? "border-[var(--vessel-border-dark)] bg-[var(--vessel-card-dark)] text-[#f1ece4] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:ring-2 focus:ring-[var(--vessel-ring)] focus:border-[var(--vessel-border-dark)]"
      : "border-slate-200/70 bg-white/70 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] focus:ring-2 focus:ring-[var(--vessel-ring)] focus:border-[var(--vessel-border)]",
    selectedTask: darkMode
      ? "border-[var(--vessel-border-dark)] bg-[linear-gradient(135deg,var(--vessel-card-dark-strong),rgba(8,18,24,0.98))] text-white shadow-[0_22px_48px_-28px_rgba(0,0,0,0.72),0_0_20px_var(--vessel-glow-dark)]"
      : "border-[#2f7771] bg-[linear-gradient(135deg,rgba(23,86,84,0.92),rgba(14,58,61,0.96))] text-white shadow-[0_18px_40px_-24px_rgba(20,71,89,0.22)]",
    unselectedTask: darkMode ? "border-[var(--vessel-border-dark)] bg-[var(--vessel-card-dark)] text-slate-100" : "border-[rgba(15,80,70,0.10)] bg-[rgba(255,255,255,0.62)] text-slate-900",
    ring: "ring-vessel",
    subtle: darkMode ? "bg-[var(--vessel-primary-soft-dark)]" : "bg-[rgba(255,255,255,0.42)]",
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
        approvalStatus: item.status || item.approval || "requested",
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
        approvalStatus: item.status || item.approval || "requested",
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
      detail: item.daysRemaining < 0 ? `${Math.abs(item.daysRemaining)} day(s) overdue` : `${item.daysRemaining} day(s) remaining`,
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

