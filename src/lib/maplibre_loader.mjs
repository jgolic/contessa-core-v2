export function ensureMapLibre() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("MapLibre can only load in the browser."));
  }

  return import("maplibre-gl").then((module) => module.default || module);
}
