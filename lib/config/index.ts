export const publicConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "",
  mapStyleUrl: process.env.NEXT_PUBLIC_MAP_STYLE_URL || "",
  mapTilerKey: process.env.NEXT_PUBLIC_MAPTILER_KEY || "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
};

export function getBrowserOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin || "";
}

export function resolvePublicAppUrl() {
  return publicConfig.appUrl || getBrowserOrigin() || "";
}
