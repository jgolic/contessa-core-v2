function getRuntimeEnv() {
  if (typeof process !== "undefined" && process.env) {
    return process.env;
  }

  return {};
}

function isEnabled(value = "") {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

export function getRuntimePublicConfig() {
  const env = getRuntimeEnv();

  return {
    appUrl: env.NEXT_PUBLIC_APP_URL || "",
    mapStyleUrl: env.NEXT_PUBLIC_MAP_STYLE_URL || "",
    mapTilerKey: env.NEXT_PUBLIC_MAPTILER_KEY || "",
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    allowDemoEditing: env.NEXT_PUBLIC_ALLOW_DEMO_EDITING || "",
    allowSensitiveCrewData: env.NEXT_PUBLIC_ALLOW_SENSITIVE_CREW_DATA || "",
    allowDemoCrewPortraits: env.NEXT_PUBLIC_ALLOW_DEMO_CREW_PORTRAITS || "",
    nodeEnv: env.NODE_ENV || "",
  };
}

export function getRuntimePublicAppUrl() {
  return getRuntimePublicConfig().appUrl || "";
}

export function getRuntimeMapStyleUrl() {
  return getRuntimePublicConfig().mapStyleUrl || "";
}

export function isProductionRuntime(config = getRuntimePublicConfig()) {
  return String(config.nodeEnv || "").trim().toLowerCase() === "production";
}

export function hasConfiguredBackend(config = getRuntimePublicConfig()) {
  return Boolean(
    String(config.supabaseUrl || "").trim() &&
    String(config.supabaseAnonKey || "").trim()
  );
}

export function isHardenedPublicDemo(config = getRuntimePublicConfig()) {
  return isProductionRuntime(config) && !hasConfiguredBackend(config);
}

export function canUseDemoEditing(config = getRuntimePublicConfig()) {
  if (isEnabled(config.allowDemoEditing)) return true;
  return !isHardenedPublicDemo(config);
}

export function canPreviewDemoRoles(config = getRuntimePublicConfig()) {
  return canUseDemoEditing(config);
}

export function canEditDemoActorIdentity(config = getRuntimePublicConfig()) {
  return canUseDemoEditing(config);
}

export function canExposeSensitiveCrewData(config = getRuntimePublicConfig()) {
  if (isEnabled(config.allowSensitiveCrewData)) return true;
  return !isHardenedPublicDemo(config);
}

export function canGenerateDemoCrewPortraits(config = getRuntimePublicConfig()) {
  if (isEnabled(config.allowDemoCrewPortraits)) return true;
  return !isHardenedPublicDemo(config);
}
