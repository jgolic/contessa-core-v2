import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Badge } from "./ui/badge.jsx";
import { filePreviewCardClass, filePreviewPlaceholderClass, infoBadgeClass, neutralBadgeClass, successBadgeClass, themeClasses, warningBadgeClass } from "../contessa_app_data.mjs";
import {
  CERTIFICATE_UPLOAD_ACCEPT,
  getCertificateExpiryMeta,
} from "../contessa_certificate_extraction.mjs";

function WorkflowStep({ darkMode = false, label, active = false, complete = false }) {
  const className = complete
    ? "bg-[#dff5ea] text-[#176342]"
    : active
      ? darkMode
        ? "bg-[#22312a] text-[#dff7ed]"
        : "bg-[#e8f5ef] text-[#1f5b4a]"
      : darkMode
        ? "bg-[#111a16] text-[#9eb1a6]"
        : "bg-[#f3f8f5] text-[#64756b]";

  return <Badge className={className}>{label}</Badge>;
}

export function CertificateExtractionPanel({
  darkMode = false,
  draft,
  isExtracting = false,
  onAttachmentUpload,
  onExtract,
  onConfirmDraft,
}) {
  const theme = themeClasses(darkMode);
  const expiryMeta = getCertificateExpiryMeta(draft.expiryDate || "");
  const hasAttachments = Boolean(draft.attachments?.length);
  const hasExtractedDraft = Boolean(draft.extractedAt);
  const isConfirmed = Boolean(draft.extractionReviewed);

  return (
    <div className={`rounded-lg border p-3 ${darkMode ? "border-[#31443a] bg-[#18211d]" : "border-[#d8e7df] bg-[#f7fbf9]"}`}>
      <div className="mb-3 flex flex-col gap-2">
        <div className={`text-sm font-medium ${theme.textPrimary}`}>AI-Assisted Review Flow</div>
        <div className="flex flex-wrap gap-2">
          <WorkflowStep darkMode={darkMode} label="1. Upload" active={!hasAttachments} complete={hasAttachments} />
          <WorkflowStep darkMode={darkMode} label="2. Extract" active={hasAttachments && !hasExtractedDraft} complete={hasExtractedDraft} />
          <WorkflowStep darkMode={darkMode} label="3. Review" active={hasExtractedDraft && !isConfirmed} complete={isConfirmed} />
          <WorkflowStep darkMode={darkMode} label="4. Save" active={isConfirmed} complete={false} />
        </div>
        <div className={`text-xs ${theme.textSecondary}`}>Upload a source file, extract the draft, review and edit the fields, then confirm before saving.</div>
      </div>

      <div className={`mb-2 text-sm font-medium ${theme.textPrimary}`}>Source Files</div>
      <Input type="file" accept={CERTIFICATE_UPLOAD_ACCEPT} multiple onChange={(event) => onAttachmentUpload(event.target.files)} className={`h-12 ${theme.input}`} />
      <div className={`mt-2 text-xs ${theme.textSecondary}`}>Supported formats: PDF, JPG, PNG.</div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onExtract} disabled={!hasAttachments || isExtracting} className="vessel-outline-button rounded-lg px-3 py-2 text-sm">
          {isExtracting ? "Extracting..." : "Extract Data"}
        </Button>
        {hasExtractedDraft && !isConfirmed ? (
          <Button type="button" onClick={onConfirmDraft} className="button-vessel-primary rounded-lg px-3 py-2 text-sm text-white">
            Confirm Review Draft
          </Button>
        ) : null}
      </div>

      {hasAttachments ? (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {draft.attachments.map((attachment, index) => (
            <a key={`certificate-source-${index}`} href={attachment.dataUrl} download={attachment.name} className={filePreviewCardClass(darkMode)}>
              {String(attachment.type || "").startsWith("image/") ? (
                <img src={attachment.dataUrl} alt={attachment.name || `Certificate file ${index + 1}`} className="h-24 w-full rounded-md object-cover" />
              ) : (
                <div className={filePreviewPlaceholderClass(darkMode)}>{attachment.name || `File ${index + 1}`}</div>
              )}
            </a>
          ))}
        </div>
      ) : (
        <div className={`mt-3 text-sm ${theme.textSecondary}`}>Upload a PDF, JPG, or PNG certificate file to begin review.</div>
      )}

      {(draft.extractedAt || draft.needsManualReview || draft.confidenceScore || draft.expiryDate) ? (
        <div className={`mt-3 rounded-lg border p-3 ${darkMode ? "border-[#31443a] bg-[#111a16]" : "border-[#d8e7df] bg-white"}`}>
          <div className={`mb-2 text-sm font-medium ${theme.textPrimary}`}>Extraction Review</div>
          <div className="flex flex-wrap gap-2">
            {draft.extractionProvider ? <Badge className={neutralBadgeClass(darkMode)}>{draft.extractionProvider}</Badge> : null}
            <Badge className={infoBadgeClass(darkMode)}>Confidence {Math.round((draft.confidenceScore || 0) * 100)}%</Badge>
            <Badge className={draft.needsManualReview ? warningBadgeClass(darkMode) : successBadgeClass(darkMode)}>
              {draft.needsManualReview ? "Manual review" : "Ready to confirm"}
            </Badge>
            <Badge className={expiryMeta.status === "expired" ? (darkMode ? "bg-[#381d1f] text-[#ffd8dc]" : "bg-[#ffe0e0] text-[#8a1f2b]") : expiryMeta.status === "urgent" ? warningBadgeClass(darkMode) : expiryMeta.status === "expiring soon" ? infoBadgeClass(darkMode) : successBadgeClass(darkMode)}>
              {draft.expiryDate ? expiryMeta.statusLabel : "No expiry yet"}
            </Badge>
            {draft.expiryDate && expiryMeta.daysRemaining !== null ? <Badge className={darkMode ? "bg-[#2a2218] text-[#e7ccb0]" : "bg-[#f3e9de] text-[#7a5630]"}>{expiryMeta.daysRemaining} day(s)</Badge> : null}
          </div>
          {draft.reviewReasons?.length ? (
            <div className={`mt-2 space-y-1 text-sm ${darkMode ? "text-[#f5ddb0]" : "text-amber-900"}`}>
              {draft.reviewReasons.map((reason, index) => <div key={`certificate-review-${index}`}>{reason}</div>)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CertificateReviewFields({
  darkMode = false,
  draft,
  onChange,
}) {
  const theme = themeClasses(darkMode);
  const expiryMeta = getCertificateExpiryMeta(draft.expiryDate || "");

  return (
    <div className={`rounded-lg border p-3 ${darkMode ? "border-[#31443a] bg-[#18211d]" : "border-[#d8e7df] bg-[#f7fbf9]"}`}>
      <div className={`mb-3 text-sm font-medium ${theme.textPrimary}`}>Review Extracted Fields</div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input placeholder="Certificate name" value={draft.name || ""} onChange={(event) => onChange({ name: event.target.value })} className={`h-12 ${theme.input}`} />
        <Input placeholder="Holder name" value={draft.holderName || ""} onChange={(event) => onChange({ holderName: event.target.value })} className={`h-12 ${theme.input}`} />
        <Input placeholder="Certificate number" value={draft.certificateNumber || ""} onChange={(event) => onChange({ certificateNumber: event.target.value })} className={`h-12 ${theme.input}`} />
        <Input type="date" value={draft.issueDate || ""} onChange={(event) => onChange({ issueDate: event.target.value })} className={`h-12 ${theme.input}`} />
        <Input placeholder="Issuing authority" value={draft.issuingAuthority || ""} onChange={(event) => onChange({ issuingAuthority: event.target.value })} className={`h-12 ${theme.input}`} />
      </div>
      <div className={`mt-3 rounded-lg border p-3 ${draft.expiryDate ? "border-vessel bg-[var(--vessel-primary-soft)]" : darkMode ? "border-[#7a5416] bg-[#2b2318]" : "border-[#f0d79a] bg-[#fff6df]"}`}>
        <div className={`mb-2 text-sm font-medium ${theme.textPrimary}`}>Expiration Date</div>
        <Input type="date" value={draft.expiryDate || ""} onChange={(event) => onChange({ expiryDate: event.target.value })} className={`h-12 ${theme.input}`} />
        {!draft.expiryDate ? <div className={`mt-2 text-sm ${darkMode ? "text-[#f5ddb0]" : "text-amber-900"}`}>No expiration date found. Enter it manually before saving.</div> : <div className={`mt-2 text-sm ${theme.textSecondary}`}>{expiryMeta.statusLabel} - {expiryMeta.statusText}</div>}
      </div>
      <textarea value={draft.notes || ""} onChange={(event) => onChange({ notes: event.target.value })} placeholder="Certificate notes" className={`mt-3 min-h-24 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--vessel-ring)] ${theme.input}`} />
    </div>
  );
}
