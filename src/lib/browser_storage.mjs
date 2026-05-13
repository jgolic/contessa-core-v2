export function getBrowserStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getStoredString(key, fallback = "") {
  return getBrowserStorage()?.getItem(key) ?? fallback;
}

export function getStoredJson(key, fallback = null) {
  const raw = getStoredString(key, "");
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setStoredJson(key, value) {
  const storage = getBrowserStorage();
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
}

export function removeStoredKey(key) {
  const storage = getBrowserStorage();
  if (!storage) return;
  storage.removeItem(key);
}
