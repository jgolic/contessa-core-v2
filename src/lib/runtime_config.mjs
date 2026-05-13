export function getRuntimePublicConfig() {
  if (typeof process !== "undefined" && process.env) {
    return {
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "",
      mapStyleUrl: process.env.NEXT_PUBLIC_MAP_STYLE_URL || "",
      mapTilerKey: process.env.NEXT_PUBLIC_MAPTILER_KEY || "",
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    };
  }

  return {
    appUrl: "",
    mapStyleUrl: "",
    mapTilerKey: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
  };
}

export function getRuntimePublicAppUrl() {
  return getRuntimePublicConfig().appUrl || "";
}

export function getRuntimeMapStyleUrl() {
  return getRuntimePublicConfig().mapStyleUrl || "";
}
