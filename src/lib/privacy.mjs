import { canExposeSensitiveCrewData } from "./runtime_config.mjs";

function maskSensitiveValue(value = "") {
  const normalized = String(value || "").trim();
  if (!normalized) return "";

  const visibleCharacters = Math.min(2, normalized.length);
  const suffix = normalized.slice(-visibleCharacters);
  const maskedLength = Math.max(normalized.length - visibleCharacters, 4);
  return `${"•".repeat(maskedLength)}${suffix}`;
}

export function getCrewIdentifierDisplay(
  value = "",
  fallback = "Not set",
  { exposeSensitiveData = canExposeSensitiveCrewData() } = {}
) {
  const normalized = String(value || "").trim();
  if (!normalized) return fallback;
  return exposeSensitiveData ? normalized : maskSensitiveValue(normalized);
}

export function getCrewIdentifierPrivacyNote({
  exposeSensitiveData = canExposeSensitiveCrewData(),
} = {}) {
  if (exposeSensitiveData) return "";
  return "Sensitive crew document identifiers are masked in this public deployment.";
}
