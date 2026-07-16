export const THEME_STORAGE_KEY = "contessa-ui-theme";
export const DEFAULT_THEME = "night";
export const THEME_MODES = ["day", "night", "red"];

export function normalizeThemeMode(value) {
  return THEME_MODES.includes(value) ? value : DEFAULT_THEME;
}

function resolveStorage(storage) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readThemePreference(storage) {
  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage) return DEFAULT_THEME;

  try {
    return normalizeThemeMode(resolvedStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyThemePreference(themeMode, documentRef, storage) {
  const normalizedTheme = normalizeThemeMode(themeMode);
  const resolvedStorage = resolveStorage(storage);
  const root = documentRef?.documentElement;
  const body = documentRef?.body;

  if (root) root.dataset.theme = normalizedTheme;
  if (body) body.classList.toggle("dark-mode", normalizedTheme !== "day");

  if (resolvedStorage) {
    try {
      resolvedStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
    } catch {
      // Keep the active theme when private browsing blocks persistence.
    }
  }

  return normalizedTheme;
}
