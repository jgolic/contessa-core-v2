export const DEFAULT_ROUTE_MAP_CENTER = { lng: 7.4246, lat: 43.7384 };
export const DEFAULT_ROUTE_MAP_ZOOM = 7.2;
export const DEFAULT_ROUTE_SAFETY_MARGIN = 1;
export const ROUTE_PLACEHOLDER_MINIMUM_DEPTH_METERS = 3.4;

export const DEFAULT_ROUTE_MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";

export const DEFAULT_VESSEL_PROFILE = {
  vesselName: "",
  draft: 0,
  beam: 0,
  cruisingSpeedKnots: 0,
  fuelBurnPerHour: 0,
  fuelCapacity: 0,
  fuelReservePercentage: 15,
};

export const DEFAULT_ROUTE_SPECS = {
  lengthFeet: 0,
  beamFeet: 0,
  draftMeters: 0,
  cruisingSpeedKnots: 0,
  maxSpeedKnots: 0,
  fuelCapacityLitres: 0,
  fuelBurnLitresPerHour: 0,
  reservePercent: 15,
  safeDepthMeters: 0,
  cautionDepthMeters: 0,
};

export const ROUTE_OVERLAY_DEFINITIONS = [
  { key: "depth", label: "Depth layer" },
  { key: "depthShading", label: "Depth Shading" },
  { key: "shallow", label: "Shallow / unsafe depth" },
  { key: "restricted", label: "Restricted / no-go areas" },
  { key: "anchorages", label: "Anchorages" },
  { key: "marinas", label: "Marinas" },
  { key: "hazards", label: "Hazards / rocks / wrecks" },
  { key: "speedZones", label: "Speed zones" },
  { key: "weather", label: "Weather / wind overlay" },
  { key: "ais", label: "AIS traffic" },
];

function safeNumber(value, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cleanText(value, fallback = "") {
  return String(value || fallback).trim();
}

function buildFeatureCollection(features = []) {
  return {
    type: "FeatureCollection",
    features,
  };
}

function buildPointFeature(id, lng, lat, properties = {}) {
  return {
    type: "Feature",
    id,
    properties,
    geometry: {
      type: "Point",
      coordinates: [lng, lat],
    },
  };
}

function buildLineFeature(id, coordinates = [], properties = {}) {
  return {
    type: "Feature",
    id,
    properties,
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}

function buildPolygonFeature(id, coordinates = [], properties = {}) {
  return {
    type: "Feature",
    id,
    properties,
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
  };
}

function normalizeWaypoint(rawWaypoint = {}, index = 0) {
  const lng = safeNumber(rawWaypoint.lng, safeNumber(rawWaypoint.longitude, DEFAULT_ROUTE_MAP_CENTER.lng));
  const lat = safeNumber(rawWaypoint.lat, safeNumber(rawWaypoint.latitude, DEFAULT_ROUTE_MAP_CENTER.lat));

  return {
    id: cleanText(rawWaypoint.id, `RWP-${index + 1}`),
    name: cleanText(rawWaypoint.name, `Waypoint ${index + 1}`),
    lng,
    lat,
  };
}

function normalizeDepthSample(rawSample = {}, index = 0) {
  return {
    id: cleanText(rawSample.id, `depth-sample-${index + 1}`),
    lng: safeNumber(rawSample.lng, safeNumber(rawSample.longitude, DEFAULT_ROUTE_MAP_CENTER.lng)),
    lat: safeNumber(rawSample.lat, safeNumber(rawSample.latitude, DEFAULT_ROUTE_MAP_CENTER.lat)),
    depthMeters: safeNumber(rawSample.depthMeters, safeNumber(rawSample.depth)),
    source: cleanText(rawSample.source, "Depth sample"),
  };
}

function normalizeDepthFeature(rawFeature = {}, index = 0) {
  const rawGeometry = rawFeature?.geometry || {};
  const rawProperties = rawFeature?.properties || {};
  return {
    type: "Feature",
    id: cleanText(rawFeature.id, `depth-zone-${index + 1}`),
    properties: {
      ...rawProperties,
      depthMeters: safeNumber(rawProperties.depthMeters, safeNumber(rawProperties.depth)),
      source: cleanText(rawProperties.source, "Depth zone"),
    },
    geometry: rawGeometry,
  };
}

export function normalizeDepthLayerState(rawDepthLayer = {}) {
  const rawSamples = Array.isArray(rawDepthLayer?.samples)
    ? rawDepthLayer.samples
    : Array.isArray(rawDepthLayer?.points)
      ? rawDepthLayer.points
      : [];
  const rawZones = Array.isArray(rawDepthLayer?.zones)
    ? rawDepthLayer.zones
    : Array.isArray(rawDepthLayer?.features)
      ? rawDepthLayer.features
      : [];

  return {
    connected: Boolean(rawDepthLayer?.connected),
    provider: cleanText(rawDepthLayer?.provider),
    sourceLabel: cleanText(rawDepthLayer?.sourceLabel || rawDepthLayer?.provider),
    lastUpdated: cleanText(rawDepthLayer?.lastUpdated),
    samples: rawSamples.map((sample, index) => normalizeDepthSample(sample, index)).filter((sample) => Number.isFinite(sample.depthMeters) && sample.depthMeters > 0),
    zones: rawZones.map((feature, index) => normalizeDepthFeature(feature, index)).filter((feature) => feature.geometry && feature.geometry.type),
  };
}

export function hasConnectedDepthLayer(depthLayer = {}) {
  const normalized = normalizeDepthLayerState(depthLayer);
  return normalized.connected && (normalized.samples.length > 0 || normalized.zones.length > 0);
}

export function getDepthBand(depthMeters = 0, minimumSafeDepth = 0) {
  const numericDepth = safeNumber(depthMeters);
  const safeThreshold = safeNumber(minimumSafeDepth);
  const cautionThreshold = safeThreshold + Math.max(1, safeThreshold * 0.15);

  if (numericDepth <= safeThreshold) return "unsafe";
  if (numericDepth <= cautionThreshold) return "caution";
  return "safe";
}

export function getDepthVisualizationBand(depthMeters = 0, minimumSafeDepth = 0) {
  const baseBand = getDepthBand(depthMeters, minimumSafeDepth);
  if (baseBand !== "safe") return baseBand;

  const numericDepth = safeNumber(depthMeters);
  const safeThreshold = safeNumber(minimumSafeDepth);
  const deepThreshold = safeThreshold + Math.max(5, safeThreshold * 0.8);

  return numericDepth >= deepThreshold ? "deep" : "safe";
}

export function findNearestDepthSample(point = {}, depthLayer = {}, maxDistanceNm = 4) {
  const normalized = normalizeDepthLayerState(depthLayer);
  if (!hasConnectedDepthLayer(normalized) || !normalized.samples.length) return null;
  const origin = {
    lng: safeNumber(point.lng),
    lat: safeNumber(point.lat),
  };

  let nearest = null;
  normalized.samples.forEach((sample) => {
    const distanceNm = haversineDistanceNm(origin, sample);
    if (distanceNm > maxDistanceNm) return;
    if (!nearest || distanceNm < nearest.distanceNm) {
      nearest = {
        ...sample,
        distanceNm,
      };
    }
  });

  return nearest;
}

export function getRouteMinimumAvailableDepthMeters(route = [], depthLayer = {}) {
  if (!Array.isArray(route) || route.length < 1) return null;
  const normalized = normalizeDepthLayerState(depthLayer);
  if (!hasConnectedDepthLayer(normalized)) return null;

  const nearbyDepths = route
    .map((waypoint) => findNearestDepthSample(waypoint, normalized))
    .filter(Boolean)
    .map((sample) => sample.depthMeters);

  if (!nearbyDepths.length) return null;
  return Math.min(...nearbyDepths);
}

export function buildDepthLayerGeoJson(depthLayer = {}, minimumSafeDepth = 0) {
  const normalized = normalizeDepthLayerState(depthLayer);
  if (!hasConnectedDepthLayer(normalized)) {
    return buildFeatureCollection([]);
  }

  const pointFeatures = normalized.samples.map((sample) =>
    buildPointFeature(sample.id, sample.lng, sample.lat, {
      depthMeters: sample.depthMeters,
      depthBand: getDepthBand(sample.depthMeters, minimumSafeDepth),
      depthVisualBand: getDepthVisualizationBand(sample.depthMeters, minimumSafeDepth),
      source: sample.source,
    })
  );

  const zoneFeatures = normalized.zones.map((feature, index) => ({
    ...feature,
    id: cleanText(feature.id, `depth-zone-${index + 1}`),
    properties: {
      ...(feature.properties || {}),
      depthMeters: safeNumber(feature.properties?.depthMeters, safeNumber(feature.properties?.depth)),
      depthBand: getDepthBand(
        safeNumber(feature.properties?.depthMeters, safeNumber(feature.properties?.depth)),
        minimumSafeDepth
      ),
      depthVisualBand: getDepthVisualizationBand(
        safeNumber(feature.properties?.depthMeters, safeNumber(feature.properties?.depth)),
        minimumSafeDepth
      ),
      source: cleanText(feature.properties?.source, "Depth zone"),
    },
  }));

  return buildFeatureCollection([...zoneFeatures, ...pointFeatures]);
}

function buildCorridorPolygonBetweenPoints(fromPoint, toPoint, halfWidthNm = 0.9) {
  const latMid = ((safeNumber(fromPoint.lat) + safeNumber(toPoint.lat)) / 2) * (Math.PI / 180);
  const dx = safeNumber(toPoint.lng) - safeNumber(fromPoint.lng);
  const dy = safeNumber(toPoint.lat) - safeNumber(fromPoint.lat);
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;
  const halfWidthLat = halfWidthNm / 60;
  const halfWidthLng = halfWidthLat / Math.max(Math.cos(latMid), 0.22);
  const offsetLng = normalX * halfWidthLng;
  const offsetLat = normalY * halfWidthLat;

  return [
    [Number((safeNumber(fromPoint.lng) + offsetLng).toFixed(6)), Number((safeNumber(fromPoint.lat) + offsetLat).toFixed(6))],
    [Number((safeNumber(toPoint.lng) + offsetLng).toFixed(6)), Number((safeNumber(toPoint.lat) + offsetLat).toFixed(6))],
    [Number((safeNumber(toPoint.lng) - offsetLng).toFixed(6)), Number((safeNumber(toPoint.lat) - offsetLat).toFixed(6))],
    [Number((safeNumber(fromPoint.lng) - offsetLng).toFixed(6)), Number((safeNumber(fromPoint.lat) - offsetLat).toFixed(6))],
    [Number((safeNumber(fromPoint.lng) + offsetLng).toFixed(6)), Number((safeNumber(fromPoint.lat) + offsetLat).toFixed(6))],
  ];
}

function createDepthShadeFeature(id, fromPoint, toPoint, depthMeters, minimumSafeDepth, bandOverride = "", corridorWeight = 1) {
  const depthBand = bandOverride || getDepthBand(depthMeters, minimumSafeDepth);
  const depthVisualBand = bandOverride || getDepthVisualizationBand(depthMeters, minimumSafeDepth);

  return buildPolygonFeature(
    id,
    buildCorridorPolygonBetweenPoints(fromPoint, toPoint, corridorWeight >= 0.9 ? 0.9 : 1.45),
    {
      depthMeters,
      depthBand,
      depthVisualBand,
      corridorWeight,
      generated: true,
    }
  );
}

function buildDemoRouteDepthMeters(legIndex = 1, progress = 0, minimumSafeDepth = 0) {
  const waveSeed = Math.sin(((legIndex + 1) * 1.3) + (progress * Math.PI * 2.2));
  const cautionBand = minimumSafeDepth + 0.8;
  const deepBand = minimumSafeDepth + 6.8;

  if (progress > 0.34 && progress < 0.48) {
    return Math.max(0.8, minimumSafeDepth - 0.7);
  }

  if (progress > 0.6 && progress < 0.78) {
    return cautionBand - 0.15 + (waveSeed * 0.12);
  }

  return deepBand + (waveSeed * 0.6);
}

export function buildBathymetryShadingGeoJson(route = [], depthLayer = {}, minimumSafeDepth = 0, useDemoFallback = true) {
  if (!Array.isArray(route) || route.length < 2) {
    return {
      geoJson: buildFeatureCollection([]),
      isDemo: false,
    };
  }

  const normalizedDepthLayer = normalizeDepthLayerState(depthLayer);
  const depthConnected = hasConnectedDepthLayer(normalizedDepthLayer);
  const features = [];

  route.slice(1).forEach((waypoint, index) => {
    const previousWaypoint = route[index];
    const legIndex = index + 1;
    const legDistanceNm = haversineDistanceNm(previousWaypoint, waypoint);
    const sampleCount = clampNumber(Math.ceil(legDistanceNm / 1.2), 8, 28);
    const samplePoints = Array.from({ length: sampleCount + 1 }, (_, sampleIndex) => {
      const progress = sampleCount === 0 ? 0 : sampleIndex / sampleCount;
      const point = interpolateRoutePoint(previousWaypoint, waypoint, progress);
      const nearestDepth = depthConnected ? findNearestDepthSample(point, normalizedDepthLayer) : null;
      const depthMeters = nearestDepth?.depthMeters ?? (useDemoFallback ? buildDemoRouteDepthMeters(legIndex, progress, minimumSafeDepth) : null);

      return {
        ...point,
        progress,
        depthMeters,
      };
    }).filter((sample) => Number.isFinite(sample.depthMeters));

    for (let sampleIndex = 1; sampleIndex < samplePoints.length; sampleIndex += 1) {
      const fromSample = samplePoints[sampleIndex - 1];
      const toSample = samplePoints[sampleIndex];
      const depthMeters = Math.min(fromSample.depthMeters, toSample.depthMeters);
      const visualBand = depthConnected
        ? getDepthVisualizationBand(depthMeters, minimumSafeDepth)
        : getDepthVisualizationBand(depthMeters, minimumSafeDepth);

      features.push(
        createDepthShadeFeature(
          `bathymetry-${legIndex}-${sampleIndex}-outer`,
          fromSample,
          toSample,
          depthMeters,
          minimumSafeDepth,
          visualBand,
          0.58
        )
      );
      features.push(
        createDepthShadeFeature(
          `bathymetry-${legIndex}-${sampleIndex}-inner`,
          fromSample,
          toSample,
          depthMeters,
          minimumSafeDepth,
          visualBand,
          1
        )
      );
    }
  });

  return {
    geoJson: buildFeatureCollection(features),
    isDemo: !depthConnected && useDemoFallback,
  };
}

function createRelativePoint(anchor, spanLng, spanLat, offsetLng, offsetLat) {
  return [
    Number((anchor.lng + (spanLng * offsetLng)).toFixed(6)),
    Number((anchor.lat + (spanLat * offsetLat)).toFixed(6)),
  ];
}

function calculateRouteBounds(waypoints = [], currentPosition = null) {
  const points = [
    ...(Array.isArray(waypoints) ? waypoints : []),
    ...(currentPosition ? [currentPosition] : []),
  ].filter((point) => Number.isFinite(Number(point?.lng)) && Number.isFinite(Number(point?.lat)));

  if (!points.length) {
    return {
      minLng: DEFAULT_ROUTE_MAP_CENTER.lng - 0.36,
      maxLng: DEFAULT_ROUTE_MAP_CENTER.lng + 0.36,
      minLat: DEFAULT_ROUTE_MAP_CENTER.lat - 0.26,
      maxLat: DEFAULT_ROUTE_MAP_CENTER.lat + 0.26,
      center: DEFAULT_ROUTE_MAP_CENTER,
    };
  }

  const minLng = Math.min(...points.map((point) => point.lng));
  const maxLng = Math.max(...points.map((point) => point.lng));
  const minLat = Math.min(...points.map((point) => point.lat));
  const maxLat = Math.max(...points.map((point) => point.lat));

  return {
    minLng,
    maxLng,
    minLat,
    maxLat,
    center: {
      lng: (minLng + maxLng) / 2,
      lat: (minLat + maxLat) / 2,
    },
  };
}

export function createDefaultRouteOverlayToggles() {
  return {
    depth: false,
    depthShading: true,
    depthContours: true,
    route: true,
    waypoints: true,
    legend: true,
    shallow: true,
    restricted: true,
    anchorages: true,
    marinas: true,
    hazards: true,
    speedZones: true,
    weather: false,
    ais: false,
  };
}

function buildOffsetPolyline(route = [], offsetNm = 0.8, side = 1) {
  if (!Array.isArray(route) || route.length < 2) return [];

  return route.map((point, index) => {
    const previous = route[Math.max(0, index - 1)];
    const next = route[Math.min(route.length - 1, index + 1)];
    const reference = previous === next ? point : next;
    const latMid = ((safeNumber(point.lat) + safeNumber(reference.lat)) / 2) * (Math.PI / 180);
    const dx = safeNumber(reference.lng) - safeNumber(point.lng);
    const dy = safeNumber(reference.lat) - safeNumber(point.lat);
    const length = Math.hypot(dx, dy) || 1;
    const normalX = (-dy / length) * side;
    const normalY = (dx / length) * side;
    const offsetLat = offsetNm / 60;
    const offsetLng = offsetLat / Math.max(Math.cos(latMid), 0.22);

    return [
      Number((safeNumber(point.lng) + (normalX * offsetLng)).toFixed(6)),
      Number((safeNumber(point.lat) + (normalY * offsetLat)).toFixed(6)),
    ];
  });
}

export function buildBathymetryContourGeoJson(route = [], depthLayer = {}, useDemoFallback = true) {
  if (!Array.isArray(route) || route.length < 2) {
    return {
      geoJson: buildFeatureCollection([]),
      isDemo: false,
    };
  }

  const normalizedDepthLayer = normalizeDepthLayerState(depthLayer);
  const depthConnected = hasConnectedDepthLayer(normalizedDepthLayer);
  const contourDepths = [5, 10, 20, 50];
  const contourOffsets = [0.35, 0.65, 1.05, 1.45];
  const features = [];

  contourDepths.forEach((depthValue, index) => {
    const coordinates = buildOffsetPolyline(route, contourOffsets[index], index % 2 === 0 ? 1 : -1);
    if (coordinates.length < 2) return;

    const labelCoordinate = coordinates[Math.max(0, Math.floor(coordinates.length / 2) - 1)] || coordinates[0];
    const source = depthConnected ? "Bathymetry contour estimate" : "Estimated planning contour";

    features.push(
      buildLineFeature(`depth-contour-${depthValue}`, coordinates, {
        contourDepth: depthValue,
        contourLabel: `${depthValue} m`,
        source,
        kind: "contour-line",
      })
    );
    features.push(
      buildPointFeature(`depth-contour-label-${depthValue}`, labelCoordinate[0], labelCoordinate[1], {
        contourDepth: depthValue,
        contourLabel: `${depthValue} m`,
        source,
        kind: "contour-label",
      })
    );
  });

  return {
    geoJson: buildFeatureCollection(features),
    isDemo: !depthConnected && useDemoFallback,
  };
}

export function normalizeVesselProfile(rawProfile = {}) {
  return {
    ...DEFAULT_VESSEL_PROFILE,
    vesselName: cleanText(rawProfile.vesselName),
    draft: safeNumber(rawProfile.draft),
    beam: safeNumber(rawProfile.beam),
    cruisingSpeedKnots: safeNumber(rawProfile.cruisingSpeedKnots),
    fuelBurnPerHour: safeNumber(rawProfile.fuelBurnPerHour),
    fuelCapacity: safeNumber(rawProfile.fuelCapacity),
    fuelReservePercentage: clampNumber(safeNumber(rawProfile.fuelReservePercentage, DEFAULT_VESSEL_PROFILE.fuelReservePercentage), 0, 100),
  };
}

export function normalizeRouteSpecs(rawSpecs = {}, fallbackProfile = {}) {
  const profile = normalizeVesselProfile(fallbackProfile || {});
  const draftMeters = safeNumber(rawSpecs.draftMeters ?? rawSpecs.draft ?? profile.draft);
  const safeDepthMeters = safeNumber(rawSpecs.safeDepthMeters, draftMeters ? draftMeters + DEFAULT_ROUTE_SAFETY_MARGIN : 0);

  return {
    ...DEFAULT_ROUTE_SPECS,
    lengthFeet: safeNumber(rawSpecs.lengthFeet ?? rawSpecs.length),
    beamFeet: safeNumber(rawSpecs.beamFeet),
    draftMeters,
    cruisingSpeedKnots: safeNumber(rawSpecs.cruisingSpeedKnots ?? profile.cruisingSpeedKnots),
    maxSpeedKnots: safeNumber(rawSpecs.maxSpeedKnots),
    fuelCapacityLitres: safeNumber(rawSpecs.fuelCapacityLitres ?? rawSpecs.fuelCapacity ?? profile.fuelCapacity),
    fuelBurnLitresPerHour: safeNumber(rawSpecs.fuelBurnLitresPerHour ?? rawSpecs.fuelBurnPerHour ?? profile.fuelBurnPerHour),
    reservePercent: clampNumber(safeNumber(rawSpecs.reservePercent ?? rawSpecs.fuelReservePercentage ?? profile.fuelReservePercentage, DEFAULT_ROUTE_SPECS.reservePercent), 0, 100),
    safeDepthMeters,
    cautionDepthMeters: safeNumber(rawSpecs.cautionDepthMeters, safeDepthMeters ? Math.max(draftMeters, safeDepthMeters - 2) : 0),
  };
}

export function routeSpecsToVesselProfile(routeSpecs = {}, vesselName = "") {
  const specs = normalizeRouteSpecs(routeSpecs);

  return normalizeVesselProfile({
    vesselName,
    draft: specs.draftMeters,
    beam: specs.beamFeet,
    cruisingSpeedKnots: specs.cruisingSpeedKnots,
    fuelBurnPerHour: specs.fuelBurnLitresPerHour,
    fuelCapacity: specs.fuelCapacityLitres,
    fuelReservePercentage: specs.reservePercent,
  });
}

export function getMinimumSafeDepth(vesselDraft = 0, safetyMargin = DEFAULT_ROUTE_SAFETY_MARGIN) {
  return Number((safeNumber(vesselDraft) + safeNumber(safetyMargin, DEFAULT_ROUTE_SAFETY_MARGIN)).toFixed(2));
}

export function createRouteWaypoint(point = {}, index = 0) {
  const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return normalizeWaypoint(
    {
      id: `RWP-${seed}`,
      name: cleanText(point.name, `Waypoint ${index + 1}`),
      lng: point.lng,
      lat: point.lat,
    },
    index
  );
}

export function normalizeRoutePlanningState(rawState = {}) {
  const vesselProfile = normalizeVesselProfile(
    rawState?.vesselProfile ||
    rawState?.vessel ||
    rawState?.profile ||
    {}
  );
  const routeSpecs = normalizeRouteSpecs(rawState?.routeSpecs || rawState?.specs || {}, vesselProfile);

  const safetyMargin = safeNumber(
    rawState?.safetyMargin ??
    rawState?.underKeelClearanceSafetyMargin ??
    rawState?.underKeelMargin ??
    rawState?.clearanceSafetyMargin,
    DEFAULT_ROUTE_SAFETY_MARGIN
  );

  const rawWaypoints = Array.isArray(rawState?.waypoints)
    ? rawState.waypoints
    : Array.isArray(rawState?.routeWaypoints)
      ? rawState.routeWaypoints
      : [];

  return {
    vesselProfile,
    routeSpecs,
    safetyMargin,
    status: cleanText(rawState?.status, "Planning"),
    riskNote: cleanText(rawState?.riskNote),
    depthLayer: normalizeDepthLayerState(
      rawState?.depthLayer ||
      rawState?.depth ||
      rawState?.bathymetry ||
      {}
    ),
    waypoints: rawWaypoints.map((waypoint, index) => normalizeWaypoint(waypoint, index)),
  };
}

export function createEmptyRoutePlanningState() {
  return normalizeRoutePlanningState({
    vesselProfile: DEFAULT_VESSEL_PROFILE,
    safetyMargin: DEFAULT_ROUTE_SAFETY_MARGIN,
    waypoints: [],
  });
}

export function routePlanningHasContent(routePlanning = {}) {
  const normalized = normalizeRoutePlanningState(routePlanning);
  if (normalized.waypoints.length) return true;

  if (normalized.vesselProfile.vesselName) return true;

  const hasMeaningfulMetric = [
    normalized.vesselProfile.draft,
    normalized.vesselProfile.beam,
    normalized.vesselProfile.cruisingSpeedKnots,
    normalized.vesselProfile.fuelBurnPerHour,
    normalized.vesselProfile.fuelCapacity,
  ].some((value) => safeNumber(value) > 0);

  if (hasMeaningfulMetric) return true;

  if (hasConnectedDepthLayer(normalized.depthLayer)) return true;

  return safeNumber(normalized.safetyMargin, DEFAULT_ROUTE_SAFETY_MARGIN) !== DEFAULT_ROUTE_SAFETY_MARGIN;
}

export function reorderRouteWaypoints(waypoints = [], fromIndex = 0, toIndex = 0) {
  const items = [...(Array.isArray(waypoints) ? waypoints : [])];
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) return items;

  const [moved] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, moved);
  return items;
}

export function haversineDistanceNm(fromPoint = {}, toPoint = {}) {
  const earthRadiusKm = 6371;
  const lat1 = safeNumber(fromPoint.lat) * (Math.PI / 180);
  const lat2 = safeNumber(toPoint.lat) * (Math.PI / 180);
  const deltaLat = (safeNumber(toPoint.lat) - safeNumber(fromPoint.lat)) * (Math.PI / 180);
  const deltaLng = (safeNumber(toPoint.lng) - safeNumber(fromPoint.lng)) * (Math.PI / 180);

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = earthRadiusKm * c;

  return distanceKm * 0.539956803;
}

export function calculateBearingDegrees(fromPoint = {}, toPoint = {}) {
  const lat1 = safeNumber(fromPoint.lat) * (Math.PI / 180);
  const lat2 = safeNumber(toPoint.lat) * (Math.PI / 180);
  const deltaLng = (safeNumber(toPoint.lng) - safeNumber(fromPoint.lng)) * (Math.PI / 180);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
}

export function formatBearingDegrees(value) {
  if (!Number.isFinite(Number(value))) return "--";
  return `${Math.round(value).toString().padStart(3, "0")}°`;
}

export function buildRouteLegs(waypoints = [], cruisingSpeedKnots = 0) {
  const normalizedWaypoints = (Array.isArray(waypoints) ? waypoints : []).map((waypoint, index) => normalizeWaypoint(waypoint, index));
  const speed = safeNumber(cruisingSpeedKnots);
  let cumulativeHours = 0;

  return normalizedWaypoints.slice(1).map((waypoint, index) => {
    const previousWaypoint = normalizedWaypoints[index];
    const distanceNm = haversineDistanceNm(previousWaypoint, waypoint);
    const estimatedHours = speed > 0 ? distanceNm / speed : 0;
    cumulativeHours += estimatedHours;

    return {
      legIndex: index + 1,
      fromId: previousWaypoint.id,
      fromName: previousWaypoint.name,
      toId: waypoint.id,
      toName: waypoint.name,
      distanceNm,
      bearingDegrees: calculateBearingDegrees(previousWaypoint, waypoint),
      estimatedHours,
      cumulativeHours,
      midpoint: {
        lng: Number(((previousWaypoint.lng + waypoint.lng) / 2).toFixed(6)),
        lat: Number(((previousWaypoint.lat + waypoint.lat) / 2).toFixed(6)),
      },
    };
  });
}

export function calculateRouteDistanceNm(waypoints = []) {
  return buildRouteLegs(waypoints).reduce((total, leg) => total + leg.distanceNm, 0);
}

export function buildRouteGeoJson(waypoints = []) {
  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    return buildFeatureCollection([]);
  }

  return buildFeatureCollection([
    buildLineFeature(
      "route-planning-line",
      waypoints.map((waypoint) => [safeNumber(waypoint.lng), safeNumber(waypoint.lat)]),
      { kind: "route" }
    ),
  ]);
}

function interpolateRoutePoint(fromPoint = {}, toPoint = {}, progress = 0) {
  return {
    lng: Number((safeNumber(fromPoint.lng) + ((safeNumber(toPoint.lng) - safeNumber(fromPoint.lng)) * progress)).toFixed(6)),
    lat: Number((safeNumber(fromPoint.lat) + ((safeNumber(toPoint.lat) - safeNumber(fromPoint.lat)) * progress)).toFixed(6)),
  };
}

function getRouteStatusRank(status = "safe") {
  if (status === "unsafe") return 2;
  if (status === "caution") return 1;
  return 0;
}

function getWorstRouteStatus(statuses = []) {
  return statuses.reduce((current, status) => (
    getRouteStatusRank(status) > getRouteStatusRank(current) ? status : current
  ), "safe");
}

export function buildDepthAwareRouteSegments(route = [], depthLayer = {}, minimumSafeDepth = 0) {
  if (!Array.isArray(route) || route.length < 2) {
    return {
      geoJson: buildFeatureCollection([]),
      legSummaries: [],
    };
  }

  const normalizedDepthLayer = normalizeDepthLayerState(depthLayer);
  const depthConnected = hasConnectedDepthLayer(normalizedDepthLayer);
  const segmentFeatures = [];
  const legSummaries = [];

  route.slice(1).forEach((waypoint, index) => {
    const previousWaypoint = route[index];
    const legIndex = index + 1;

    if (!depthConnected) {
      segmentFeatures.push(
        buildLineFeature(
          `route-leg-${legIndex}-safe`,
          [
            [safeNumber(previousWaypoint.lng), safeNumber(previousWaypoint.lat)],
            [safeNumber(waypoint.lng), safeNumber(waypoint.lat)],
          ],
          { routeStatus: "safe", legIndex }
        )
      );
      legSummaries.push({
        legIndex,
        status: "safe",
        minimumDepth: null,
        hasDepthData: false,
      });
      return;
    }

    const legDistanceNm = haversineDistanceNm(previousWaypoint, waypoint);
    const sampleCount = clampNumber(Math.ceil(legDistanceNm / 1.2), 8, 28);
    const samplePoints = Array.from({ length: sampleCount + 1 }, (_, sampleIndex) => {
      const progress = sampleCount === 0 ? 0 : sampleIndex / sampleCount;
      const point = interpolateRoutePoint(previousWaypoint, waypoint, progress);
      const nearestDepth = findNearestDepthSample(point, normalizedDepthLayer);
      return {
        ...point,
        nearestDepth,
        routeStatus: nearestDepth ? getDepthBand(nearestDepth.depthMeters, minimumSafeDepth) : "safe",
      };
    });

    const availableDepths = samplePoints
      .map((point) => point.nearestDepth?.depthMeters)
      .filter((depth) => Number.isFinite(depth));
    const minimumDepth = availableDepths.length ? Math.min(...availableDepths) : null;

    let groupCoordinates = [[samplePoints[0].lng, samplePoints[0].lat]];
    let groupStatus = getWorstRouteStatus([samplePoints[0].routeStatus, samplePoints[1]?.routeStatus || samplePoints[0].routeStatus]);
    let segmentCounter = 0;
    const legStatuses = [];

    for (let sampleIndex = 1; sampleIndex < samplePoints.length; sampleIndex += 1) {
      const point = samplePoints[sampleIndex];
      const edgeStatus = getWorstRouteStatus([samplePoints[sampleIndex - 1].routeStatus, point.routeStatus]);

      if (edgeStatus !== groupStatus && groupCoordinates.length > 1) {
        segmentCounter += 1;
        segmentFeatures.push(
          buildLineFeature(
            `route-leg-${legIndex}-segment-${segmentCounter}`,
            groupCoordinates,
            { routeStatus: groupStatus, legIndex }
          )
        );
        legStatuses.push(groupStatus);
        groupCoordinates = [[samplePoints[sampleIndex - 1].lng, samplePoints[sampleIndex - 1].lat]];
        groupStatus = edgeStatus;
      }

      groupCoordinates.push([point.lng, point.lat]);
    }

    if (groupCoordinates.length > 1) {
      segmentCounter += 1;
      segmentFeatures.push(
        buildLineFeature(
          `route-leg-${legIndex}-segment-${segmentCounter}`,
          groupCoordinates,
          { routeStatus: groupStatus, legIndex }
        )
      );
      legStatuses.push(groupStatus);
    }

    legSummaries.push({
      legIndex,
      status: getWorstRouteStatus(legStatuses),
      minimumDepth,
      hasDepthData: availableDepths.length > 0,
    });
  });

  return {
    geoJson: buildFeatureCollection(segmentFeatures),
    legSummaries,
  };
}

export function buildRoutePlaceholderCollections({ waypoints = [], currentPosition = null } = {}) {
  const bounds = calculateRouteBounds(waypoints, currentPosition);
  const spanLng = Math.max(bounds.maxLng - bounds.minLng, 0.42);
  const spanLat = Math.max(bounds.maxLat - bounds.minLat, 0.28);
  const anchor = bounds.center;

  const land = buildFeatureCollection([
    buildPolygonFeature("land-west", [
      createRelativePoint(anchor, spanLng, spanLat, -0.76, 0.72),
      createRelativePoint(anchor, spanLng, spanLat, -0.74, 0.12),
      createRelativePoint(anchor, spanLng, spanLat, -0.62, -0.08),
      createRelativePoint(anchor, spanLng, spanLat, -0.56, -0.34),
      createRelativePoint(anchor, spanLng, spanLat, -0.41, -0.62),
      createRelativePoint(anchor, spanLng, spanLat, -0.94, -0.72),
      createRelativePoint(anchor, spanLng, spanLat, -0.76, 0.72),
    ], { title: "Land mass" }),
    buildPolygonFeature("land-island", [
      createRelativePoint(anchor, spanLng, spanLat, 0.32, 0.56),
      createRelativePoint(anchor, spanLng, spanLat, 0.42, 0.46),
      createRelativePoint(anchor, spanLng, spanLat, 0.46, 0.28),
      createRelativePoint(anchor, spanLng, spanLat, 0.31, 0.18),
      createRelativePoint(anchor, spanLng, spanLat, 0.22, 0.32),
      createRelativePoint(anchor, spanLng, spanLat, 0.32, 0.56),
    ], { title: "Island" }),
  ]);

  const coastline = buildFeatureCollection([
    buildLineFeature("coastline-main", [
      createRelativePoint(anchor, spanLng, spanLat, -0.72, 0.62),
      createRelativePoint(anchor, spanLng, spanLat, -0.66, 0.34),
      createRelativePoint(anchor, spanLng, spanLat, -0.58, 0.16),
      createRelativePoint(anchor, spanLng, spanLat, -0.52, -0.02),
      createRelativePoint(anchor, spanLng, spanLat, -0.47, -0.24),
      createRelativePoint(anchor, spanLng, spanLat, -0.42, -0.52),
    ], { title: "Coastline" }),
    buildLineFeature("coastline-island", [
      createRelativePoint(anchor, spanLng, spanLat, 0.28, 0.49),
      createRelativePoint(anchor, spanLng, spanLat, 0.4, 0.4),
      createRelativePoint(anchor, spanLng, spanLat, 0.41, 0.26),
      createRelativePoint(anchor, spanLng, spanLat, 0.3, 0.22),
      createRelativePoint(anchor, spanLng, spanLat, 0.24, 0.34),
      createRelativePoint(anchor, spanLng, spanLat, 0.28, 0.49),
    ], { title: "Island coastline" }),
  ]);

  const depthContours = buildFeatureCollection([
    buildLineFeature("contour-6", [
      createRelativePoint(anchor, spanLng, spanLat, -0.18, 0.54),
      createRelativePoint(anchor, spanLng, spanLat, -0.02, 0.32),
      createRelativePoint(anchor, spanLng, spanLat, 0.16, 0.2),
      createRelativePoint(anchor, spanLng, spanLat, 0.35, 0.08),
      createRelativePoint(anchor, spanLng, spanLat, 0.52, -0.12),
    ], { depth: 6 }),
    buildLineFeature("contour-12", [
      createRelativePoint(anchor, spanLng, spanLat, -0.28, 0.32),
      createRelativePoint(anchor, spanLng, spanLat, -0.04, 0.08),
      createRelativePoint(anchor, spanLng, spanLat, 0.18, -0.06),
      createRelativePoint(anchor, spanLng, spanLat, 0.42, -0.2),
      createRelativePoint(anchor, spanLng, spanLat, 0.68, -0.28),
    ], { depth: 12 }),
    buildLineFeature("contour-20", [
      createRelativePoint(anchor, spanLng, spanLat, -0.34, 0.1),
      createRelativePoint(anchor, spanLng, spanLat, -0.12, -0.14),
      createRelativePoint(anchor, spanLng, spanLat, 0.12, -0.28),
      createRelativePoint(anchor, spanLng, spanLat, 0.38, -0.38),
      createRelativePoint(anchor, spanLng, spanLat, 0.74, -0.42),
    ], { depth: 20 }),
  ]);

  const shallow = buildFeatureCollection([
    buildPolygonFeature("shallow-main", [
      createRelativePoint(anchor, spanLng, spanLat, -0.02, 0.04),
      createRelativePoint(anchor, spanLng, spanLat, 0.18, 0.1),
      createRelativePoint(anchor, spanLng, spanLat, 0.24, -0.04),
      createRelativePoint(anchor, spanLng, spanLat, 0.08, -0.16),
      createRelativePoint(anchor, spanLng, spanLat, -0.08, -0.04),
      createRelativePoint(anchor, spanLng, spanLat, -0.02, 0.04),
    ], { title: "Shallow bank" }),
  ]);

  const caution = buildFeatureCollection([
    buildPolygonFeature("caution-main", [
      createRelativePoint(anchor, spanLng, spanLat, -0.24, 0.24),
      createRelativePoint(anchor, spanLng, spanLat, 0.12, 0.34),
      createRelativePoint(anchor, spanLng, spanLat, 0.26, 0.14),
      createRelativePoint(anchor, spanLng, spanLat, -0.05, -0.04),
      createRelativePoint(anchor, spanLng, spanLat, -0.24, 0.24),
    ], { title: "Caution zone" }),
  ]);

  const restricted = buildFeatureCollection([
    buildPolygonFeature("restricted-main", [
      createRelativePoint(anchor, spanLng, spanLat, 0.38, 0.06),
      createRelativePoint(anchor, spanLng, spanLat, 0.74, 0.08),
      createRelativePoint(anchor, spanLng, spanLat, 0.7, -0.26),
      createRelativePoint(anchor, spanLng, spanLat, 0.36, -0.22),
      createRelativePoint(anchor, spanLng, spanLat, 0.38, 0.06),
    ], { title: "Restricted zone" }),
  ]);

  const speedZones = buildFeatureCollection([
    buildPolygonFeature("speed-zone-harbor", [
      createRelativePoint(anchor, spanLng, spanLat, -0.64, -0.06),
      createRelativePoint(anchor, spanLng, spanLat, -0.42, -0.02),
      createRelativePoint(anchor, spanLng, spanLat, -0.37, -0.19),
      createRelativePoint(anchor, spanLng, spanLat, -0.58, -0.24),
      createRelativePoint(anchor, spanLng, spanLat, -0.64, -0.06),
    ], { title: "8 kn speed zone" }),
  ]);

  const anchorages = buildFeatureCollection([
    buildPointFeature("anchorage-1", ...createRelativePoint(anchor, spanLng, spanLat, -0.16, -0.32), { title: "Anchorage A" }),
    buildPointFeature("anchorage-2", ...createRelativePoint(anchor, spanLng, spanLat, 0.28, -0.44), { title: "Anchorage B" }),
  ]);

  const marinas = buildFeatureCollection([
    buildPointFeature("marina-1", ...createRelativePoint(anchor, spanLng, spanLat, -0.55, -0.12), { title: "Marina placeholder" }),
    buildPointFeature("marina-2", ...createRelativePoint(anchor, spanLng, spanLat, 0.5, 0.28), { title: "Harbor placeholder" }),
  ]);

  const hazards = buildFeatureCollection([
    buildPointFeature("hazard-1", ...createRelativePoint(anchor, spanLng, spanLat, 0.04, 0.02), { title: "Rock / wreck placeholder" }),
    buildPointFeature("hazard-2", ...createRelativePoint(anchor, spanLng, spanLat, 0.22, -0.12), { title: "Shoal / hazard placeholder" }),
  ]);

  return {
    land,
    coastline,
    depthContours,
    shallow,
    caution,
    restricted,
    speedZones,
    anchorages,
    marinas,
    hazards,
  };
}

export function calculateRoutePassageSummary({
  waypoints = [],
  vesselProfile = {},
  safetyMargin = DEFAULT_ROUTE_SAFETY_MARGIN,
} = {}) {
  const normalizedProfile = normalizeVesselProfile(vesselProfile);
  const legs = buildRouteLegs(waypoints, normalizedProfile.cruisingSpeedKnots);
  const totalDistanceNm = legs.reduce((total, leg) => total + leg.distanceNm, 0);
  const estimatedHours = normalizedProfile.cruisingSpeedKnots > 0 ? totalDistanceNm / normalizedProfile.cruisingSpeedKnots : 0;
  const estimatedFuelBurn = normalizedProfile.fuelBurnPerHour > 0 ? estimatedHours * normalizedProfile.fuelBurnPerHour : 0;
  const fuelReserveAmount = normalizedProfile.fuelCapacity * (normalizedProfile.fuelReservePercentage / 100);

  return {
    totalDistanceNm,
    totalLegs: legs.length,
    estimatedHours,
    estimatedFuelBurn,
    fuelReserveAmount,
    remainingFuelAfterReserve: normalizedProfile.fuelCapacity - fuelReserveAmount - estimatedFuelBurn,
    minimumSafeDepth: getMinimumSafeDepth(normalizedProfile.draft, safetyMargin),
  };
}

export function getRouteMinimumPlaceholderDepthMeters(route = []) {
  if (!Array.isArray(route) || route.length < 2) return null;
  return ROUTE_PLACEHOLDER_MINIMUM_DEPTH_METERS;
}

export function formatRouteDistanceNm(value) {
  return `${safeNumber(value).toFixed(1)} nm`;
}

export function formatPassageHours(value) {
  const hours = safeNumber(value);
  if (hours <= 0) return "0h";

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h ${minutes}m`;
}

export function checkDepthAlongRoute(route = [], vesselDraft = 0, safetyMargin = DEFAULT_ROUTE_SAFETY_MARGIN, depthLayer = {}) {
  if (!Array.isArray(route) || route.length < 2) return [];

  const minimumSafeDepth = getMinimumSafeDepth(vesselDraft, safetyMargin);
  const normalizedDepthLayer = normalizeDepthLayerState(depthLayer);

  if (!hasConnectedDepthLayer(normalizedDepthLayer)) {
    return [
      {
        id: "depth-source-required",
        severity: "warning",
        message: "Depth layer requires nautical chart or bathymetry data connection.",
      },
      {
        id: "depth-planning-only",
        severity: "info",
        message: `Planning support only. Official bathymetry and certified chart data are required before accepting any route that needs at least ${minimumSafeDepth.toFixed(1)} m of safe depth.`,
      },
    ];
  }

  const { legSummaries } = buildDepthAwareRouteSegments(route, normalizedDepthLayer, minimumSafeDepth);
  const minimumRouteDepth = getRouteMinimumAvailableDepthMeters(route, normalizedDepthLayer);
  const warnings = [];
  const unsafeLegs = legSummaries.filter((leg) => leg.status === "unsafe");
  const cautionLegs = legSummaries.filter((leg) => leg.status === "caution");

  if (unsafeLegs.length) {
    unsafeLegs.forEach((leg) => {
      warnings.push({
        id: `depth-route-unsafe-leg-${leg.legIndex}`,
        severity: "warning",
        message: `Unsafe shallow section detected. Leg ${leg.legIndex} crosses water below minimum safe depth.${leg.minimumDepth !== null ? ` Minimum sampled depth is ${leg.minimumDepth.toFixed(1)} m.` : ""}`,
      });
    });
  } else if (cautionLegs.length) {
    warnings.push({
      id: `depth-route-caution-leg-${cautionLegs[0].legIndex}`,
      severity: "warning",
      message: `Leg ${cautionLegs[0].legIndex} enters a caution depth band near the minimum safe depth of ${minimumSafeDepth.toFixed(1)} m.`,
    });
  } else if (minimumRouteDepth !== null) {
    warnings.push({
      id: "depth-route-reviewed",
      severity: "info",
      message: `Depth samples connected. Minimum sampled route depth is ${minimumRouteDepth.toFixed(1)} m against a required minimum of ${minimumSafeDepth.toFixed(1)} m.`,
    });
  } else {
    warnings.push({
      id: "depth-route-no-nearby-samples",
      severity: "warning",
      message: "Depth data source is connected, but no nearby depth samples are available for the current route.",
    });
  }

  return warnings;
}
