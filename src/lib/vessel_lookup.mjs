export function normalizeVesselSlug(value = "") {
  let decoded = String(value || "");

  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep the original value if it was not a valid URI component.
  }

  return decoded
    .toLowerCase()
    .trim()
    .replace(/^m\/y\s+/i, "")
    .replace(/^m-y-+/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function getVesselList(vesselsData) {
  if (Array.isArray(vesselsData)) return vesselsData;

  if (vesselsData && typeof vesselsData === "object") {
    return Object.entries(vesselsData).map(([key, vessel]) => ({
      slug: vessel?.slug || key,
      ...vessel,
    }));
  }

  return [];
}

export function findVesselBySlug(vesselsData, routeSlug) {
  const normalizedRouteSlug = normalizeVesselSlug(routeSlug);
  const vesselList = getVesselList(vesselsData);

  return (
    vesselList.find((vessel) => {
      const possibleSlugs = [
        vessel?.id,
        vessel?.slug,
        vessel?.name,
        vessel?.displayName,
        vessel?.vesselPrintInfo?.displayName,
      ]
        .filter(Boolean)
        .map(normalizeVesselSlug);

      return possibleSlugs.includes(normalizedRouteSlug);
    }) || null
  );
}

export function getCanonicalVesselSlug(vesselOrSlug) {
  const target = vesselOrSlug || "vessel";

  if (typeof target === "string") {
    return normalizeVesselSlug(target) || "vessel";
  }

  return (
    normalizeVesselSlug(
      target?.slug ||
        target?.id ||
        target?.name ||
        target?.displayName ||
        target?.vesselPrintInfo?.displayName
    ) || "vessel"
  );
}
