export const CERTIFICATE_REVIEW_CONFIDENCE_THRESHOLD = 0.72;
export const CERTIFICATE_STATUS_OPTIONS = ["valid", "expiring soon", "urgent", "expired", "review"];
export const CERTIFICATE_UPLOAD_ACCEPT = "application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png";

const KNOWN_CERTIFICATE_TYPES = [
  "STCW",
  "ENG1",
  "Medical Certificate",
  "Medical",
  "GMDSS",
  "ROC",
  "COC",
  "Certificate of Competency",
  "Passport",
  "Seaman Book",
  "Seafarer Medical",
  "Basic Training",
  "Security Awareness",
];

function clampNumber(value, min = 0, max = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function certificateTitleCase(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function certificateParseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function certificateTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function certificateDaysUntil(dateString) {
  const dueDate = certificateParseLocalDate(dateString);
  if (!dueDate) return null;
  const today = certificateParseLocalDate(certificateTodayDateString());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((dueDate.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / msPerDay);
}

function normalizeDateCandidate(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const slashMatch = value.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (slashMatch) {
    const [, first, second, yearRaw] = slashMatch;
    const month = Number(first);
    const day = Number(second);
    const year = Number(yearRaw.length === 2 ? `20${yearRaw}` : yearRaw);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const monthMatch = value.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthMatch) {
    const [, monthName, dayRaw, yearRaw] = monthMatch;
    const date = new Date(`${monthName} ${dayRaw}, ${yearRaw}`);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  return "";
}

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBase64(base64Value) {
  if (typeof atob === "function") return atob(base64Value);
  if (typeof Buffer !== "undefined") return Buffer.from(base64Value, "base64").toString("binary");
  return "";
}

function decodeDataUrlText(dataUrl = "") {
  const match = String(dataUrl || "").match(/^data:([^;,]+)?(?:;base64)?,(.*)$/s);
  if (!match) return "";
  const mimeType = String(match[1] || "").toLowerCase();
  const payload = match[2] || "";
  const binaryText = decodeBase64(payload);
  if (!binaryText) return "";

  if (mimeType.startsWith("text/")) {
    return normalizeWhitespace(binaryText);
  }

  if (mimeType === "application/pdf") {
    const printable = binaryText.match(/[A-Za-z0-9][A-Za-z0-9\s:/#().,\-]{4,}/g) || [];
    return normalizeWhitespace(printable.join(" "));
  }

  return "";
}

function pickFirstMatch(sourceText, patterns) {
  for (const pattern of patterns) {
    const match = sourceText.match(pattern);
    if (match?.[1]) return normalizeWhitespace(match[1]);
  }
  return "";
}

function inferCertificateType(sourceText, fileNames = []) {
  const matchedKnownType = KNOWN_CERTIFICATE_TYPES.find((type) => new RegExp(type.replace(/\s+/g, "\\s+"), "i").test(sourceText));
  if (matchedKnownType) return matchedKnownType;

  const labeled = pickFirstMatch(sourceText, [
    /(?:certificate(?:\s+name|\s+type)?|document(?:\s+type)?)\s*[:\-]\s*([A-Za-z0-9 /()-]{4,80})/i,
  ]);
  if (labeled) return labeled;

  const fileNameHint = fileNames
    .map((name) => String(name || "").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim())
    .find(Boolean);

  return fileNameHint ? certificateTitleCase(fileNameHint) : "";
}

function extractNamedDate(sourceText, labels) {
  const stopLabels = "issue date|date of issue|issued on|issued|expiry date|expiration date|valid until|expires on|expiry|expiration|issuing authority|authority|issued by|certificate(?:\\s+(?:no|number))?";
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[:\\-]?\\s*([A-Za-z0-9,./ -]{6,30}?)(?=\\s+(?:${stopLabels})\\b|$)`, "i");
    const match = sourceText.match(pattern);
    if (match?.[1]) {
      const normalized = normalizeDateCandidate(match[1]);
      if (normalized) return normalized;
    }
  }
  return "";
}

function buildReviewReasons({ attachments = [], expiryDate, confidenceScore, extractedText }) {
  const reasons = [];
  if (!attachments.length) reasons.push("No source file uploaded.");
  if (!extractedText) reasons.push("No readable text was extracted from the uploaded file.");
  if (!expiryDate) reasons.push("No expiration date was found. Manual review is required.");
  if (confidenceScore < CERTIFICATE_REVIEW_CONFIDENCE_THRESHOLD) reasons.push("Extraction confidence is low. Review before saving.");
  if (attachments.some((attachment) => String(attachment.type || "").startsWith("image/"))) {
    reasons.push("Image OCR provider is not configured yet, so image parsing may be incomplete.");
  }
  return [...new Set(reasons)];
}

export function getCertificateExpiryMeta(expiryDate) {
  const daysRemaining = certificateDaysUntil(expiryDate);
  if (daysRemaining === null) {
    return {
      daysRemaining: null,
      status: "review",
      statusLabel: "Review needed",
      statusText: "No expiry date",
      alertLevel: "warning",
    };
  }

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      status: "expired",
      statusLabel: "Expired",
      statusText: `Expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? "" : "s"} ago`,
      alertLevel: "critical",
    };
  }

  if (daysRemaining <= 30) {
    return {
      daysRemaining,
      status: "urgent",
      statusLabel: "Urgent",
      statusText: daysRemaining === 0 ? "Expires today" : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`,
      alertLevel: "critical",
    };
  }

  if (daysRemaining <= 90) {
    return {
      daysRemaining,
      status: "expiring soon",
      statusLabel: "Expiring Soon",
      statusText: `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`,
      alertLevel: "warning",
    };
  }

  return {
    daysRemaining,
    status: "valid",
    statusLabel: "Valid",
    statusText: `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`,
    alertLevel: "ok",
  };
}

export function getCertificateStatusBadgeClass(status) {
  if (status === "expired") return "bg-[#ffe0e0] text-[#8a1f2b]";
  if (status === "urgent") return "bg-[#fff3c4] text-[#7a5416]";
  if (status === "expiring soon") return "vessel-pill";
  if (status === "valid") return "bg-[#dff5ea] text-[#176342]";
  return "bg-[#f3e9de] text-[#7a5630]";
}

export function createEmptyCertificateDraft() {
  return {
    name: "",
    holderName: "",
    certificateNumber: "",
    issueDate: "",
    expiryDate: "",
    issuingAuthority: "",
    notes: "",
    attachments: [],
    confidenceScore: 0,
    needsManualReview: false,
    reviewReasons: [],
    extractionProvider: "",
    rawExtractedText: "",
    extractedAt: "",
    extractionReviewed: false,
    qrPlaceholder: "QR profile access coming soon",
  };
}

export function normalizeCertificateRecord(item = {}) {
  const attachments = Array.isArray(item.attachments)
    ? item.attachments.filter((attachment) => attachment && typeof attachment === "object" && attachment.dataUrl)
    : [];
  const confidenceScore = clampNumber(item.confidenceScore ?? item.confidence ?? 0);
  const expiryDate = normalizeDateCandidate(item.expiryDate || "");
  const issueDate = normalizeDateCandidate(item.issueDate || "");
  const expiryMeta = getCertificateExpiryMeta(expiryDate);
  const reviewReasons = Array.isArray(item.reviewReasons) ? item.reviewReasons.filter(Boolean) : [];
  const needsManualReview = Boolean(item.needsManualReview) || reviewReasons.length > 0 || (!expiryDate && attachments.length > 0);

  return {
    ...item,
    id: item.id || `CERT-${Date.now()}`,
    name: item.name || item.certificateType || "Certificate",
    holderName: item.holderName || "",
    certificateNumber: item.certificateNumber || "",
    issueDate,
    expiryDate,
    issuingAuthority: item.issuingAuthority || "",
    notes: item.notes || "",
    attachments,
    confidenceScore,
    needsManualReview,
    reviewReasons,
    extractionProvider: item.extractionProvider || "",
    rawExtractedText: item.rawExtractedText || "",
    extractedAt: item.extractedAt || "",
    extractionReviewed: item.extractionReviewed !== false,
    qrPlaceholder: item.qrPlaceholder || "QR profile access coming soon",
    daysUntilExpiration: expiryMeta.daysRemaining,
    status: needsManualReview && !expiryDate ? "review" : expiryMeta.status,
    statusLabel: needsManualReview && !expiryDate ? "Review needed" : expiryMeta.statusLabel,
    statusText: needsManualReview && !expiryDate ? "Missing expiry date" : expiryMeta.statusText,
  };
}

function localCertificateExtractionProvider({ attachments = [] } = {}) {
  const fileNames = attachments.map((attachment) => attachment.name || "").filter(Boolean);
  const extractedText = normalizeWhitespace(attachments.map((attachment) => decodeDataUrlText(attachment.dataUrl)).join(" "));
  const sourceText = normalizeWhitespace(`${fileNames.join(" ")} ${extractedText}`);

  const draft = {
    name: inferCertificateType(sourceText, fileNames),
    holderName: pickFirstMatch(sourceText, [
      /(?:holder(?:\s+name)?|name of holder|crew member|seafarer|issued to)\s*[:\-]?\s*([A-Za-z][A-Za-z .'-]{3,80}?)(?=\s+(?:certificate(?:\s+(?:no|number))?|issue date|date of issue|expiry date|expiration date|issuing authority|authority|issued by)\b|$)/i,
      /this is to certify that\s+([A-Za-z][A-Za-z .'-]{3,80}?)(?=\s+(?:certificate(?:\s+(?:no|number))?|issue date|date of issue|expiry date|expiration date|issuing authority|authority|issued by)\b|$)/i,
    ]),
    certificateNumber: pickFirstMatch(sourceText, [
      /(?:certificate(?:\s+(?:no|number))?|cert(?:ificate)?\s*#|document\s*no\.?)\s*[:\-]?\s*([A-Z0-9\-\/]{4,40})/i,
      /\b([A-Z]{2,6}[-/][A-Z0-9]{3,20})\b/,
    ]),
    issueDate: extractNamedDate(sourceText, ["issue date", "date of issue", "issued on", "issued"]),
    expiryDate: extractNamedDate(sourceText, ["expiry date", "expiration date", "valid until", "expires on", "expiry", "expiration"]),
    issuingAuthority: pickFirstMatch(sourceText, [
      /(?:issuing authority|authority|issued by)\s*[:\-]?\s*([A-Za-z0-9 ,.'&/-]{4,80})/i,
    ]),
  };

  const resolvedFieldCount = Object.values(draft).filter(Boolean).length;
  const confidenceScore = clampNumber((resolvedFieldCount / 6) * (extractedText ? 1 : 0.75));
  const reviewReasons = buildReviewReasons({
    attachments,
    expiryDate: draft.expiryDate,
    confidenceScore,
    extractedText,
  });

  return {
    provider: "local-review-parser",
    confidenceScore,
    reviewReasons,
    needsManualReview: reviewReasons.length > 0,
    rawExtractedText: extractedText,
    extractedAt: new Date().toISOString(),
    fields: draft,
  };
}

const EXTRACTION_PROVIDERS = {
  local: localCertificateExtractionProvider,
};

export async function extractCertificateDraft({ attachments = [], providerKey = "local" } = {}) {
  const provider = EXTRACTION_PROVIDERS[providerKey] || EXTRACTION_PROVIDERS.local;
  const result = provider({ attachments });
  const merged = normalizeCertificateRecord({
    ...createEmptyCertificateDraft(),
    ...result.fields,
    attachments,
    confidenceScore: result.confidenceScore,
    needsManualReview: result.needsManualReview,
    reviewReasons: result.reviewReasons,
    extractionProvider: result.provider,
    rawExtractedText: result.rawExtractedText,
    extractedAt: result.extractedAt,
    extractionReviewed: false,
  });

  return {
    ...merged,
    extractionProvider: result.provider,
  };
}
