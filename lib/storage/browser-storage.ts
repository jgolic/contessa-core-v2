export function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getStoredString(key: string, fallback = "") {
  return getStorage()?.getItem(key) ?? fallback;
}

export function getStoredJson<T>(key: string, fallback: T): T {
  const raw = getStoredString(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setStoredJson(key: string, value: unknown) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
}

export function removeStoredKey(key: string) {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(key);
}
