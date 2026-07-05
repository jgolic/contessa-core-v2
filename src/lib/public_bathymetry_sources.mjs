const NOAA_ENC_DEPTH_LAYER_ENDPOINTS = [
  { service: "harbour", layerId: 227, label: "NOAA ENC" },
  { service: "approach", layerId: 232, label: "NOAA ENC" },
  { service: "coastal", layerId: 166, label: "NOAA ENC" },
  { service: "general", layerId: 117, label: "NOAA ENC" },
];

const NOAA_BATHYMETRY_SAMPLES_ENDPOINT = "https://gis.ngdc.noaa.gov/arcgis/rest/services/multibeam_mosaic/ImageServer/getSamples";
const GEBCO_WMS_ENDPOINT = "https://wms.gebco.net/mapserv";
const FETCH_TIMEOUT_MS = 12000;

function safeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function encodeJsonParam(value) {
  return encodeURIComponent(JSON.stringify(value));
}

function createTimeoutSignal(timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

function buildRouteBounds(points = []) {
  const valid = points.filter((point) => Number.isFinite(Number(point?.lng)) && Number.isFinite(Number(point?.lat)));
  if (!valid.length) {
    return null;
  }

  return {
    minLng: Math.min(...valid.map((point) => Number(point.lng))),
    maxLng: Math.max(...valid.map((point) => Number(point.lng))),
    minLat: Math.min(...valid.map((point) => Number(point.lat))),
    maxLat: Math.max(...valid.map((point) => Number(point.lat))),
  };
}

export function isLikelyUsWaters(points = []) {
  const bounds = buildRouteBounds(points);
  if (!bounds) return false;

  return bounds.minLng >= -180 &&
    bounds.maxLng <= -60 &&
    bounds.minLat >= 15 &&
    bounds.maxLat <= 73;
}

export function buildDepthSamplePoints(route = [], stepNm = 1.2) {
  if (!Array.isArray(route) || route.length < 2) return [];

  const points = [];

  const haversineNm = (fromPoint, toPoint) => {
    const earthRadiusKm = 6371;
    const lat1 = Number(fromPoint.lat) * (Math.PI / 180);
    const lat2 = Number(toPoint.lat) * (Math.PI / 180);
    const deltaLat = (Number(toPoint.lat) - Number(fromPoint.lat)) * (Math.PI / 180);
    const deltaLng = (Number(toPoint.lng) - Number(fromPoint.lng)) * (Math.PI / 180);
    const a = Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c * 0.539956803;
  };

  for (let index = 1; index < route.length; index += 1) {
    const from = route[index - 1];
    const to = route[index];
    const distanceNm = haversineNm(from, to);
    const sampleCount = Math.max(6, Math.min(28, Math.ceil(distanceNm / stepNm)));

    for (let sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex += 1) {
      const progress = sampleCount === 0 ? 0 : sampleIndex / sampleCount;
      points.push({
        id: `LEG-${index}-${sampleIndex}`,
        legIndex: index,
        progress,
        lng: Number((Number(from.lng) + ((Number(to.lng) - Number(from.lng)) * progress)).toFixed(6)),
        lat: Number((Number(from.lat) + ((Number(to.lat) - Number(from.lat)) * progress)).toFixed(6)),
      });
    }
  }

  return points;
}

function extractConservativeDepth(properties = {}) {
  const depthCandidates = [
    properties.DRVAL1,
    properties.DRVAL2,
    properties.depthMeters,
    properties.depth,
    properties.VALDCO,
    properties.VALSOU,
  ]
    .map((value) => safeNumber(value, NaN))
    .filter((value) => Number.isFinite(value) && value !== 0);

  if (!depthCandidates.length) return null;

  const normalized = depthCandidates.map((value) => Math.abs(value));
  return Math.min(...normalized);
}

function pointInRing(point, ring = []) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersects = ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point, geometry = {}) {
  if (!geometry || !geometry.type) return false;
  if (geometry.type === "Polygon") {
    return Array.isArray(geometry.coordinates?.[0]) && pointInRing(point, geometry.coordinates[0]);
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => Array.isArray(polygon?.[0]) && pointInRing(point, polygon[0]));
  }
  return false;
}

async function fetchJson(url) {
  const { signal, cleanup } = createTimeoutSignal();
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return await response.json();
  } finally {
    cleanup();
  }
}

async function fetchText(url) {
  const { signal, cleanup } = createTimeoutSignal();
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return await response.text();
  } finally {
    cleanup();
  }
}

async function queryNoaaEncDepthAreas(bounds, endpointConfig) {
  const geometry = `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;
  const url = `https://encdirect.noaa.gov/arcgis/rest/services/encdirect/enc_${endpointConfig.service}/MapServer/${endpointConfig.layerId}/query?where=1%3D1&geometry=${encodeURIComponent(geometry)}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=DRVAL1,DRVAL2,QUASOU,VERDAT,INFORM&returnGeometry=true&f=geojson`;
  const data = await fetchJson(url);
  return Array.isArray(data?.features) ? data.features : [];
}

async function fetchNoaaEncDepthLayer(samplePoints = []) {
  const bounds = buildRouteBounds(samplePoints);
  if (!bounds) {
    return { connected: false, sourceLabel: "No depth data available", providerKey: "none", samples: [] };
  }

  const paddedBounds = {
    minLng: bounds.minLng - 0.02,
    maxLng: bounds.maxLng + 0.02,
    minLat: bounds.minLat - 0.02,
    maxLat: bounds.maxLat + 0.02,
  };

  for (const endpoint of NOAA_ENC_DEPTH_LAYER_ENDPOINTS) {
    try {
      const features = await queryNoaaEncDepthAreas(paddedBounds, endpoint);
      if (!features.length) continue;

      const samples = samplePoints.map((samplePoint) => {
        const matchingDepths = features
          .filter((feature) => pointInPolygon(samplePoint, feature.geometry))
          .map((feature) => extractConservativeDepth(feature.properties))
          .filter((depth) => Number.isFinite(depth) && depth > 0);

        if (!matchingDepths.length) return null;
        return {
          id: `enc-${samplePoint.id}`,
          lng: samplePoint.lng,
          lat: samplePoint.lat,
          depthMeters: Math.min(...matchingDepths),
          source: endpoint.label,
        };
      }).filter(Boolean);

      if (samples.length >= Math.max(4, Math.floor(samplePoints.length * 0.35))) {
        return {
          connected: true,
          sourceLabel: "NOAA ENC / NOAA Bathymetry",
          providerKey: "noaa-enc",
          provider: "NOAA ENC",
          samples,
          zones: [],
        };
      }
    } catch {
      continue;
    }
  }

  return { connected: false, sourceLabel: "No depth data available", providerKey: "none", samples: [] };
}

async function fetchNoaaBathymetryLayer(samplePoints = []) {
  const samples = [];

  for (const point of samplePoints) {
    try {
      const geometry = {
        x: point.lng,
        y: point.lat,
        spatialReference: { wkid: 4326 },
      };
      const url = `${NOAA_BATHYMETRY_SAMPLES_ENDPOINT}?geometry=${encodeJsonParam(geometry)}&geometryType=esriGeometryPoint&returnFirstValueOnly=true&outFields=*&renderingRule=${encodeJsonParam({ rasterFunction: "None" })}&f=pjson`;
      const data = await fetchJson(url);
      const sample = Array.isArray(data?.samples) ? data.samples[0] : null;
      const rawValue = safeNumber(sample?.value, NaN);
      if (!Number.isFinite(rawValue)) continue;
      const depthMeters = Math.abs(rawValue);
      if (!(depthMeters > 0)) continue;

      samples.push({
        id: `noaa-bathy-${point.id}`,
        lng: point.lng,
        lat: point.lat,
        depthMeters,
        source: "NOAA Bathymetry",
      });
    } catch {
      continue;
    }
  }

  if (samples.length >= Math.max(4, Math.floor(samplePoints.length * 0.35))) {
    return {
      connected: true,
      sourceLabel: "NOAA Bathymetry",
      providerKey: "noaa-bathymetry",
      provider: "NOAA Bathymetry",
      samples,
      zones: [],
    };
  }

  return { connected: false, sourceLabel: "No depth data available", providerKey: "none", samples: [] };
}

async function fetchGebcoDepthLayer(samplePoints = []) {
  const samples = [];

  for (const point of samplePoints) {
    try {
      const delta = 0.01;
      const params = new URLSearchParams({
        SERVICE: "WMS",
        VERSION: "1.1.1",
        REQUEST: "GetFeatureInfo",
        LAYERS: "GEBCO_latest",
        QUERY_LAYERS: "GEBCO_latest",
        SRS: "EPSG:4326",
        BBOX: `${point.lng - delta},${point.lat - delta},${point.lng + delta},${point.lat + delta}`,
        WIDTH: "101",
        HEIGHT: "101",
        X: "50",
        Y: "50",
        INFO_FORMAT: "text/plain",
        FEATURE_COUNT: "1",
      });
      const responseText = await fetchText(`${GEBCO_WMS_ENDPOINT}?${params.toString()}`);
      const match = responseText.match(/-?\d+(?:\.\d+)?/);
      if (!match) continue;
      const rawDepth = Number(match[0]);
      if (!Number.isFinite(rawDepth) || rawDepth >= 0) continue;

      samples.push({
        id: `gebco-${point.id}`,
        lng: point.lng,
        lat: point.lat,
        depthMeters: Math.abs(rawDepth),
        source: "GEBCO",
      });
    } catch {
      continue;
    }
  }

  if (samples.length >= Math.max(4, Math.floor(samplePoints.length * 0.35))) {
    return {
      connected: true,
      sourceLabel: "GEBCO fallback",
      providerKey: "gebco",
      provider: "GEBCO",
      samples,
      zones: [],
    };
  }

  return { connected: false, sourceLabel: "No depth data available", providerKey: "none", samples: [] };
}

export async function fetchPublicDepthLayerForRoute(route = []) {
  const samplePoints = buildDepthSamplePoints(route);
  if (!samplePoints.length) {
    return { connected: false, sourceLabel: "No depth data available", providerKey: "none", samples: [], zones: [] };
  }

  const shouldTryNoaaFirst = isLikelyUsWaters(route);
  if (shouldTryNoaaFirst) {
    const encResult = await fetchNoaaEncDepthLayer(samplePoints);
    if (encResult.connected) return encResult;

    const noaaBathymetryResult = await fetchNoaaBathymetryLayer(samplePoints);
    if (noaaBathymetryResult.connected) return noaaBathymetryResult;
  }

  const gebcoResult = await fetchGebcoDepthLayer(samplePoints);
  if (gebcoResult.connected) return gebcoResult;

  if (!shouldTryNoaaFirst) {
    const noaaBathymetryResult = await fetchNoaaBathymetryLayer(samplePoints);
    if (noaaBathymetryResult.connected) return noaaBathymetryResult;
  }

  return {
    connected: false,
    sourceLabel: "No depth data available",
    providerKey: "none",
    provider: "",
    samples: [],
    zones: [],
  };
}
