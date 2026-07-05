import { getRuntimePublicConfig } from "../../src/lib/runtime_config.mjs";

export const publicConfig = getRuntimePublicConfig();

export function getBrowserOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin || "";
}

export function resolvePublicAppUrl() {
  return publicConfig.appUrl || getBrowserOrigin() || "";
}
