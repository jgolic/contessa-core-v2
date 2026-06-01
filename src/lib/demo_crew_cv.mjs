export function slugify(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function getCrewFullName(person = {}) {
  return (
    person.name ||
    person.fullName ||
    [person.firstName, person.lastName].filter(Boolean).join(" ") ||
    "Unnamed crew"
  );
}

export function getCrewPosition(person = {}) {
  return person.position || person.title || person.rank || person.role || "Crew";
}

export function getCrewCvId(person = {}) {
  return slugify(person.id || getCrewFullName(person));
}

export function getCrewCvRouteId(person = {}) {
  return slugify(getCrewFullName(person) || person.id || "crew");
}

const roleProfiles = {
  Captain: {
    summary:
      "Experienced yacht captain with strong vessel command, guest operations, safety oversight, passage planning, and owner-facing communication.",
    skills: [
      "Vessel command",
      "Passage planning",
      "Crew leadership",
      "Owner reporting",
      "Safety management",
      "Guest operations",
    ],
    certificates: ["Master 3000GT", "STCW", "ENG1 Medical", "GMDSS", "Advanced Fire Fighting"],
  },
  "First Mate": {
    summary:
      "Operational deck officer focused on watchkeeping, deck team coordination, tender operations, safety drills, and exterior readiness.",
    skills: [
      "Bridge watchkeeping",
      "Deck operations",
      "Tender handling",
      "Safety drills",
      "Exterior maintenance",
      "Mooring operations",
    ],
    certificates: ["OOW Yachts", "STCW", "ENG1 Medical", "Powerboat Level 2", "Security Awareness"],
  },
  "Chief Engineer": {
    summary:
      "Technical engineer responsible for machinery reliability, planned maintenance, fault diagnosis, engine room standards, and technical reporting.",
    skills: [
      "Engine room management",
      "Preventive maintenance",
      "Fault diagnosis",
      "Generator systems",
      "Hydraulic systems",
      "Technical reporting",
    ],
    certificates: ["Y4 / SV Engineering", "STCW", "ENG1 Medical", "Advanced Fire Fighting", "High Voltage Awareness"],
  },
  Bosun: {
    summary:
      "Hands-on deck leader responsible for exterior standards, deck maintenance, water sports readiness, tender support, and junior crew supervision.",
    skills: [
      "Deck maintenance",
      "Exterior detailing",
      "Tender support",
      "Water sports setup",
      "Mooring operations",
      "Crew supervision",
    ],
    certificates: ["Yacht Rating", "STCW", "ENG1 Medical", "Powerboat Level 2", "Personal Watercraft"],
  },
  Stewardess: {
    summary:
      "Interior crew member focused on guest service, housekeeping standards, laundry, table presentation, provisioning support, and guest readiness.",
    skills: [
      "Guest service",
      "Housekeeping",
      "Laundry",
      "Table service",
      "Provisioning support",
      "Interior detailing",
    ],
    certificates: ["STCW", "ENG1 Medical", "Food Hygiene Level 2", "Silver Service Introduction", "Security Awareness"],
  },
  Deckhand: {
    summary:
      "Deck crew member supporting exterior maintenance, washdowns, tender operations, line handling, water sports, and guest movement.",
    skills: ["Washdowns", "Line handling", "Tender support", "Water sports", "Exterior care", "Safety support"],
    certificates: ["STCW", "ENG1 Medical", "Powerboat Level 2", "Yacht Rating Training", "Security Awareness"],
  },
};

function getRoleProfile(position = "") {
  const normalized = String(position || "").toLowerCase();

  if (normalized.includes("captain")) return roleProfiles.Captain;
  if (normalized.includes("mate") || normalized.includes("officer")) return roleProfiles["First Mate"];
  if (normalized.includes("engineer")) return roleProfiles["Chief Engineer"];
  if (normalized.includes("bosun")) return roleProfiles.Bosun;
  if (normalized.includes("stew")) return roleProfiles.Stewardess;
  if (normalized.includes("deck")) return roleProfiles.Deckhand;

  return {
    summary:
      "Professional yacht crew member with experience supporting safe, organized, and guest-ready vessel operations.",
    skills: [
      "Yacht operations",
      "Safety awareness",
      "Team communication",
      "Guest support",
      "Daily reporting",
      "Operational readiness",
    ],
    certificates: ["STCW", "ENG1 Medical", "Security Awareness"],
  };
}

function normalizeCertificate(certificate) {
  if (typeof certificate === "string") return certificate;
  return certificate?.name || certificate?.title || certificate?.certificateName || "Crew certificate";
}

export function generateDemoCrewCv(person = {}, vessel = {}) {
  const name = getCrewFullName(person);
  const position = getCrewPosition(person);
  const roleProfile = getRoleProfile(position);
  const vesselName = vessel?.name || vessel?.displayName || "Current Vessel";

  return {
    demo: true,
    name,
    position,
    department: person?.department || "General",
    nationality: person?.nationality || "-",
    dateOfBirth: person?.dateOfBirth || person?.dob || "-",
    passportNumber: person?.passportNumber || "-",
    seamansBookNumber: person?.seamansBookNumber || "-",
    vesselName,
    summary: roleProfile.summary,
    keySkills: roleProfile.skills,
    certificates: person?.certificates?.length
      ? person.certificates.map(normalizeCertificate)
      : roleProfile.certificates,
    languages: person?.languages || ["English"],
    experience: [
      {
        vessel: vesselName,
        role: position,
        period: "Current assignment",
        details:
          "Supports daily yacht operations, safety routines, guest readiness, and departmental communication.",
      },
      {
        vessel: "Previous private yacht",
        role: position,
        period: "Previous seasons",
        details:
          "Demonstrated reliability in high-standard yacht environments with emphasis on discretion, teamwork, and operational discipline.",
      },
    ],
    emergencyRole:
      person?.emergencyRole ||
      (position.toLowerCase().includes("engineer")
        ? "Technical response and engine room support"
        : position.toLowerCase().includes("captain")
          ? "Vessel command and emergency coordination"
          : "Muster support and guest assistance"),
    disclaimer: "DEMO CV — GENERATED FOR TESTING ONLY. NOT AN OFFICIAL CREW DOCUMENT.",
  };
}
