import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { AlertCircle, Compass, Plus, TriangleAlert, Wifi, WifiOff } from "../../components/icons.jsx";
import { ExpandableMetricGroup } from "../../components/expandable_metric_group.jsx";
import { SmartLabel } from "../../components/smart_label.jsx";
import { neutralBadgeClass, successBadgeClass, themeClasses, warningBadgeClass } from "../../contessa_app_data.mjs";
import { ensureMapLibre } from "../../lib/maplibre_loader.mjs";
import { fetchPublicDepthLayerForRoute } from "../../lib/public_bathymetry_sources.mjs";
import {
  buildBathymetryContourGeoJson,
  DEFAULT_ROUTE_MAP_CENTER,
  DEFAULT_ROUTE_MAP_STYLE,
  DEFAULT_ROUTE_MAP_ZOOM,
  ROUTE_OVERLAY_DEFINITIONS,
  buildBathymetryShadingGeoJson,
  buildDepthLayerGeoJson,
  buildDepthAwareRouteSegments,
  buildRouteLegs,
  buildRoutePlaceholderCollections,
  calculateRoutePassageSummary,
  checkDepthAlongRoute,
  createDefaultRouteOverlayToggles,
  getDepthBand,
  findNearestDepthSample,
  formatBearingDegrees,
  formatPassageHours,
  formatRouteDistanceNm,
  getRouteMinimumAvailableDepthMeters,
  hasConnectedDepthLayer,
} from "../../lib/route_planning.mjs";

const MAP_LOAD_FAILURE_MESSAGE = "Map could not load. Check internet connection or tile style URL.";
const DEPTH_LAYER_UNAVAILABLE_MESSAGE = "Depth-based route highlighting requires nautical chart or bathymetry data.";
const ACTIVE_OVERLAY_KEYS = ["depth", "depthShading", "shallow", "restricted", "hazards", "speedZones", "weather", "ais"];

function formatCoordinate(value) {
  return Number(value || 0).toFixed(5);
}

function formatFuelValue(value) {
  return `${Number(value || 0).toFixed(0)} L`;
}

function formatHoursValue(value) {
  return `${Number(value || 0).toFixed(1)} h`;
}

function formatPercentValue(value) {
  return `${Number(value || 0).toFixed(0)}%`;
}

function hasMetricValue(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function formatDepthDisplay(value) {
  return hasMetricValue(value) ? Number(value).toFixed(1) : "Not set";
}

function formatSpeedDisplay(value) {
  return hasMetricValue(value) ? Number(value).toFixed(1) : "Not set";
}

function formatFuelDisplay(value) {
  return hasMetricValue(value) ? Number(value).toFixed(0) : "Not set";
}

function formatPercentDisplay(value) {
  return hasMetricValue(value) ? Number(value).toFixed(0) : "Not set";
}

function formatHoursDisplay(value, ready = true) {
  return ready ? Number(value || 0).toFixed(1) : "Not set";
}

function ensureGeoJsonSource(map, sourceId, data) {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, { type: "geojson", data });
    return;
  }

  map.getSource(sourceId).setData(data);
}

function getFirstSymbolLayerId(map) {
  const layers = map?.getStyle?.()?.layers || [];
  return layers.find((layer) => layer.type === "symbol")?.id;
}

function SummaryRow({ darkMode = false, label, value, detail, tone = "neutral" }) {
  const theme = themeClasses(darkMode);
  const accentClass = tone === "critical"
    ? darkMode ? "bg-[#3f241f] text-[#ffd7cf]" : "bg-[#fff1ed] text-[#9b2c20]"
    : tone === "warning"
      ? darkMode ? "bg-[#3c341b] text-[#ffe7aa]" : "bg-[#fff4cb] text-[#7a5416]"
      : "vessel-pill";

  return (
    <div className={`app-panel app-panel-soft rounded-[22px] border p-4 md:rounded-xl ${darkMode ? "border-[#1f3037] bg-[#0d1519]/90" : "border-white/80 bg-white/88"}`}>
      <div className="flex min-w-0 flex-col gap-2 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between min-[420px]:gap-3">
        <div className="min-w-0">
          <div className={`app-data-label ${theme.textSecondary}`}>{label}</div>
          <div className={`app-metric-value mt-3 ${theme.textPrimary}`}>{value}</div>
        </div>
        <Badge className={accentClass}>{tone === "critical" ? "Review" : tone === "warning" ? "Watch" : "Ready"}</Badge>
      </div>
      <div className={`app-helper-text mt-2 ${theme.textSecondary}`}>{detail}</div>
    </div>
  );
}

function ParameterBracket({
  darkMode = false,
  label,
  valueText,
  unit = "",
  helperText,
  tone = "neutral",
  statusLabel = "Ready",
  children = null,
}) {
  const theme = themeClasses(darkMode);
  const shellClass = tone === "critical"
    ? darkMode ? "border-[#6c3027] bg-[#2a1613]" : "border-[#efb0a6] bg-[#fff1ed]"
    : tone === "warning"
      ? darkMode ? "border-[#5a4820] bg-[#2f2611]" : "border-[#f0d58d] bg-[#fff7de]"
      : darkMode ? "border-[#233630] bg-[#111a17]/88" : "border-white/80 bg-white/88";
  const badgeClass = tone === "critical"
    ? darkMode ? "bg-[#4d211b] text-[#ffd7cf]" : "bg-[#ffe0da] text-[#9b2c20]"
    : tone === "warning"
      ? darkMode ? "bg-[#4d3e19] text-[#ffe7aa]" : "bg-[#fff1bf] text-[#7a5416]"
      : "vessel-pill";
  const showUnit = valueText !== "Not set" && unit;

  return (
    <div className={`app-panel ${tone !== "neutral" ? "app-panel-active" : "app-panel-soft"} min-w-0 overflow-hidden rounded-[22px] border p-4 md:rounded-xl ${shellClass}`}>
      <div className="flex min-w-0 flex-col gap-2 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between min-[420px]:gap-3">
        <div className={`min-w-0 truncate text-sm font-semibold ${theme.textPrimary}`}>{label}</div>
        <Badge className={`${badgeClass} max-w-full shrink-0 truncate whitespace-nowrap text-center leading-tight min-[420px]:max-w-[44%]`}>{statusLabel}</Badge>
      </div>
      <div className="mt-3 flex min-w-0 flex-wrap items-end gap-2">
        <div className={`${valueText === "Not set" ? "text-lg" : "text-2xl"} min-w-0 truncate font-semibold tracking-tight ${theme.textPrimary}`}>{valueText}</div>
        {showUnit ? <div className={`app-compact-label pb-0.5 ${theme.textSecondary}`}><SmartLabel label={unit} /></div> : null}
      </div>
      <div className={`mt-2 text-xs leading-5 ${theme.textSecondary}`}>{helperText}</div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function getDepthSourcePresentation(depthLayer = {}) {
  const label = depthLayer?.sourceLabel || "No depth data available";

  if (!depthLayer?.connected) {
    return {
      label,
      badgeClass: "border-slate-300/80 bg-white/88 text-slate-700 dark:border-slate-700 dark:bg-slate-900/88 dark:text-slate-200",
    };
  }

  if (depthLayer.providerKey === "gebco") {
    return {
      label,
      badgeClass: "border-[#f0d58d] bg-[#fff7de] text-[#7a5416] dark:border-[#5a4820] dark:bg-[#2f2611] dark:text-[#ffe7aa]",
    };
  }

  return {
    label,
      badgeClass: "vessel-pill",
  };
}

function getWaypointDepthBadgeClass(darkMode, depthMeters, minimumSafeDepth) {
  const depthBand = getDepthBand(depthMeters, minimumSafeDepth);
  if (depthBand === "unsafe") {
    return darkMode ? "bg-[#3b1f22] text-[#ffd8dc]" : "bg-[#ffe0e0] text-[#8a1f2b]";
  }
  if (depthBand === "caution") {
    return darkMode ? "bg-[#3b3118] text-[#ffe7aa]" : "bg-[#fff1bf] text-[#7a5416]";
  }
  return "vessel-pill";
}

export function RoutePlanningView({
  darkMode = false,
  canEdit = true,
  routePlanning,
  onUpdateVesselProfile,
  onUpdateSafetyMargin,
  onAddWaypoint,
  onUpdateWaypoint,
  onDeleteWaypoint,
  onReorderWaypoints,
}) {
  const theme = themeClasses(darkMode);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapLibreRef = useRef(null);
  const mapReadyRef = useRef(false);
  const waypointMarkersRef = useRef([]);
  const vesselMarkerRef = useRef(null);
  const overlayMarkersRef = useRef([]);
  const draggingWaypointIdRef = useRef("");
  const addWaypointModeRef = useRef(false);
  const hasInitialFitRef = useRef(false);
  const initialWaypointCountRef = useRef((routePlanning?.waypoints || []).length);
  const userInteractingRef = useRef(false);
  const followVesselRef = useRef(false);
  const mapLockedRef = useRef(false);
  const interactionResetTimeoutRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const canEditRef = useRef(canEdit);
  const addWaypointHandlerRef = useRef(onAddWaypoint);
  const updateWaypointHandlerRef = useRef(onUpdateWaypoint);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [geolocationStatus, setGeolocationStatus] = useState("idle");
  const [geolocationMessage, setGeolocationMessage] = useState("Attempting to locate the vessel from this device.");
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isAddWaypointMode, setIsAddWaypointMode] = useState(false);
  const [overlayToggles, setOverlayToggles] = useState(() => createDefaultRouteOverlayToggles());
  const [publicDepthLayer, setPublicDepthLayer] = useState(null);
  const [depthSourceLoading, setDepthSourceLoading] = useState(false);
  const [depthShadingOpacity, setDepthShadingOpacity] = useState(0.62);
  const [styleRevision, setStyleRevision] = useState(0);
  const [followVesselPosition, setFollowVesselPosition] = useState(false);
  const [isMapLocked, setIsMapLocked] = useState(false);
  const [showMapLayerPanel, setShowMapLayerPanel] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const overlayDefinitions = useMemo(
    () => ROUTE_OVERLAY_DEFINITIONS.filter((overlay) => ACTIVE_OVERLAY_KEYS.includes(overlay.key)),
    []
  );
  const advancedOverlayDefinitions = useMemo(
    () => overlayDefinitions.filter((overlay) => !["depth", "depthShading", "depthContours", "route", "waypoints", "legend"].includes(overlay.key)),
    [overlayDefinitions]
  );
  const waypoints = routePlanning?.waypoints || [];
  const routeStartPosition = useMemo(() => {
    if (!waypoints.length) return null;
    return {
      lng: Number(waypoints[0].lng),
      lat: Number(waypoints[0].lat),
      source: "route-start",
    };
  }, [waypoints]);
  const vesselProfile = routePlanning?.vesselProfile || {};
  const safetyMargin = Number(routePlanning?.safetyMargin || 1);
  const depthLayer = publicDepthLayer || routePlanning?.depthLayer || {};
  const routeLegs = useMemo(
    () => buildRouteLegs(waypoints, vesselProfile.cruisingSpeedKnots),
    [waypoints, vesselProfile.cruisingSpeedKnots]
  );
  const routeLegByToId = useMemo(
    () => Object.fromEntries(routeLegs.map((leg) => [leg.toId, leg])),
    [routeLegs]
  );
  const passageSummary = useMemo(
    () => calculateRoutePassageSummary({ waypoints, vesselProfile, safetyMargin }),
    [waypoints, vesselProfile, safetyMargin]
  );
  const minimumSafeDepth = passageSummary.minimumSafeDepth;
  const depthDataConnected = useMemo(() => hasConnectedDepthLayer(depthLayer), [depthLayer]);
  const depthLayerGeoJson = useMemo(
    () => buildDepthLayerGeoJson(depthLayer, minimumSafeDepth),
    [depthLayer, minimumSafeDepth]
  );
  const bathymetryShading = useMemo(
    () => buildBathymetryShadingGeoJson(waypoints, depthLayer, minimumSafeDepth, true),
    [depthLayer, minimumSafeDepth, waypoints]
  );
  const bathymetryContours = useMemo(
    () => buildBathymetryContourGeoJson(waypoints, depthLayer, true),
    [depthLayer, waypoints]
  );
  const waypointDepthSamples = useMemo(
    () =>
      Object.fromEntries(
        waypoints
          .map((waypoint) => [waypoint.id, findNearestDepthSample(waypoint, depthLayer)])
          .filter(([, sample]) => Boolean(sample))
      ),
    [waypoints, depthLayer]
  );
  const waypointDepthDisplays = useMemo(() => {
    const entries = {};
    const demoFeatures = bathymetryShading.isDemo
      ? bathymetryShading.geoJson.features.filter((feature) => feature.geometry?.type === "Polygon" && Number.isFinite(Number(feature.properties?.depthMeters)))
      : [];

    waypoints.forEach((waypoint) => {
      if (waypointDepthSamples[waypoint.id]) {
        entries[waypoint.id] = waypointDepthSamples[waypoint.id];
        return;
      }

      if (!demoFeatures.length) return;

      let nearest = null;
      demoFeatures.forEach((feature) => {
        const ring = feature.geometry.coordinates?.[0] || [];
        if (!ring.length) return;
        const centroid = ring.reduce(
          (acc, [lng, lat]) => ({ lng: acc.lng + Number(lng), lat: acc.lat + Number(lat) }),
          { lng: 0, lat: 0 }
        );
        const count = ring.length || 1;
        const normalizedPoint = {
          lng: centroid.lng / count,
          lat: centroid.lat / count,
        };
        const distance = ((normalizedPoint.lng - Number(waypoint.lng)) ** 2) + ((normalizedPoint.lat - Number(waypoint.lat)) ** 2);
        if (!nearest || distance < nearest.distance) {
          nearest = {
            id: feature.id,
            lng: normalizedPoint.lng,
            lat: normalizedPoint.lat,
            depthMeters: Number(feature.properties.depthMeters),
            source: "Estimated planning layer",
            distance,
          };
        }
      });

      if (nearest) {
        entries[waypoint.id] = nearest;
      }
    });

    return entries;
  }, [bathymetryShading.geoJson.features, bathymetryShading.isDemo, waypointDepthSamples, waypoints]);
  const routeMinimumAvailableDepth = useMemo(
    () => getRouteMinimumAvailableDepthMeters(waypoints, depthLayer),
    [waypoints, depthLayer]
  );
  const depthAwareRoute = useMemo(
    () => buildDepthAwareRouteSegments(waypoints, depthLayer, minimumSafeDepth),
    [waypoints, depthLayer, minimumSafeDepth]
  );
  const depthWarnings = useMemo(
    () => checkDepthAlongRoute(waypoints, vesselProfile.draft, safetyMargin, depthLayer),
    [waypoints, vesselProfile.draft, safetyMargin, depthLayer]
  );
  const vesselPosition = useMemo(() => {
    if (currentPosition) {
      return {
        lng: Number(currentPosition.lng),
        lat: Number(currentPosition.lat),
        accuracy: currentPosition.accuracy,
        source: "live-gps",
      };
    }

    if (routeStartPosition) {
      return {
        lng: routeStartPosition.lng,
        lat: routeStartPosition.lat,
        source: "route-start",
      };
    }

    return null;
  }, [currentPosition, routeStartPosition]);
  const placeholderCollections = useMemo(
    () => buildRoutePlaceholderCollections({ waypoints, currentPosition: vesselPosition }),
    [waypoints, vesselPosition]
  );
  const canComputeEta = Number(vesselProfile.cruisingSpeedKnots || 0) > 0;
  const canComputeFuel = canComputeEta && Number(vesselProfile.fuelBurnPerHour || 0) > 0;
  const routeCrossesUnsafeShallowWater = depthDataConnected &&
    routeMinimumAvailableDepth !== null &&
    routeMinimumAvailableDepth < minimumSafeDepth;
  const depthSourcePresentation = useMemo(() => getDepthSourcePresentation(depthLayer), [depthLayer]);
  const depthSourceLabel = bathymetryShading.isDemo
    ? "Estimated planning layer"
    : depthSourcePresentation.label;
  const unsafeLegDetails = useMemo(
    () =>
      depthAwareRoute.legSummaries
        .filter((leg) => leg.status === "unsafe")
        .map((leg) => {
          const routeLeg = routeLegs.find((item) => item.legIndex === leg.legIndex);
          return {
            legIndex: leg.legIndex,
            minimumDepth: leg.minimumDepth,
            distanceNm: routeLeg?.distanceNm || 0,
          };
        }),
    [depthAwareRoute.legSummaries, routeLegs]
  );
  const draftSet = hasMetricValue(vesselProfile.draft);
  const underKeelSet = hasMetricValue(safetyMargin);
  const cruisingSpeedSet = hasMetricValue(vesselProfile.cruisingSpeedKnots);
  const fuelConsumptionSet = hasMetricValue(vesselProfile.fuelBurnPerHour);
  const fuelCapacitySet = hasMetricValue(vesselProfile.fuelCapacity);
  const fuelReserveSet = hasMetricValue(vesselProfile.fuelReservePercentage);
  const routeDistanceSet = passageSummary.totalDistanceNm > 0;
  const minimumRequiredDepthSet = draftSet && underKeelSet;
  const estimatedPassageTimeSet = routeDistanceSet && cruisingSpeedSet;
  const estimatedFuelRequiredSet = estimatedPassageTimeSet && fuelConsumptionSet;
  const availableFuelAfterReserveValue = fuelCapacitySet && fuelReserveSet
    ? Number(vesselProfile.fuelCapacity) - passageSummary.fuelReserveAmount
    : null;
  const availableFuelAfterReserveSet = availableFuelAfterReserveValue !== null;
  const availableFuelAfterReserveCoversRoute = availableFuelAfterReserveValue !== null &&
    estimatedFuelRequiredSet &&
    availableFuelAfterReserveValue >= passageSummary.estimatedFuelBurn;
  const readyOrMissingState = (isSet) => (isSet ? "Ready" : "Missing");
  const remainingFuelTone = passageSummary.remainingFuelAfterReserve < 0
    ? "critical"
    : passageSummary.remainingFuelAfterReserve <= passageSummary.fuelReserveAmount * 0.25
      ? "warning"
      : "neutral";
  const routeMetrics = [
    {
      id: "distance",
      label: "Distance",
      shortLabel: "Distance",
      value: formatRouteDistanceNm(passageSummary.totalDistanceNm),
      note: `${passageSummary.totalLegs} leg${passageSummary.totalLegs === 1 ? "" : "s"}`,
      description: "Total planned route distance across all currently published route legs.",
    },
    {
      id: "eta",
      label: "Estimated Time",
      shortLabel: "ETA",
      value: canComputeEta ? formatHoursValue(passageSummary.estimatedHours) : "--",
      note: canComputeEta ? "Cruising speed planning" : "Set cruising speed",
      description: "Estimated passage time based on planned cruising speed and route distance.",
      tone: canComputeEta ? "neutral" : "warning",
    },
    {
      id: "fuel",
      label: "Fuel Demand",
      shortLabel: "Fuel",
      value: canComputeFuel ? formatFuelValue(passageSummary.estimatedFuelBurn) : "--",
      note: canComputeFuel ? "Estimated route demand" : "Set fuel burn",
      description: "Estimated fuel required for the planned route using the vessel fuel burn profile.",
      tone: canComputeFuel ? "neutral" : "warning",
    },
    {
      id: "min-depth",
      label: "Minimum Depth",
      shortLabel: "Min Depth",
      value: minimumSafeDepth.toFixed(1),
      unit: "m",
      note: depthDataConnected ? routeCrossesUnsafeShallowWater ? "Unsafe section flagged" : "Sampled against depth data" : "Draft + clearance target",
      description: "Minimum required safe water depth based on vessel draft and under-keel clearance settings.",
      tone: routeCrossesUnsafeShallowWater ? "critical" : "neutral",
    },
    {
      id: "reserve",
      label: "Fuel Reserve",
      shortLabel: "Reserve",
      value: formatPercentValue(vesselProfile.fuelReservePercentage || 0),
      note: canComputeFuel ? `${formatFuelValue(passageSummary.fuelReserveAmount)} held back` : "Safety reserve target",
      description: "Fuel reserve retained for safety, delays, weather, or operational margin after route planning.",
      tone: remainingFuelTone,
    },
  ];

  const markUserInteraction = () => {
    userInteractingRef.current = true;
    if (interactionResetTimeoutRef.current) {
      clearTimeout(interactionResetTimeoutRef.current);
    }
  };

  const releaseUserInteractionSoon = () => {
    if (interactionResetTimeoutRef.current) {
      clearTimeout(interactionResetTimeoutRef.current);
    }
    interactionResetTimeoutRef.current = setTimeout(() => {
      userInteractingRef.current = false;
    }, 220);
  };

  const safeCameraMove = (action, callback) => {
    const map = mapRef.current;
    if (!map) return false;
    if (mapLockedRef.current && action !== "unlock-check") return false;
    if (userInteractingRef.current) return false;
    if (action === "follow-vessel" && !followVesselRef.current) return false;

    callback(map);
    return true;
  };

  const fitRouteToViewport = () => {
    if (!waypoints.length) return false;

    return safeCameraMove("fit-route", (map) => {
      if (waypoints.length >= 2) {
        const maplibregl = mapLibreRef.current;
        const bounds = waypoints.reduce(
          (nextBounds, point) => nextBounds.extend([point.lng, point.lat]),
          new maplibregl.LngLatBounds([waypoints[0].lng, waypoints[0].lat], [waypoints[0].lng, waypoints[0].lat])
        );
        map.fitBounds(bounds, { padding: 84, maxZoom: 10.4, duration: 650 });
        return;
      }

      map.easeTo({ center: [waypoints[0].lng, waypoints[0].lat], zoom: Math.max(map.getZoom(), 10), duration: 650 });
    });
  };

  const centerVesselInViewport = () => {
    if (!vesselPosition) return false;

    return safeCameraMove("center-vessel", (map) => {
      map.easeTo({
        center: [vesselPosition.lng, vesselPosition.lat],
        zoom: 11,
        duration: 700,
      });
    });
  };

  useEffect(() => {
    addWaypointModeRef.current = isAddWaypointMode;
  }, [isAddWaypointMode]);

  useEffect(() => {
    followVesselRef.current = followVesselPosition;
  }, [followVesselPosition]);

  useEffect(() => {
    mapLockedRef.current = isMapLocked;
  }, [isMapLocked]);

  useEffect(() => {
    canEditRef.current = canEdit;
  }, [canEdit]);

  useEffect(() => {
    addWaypointHandlerRef.current = onAddWaypoint;
  }, [onAddWaypoint]);

  useEffect(() => {
    updateWaypointHandlerRef.current = onUpdateWaypoint;
  }, [onUpdateWaypoint]);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in window.navigator)) {
      setGeolocationStatus("unavailable");
      setGeolocationMessage("Browser geolocation is unavailable on this device.");
      return;
    }

    setGeolocationStatus("loading");
    setGeolocationMessage("Locating the vessel from this browser session.");

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPosition = {
          lng: Number(position.coords.longitude),
          lat: Number(position.coords.latitude),
          accuracy: Number(position.coords.accuracy || 0),
        };
        setCurrentPosition(nextPosition);
        setGeolocationStatus("ready");
        setGeolocationMessage(`Vessel position available within approximately ${Math.round(nextPosition.accuracy || 0)} m.`);
      },
      () => {
        setGeolocationStatus("denied");
        setGeolocationMessage("Geolocation is blocked or unavailable. Using the current route start as an estimated vessel position when available.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (waypoints.length < 2) {
      setPublicDepthLayer(null);
      setDepthSourceLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setDepthSourceLoading(true);

    fetchPublicDepthLayerForRoute(waypoints)
      .then((nextDepthLayer) => {
        if (cancelled) return;
        setPublicDepthLayer(nextDepthLayer);
      })
      .catch(() => {
        if (cancelled) return;
        setPublicDepthLayer({
          connected: false,
          sourceLabel: "No depth data available",
          providerKey: "none",
          provider: "",
          samples: [],
          zones: [],
        });
      })
      .finally(() => {
        if (cancelled) return;
        setDepthSourceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [waypoints]);

  useEffect(() => {
    if (mapRef.current) return;
    if (!mapContainerRef.current) return;

    let cancelled = false;

    ensureMapLibre()
      .then((maplibregl) => {
        if (cancelled || mapRef.current || !mapContainerRef.current) return;
        mapLibreRef.current = maplibregl;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: DEFAULT_ROUTE_MAP_STYLE,
          // Vessel position is informational by default. The map should not
          // automatically center on GPS/demo vessel coordinates unless the user
          // explicitly presses "Center Vessel" or enables the separate
          // follow-vessel mode.
          center: [DEFAULT_ROUTE_MAP_CENTER.lng, DEFAULT_ROUTE_MAP_CENTER.lat],
          zoom: DEFAULT_ROUTE_MAP_ZOOM,
          attributionControl: true,
          dragRotate: false,
          pitchWithRotate: false,
        });

        map.dragRotate.disable();
        map.touchZoomRotate.enable();
        map.touchZoomRotate.disableRotation();
        map.scrollZoom.enable();
        map.dragPan.enable();

        map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), "top-right");

        ["touchstart", "dragstart", "zoomstart", "movestart"].forEach((eventName) => {
          map.on(eventName, markUserInteraction);
        });

        ["touchend", "dragend", "zoomend", "moveend"].forEach((eventName) => {
          map.on(eventName, releaseUserInteractionSoon);
        });

        map.on("load", () => {
          if (cancelled) return;
          mapReadyRef.current = true;
          setMapReady(true);
          setMapError("");
        });

        map.on("styledata", () => {
          if (cancelled) return;
          setStyleRevision((value) => value + 1);
        });

        map.on("click", (event) => {
          if (!canEditRef.current || !addWaypointModeRef.current) return;

          addWaypointHandlerRef.current?.({
            lng: Number(event.lngLat.lng.toFixed(6)),
            lat: Number(event.lngLat.lat.toFixed(6)),
          });
          setIsAddWaypointMode(false);
        });

        map.on("error", (error) => {
          console.error("MapLibre error:", error);
          if (!mapReadyRef.current) {
            setMapError(MAP_LOAD_FAILURE_MESSAGE);
          }
        });

        mapRef.current = map;
      })
      .catch((error) => {
        console.error("MapLibre error:", error);
        if (cancelled) return;
        setMapError(MAP_LOAD_FAILURE_MESSAGE);
      });

    return () => {
      cancelled = true;
      waypointMarkersRef.current.forEach((marker) => marker.remove());
      overlayMarkersRef.current.forEach((marker) => marker.remove());
      waypointMarkersRef.current = [];
      overlayMarkersRef.current = [];

      if (vesselMarkerRef.current) {
        vesselMarkerRef.current.remove();
        vesselMarkerRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      if (interactionResetTimeoutRef.current) {
        clearTimeout(interactionResetTimeoutRef.current);
        interactionResetTimeoutRef.current = null;
      }

      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      mapReadyRef.current = false;
      mapLibreRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.getCanvas().style.cursor = isAddWaypointMode && canEdit ? "crosshair" : "grab";
  }, [canEdit, isAddWaypointMode, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (isMapLocked) {
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      map.touchZoomRotate.disable();
      return;
    }

    map.dragPan.enable();
    map.scrollZoom.enable();
    map.doubleClickZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    map.touchZoomRotate.enable();
    map.touchZoomRotate.disableRotation();
  }, [isMapLocked, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!vesselPosition || !followVesselPosition) return;

    // Follow-vessel is opt-in on mobile and desktop. "Center Vessel" is only a
    // one-time explicit action. Continuous recentering must never happen unless
    // follow-vessel is enabled, and even then it is blocked while the user is
    // interacting or the map is explicitly locked.
    safeCameraMove("follow-vessel", (liveMap) => {
      liveMap.easeTo({
        center: [vesselPosition.lng, vesselPosition.lat],
        zoom: Math.max(liveMap.getZoom(), 9.4),
        duration: 650,
      });
    });
  }, [followVesselPosition, mapReady, vesselPosition]);

  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!map || !container || !mapReady) return;

    const handleStableResize = () => {
      if (userInteractingRef.current) return;

      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        if (!mapRef.current) return;
        const activeMap = mapRef.current;
        activeMap.resize();
      }, 220);
    };

    if (typeof ResizeObserver !== "undefined") {
      resizeObserverRef.current = new ResizeObserver(handleStableResize);
      resizeObserverRef.current.observe(container);
    }

    window.addEventListener("orientationchange", handleStableResize);

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      window.removeEventListener("orientationchange", handleStableResize);
    };
  }, [mapReady]);

  useEffect(() => {
    const syncFullscreenState = () => {
      const container = mapContainerRef.current?.parentElement;
      setIsFullscreen(Boolean(container && document.fullscreenElement === container));
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow || "";
    }

    return () => {
      document.body.style.overflow = previousOverflow || "";
    };
  }, [isFullscreen]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return undefined;

    const timeout = setTimeout(() => {
      map.resize();
    }, 90);

    return () => clearTimeout(timeout);
  }, [isFullscreen, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const routeSourceId = "route-planning-source";
    const routeCasingId = "route-planning-casing";
    const routeLineId = "route-planning-line";
    const routeData = depthAwareRoute.geoJson;

    ensureGeoJsonSource(map, routeSourceId, routeData);

    if (!map.getLayer(routeCasingId)) {
      map.addLayer({
        id: routeCasingId,
        type: "line",
        source: routeSourceId,
        layout: {
          visibility: overlayToggles.route ? "visible" : "none",
        },
        paint: {
          "line-color": darkMode ? "rgba(6, 14, 18, 0.82)" : "rgba(255, 255, 255, 0.92)",
          "line-width": 8.5,
          "line-opacity": 0.9,
        },
      });
    }

    if (!map.getLayer(routeLineId)) {
      map.addLayer({
        id: routeLineId,
        type: "line",
        source: routeSourceId,
        layout: {
          visibility: overlayToggles.route ? "visible" : "none",
        },
        paint: {
          "line-color": (overlayToggles.depth || overlayToggles.depthShading) && depthDataConnected
            ? [
              "match",
              ["get", "routeStatus"],
              "unsafe", "#d6533a",
              "caution", "#d7a436",
              "#2f74ff",
            ]
            : "#2f74ff",
          "line-width": 4.5,
          "line-opacity": 0.98,
        },
      });
    } else {
      map.setLayoutProperty(routeCasingId, "visibility", overlayToggles.route ? "visible" : "none");
      map.setLayoutProperty(routeLineId, "visibility", overlayToggles.route ? "visible" : "none");
      map.setPaintProperty(
        routeLineId,
        "line-color",
        (overlayToggles.depth || overlayToggles.depthShading) && depthDataConnected
          ? [
            "match",
            ["get", "routeStatus"],
            "unsafe", "#d6533a",
            "caution", "#d7a436",
            "#2f74ff",
          ]
          : "#2f74ff"
      );
    }
  }, [darkMode, depthAwareRoute.geoJson, depthDataConnected, mapReady, overlayToggles.depth, overlayToggles.depthShading, overlayToggles.route, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const placeholderLayerConfigs = [
      {
        sourceId: "route-overlay-shallow",
        data: placeholderCollections.shallow,
        visible: overlayToggles.shallow,
        layers: [
          {
            id: "route-overlay-shallow-fill",
            type: "fill",
            paint: {
              "fill-color": darkMode ? "rgba(191, 93, 83, 0.22)" : "rgba(214, 83, 58, 0.2)",
            },
          },
          {
            id: "route-overlay-shallow-line",
            type: "line",
            paint: {
              "line-color": darkMode ? "rgba(255, 214, 205, 0.62)" : "rgba(174, 63, 43, 0.4)",
              "line-width": 2,
            },
          },
        ],
      },
      {
        sourceId: "route-overlay-caution",
        data: placeholderCollections.caution,
        visible: true,
        layers: [
          {
            id: "route-overlay-caution-fill",
            type: "fill",
            paint: {
              "fill-color": darkMode ? "rgba(225, 183, 77, 0.14)" : "rgba(235, 193, 85, 0.18)",
            },
          },
          {
            id: "route-overlay-caution-line",
            type: "line",
            paint: {
              "line-color": darkMode ? "rgba(255, 227, 153, 0.46)" : "rgba(188, 148, 45, 0.32)",
              "line-width": 2,
            },
          },
        ],
      },
      {
        sourceId: "route-overlay-restricted",
        data: placeholderCollections.restricted,
        visible: overlayToggles.restricted,
        layers: [
          {
            id: "route-overlay-restricted-fill",
            type: "fill",
            paint: {
              "fill-color": darkMode ? "rgba(114, 92, 204, 0.1)" : "rgba(114, 92, 204, 0.09)",
            },
          },
          {
            id: "route-overlay-restricted-line",
            type: "line",
            paint: {
              "line-color": darkMode ? "rgba(205, 190, 250, 0.62)" : "rgba(105, 73, 167, 0.52)",
              "line-width": 2.2,
              "line-dasharray": [4, 3],
            },
          },
        ],
      },
      {
        sourceId: "route-overlay-speed-zones",
        data: placeholderCollections.speedZones,
        visible: overlayToggles.speedZones,
        layers: [
          {
            id: "route-overlay-speed-zones-fill",
            type: "fill",
            paint: {
              "fill-color": darkMode ? "rgba(39, 130, 111, 0.1)" : "rgba(39, 130, 111, 0.12)",
            },
          },
          {
            id: "route-overlay-speed-zones-line",
            type: "line",
            paint: {
              "line-color": darkMode ? "rgba(193, 244, 226, 0.52)" : "rgba(18, 106, 89, 0.36)",
              "line-width": 2,
              "line-dasharray": [2, 2],
            },
          },
        ],
      },
    ];

    placeholderLayerConfigs.forEach((config) => {
      ensureGeoJsonSource(map, config.sourceId, config.data);

      config.layers.forEach((layer) => {
        if (!map.getLayer(layer.id)) {
          map.addLayer({
            id: layer.id,
            source: config.sourceId,
            type: layer.type,
            paint: layer.paint,
            layout: {
              visibility: config.visible ? "visible" : "none",
            },
          });
          return;
        }

        map.setLayoutProperty(layer.id, "visibility", config.visible ? "visible" : "none");
      });
    });

    if (map.getLayer("route-planning-casing")) {
      map.moveLayer("route-planning-casing");
    }

    if (map.getLayer("route-planning-line")) {
      map.moveLayer("route-planning-line");
    }
  }, [darkMode, mapReady, overlayToggles, placeholderCollections, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const pointSourceId = "route-overlay-depth";
    const shadingSourceId = "route-overlay-depth-shading";
    const beforeLabelLayerId = getFirstSymbolLayerId(map);

    ensureGeoJsonSource(map, pointSourceId, depthLayerGeoJson);
    ensureGeoJsonSource(map, shadingSourceId, bathymetryShading.geoJson);

    const shadingLayerConfigs = [
      {
        id: "route-overlay-depth-deep-fill",
        type: "fill",
        filter: ["all", ["==", ["geometry-type"], "Polygon"], ["==", ["get", "depthVisualBand"], "deep"]],
        paint: {
          "fill-color": darkMode ? "#173657" : "#255381",
          "fill-opacity": [
            "*",
            ["get", "corridorWeight"],
            depthShadingOpacity * (darkMode ? 0.52 : 0.44),
          ],
        },
      },
      {
        id: "route-overlay-depth-safe-fill",
        type: "fill",
        filter: ["all", ["==", ["geometry-type"], "Polygon"], ["==", ["get", "depthBand"], "safe"]],
        paint: {
          "fill-color": darkMode ? "#2f6fa6" : "#3f7db6",
          "fill-opacity": [
            "*",
            ["get", "corridorWeight"],
            depthShadingOpacity * (darkMode ? 0.4 : 0.34),
          ],
        },
      },
      {
        id: "route-overlay-depth-caution-fill",
        type: "fill",
        filter: ["all", ["==", ["geometry-type"], "Polygon"], ["==", ["get", "depthBand"], "caution"]],
        paint: {
          "fill-color": darkMode ? "#b88d43" : "#caa25d",
          "fill-opacity": [
            "*",
            ["get", "corridorWeight"],
            depthShadingOpacity * (darkMode ? 0.36 : 0.3),
          ],
        },
      },
      {
        id: "route-overlay-depth-unsafe-fill",
        type: "fill",
        filter: ["all", ["==", ["geometry-type"], "Polygon"], ["==", ["get", "depthBand"], "unsafe"]],
        paint: {
          "fill-color": darkMode ? "#b56a60" : "#c9776b",
          "fill-opacity": [
            "*",
            ["get", "corridorWeight"],
            depthShadingOpacity * (darkMode ? 0.34 : 0.28),
          ],
        },
      },
    ];

    const depthPointLayerConfigs = [
      {
        id: "route-overlay-depth-points",
        type: "circle",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": [
            "match",
            ["get", "depthBand"],
            "unsafe", darkMode ? "#f08c82" : "#d6533a",
            "caution", darkMode ? "#f2d37b" : "#d7a436",
            darkMode ? "#8dc5ff" : "#3e86c6",
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": darkMode ? "rgba(8,17,22,0.88)" : "rgba(255,255,255,0.92)",
        },
      },
    ];

    shadingLayerConfigs.forEach((layer) => {
      const isVisible = overlayToggles.depthShading && (depthDataConnected || bathymetryShading.isDemo);
      if (!map.getLayer(layer.id)) {
        map.addLayer({
          id: layer.id,
          source: shadingSourceId,
          type: layer.type,
          filter: layer.filter,
          paint: layer.paint,
          layout: {
            visibility: isVisible ? "visible" : "none",
          },
        }, beforeLabelLayerId);
        return;
      }

      map.setLayoutProperty(layer.id, "visibility", isVisible ? "visible" : "none");
    });

    depthPointLayerConfigs.forEach((layer) => {
      const isVisible = overlayToggles.depth && depthDataConnected;
      if (!map.getLayer(layer.id)) {
        map.addLayer({
          id: layer.id,
          source: pointSourceId,
          type: layer.type,
          filter: layer.filter,
          paint: layer.paint,
          layout: {
            visibility: isVisible ? "visible" : "none",
          },
        });
        return;
      }

      map.setLayoutProperty(layer.id, "visibility", isVisible ? "visible" : "none");
    });

    if (map.getLayer("route-planning-casing")) {
      map.moveLayer("route-planning-casing");
    }

    if (map.getLayer("route-planning-line")) {
      map.moveLayer("route-planning-line");
    }
  }, [bathymetryShading.geoJson, bathymetryShading.isDemo, darkMode, depthDataConnected, depthLayerGeoJson, depthShadingOpacity, mapReady, overlayToggles.depth, overlayToggles.depthShading, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const sourceId = "route-overlay-depth-contours";
    const beforeLabelLayerId = getFirstSymbolLayerId(map);
    ensureGeoJsonSource(map, sourceId, bathymetryContours.geoJson);

    const contourLayers = [
      {
        id: "route-overlay-depth-contour-lines",
        type: "line",
        filter: ["==", ["get", "kind"], "contour-line"],
        paint: {
          "line-color": darkMode ? "rgba(214, 231, 245, 0.42)" : "rgba(45, 88, 126, 0.34)",
          "line-width": 1.15,
          "line-opacity": overlayToggles.depthContours ? 0.95 : 0,
        },
      },
      {
        id: "route-overlay-depth-contour-labels",
        type: "symbol",
        filter: ["==", ["get", "kind"], "contour-label"],
        layout: {
          "text-field": ["get", "contourLabel"],
          "text-size": 11,
          "text-letter-spacing": 0.06,
          "text-font": ["Open Sans Regular"],
          visibility: overlayToggles.depthContours ? "visible" : "none",
        },
        paint: {
          "text-color": darkMode ? "#d7ebff" : "#234b6d",
          "text-halo-color": darkMode ? "rgba(8,17,22,0.84)" : "rgba(255,255,255,0.9)",
          "text-halo-width": 1.25,
          "text-opacity": 0.9,
        },
      },
    ];

    contourLayers.forEach((layer) => {
      if (!map.getLayer(layer.id)) {
        map.addLayer(
          {
            id: layer.id,
            source: sourceId,
            type: layer.type,
            filter: layer.filter,
            layout: layer.layout || { visibility: overlayToggles.depthContours ? "visible" : "none" },
            paint: layer.paint,
          },
          beforeLabelLayerId
        );
        return;
      }

      if (layer.type === "symbol") {
        map.setLayoutProperty(layer.id, "visibility", overlayToggles.depthContours ? "visible" : "none");
      } else {
        map.setPaintProperty(layer.id, "line-opacity", overlayToggles.depthContours ? 0.95 : 0);
      }
    });

    if (map.getLayer("route-planning-casing")) {
      map.moveLayer("route-planning-casing");
    }

    if (map.getLayer("route-planning-line")) {
      map.moveLayer("route-planning-line");
    }
  }, [bathymetryContours.geoJson, darkMode, mapReady, overlayToggles.depthContours, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mapLibreRef.current;
    if (!map || !maplibregl || !mapReady) return;

    waypointMarkersRef.current.forEach((marker) => marker.remove());
    waypointMarkersRef.current = [];
    if (!overlayToggles.waypoints) return;

    waypointMarkersRef.current = waypoints.map((waypoint, index) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = darkMode ? "route-waypoint-marker route-waypoint-marker-dark" : "route-waypoint-marker";
      element.setAttribute("aria-label", waypoint.name || `Waypoint ${index + 1}`);
      element.innerHTML = `<span>${index + 1}</span>`;

      element.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      const marker = new maplibregl.Marker({ element, draggable: canEdit })
        .setLngLat([waypoint.lng, waypoint.lat])
        .addTo(map);

      marker.on("dragstart", () => {
        markUserInteraction();
      });

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        updateWaypointHandlerRef.current?.(waypoint.id, {
          lng: Number(lngLat.lng.toFixed(6)),
          lat: Number(lngLat.lat.toFixed(6)),
        });
        releaseUserInteractionSoon();
      });

      return marker;
    });
  }, [canEdit, darkMode, mapReady, overlayToggles.waypoints, waypoints]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mapLibreRef.current;
    if (!map || !maplibregl || !mapReady) return;

    overlayMarkersRef.current.forEach((marker) => marker.remove());
    overlayMarkersRef.current = [];

    if (!overlayToggles.hazards) return;

    placeholderCollections.hazards.features.forEach((feature) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = [
        "route-overlay-marker",
        darkMode ? "route-overlay-marker-dark" : "",
        "route-overlay-marker--hazard",
      ].filter(Boolean).join(" ");
      element.setAttribute("aria-label", feature.properties?.title || "Hazard placeholder");
      element.title = feature.properties?.title || "Hazard placeholder";
      element.innerHTML = "<span>!</span>";

      element.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      overlayMarkersRef.current.push(
        new maplibregl.Marker({ element })
          .setLngLat(feature.geometry.coordinates)
          .addTo(map)
      );
    });
  }, [darkMode, mapReady, overlayToggles.hazards, placeholderCollections.hazards]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mapLibreRef.current;
    if (!map || !maplibregl || !mapReady) return;

    if (vesselMarkerRef.current) {
      vesselMarkerRef.current.remove();
      vesselMarkerRef.current = null;
    }

    if (!vesselPosition) return;

    const element = document.createElement("div");
    element.className = darkMode ? "route-vessel-marker route-vessel-marker-dark" : "route-vessel-marker";
    element.setAttribute("aria-label", "Current vessel position");
    element.setAttribute("title", "Current vessel position");
    element.innerHTML = '<span class="route-vessel-marker-core" aria-hidden="true"></span>';

    vesselMarkerRef.current = new maplibregl.Marker({ element })
      .setLngLat([vesselPosition.lng, vesselPosition.lat])
      .addTo(map);
  }, [darkMode, mapReady, vesselPosition]);

  useEffect(() => {
    if (!mapReady) return;

    // Camera movement lives only here for the automatic startup fit.
    // Route, depth, resize, and metrics updates elsewhere must never recenter
    // the map on mobile after the user starts planning.
    // We only fit once when the screen opens with a pre-existing route.
    const hasInitialRoute = initialWaypointCountRef.current > 0;
    if (hasInitialRoute && waypoints.length > 0 && !hasInitialFitRef.current) {
      const didFit = fitRouteToViewport();
      if (didFit) {
        hasInitialFitRef.current = true;
      }
    }
  }, [mapReady, waypoints]);

  const handleDropWaypoint = (targetWaypointId) => {
    const sourceWaypointId = draggingWaypointIdRef.current;
    draggingWaypointIdRef.current = "";
    if (!sourceWaypointId || sourceWaypointId === targetWaypointId) return;

    const fromIndex = waypoints.findIndex((item) => item.id === sourceWaypointId);
    const toIndex = waypoints.findIndex((item) => item.id === targetWaypointId);
    if (fromIndex === -1 || toIndex === -1) return;
    onReorderWaypoints(fromIndex, toIndex);
  };

  const handleMoveWaypoint = (index, direction) => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= waypoints.length) return;
    onReorderWaypoints(index, nextIndex);
  };

  const toggleOverlay = (key) => {
    setOverlayToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFitRoute = () => {
    fitRouteToViewport();
  };

  const handleCenterVessel = () => {
    centerVesselInViewport();
  };

  const handleToggleMapLock = () => {
    setIsMapLocked((value) => !value);
  };

  const handleToggleFullscreen = async () => {
    const container = mapContainerRef.current?.parentElement;
    if (!container || typeof document === "undefined") return;

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
      return;
    }

    if (typeof container.requestFullscreen === "function") {
      const result = await container.requestFullscreen().catch(() => null);
      if (result !== null) {
        setIsFullscreen(Boolean(document.fullscreenElement || container.matches?.(":fullscreen")));
        return;
      }
    }

    setIsFullscreen((value) => !value);
  };

  return (
    <div className="app-section-grid grid min-w-0 max-w-full md:gap-6">
      <Card className={`app-panel app-hero-surface app-panel-active mobile-route-hero min-w-0 overflow-hidden rounded-[28px] md:rounded-[30px] ${theme.card}`}>
        <CardContent className="p-0">
          <div className={`${darkMode ? "bg-[radial-gradient(circle_at_top_left,_rgba(118,214,180,0.18),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(198,163,91,0.1),_transparent_24%),linear-gradient(135deg,_rgba(16,25,23,0.98),_rgba(8,14,12,0.98))]" : "bg-[radial-gradient(circle_at_top_left,_rgba(16,124,108,0.12),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(198,163,91,0.14),_transparent_20%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(239,245,241,0.98))]"} p-4 md:p-5`}>
            <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] xl:items-center">
              <div className="min-w-0 max-w-xl">
                <div className="app-kicker">Route Planning</div>
                <h2 className={`mt-2 text-[1.55rem] font-semibold tracking-tight md:text-[2rem] ${theme.textPrimary}`}>Chart-first passage planning.</h2>
                <p className={`mt-2 max-w-lg text-sm leading-6 ${theme.textSecondary}`}>Place, review, and reorder waypoints on a live planning chart. Certified navigation checks remain separate.</p>
              </div>
              <div className={`app-panel mobile-route-status min-w-0 rounded-[22px] border p-4 md:rounded-[20px] ${darkMode ? "border-[#24353b] bg-[#0c1419]/86" : "border-white/80 bg-white/86"}`}>
                <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                  <div className="min-w-0">
                    <div className="app-kicker">Planning Status</div>
                    <div className={`mt-2 text-xl font-semibold ${theme.textPrimary}`}>{waypoints.length ? `${waypoints.length} waypoint${waypoints.length === 1 ? "" : "s"}` : "Awaiting route"}</div>
                  </div>
                  <Badge className={geolocationStatus === "ready" ? successBadgeClass(darkMode) : geolocationStatus === "loading" ? warningBadgeClass(darkMode) : routeStartPosition ? warningBadgeClass(darkMode) : neutralBadgeClass(darkMode)}>
                    {geolocationStatus === "ready" ? <Wifi className="mr-1 h-3.5 w-3.5" /> : <WifiOff className="mr-1 h-3.5 w-3.5" />}
                    {geolocationStatus === "ready" ? "Position live" : geolocationStatus === "loading" ? "Locating" : routeStartPosition ? "Estimated position" : "Manual mode"}
                  </Badge>
                </div>
                <div className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>{geolocationMessage}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="vessel-pill">{formatRouteDistanceNm(passageSummary.totalDistanceNm)}</Badge>
                  <Badge className={neutralBadgeClass(darkMode)}>{routeLegs.length} leg{routeLegs.length === 1 ? "" : "s"}</Badge>
                  <Badge className={warningBadgeClass(darkMode)}>Planning support only</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid min-w-0 max-w-full gap-4 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <Card className={`route-waypoint-pane order-2 app-panel app-panel-soft rounded-[26px] md:rounded-[24px] xl:order-1 xl:sticky xl:top-6 ${theme.card}`}>
          <CardContent className="p-5 md:p-6">
            <div className="mb-4">
              <div className="app-kicker">Route List</div>
              <div className={`mt-2 text-xl font-semibold ${theme.textPrimary}`}>Waypoints</div>
              <div className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>Review waypoint order, coordinates, leg distance, and bearing before using the plan onboard.</div>
            </div>

            <div className="space-y-3 xl:max-h-[calc(100vh-210px)] xl:overflow-y-auto xl:pr-1">
              {waypoints.length ? waypoints.map((waypoint, index) => {
                const inboundLeg = routeLegByToId[waypoint.id];
                return (
                  <div
                    key={waypoint.id}
                    draggable={canEdit}
                    onDragStart={() => { draggingWaypointIdRef.current = waypoint.id; }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDropWaypoint(waypoint.id)}
                    onDragEnd={() => { draggingWaypointIdRef.current = ""; }}
                    className={`app-card-hover app-panel app-panel-soft rounded-[22px] border p-4 md:rounded-xl ${darkMode ? "border-[#1f3037] bg-[#0d1519]/90" : "border-white/80 bg-white/88"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-semibold md:rounded-xl ${darkMode ? "bg-[#183029] text-[#d7f6e9]" : "bg-[#ebf6f1] text-[#166155]"}`}>{index + 1}</div>
                        <div className="min-w-0 flex-1">
                          <Input
                            disabled={!canEdit}
                            value={waypoint.name || ""}
                            onChange={(event) => onUpdateWaypoint(waypoint.id, { name: event.target.value })}
                            className={`h-11 rounded-xl ${theme.input}`}
                          />
                          <div className={`mt-2 text-xs leading-5 ${theme.textSecondary}`}>Lat {formatCoordinate(waypoint.lat)}</div>
                          <div className={`text-xs leading-5 ${theme.textSecondary}`}>Lng {formatCoordinate(waypoint.lng)}</div>
                          {waypointDepthDisplays[waypoint.id] ? (
                            <div className="mt-2">
                              <Badge className={getWaypointDepthBadgeClass(darkMode, waypointDepthDisplays[waypoint.id].depthMeters, minimumSafeDepth)}>
                                Depth: {waypointDepthDisplays[waypoint.id].depthMeters.toFixed(1)} m
                              </Badge>
                            </div>
                          ) : null}
                          <div className={`mt-2 text-xs leading-5 ${theme.textSecondary}`}>
                            {inboundLeg
                              ? `Leg ${inboundLeg.legIndex} - ${formatRouteDistanceNm(inboundLeg.distanceNm)} - ${formatBearingDegrees(inboundLeg.bearingDegrees)} - ${canComputeEta ? formatPassageHours(inboundLeg.estimatedHours) : "Set speed for ETA"}`
                              : "Departure reference point"}
                          </div>
                        </div>
                      </div>

                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => onDeleteWaypoint(waypoint.id)}
                          className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-semibold ${darkMode ? "bg-[#2b231f] text-[#ffd8cf] hover:bg-[#432d28]" : "bg-[#fff0ed] text-[#9b2c20] hover:bg-[#ffe0da]"}`}
                          aria-label={`Delete ${waypoint.name || `Waypoint ${index + 1}`}`}
                        >
                          x
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => handleMoveWaypoint(index, "up")} disabled={!canEdit || index === 0} className={`app-action-reveal rounded-2xl px-3 py-2 text-xs md:rounded-xl ${darkMode ? "border-[#284038] bg-[#0f1715]/92 text-[#dce9e1] hover:bg-[#16211d]" : "border-white/70 bg-white/84 text-[#365248] hover:bg-[#f7fbf9]"}`}>
                        Move Up
                      </Button>
                      <Button type="button" variant="outline" onClick={() => handleMoveWaypoint(index, "down")} disabled={!canEdit || index === waypoints.length - 1} className={`app-action-reveal rounded-2xl px-3 py-2 text-xs md:rounded-xl ${darkMode ? "border-[#284038] bg-[#0f1715]/92 text-[#dce9e1] hover:bg-[#16211d]" : "border-white/70 bg-white/84 text-[#365248] hover:bg-[#f7fbf9]"}`}>
                        Move Down
                      </Button>
                      <Badge className="vessel-pill">Drag to reorder</Badge>
                    </div>
                  </div>
                );
              }) : (
                <div className={`app-empty-state rounded-[22px] border border-dashed text-center text-sm leading-6 md:rounded-xl ${theme.textSecondary} ${darkMode ? "border-[#294038] bg-[#0d1513]/88" : "border-[#d5e1da] bg-[#f7faf8]"}`}>
                  Use <span className="font-semibold">+ Add Waypoint</span>, then click the map once to place the next point.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className={`app-panel app-panel-soft min-w-0 rounded-[26px] md:rounded-[24px] ${theme.card}`}>
            <CardContent className="p-4 md:p-5">
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="app-kicker">Marine Chart</div>
                    <div className={`mt-1 text-xl font-semibold ${theme.textPrimary}`}>Route planning chart</div>
                    <div className={`mt-1 text-sm ${theme.textSecondary}`}>Clean planning surface with route, waypoints, vessel position, and depth context.</div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
                    {canEdit ? (
                      <Button
                        type="button"
                        onClick={() => setIsAddWaypointMode(true)}
                        disabled={isAddWaypointMode}
                        className={`h-11 rounded-2xl px-4 text-sm font-semibold md:rounded-xl ${isAddWaypointMode ? darkMode ? "bg-[#8b6a1d] text-[#fff7de]" : "bg-[#f2cb6d] text-[#62420d]" : "button-vessel-primary"}`}
                      >
                        {!isAddWaypointMode ? <Plus className="mr-2 h-4 w-4" /> : null}
                        {isAddWaypointMode ? "Place waypoint" : "Add waypoint"}
                      </Button>
                    ) : (
                      <Badge className={neutralBadgeClass(darkMode)}>View-only access</Badge>
                    )}

                    {isAddWaypointMode ? (
                      <Button type="button" variant="outline" onClick={() => setIsAddWaypointMode(false)} className="vessel-outline-button h-11 rounded-2xl px-4 text-sm md:rounded-xl">
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className={`-mx-1 flex max-w-[calc(100%+0.5rem)] gap-2 overflow-x-auto rounded-[22px] border p-2 px-1 md:mx-0 md:max-w-full md:flex-wrap md:px-2 md:rounded-2xl ${darkMode ? "border-[#284038] bg-[#0f1715]/86" : "border-white/80 bg-white/88"}`}>
                  {[
                    { key: "planning", label: "Route", active: overlayToggles.route, onClick: () => toggleOverlay("route") },
                    { key: "depthShading", label: "Depth", active: overlayToggles.depthShading, onClick: () => toggleOverlay("depthShading") },
                    { key: "weather", label: "Weather", active: overlayToggles.weather, onClick: () => toggleOverlay("weather") },
                    { key: "waypoints", label: "Waypoints", active: overlayToggles.waypoints, onClick: () => toggleOverlay("waypoints") },
                    { key: "follow", label: "Follow", active: followVesselPosition, onClick: () => setFollowVesselPosition((value) => !value) },
                  ].map((control) => (
                    <Button
                      key={control.key}
                      type="button"
                      onClick={control.onClick}
                      className={`h-10 shrink-0 rounded-2xl px-4 text-sm font-medium md:rounded-xl ${control.active ? "vessel-active" : darkMode ? "text-[#dce9e1] hover:bg-white/5" : "text-[#365248] hover:bg-white/80"}`}
                    >
                      {control.label}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFitRoute}
                    disabled={!waypoints.length}
                    className="vessel-outline-button h-10 shrink-0 rounded-2xl px-4 text-sm md:rounded-xl"
                  >
                    Fit Route
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCenterVessel}
                    disabled={!vesselPosition}
                    className="vessel-outline-button h-10 shrink-0 rounded-2xl px-4 text-sm md:rounded-xl"
                  >
                    Center Vessel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleToggleMapLock}
                    className={`h-10 shrink-0 rounded-2xl px-4 text-sm md:rounded-xl ${isMapLocked ? darkMode ? "border-[#5a4820] bg-[#2f2611] text-[#ffe7aa]" : "border-[#f0d58d] bg-[#fff7de] text-[#7a5416]" : "vessel-outline-button"}`}
                  >
                    {isMapLocked ? "Unlock Map" : "Lock Map"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMapLayerPanel((value) => !value)}
                    className="vessel-outline-button h-10 shrink-0 rounded-2xl px-4 text-sm md:rounded-xl"
                  >
                    {showMapLayerPanel ? "Hide Layers" : "Layers"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleToggleFullscreen}
                    className="vessel-outline-button h-10 shrink-0 rounded-2xl px-4 text-sm md:rounded-xl"
                  >
                    {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  </Button>
                </div>
              </div>

                <div className={`route-map-workspace order-1 app-panel relative max-w-full overflow-hidden rounded-[30px] border shadow-[0_30px_70px_-34px_rgba(8,24,30,0.52)] xl:order-2 ${isFullscreen ? "route-map-workspace-fullscreen" : ""} ${darkMode ? "border-[#21343b] bg-[#091310] shadow-[0_30px_80px_-38px_rgba(0,0,0,0.72)]" : "border-[#d5e1da] bg-[#eef5f2] shadow-[0_26px_60px_-30px_rgba(18,47,40,0.2)]"}`}>
                <div
                  ref={mapContainerRef}
                  className="route-map-frame route-map-frame-mobile w-full overflow-hidden rounded-[30px] md:h-[70vh] md:min-h-[650px] xl:max-h-[820px]"
                />

                {isAddWaypointMode ? (
                  <div className="absolute left-4 right-4 top-4 z-20 flex flex-col gap-3 md:left-6 md:right-6 md:flex-row md:items-center md:justify-between">
                    <div className={`rounded-[22px] border px-4 py-3 text-sm font-medium md:rounded-xl ${darkMode ? "border-[#5a4820] bg-[#2f2611] text-[#ffe7aa]" : "border-[#f0d58d] bg-[#fff7de] text-[#7a5416]"}`}>
                      Click map to place waypoint
                    </div>
                    <Button type="button" variant="outline" onClick={() => setIsAddWaypointMode(false)} className="vessel-outline-button rounded-2xl px-4 py-3 md:rounded-xl">
                      Cancel
                    </Button>
                  </div>
                ) : null}

                <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
                  <Badge className="vessel-pill">{formatRouteDistanceNm(passageSummary.totalDistanceNm)}</Badge>
                  <Badge className={routeCrossesUnsafeShallowWater ? darkMode ? "bg-[#381d1f] text-[#ffd8dc]" : "bg-[#ffe0e0] text-[#8a1f2b]" : neutralBadgeClass(darkMode)}>
                    Min depth {minimumSafeDepth.toFixed(1)} m
                  </Badge>
                </div>

                {!mapReady && !mapError ? (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center gap-4 ${darkMode ? "bg-[#081116]/72" : "bg-[#edf3ee]/68"} text-sm ${theme.textSecondary}`}>
                    <div className={`h-12 w-12 animate-pulse rounded-full ${darkMode ? "bg-[#16262b]" : "bg-white/90"}`} />
                    <div className={`h-3 w-40 animate-pulse rounded-full ${darkMode ? "bg-[#16262b]" : "bg-white/90"}`} />
                    <div>Loading route map...</div>
                  </div>
                ) : null}

                {mapError ? (
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className={`app-empty-state max-w-md border text-center text-sm leading-6 ${theme.textSecondary} ${darkMode ? "border-[#5a4820] bg-[#0d1519]/92" : "border-[#d5e1da] bg-white/92"}`}>
                      {mapError}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-3 grid gap-3">
                {showMapLayerPanel ? (
                  <div className={`app-panel app-panel-soft rounded-[24px] border px-4 py-4 text-xs ${darkMode ? "border-[#2b4048] bg-[#0d1519]/92 text-[#dce9e1]" : "border-white/84 bg-white/92 text-[#365248]"}`}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="app-kicker">Layers</div>
                        <div className={`mt-1 text-sm font-semibold ${theme.textPrimary}`}>Advanced chart controls</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={depthDataConnected ? successBadgeClass(darkMode) : bathymetryShading.isDemo ? warningBadgeClass(darkMode) : neutralBadgeClass(darkMode)}>
                          {depthSourceLoading ? "Loading" : depthDataConnected ? "NOAA / GEBCO" : bathymetryShading.isDemo ? "Estimated" : "Offline"}
                        </Badge>
                        <Badge className={followVesselPosition ? successBadgeClass(darkMode) : neutralBadgeClass(darkMode)}>
                          Follow {followVesselPosition ? "on" : "off"}
                        </Badge>
                      </div>
                    </div>
                    <div className={`mt-2 text-[11px] leading-5 ${theme.textSecondary}`}>Depth source: {depthSourceLoading ? "Loading..." : depthSourceLabel}</div>

                    <div className="mt-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 xl:grid-cols-5">
                      {[
                        ["depthShading", "Shading"],
                        ["depthContours", "Contours"],
                        ["route", "Route"],
                        ["waypoints", "Waypoints"],
                        ["legend", "Legend"],
                      ].map(([key, label]) => (
                        <Button
                          key={`mobile-${key}`}
                          type="button"
                          variant="outline"
                          onClick={() => toggleOverlay(key)}
                          className={`min-h-11 justify-between rounded-2xl px-3 py-2 text-xs ${overlayToggles[key] ? "vessel-pill-strong border-vessel" : "vessel-outline-button"}`}
                        >
                          <span>{label}</span>
                        </Button>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
                    <div className="rounded-[18px] border border-white/10 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="app-kicker">Depth opacity</div>
                        <div className={`app-compact-label ${theme.textSecondary}`}><SmartLabel label={`${Math.round(depthShadingOpacity * 100)}%`} /></div>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={Math.round(depthShadingOpacity * 100)}
                        onChange={(event) => setDepthShadingOpacity(Number(event.target.value) / 100)}
                        className="mt-3 w-full accent-cyan-500"
                      />
                    </div>

                    <div className="rounded-[18px] border border-white/10 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="app-kicker">Follow vessel</div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFollowVesselPosition((value) => !value)}
                          className="vessel-outline-button rounded-2xl px-3 py-2 text-xs"
                        >
                          {followVesselPosition ? "Disable" : "Enable"}
                        </Button>
                      </div>
                      <div className={`mt-2 text-[11px] leading-5 ${theme.textSecondary}`}>When off, GPS never recenters the chart automatically.</div>
                    </div>
                    </div>
                  </div>
                ) : null}

                {(overlayToggles.depth && !depthDataConnected) ? (
                  <div className={`rounded-[22px] border px-4 py-3 text-sm ${darkMode ? "border-[#5a4820] bg-[#2f2611]/94 text-[#ffe7aa]" : "border-[#f0d58d] bg-[#fff7de]/94 text-[#7a5416]"}`}>
                    <div className="font-semibold">Depth data unavailable</div>
                    <div className="mt-1 text-xs opacity-90">{DEPTH_LAYER_UNAVAILABLE_MESSAGE}</div>
                  </div>
                ) : null}

                <div className={`rounded-[22px] border px-4 py-3 text-sm leading-6 ${darkMode ? "border-[#294038] bg-[#0d1513]/94 text-[#dce9e1]" : "border-white/84 bg-white/92 text-[#365248]"}`}>
                  Planning aid only. Verify route against official charts and onboard instruments.
                </div>
              </div>

              {unsafeLegDetails.length ? (
                <div className={`mt-3 rounded-[22px] border px-4 py-3 md:rounded-xl ${darkMode ? "border-[#6c3027] bg-[#2a1613] text-[#ffd7cf]" : "border-[#efb0a6] bg-[#fff1ed] text-[#9b2c20]"}`}>
                  <div className="text-sm font-semibold">Unsafe shallow section detected</div>
                  <div className="mt-1 text-xs leading-5 opacity-90">
                    {unsafeLegDetails.map((leg) => `Leg ${leg.legIndex}${leg.distanceNm ? `, approx ${leg.distanceNm.toFixed(1)} nm` : ""}${leg.minimumDepth !== null ? `, sampled minimum ${leg.minimumDepth.toFixed(1)} m` : ""}`).join(" · ")}
                  </div>
                </div>
              ) : null}

              <div className="mt-3">
                <ExpandableMetricGroup
                  title="Route Metrics"
                  metrics={routeMetrics}
                  darkMode={darkMode}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
            <Card className={`app-panel app-panel-soft rounded-[26px] md:rounded-[24px] ${theme.card}`}>
              <CardContent className="p-5">
                <div className="app-kicker">Vessel Safety & Passage Parameters</div>
                <div className={`mt-2 text-lg font-semibold ${theme.textPrimary}`}>Captain planning reference</div>
                <div className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>Planning values for duration, fuel, and safe depth. Verify against official charts and onboard instruments.</div>

                {routeCrossesUnsafeShallowWater ? (
                  <div className={`mt-4 rounded-[22px] border p-4 md:rounded-xl ${darkMode ? "border-[#6c3027] bg-[#2a1613] text-[#ffd7cf]" : "border-[#efb0a6] bg-[#fff1ed] text-[#9b2c20]"}`}>
                    <div className="text-sm font-semibold">WARNING: Route crosses unsafe shallow water</div>
                    <div className="mt-2 text-xs leading-5 opacity-90">
                      Connected depth samples show approximately {routeMinimumAvailableDepth?.toFixed(1)} m available against a required minimum of {minimumSafeDepth.toFixed(1)} m. Official nautical chart depth data is still required for confirmation.
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ParameterBracket
                    darkMode={darkMode}
                    label="Vessel Draft"
                    valueText={formatDepthDisplay(vesselProfile.draft)}
                    unit="m"
                    helperText="Distance from the waterline to the lowest point of the vessel. Used to assess minimum required water depth."
                    tone={draftSet ? "neutral" : "warning"}
                    statusLabel={readyOrMissingState(draftSet)}
                  >
                    <Input disabled={!canEdit} type="number" step="0.1" value={draftSet ? vesselProfile.draft : ""} onChange={(event) => onUpdateVesselProfile({ draft: event.target.value })} placeholder="Enter draft (m)" className={`h-12 rounded-xl ${theme.input}`} />
                  </ParameterBracket>

                  <ParameterBracket
                    darkMode={darkMode}
                    label="Under-Keel Clearance"
                    valueText={formatDepthDisplay(safetyMargin)}
                    unit="m"
                    helperText="Additional safety clearance below the keel to account for tide, swell, squat, and chart tolerance."
                    tone={underKeelSet ? "neutral" : "warning"}
                    statusLabel={readyOrMissingState(underKeelSet)}
                  >
                    <Input disabled={!canEdit} type="number" step="0.1" value={underKeelSet ? safetyMargin : ""} onChange={(event) => onUpdateSafetyMargin(event.target.value)} placeholder="Enter clearance (m)" className={`h-12 rounded-xl ${theme.input}`} />
                  </ParameterBracket>

                  <ParameterBracket
                    darkMode={darkMode}
                    label="Minimum Required Depth"
                    valueText={minimumRequiredDepthSet ? Number(passageSummary.minimumSafeDepth).toFixed(1) : "Not set"}
                    unit="m"
                    helperText="Calculated safety threshold. Any charted depth below this value should be treated as unsafe."
                    tone={routeCrossesUnsafeShallowWater ? "critical" : minimumRequiredDepthSet ? "neutral" : "warning"}
                    statusLabel={routeCrossesUnsafeShallowWater ? "Unsafe" : readyOrMissingState(minimumRequiredDepthSet)}
                  />

                  <ParameterBracket
                    darkMode={darkMode}
                    label="Cruising Speed"
                    valueText={formatSpeedDisplay(vesselProfile.cruisingSpeedKnots)}
                    unit="kn"
                    helperText="Average planned passage speed used to estimate total route duration."
                    tone={cruisingSpeedSet ? "neutral" : "warning"}
                    statusLabel={readyOrMissingState(cruisingSpeedSet)}
                  >
                    <Input disabled={!canEdit} type="number" step="0.1" value={cruisingSpeedSet ? vesselProfile.cruisingSpeedKnots : ""} onChange={(event) => onUpdateVesselProfile({ cruisingSpeedKnots: event.target.value })} placeholder="Enter cruising speed (kn)" className={`h-12 rounded-xl ${theme.input}`} />
                  </ParameterBracket>

                  <ParameterBracket
                    darkMode={darkMode}
                    label="Fuel Consumption"
                    valueText={formatFuelDisplay(vesselProfile.fuelBurnPerHour)}
                    unit="L/h"
                    helperText="Average fuel burn per hour at planned cruising speed."
                    tone={fuelConsumptionSet ? "neutral" : "warning"}
                    statusLabel={readyOrMissingState(fuelConsumptionSet)}
                  >
                    <Input disabled={!canEdit} type="number" step="1" value={fuelConsumptionSet ? vesselProfile.fuelBurnPerHour : ""} onChange={(event) => onUpdateVesselProfile({ fuelBurnPerHour: event.target.value })} placeholder="Enter fuel consumption (L/h)" className={`h-12 rounded-xl ${theme.input}`} />
                  </ParameterBracket>

                  <ParameterBracket
                    darkMode={darkMode}
                    label="Fuel Capacity"
                    valueText={formatFuelDisplay(vesselProfile.fuelCapacity)}
                    unit="L"
                    helperText="Total usable fuel capacity entered for passage planning."
                    tone={fuelCapacitySet ? "neutral" : "warning"}
                    statusLabel={readyOrMissingState(fuelCapacitySet)}
                  >
                    <Input disabled={!canEdit} type="number" step="1" value={fuelCapacitySet ? vesselProfile.fuelCapacity : ""} onChange={(event) => onUpdateVesselProfile({ fuelCapacity: event.target.value })} placeholder="Enter fuel capacity (L)" className={`h-12 rounded-xl ${theme.input}`} />
                  </ParameterBracket>

                  <ParameterBracket
                    darkMode={darkMode}
                    label="Fuel Reserve"
                    valueText={formatPercentDisplay(vesselProfile.fuelReservePercentage)}
                    unit="%"
                    helperText="Fuel percentage reserved for safety, delays, weather, or operational margin."
                    tone={fuelReserveSet ? "neutral" : "warning"}
                    statusLabel={readyOrMissingState(fuelReserveSet)}
                  >
                    <Input disabled={!canEdit} type="number" step="1" value={fuelReserveSet ? vesselProfile.fuelReservePercentage : ""} onChange={(event) => onUpdateVesselProfile({ fuelReservePercentage: event.target.value })} placeholder="Enter fuel reserve (%)" className={`h-12 rounded-xl ${theme.input}`} />
                  </ParameterBracket>

                  <ParameterBracket
                    darkMode={darkMode}
                    label="Estimated Passage Time"
                    valueText={formatHoursDisplay(passageSummary.estimatedHours, estimatedPassageTimeSet)}
                    unit="h"
                    helperText="Calculated from total route distance and cruising speed."
                    tone={estimatedPassageTimeSet ? "neutral" : "warning"}
                    statusLabel={readyOrMissingState(estimatedPassageTimeSet)}
                  />

                  <ParameterBracket
                    darkMode={darkMode}
                    label="Estimated Fuel Required"
                    valueText={estimatedFuelRequiredSet ? Number(passageSummary.estimatedFuelBurn).toFixed(0) : "Not set"}
                    unit="L"
                    helperText="Calculated from estimated passage time and hourly fuel consumption."
                    tone={estimatedFuelRequiredSet ? "neutral" : "warning"}
                    statusLabel={readyOrMissingState(estimatedFuelRequiredSet)}
                  />

                  <ParameterBracket
                    darkMode={darkMode}
                    label="Available Fuel After Reserve"
                    valueText={availableFuelAfterReserveSet ? Number(availableFuelAfterReserveValue).toFixed(0) : "Not set"}
                    unit="L"
                    helperText="Fuel available for route planning after reserve fuel is protected."
                    tone={availableFuelAfterReserveSet ? (estimatedFuelRequiredSet && !availableFuelAfterReserveCoversRoute ? "warning" : "neutral") : "warning"}
                    statusLabel={availableFuelAfterReserveSet ? (estimatedFuelRequiredSet && !availableFuelAfterReserveCoversRoute ? "Review" : "Ready") : "Missing"}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card className={`app-panel app-panel-soft rounded-[26px] md:rounded-[24px] ${theme.card}`}>
                <CardContent className="p-5">
                  <div className="app-kicker">Supplemental Feeds</div>
                  <div className={`mt-2 text-lg font-semibold ${theme.textPrimary}`}>Secondary route overlays</div>
                  <div className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>Keep advanced overlays secondary to the chart. Connect real hazard, weather, and AIS feeds before relying on them.</div>
                  <div className="mt-4 space-y-3">
                    {advancedOverlayDefinitions.map((overlay) => (
                      <div key={overlay.key} className={`app-panel app-panel-soft rounded-[22px] border p-4 md:rounded-xl ${darkMode ? "border-[#1f3037] bg-[#0d1519]/90" : "border-white/80 bg-white/88"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`font-semibold ${theme.textPrimary}`}>{overlay.label}</div>
                            <div className={`mt-1 text-sm leading-6 ${theme.textSecondary}`}>Data source required</div>
                          </div>
                          <Button type="button" variant="outline" onClick={() => toggleOverlay(overlay.key)} className={`rounded-2xl px-3 py-2 text-xs md:rounded-xl ${overlayToggles[overlay.key] ? darkMode ? "border-[#2c5f50] bg-[#183029] text-[#d7f6e9]" : "border-[#cbe4d9] bg-[#ebf6f1] text-[#166155]" : darkMode ? "border-[#284038] bg-[#0f1715]/92 text-[#dce9e1] hover:bg-[#16211d]" : "border-white/70 bg-white/84 text-[#365248] hover:bg-[#f7fbf9]"}`}>
                            {overlayToggles[overlay.key] ? "On" : "Off"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className={`app-panel app-panel-soft rounded-[26px] md:rounded-[24px] ${theme.card}`}>
                <CardContent className="p-5">
                  <div className="app-kicker">Depth Review</div>
                  <div className={`mt-2 text-lg font-semibold ${theme.textPrimary}`}>Safety reminders</div>
                  <div className="mt-4 space-y-3">
                    {depthWarnings.length ? depthWarnings.map((warning) => (
                      <div key={warning.id} className={`rounded-[22px] border p-4 md:rounded-xl ${warning.severity === "warning" ? darkMode ? "border-[#5a4820] bg-[#2f2611] text-[#ffe7aa]" : "border-[#f0d58d] bg-[#fff7de] text-[#7a5416]" : darkMode ? "border-[#294038] bg-[#0d1513]/88 text-[#cfe4da]" : "border-[#d5e1da] bg-[#f7faf8] text-[#496157]"}`}>
                        <div className="flex items-start gap-3">
                          {warning.severity === "warning" ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                          <div className="text-sm leading-6">{warning.message}</div>
                        </div>
                      </div>
                    )) : (
                      <div className={`app-empty-state rounded-[22px] border border-dashed text-sm leading-6 md:rounded-xl ${theme.textSecondary} ${darkMode ? "border-[#294038] bg-[#0d1513]/88" : "border-[#d5e1da] bg-[#f7faf8]"}`}>
                        Add at least two waypoints to produce route depth-review reminders.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className={`app-panel app-panel-soft rounded-[26px] md:rounded-[24px] ${theme.card}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl md:rounded-xl ${darkMode ? "bg-[#183029] text-[#d7f6e9]" : "bg-[#ebf6f1] text-[#166155]"}`}>
                      <Compass className="h-4 w-4" />
                    </div>
                    <div>
                      <div className={`text-lg font-semibold ${theme.textPrimary}`}>Planning disclaimer</div>
                      <div className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>This tool is for planning support only and is not certified for navigation.</div>
                      <div className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>Every route must be verified using official charts, notices, weather, traffic, and onboard bridge procedures before use.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
