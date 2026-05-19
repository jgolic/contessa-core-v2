import { useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import { Plus } from "../../components/icons.jsx";
import {
  CREW_DEPARTMENT_OPTIONS,
  CREW_RANK_OPTIONS,
  filePreviewCardClass,
  filePreviewPlaceholderClass,
  formatDaysRemaining,
  neutralBadgeClass,
  themeClasses,
} from "../../contessa_app_data.mjs";
import {
  CERTIFICATE_UPLOAD_ACCEPT,
  getCertificateStatusBadgeClass,
} from "../../contessa_certificate_extraction.mjs";
import { ROLE_OPTIONS } from "../../contessa_access.mjs";
import { CertificateExtractionPanel, CertificateReviewFields } from "../../components/certificate_extraction_panel.jsx";

/**
 * @typedef {import("../../lib/contessa-types").CrewProfileRecord} CrewProfileRecord
 * @typedef {import("../../lib/contessa-types").CertificateRecord} CertificateRecord
 */

function ConfirmableCrewProfileFields({
  profile,
  darkMode = false,
  canEdit = true,
  onConfirm,
}) {
  const theme = themeClasses(darkMode);
  const [draft, setDraft] = useState({
    fullName: profile.fullName || "",
    rank: profile.rank || CREW_RANK_OPTIONS[0],
    department: profile.department || CREW_DEPARTMENT_OPTIONS[0],
    nationality: profile.nationality || "",
    roleKey: profile.roleKey || "",
    notes: profile.notes || "",
  });
  const isDirty =
    draft.fullName !== (profile.fullName || "") ||
    draft.rank !== (profile.rank || CREW_RANK_OPTIONS[0]) ||
    draft.department !== (profile.department || CREW_DEPARTMENT_OPTIONS[0]) ||
    draft.nationality !== (profile.nationality || "") ||
    draft.roleKey !== (profile.roleKey || "") ||
    draft.notes !== (profile.notes || "");

  useEffect(() => {
    setDraft({
      fullName: profile.fullName || "",
      rank: profile.rank || CREW_RANK_OPTIONS[0],
      department: profile.department || CREW_DEPARTMENT_OPTIONS[0],
      nationality: profile.nationality || "",
      roleKey: profile.roleKey || "",
      notes: profile.notes || "",
    });
  }, [profile.id, profile.fullName, profile.rank, profile.department, profile.nationality, profile.roleKey, profile.notes]);

  return (
    <div className={`rounded-lg p-4 ${theme.subtle}`}>
      <div className="grid gap-3 md:grid-cols-2">
        <Input disabled={!canEdit} value={draft.fullName} onChange={(event) => setDraft((prev) => ({ ...prev, fullName: event.target.value }))} placeholder="Full name" className={`h-12 rounded-lg ${theme.input}`} />
        <Select value={draft.rank} onValueChange={(value) => canEdit && setDraft((prev) => ({ ...prev, rank: value }))}>
          <SelectTrigger className={`h-12 rounded-lg ${theme.input}`}><SelectValue /></SelectTrigger>
          <SelectContent>{CREW_RANK_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={draft.department} onValueChange={(value) => canEdit && setDraft((prev) => ({ ...prev, department: value }))}>
          <SelectTrigger className={`h-12 rounded-lg ${theme.input}`}><SelectValue /></SelectTrigger>
          <SelectContent>{CREW_DEPARTMENT_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
        </Select>
        <Input disabled={!canEdit} value={draft.nationality} onChange={(event) => setDraft((prev) => ({ ...prev, nationality: event.target.value }))} placeholder="Nationality" className={`h-12 rounded-lg ${theme.input}`} />
        <Select value={draft.roleKey || ROLE_OPTIONS[0]?.value || ""} onValueChange={(value) => canEdit && setDraft((prev) => ({ ...prev, roleKey: value }))}>
          <SelectTrigger className={`h-12 rounded-lg ${theme.input}`}><SelectValue /></SelectTrigger>
          <SelectContent>{ROLE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <textarea
        disabled={!canEdit}
        value={draft.notes}
        onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
        placeholder="Crew notes"
        className={`mt-3 min-h-24 w-full rounded-lg border px-3 py-2 outline-none ${theme.input}`}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className={`text-sm ${theme.textSecondary}`}>{isDirty ? "Changes pending confirmation." : "No unconfirmed changes."}</div>
        {canEdit ? <Button type="button" onClick={() => onConfirm(profile.id, draft)} disabled={!isDirty} className="button-vessel-primary rounded-lg px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50">
          Confirm
        </Button> : <Badge className={neutralBadgeClass(darkMode)}>View only</Badge>}
      </div>
    </div>
  );
}

function ConfirmableCertificateRow({
  certificate,
  darkMode = false,
  canEdit = true,
  onConfirm,
  onDelete,
  onAttachmentUpload,
  onRunExtraction,
}) {
  const theme = themeClasses(darkMode);
  const [isExtracting, setIsExtracting] = useState(false);
  const [draft, setDraft] = useState({
    name: certificate.name || "",
    holderName: certificate.holderName || "",
    certificateNumber: certificate.certificateNumber || "",
    issueDate: certificate.issueDate || "",
    issuingAuthority: certificate.issuingAuthority || "",
    expiryDate: certificate.expiryDate || "",
    notes: certificate.notes || "",
    confidenceScore: certificate.confidenceScore || 0,
    needsManualReview: Boolean(certificate.needsManualReview),
    reviewReasons: Array.isArray(certificate.reviewReasons) ? certificate.reviewReasons : [],
    extractionProvider: certificate.extractionProvider || "",
    rawExtractedText: certificate.rawExtractedText || "",
    extractedAt: certificate.extractedAt || "",
    extractionReviewed: certificate.extractionReviewed !== false,
  });
  const isDirty =
    draft.name !== (certificate.name || "") ||
    draft.holderName !== (certificate.holderName || "") ||
    draft.certificateNumber !== (certificate.certificateNumber || "") ||
    draft.issueDate !== (certificate.issueDate || "") ||
    draft.issuingAuthority !== (certificate.issuingAuthority || "") ||
    draft.expiryDate !== (certificate.expiryDate || "") ||
    draft.notes !== (certificate.notes || "") ||
    draft.confidenceScore !== (certificate.confidenceScore || 0) ||
    draft.needsManualReview !== Boolean(certificate.needsManualReview) ||
    JSON.stringify(draft.reviewReasons) !== JSON.stringify(certificate.reviewReasons || []) ||
    draft.extractionProvider !== (certificate.extractionProvider || "") ||
    draft.rawExtractedText !== (certificate.rawExtractedText || "") ||
    draft.extractedAt !== (certificate.extractedAt || "") ||
    draft.extractionReviewed !== (certificate.extractionReviewed !== false);

  useEffect(() => {
    setDraft({
      name: certificate.name || "",
      holderName: certificate.holderName || "",
      certificateNumber: certificate.certificateNumber || "",
      issueDate: certificate.issueDate || "",
      issuingAuthority: certificate.issuingAuthority || "",
      expiryDate: certificate.expiryDate || "",
      notes: certificate.notes || "",
      confidenceScore: certificate.confidenceScore || 0,
      needsManualReview: Boolean(certificate.needsManualReview),
      reviewReasons: Array.isArray(certificate.reviewReasons) ? certificate.reviewReasons : [],
      extractionProvider: certificate.extractionProvider || "",
      rawExtractedText: certificate.rawExtractedText || "",
      extractedAt: certificate.extractedAt || "",
      extractionReviewed: certificate.extractionReviewed !== false,
    });
  }, [certificate.id, certificate.name, certificate.holderName, certificate.certificateNumber, certificate.issueDate, certificate.issuingAuthority, certificate.expiryDate, certificate.notes, certificate.confidenceScore, certificate.needsManualReview, certificate.reviewReasons, certificate.extractionProvider, certificate.rawExtractedText, certificate.extractedAt, certificate.extractionReviewed]);

  const handleExtraction = async () => {
    if (!canEdit) return;
    setIsExtracting(true);
    try {
      const extractedDraft = await onRunExtraction(certificate.id);
      if (!extractedDraft) return;
      setDraft((prev) => ({
        ...prev,
        ...extractedDraft,
        extractionReviewed: false,
      }));
    } finally {
      setIsExtracting(false);
    }
  };

  const confirmDraft = () => {
    onConfirm(certificate.id, {
      ...draft,
      extractionReviewed: draft.extractedAt ? true : draft.extractionReviewed,
    });
  };

  return (
    <div className={`rounded-lg border p-4 ${darkMode ? "border-[#31443a] bg-[#111a16]" : "border-[#d8e7df] bg-white"}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge className={getCertificateStatusBadgeClass(certificate.status)}>{certificate.statusLabel || "Certificate"}</Badge>
          <Badge className="vessel-pill">
            {formatDaysRemaining(certificate.daysUntilExpiration)}
          </Badge>
          {certificate.needsManualReview ? <Badge className="bg-[#fff3c4] text-[#7a5416]">Manual review</Badge> : null}
        </div>
        {canEdit ? <button type="button" onClick={() => onDelete(certificate.id)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0ed] text-sm font-semibold text-[#9b2c20] hover:bg-[#ffe0da]" aria-label="Remove certificate">x</button> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input disabled={!canEdit} value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="Certificate" className={`h-12 rounded-lg ${theme.input}`} />
        <Input disabled={!canEdit} value={draft.holderName} onChange={(event) => setDraft((prev) => ({ ...prev, holderName: event.target.value }))} placeholder="Holder name" className={`h-12 rounded-lg ${theme.input}`} />
        <Input disabled={!canEdit} value={draft.certificateNumber} onChange={(event) => setDraft((prev) => ({ ...prev, certificateNumber: event.target.value }))} placeholder="Number" className={`h-12 rounded-lg ${theme.input}`} />
        <Input disabled={!canEdit} type="date" value={draft.issueDate} onChange={(event) => setDraft((prev) => ({ ...prev, issueDate: event.target.value }))} className={`h-12 rounded-lg ${theme.input}`} />
        <Input disabled={!canEdit} value={draft.issuingAuthority} onChange={(event) => setDraft((prev) => ({ ...prev, issuingAuthority: event.target.value }))} placeholder="Issuing authority" className={`h-12 rounded-lg ${theme.input}`} />
        <Input disabled={!canEdit} type="date" value={draft.expiryDate} onChange={(event) => setDraft((prev) => ({ ...prev, expiryDate: event.target.value }))} className={`h-12 rounded-lg ${theme.input}`} />
      </div>
      <textarea disabled={!canEdit} value={draft.notes} onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Certificate notes" className={`mt-3 min-h-20 w-full rounded-lg border px-3 py-2 outline-none ${theme.input}`} />
      <div className={`mt-3 rounded-lg p-3 ${theme.subtle}`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className={`text-sm font-medium ${theme.textPrimary}`}>Certificate Source Files</div>
          {canEdit ? <Button type="button" variant="outline" onClick={handleExtraction} disabled={isExtracting} className={`rounded-lg px-3 py-2 text-sm ${darkMode ? "border-[#31443a] bg-[#18211d] text-[#f4fbf6] hover:bg-[#22312a]" : "border-[#c9ded3] bg-white text-[#40534a] hover:bg-[#f3faf6]"}`}>
            {isExtracting ? "Extracting..." : "Extract Again"}
          </Button> : null}
        </div>
        {canEdit ? <Input type="file" accept={CERTIFICATE_UPLOAD_ACCEPT} multiple onChange={(event) => onAttachmentUpload(certificate.id, event.target.files)} className={`rounded-lg h-12 ${theme.input}`} /> : null}
        {certificate.attachments?.length ? (
          <div className="mt-3 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-4">
            {certificate.attachments.map((attachment, index) => (
              <a key={`${certificate.id}-attachment-${index}`} href={attachment.dataUrl} download={attachment.name} className={filePreviewCardClass(darkMode)}>
                {String(attachment.type || "").startsWith("image/") ? (
                  <img src={attachment.dataUrl} alt={attachment.name || `Certificate file ${index + 1}`} className="h-24 w-full rounded-md object-cover" />
                ) : (
                  <div className={filePreviewPlaceholderClass(darkMode)}>{attachment.name || `File ${index + 1}`}</div>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className={`mt-2 text-sm ${theme.textSecondary}`}>No certificate files uploaded.</div>
        )}
      </div>
      {(draft.confidenceScore || draft.needsManualReview || draft.extractionProvider || draft.extractedAt) ? (
        <div className={`mt-3 rounded-lg border p-3 ${darkMode ? "border-[#31443a] bg-[#18211d]" : "border-[#d8e7df] bg-[#f7fbf9]"}`}>
          <div className="flex flex-wrap gap-2">
            <Badge className="vessel-pill">Confidence {Math.round((draft.confidenceScore || 0) * 100)}%</Badge>
            {draft.extractionProvider ? <Badge className={neutralBadgeClass(darkMode)}>{draft.extractionProvider}</Badge> : null}
            {draft.extractedAt ? <Badge className="bg-[#f3e9de] text-[#7a5630]">Parsed {draft.extractedAt.slice(0, 10)}</Badge> : null}
            {draft.extractedAt ? <Badge className={draft.extractionReviewed ? "bg-[#dff5ea] text-[#176342]" : "bg-[#fff3c4] text-[#7a5416]"}>{draft.extractionReviewed ? "Reviewed" : "Review required"}</Badge> : null}
          </div>
          {draft.reviewReasons?.length ? (
            <div className="mt-2 space-y-1 text-sm text-amber-900">
              {draft.reviewReasons.map((reason, index) => <div key={`${certificate.id}-review-${index}`}>{reason}</div>)}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className={`text-sm ${theme.textSecondary}`}>
          {draft.extractedAt && !draft.extractionReviewed
            ? "Review extracted fields, then confirm to save them."
            : isDirty
              ? "Changes pending confirmation."
              : "No unconfirmed changes."}
        </div>
        {canEdit ? <Button type="button" onClick={confirmDraft} disabled={!isDirty && !(draft.extractedAt && !draft.extractionReviewed)} className="button-vessel-primary rounded-lg px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50">Confirm</Button> : <Badge className={neutralBadgeClass(darkMode)}>View only</Badge>}
      </div>
    </div>
  );
}

function CrewListToolsDialog({
  open,
  onOpenChange,
  href = "",
  darkMode = false,
  crewCount = 0,
}) {
  const theme = themeClasses(darkMode);
  const previewHref = href || "#";
  const lastUpdated = new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const openLink = (targetHref) => {
    if (!targetHref || targetHref === "#") return;
    window.open(targetHref, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-[28px] border p-4 shadow-2xl sm:p-5 md:rounded-[30px] ${darkMode ? "border-white/10 bg-slate-950/95 text-slate-100" : "border-slate-200/80 bg-white text-slate-950"}`}>
        <DialogHeader>
          <DialogTitle>Crew List</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className={`flex min-w-0 flex-col gap-4 rounded-3xl border p-4 min-[420px]:flex-row min-[420px]:items-center ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200/80 bg-slate-50/80"}`}>
            <div className={`flex h-28 w-20 shrink-0 flex-col items-center justify-start rounded-xl border px-2 py-3 shadow-sm ${darkMode ? "border-cyan-300/20 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-cyan-200">Crew</div>
              <div className="mt-2 h-px w-full bg-slate-300/70 dark:bg-white/20" />
              <div className="mt-3 grid w-full gap-1.5">
                <span className="h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="app-kicker">Printable Document</div>
              <p className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>
                Official printable crew list for the current vessel.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs min-[360px]:grid-cols-2">
                <div className={`rounded-2xl border px-3 py-2 ${darkMode ? "border-white/10 bg-white/[0.035]" : "border-slate-200/80 bg-white/80"}`}>
                  <div className="font-semibold text-slate-500 dark:text-slate-400">Crew</div>
                  <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{crewCount}</div>
                </div>
                <div className={`rounded-2xl border px-3 py-2 ${darkMode ? "border-white/10 bg-white/[0.035]" : "border-slate-200/80 bg-white/80"}`}>
                  <div className="font-semibold text-slate-500 dark:text-slate-400">Updated</div>
                  <div className="mt-1 truncate font-semibold text-slate-900 dark:text-slate-100">{lastUpdated}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-1 flex justify-center">
            <Button
              type="button"
              variant="outline"
              className={`mx-auto inline-flex min-h-11 w-full max-w-[240px] min-w-[180px] items-center justify-center rounded-2xl border px-5 py-2.5 text-center text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/30 ${darkMode ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:border-cyan-300/50 hover:bg-cyan-300/20" : "border-blue-300/70 bg-blue-50/70 text-blue-800 hover:border-blue-400 hover:bg-blue-100 hover:shadow-md"}`}
              onClick={() => openLink(previewHref)}
              disabled={!href}
            >
              Preview
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            className={`mt-3 min-h-11 w-full rounded-2xl px-4 py-3 text-sm font-semibold ${darkMode ? "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CrewView({
  darkMode = false,
  canEdit = true,
  canViewCrew = false,
  visibleCrewProfiles,
  selectedCrewProfile,
  onSelectCrewProfile,
  newCrewProfileOpen,
  onNewCrewProfileOpenChange,
  newCrewProfile,
  onNewCrewProfileChange,
  onAddCrewProfile,
  onUpdateCrewProfile,
  newCertificateOpen,
  onNewCertificateOpenChange,
  newCertificate,
  onNewCertificateChange,
  onAddCertificate,
  onExtractNewCertificate,
  isExtractingCertificate,
  onConfirmNewCertificateDraft,
  onNewCertificateAttachmentUpload,
  onUpdateCertificate,
  onCertificateAttachmentUpload,
  onReextractCertificate,
  onDeleteCertificate,
  crewListPrintHref = "",
}) {
  const theme = themeClasses(darkMode);
  const [crewListOpen, setCrewListOpen] = useState(false);
  const primaryButtonClass = "inline-flex min-h-11 items-center justify-center rounded-2xl border border-blue-300/70 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-100 dark:hover:bg-cyan-300/20";
  const secondaryButtonClass = "inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:border-cyan-300/40 dark:hover:bg-cyan-300/15";

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const openCrewList = () => setCrewListOpen(true);
    window.addEventListener("contessa:open-crew-list", openCrewList);
    return () => window.removeEventListener("contessa:open-crew-list", openCrewList);
  }, []);

  if (!canViewCrew) {
    return (
      <Card className={`rounded-[26px] md:rounded-[24px] ${theme.card}`}>
        <CardContent className="p-5">
          <div className="rounded-[22px] border border-amber-300 bg-amber-50 p-4 text-amber-900 md:rounded-xl">
            Crew profiles are limited for the current role. Switch to Captain, Manager, or Owner to manage full crew records.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid min-w-0 gap-5 md:gap-6 xl:grid-cols-[minmax(380px,420px)_minmax(0,1fr)]">
      <CrewListToolsDialog
        open={crewListOpen}
        onOpenChange={setCrewListOpen}
        href={crewListPrintHref}
        darkMode={darkMode}
        crewCount={visibleCrewProfiles.length}
      />
      <Card className={`rounded-[26px] md:rounded-[24px] ${theme.card}`}>
        <CardContent className="p-5 sm:p-6">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="min-w-0 max-w-full">
              <div className="app-kicker">Crew</div>
              <h2 className={`mt-2 text-xl font-semibold tracking-tight ${darkMode ? "text-slate-50" : "text-slate-950"}`}>Crew onboard</h2>
              <p className={`mt-1 max-w-full text-sm leading-6 sm:max-w-[48ch] ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                Manage onboard crew, certificates, and printable crew list.
              </p>
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              {canEdit ? <Dialog open={newCrewProfileOpen} onOpenChange={onNewCrewProfileOpenChange}>
                <DialogTrigger asChild>
                  <Button className={`${primaryButtonClass} w-full sm:w-auto`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Crew
                  </Button>
                </DialogTrigger>
                <DialogContent className={`rounded-lg ${darkMode ? "bg-[#111a16] text-[#f4fbf6] border-[#2a3a32]" : "bg-white"}`}>
                  <DialogHeader><DialogTitle>Add Crew Profile</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Full name" value={newCrewProfile.fullName} onChange={(event) => onNewCrewProfileChange({ fullName: event.target.value })} className={`h-12 ${theme.input}`} />
                    <Select value={newCrewProfile.rank} onValueChange={(value) => onNewCrewProfileChange({ rank: value })}>
                      <SelectTrigger className={`h-12 ${theme.input}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{CREW_RANK_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={newCrewProfile.department} onValueChange={(value) => onNewCrewProfileChange({ department: value })}>
                      <SelectTrigger className={`h-12 ${theme.input}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{CREW_DEPARTMENT_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Nationality" value={newCrewProfile.nationality} onChange={(event) => onNewCrewProfileChange({ nationality: event.target.value })} className={`h-12 ${theme.input}`} />
                    <Select value={newCrewProfile.roleKey} onValueChange={(value) => onNewCrewProfileChange({ roleKey: value })}>
                      <SelectTrigger className={`h-12 ${theme.input}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{ROLE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <textarea value={newCrewProfile.notes} onChange={(event) => onNewCrewProfileChange({ notes: event.target.value })} placeholder="Crew notes" className={`min-h-24 w-full rounded-lg border px-3 py-2 outline-none ${theme.input}`} />
                    <Button onClick={onAddCrewProfile} className="button-vessel-primary w-full rounded-lg px-4 py-6 text-white">Save Crew Profile</Button>
                  </div>
                </DialogContent>
              </Dialog> : null}
              {crewListPrintHref ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCrewListOpen(true)}
                  className={`${secondaryButtonClass} w-full sm:w-auto`}
                >
                  Crew List
                </Button>
              ) : null}
            </div>
          </div>
          {!canEdit ? <div className={`mt-4 text-sm ${theme.textSecondary}`}>Crew editing is locked until admin mode is unlocked.</div> : null}
          <div className="mt-5 space-y-3">
            {visibleCrewProfiles.length === 0 ? (
              <div className={`rounded-[22px] border border-dashed p-6 text-center text-sm leading-6 md:rounded-xl ${theme.textSecondary} ${darkMode ? "border-[#294038] bg-[#0d1513]/88" : "border-[#d5e1da] bg-[#f7faf8]"}`}>No visible crew profiles yet.</div>
            ) : (
              visibleCrewProfiles.map((profile) => {
                const crewName = profile.fullName || profile.name || "Unnamed crew";
                const position = profile.position || profile.title || profile.rank || profile.role || "Crew";
                const department = profile.department || "General";
                const certificateCount = profile.certificates?.length || 0;

                return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => onSelectCrewProfile(profile.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 md:rounded-2xl ${selectedCrewProfile?.id === profile.id ? (darkMode ? "border-cyan-300/40 bg-cyan-300/10" : "border-blue-300 bg-blue-50/70") : darkMode ? "border-white/10 bg-white/[0.04] hover:border-cyan-300/40 hover:bg-cyan-300/10" : "border-slate-200/80 bg-white hover:border-blue-300 hover:bg-blue-50/40"}`}
                >
                  <div className="flex min-w-0 flex-col gap-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                    <div className="min-w-0">
                      <p className={`truncate text-base font-semibold ${darkMode ? "text-slate-50" : "text-slate-950"}`}>{crewName}</p>
                      <p className={`mt-1 truncate text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{position} &middot; {department}</p>
                      <p className={`mt-2 text-xs font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{certificateCount} certificate{certificateCount === 1 ? "" : "s"}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-100">
                      Open
                    </span>
                  </div>
                </button>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card className={`rounded-[26px] md:rounded-[24px] ${theme.card}`}>
        <CardContent className="p-5 md:p-6">
          {selectedCrewProfile ? (
            <div>
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="app-kicker">Crew Profile</div>
                  <h2 className={`mt-2 text-2xl font-semibold ${theme.textPrimary}`}>{selectedCrewProfile.fullName}</h2>
                  <p className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>{selectedCrewProfile.rank} - {selectedCrewProfile.department} - {selectedCrewProfile.nationality || "Nationality not set"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={neutralBadgeClass(darkMode)}>{selectedCrewProfile.roleKey ? ROLE_OPTIONS.find((option) => option.value === selectedCrewProfile.roleKey)?.label || selectedCrewProfile.roleKey : "Role not set"}</Badge>
                    <Badge className="vessel-pill">{selectedCrewProfile.certificates?.length || 0} certificates</Badge>
                  </div>
                </div>
                <div className={`rounded-[22px] border p-4 text-sm md:rounded-xl ${darkMode ? "border-[#284038] bg-[#0f1715]/92" : "border-white/80 bg-white/84"}`}>
                  <div className="app-kicker">QR Placeholder</div>
                  <div className={`mt-2 leading-6 ${theme.textSecondary}`}>{selectedCrewProfile.qrPlaceholder}</div>
                </div>
              </div>

              <ConfirmableCrewProfileFields profile={selectedCrewProfile} darkMode={darkMode} canEdit={canEdit} onConfirm={onUpdateCrewProfile} />

              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="app-kicker">Certificates</div>
                  <h3 className={`mt-2 text-lg font-semibold ${theme.textPrimary}`}>Profile compliance</h3>
                  <p className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>Track expiry dates and keep the profile ready for future QR and CV access.</p>
                </div>
                {canEdit ? <Dialog open={newCertificateOpen} onOpenChange={onNewCertificateOpenChange}>
                  <DialogTrigger asChild>
                    <Button className="button-vessel-primary rounded-2xl px-4 py-5 text-white md:rounded-xl">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Certificate
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`rounded-lg ${darkMode ? "bg-[#111a16] text-[#f4fbf6] border-[#2a3a32]" : "bg-white"}`}>
                    <DialogHeader><DialogTitle>Add Certificate</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <CertificateExtractionPanel
                        darkMode={darkMode}
                        draft={newCertificate}
                        isExtracting={isExtractingCertificate}
                        onAttachmentUpload={onNewCertificateAttachmentUpload}
                        onExtract={onExtractNewCertificate}
                        onConfirmDraft={onConfirmNewCertificateDraft}
                      />
                      <CertificateReviewFields
                        darkMode={darkMode}
                        draft={newCertificate}
                        onChange={onNewCertificateChange}
                      />
                      <Button onClick={() => onAddCertificate(selectedCrewProfile.id)} className="button-vessel-primary w-full rounded-lg px-4 py-6 text-white">Save Certificate</Button>
                    </div>
                  </DialogContent>
                </Dialog> : <Badge className={neutralBadgeClass(darkMode)}>View-only access</Badge>}
              </div>

              <div className="space-y-3">
                {selectedCrewProfile.certificates?.length ? selectedCrewProfile.certificates.map((certificate) => (
                  <ConfirmableCertificateRow
                    key={certificate.id}
                    certificate={certificate}
                    darkMode={darkMode}
                    canEdit={canEdit}
                    onConfirm={(certificateId, patch) => onUpdateCertificate(selectedCrewProfile.id, certificateId, patch)}
                    onDelete={(certificateId) => onDeleteCertificate(selectedCrewProfile.id, certificateId)}
                    onAttachmentUpload={(certificateId, files) => onCertificateAttachmentUpload(selectedCrewProfile.id, certificateId, files)}
                    onRunExtraction={(certificateId) => onReextractCertificate(selectedCrewProfile.id, certificateId)}
                  />
                )) : (
                  <div className={`rounded-[22px] border border-dashed p-6 text-center text-sm leading-6 md:rounded-xl ${theme.textSecondary} ${darkMode ? "border-[#294038] bg-[#0d1513]/88" : "border-[#d5e1da] bg-[#f7faf8]"}`}>No certificates recorded yet.</div>
                )}
              </div>
            </div>
          ) : (
            <div className={`rounded-[22px] border border-dashed p-8 text-center text-sm leading-6 md:rounded-xl ${theme.textSecondary} ${darkMode ? "border-[#294038] bg-[#0d1513]/88" : "border-[#d5e1da] bg-[#f7faf8]"}`}>Select a crew profile.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
