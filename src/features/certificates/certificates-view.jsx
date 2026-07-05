import { Card, CardContent } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
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
import { CERTIFICATE_ALERT_WINDOWS, formatDaysRemaining, infoBadgeClass, neutralBadgeClass, themeClasses } from "../../contessa_app_data.mjs";
import { getCertificateStatusBadgeClass } from "../../contessa_certificate_extraction.mjs";
import { CertificateExtractionPanel, CertificateReviewFields } from "../../components/certificate_extraction_panel.jsx";

export function CertificatesView({
  darkMode = false,
  canEdit = true,
  canViewCertificates = false,
  certificateAlerts,
  visibleCertificates,
  visibleCrewProfiles = [],
  newCertificateOpen,
  onNewCertificateOpenChange,
  newCertificate,
  onNewCertificateChange,
  newCertificateCrewId,
  onNewCertificateCrewIdChange,
  onExtractNewCertificate,
  isExtractingCertificate = false,
  onConfirmNewCertificateDraft,
  onNewCertificateAttachmentUpload,
  onAddCertificate,
  onOpenCrewProfile,
}) {
  const theme = themeClasses(darkMode);
  const withinWindowCount = (windowDays) => certificateAlerts.filter((item) => item.daysRemaining !== null && item.daysRemaining <= windowDays).length;

  if (!canViewCertificates) {
    return (
      <Card className={`rounded-[26px] md:rounded-[24px] ${theme.card}`}>
        <CardContent className="p-5">
          <div className={`rounded-[22px] border p-4 md:rounded-xl ${darkMode ? "border-[#5e4920] bg-[#2d2414] text-[#f5ddb0]" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
            Certificates are limited for the current role. Switch to Captain, Manager, or Owner to review vessel-wide certificate compliance.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 md:gap-6">
      <Card className={`overflow-hidden rounded-[30px] md:rounded-[32px] ${theme.card}`}>
        <CardContent className="p-0">
          <div className={`${darkMode ? "bg-[radial-gradient(circle_at_top_left,_rgba(118,214,180,0.18),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(198,163,91,0.1),_transparent_24%),linear-gradient(135deg,_rgba(16,25,23,0.98),_rgba(8,14,12,0.98))]" : "bg-[radial-gradient(circle_at_top_left,_rgba(16,124,108,0.12),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(198,163,91,0.14),_transparent_20%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(239,245,241,0.98))]"} p-5 md:p-7`}>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-end">
              <div className="max-w-2xl">
                <div className="app-kicker">Certificates</div>
                <h2 className={`mt-3 text-3xl font-semibold tracking-tight md:text-4xl ${theme.textPrimary}`}>Compliance readiness without the paperwork fog.</h2>
                <p className={`mt-3 max-w-xl text-sm leading-6 md:text-base ${theme.textSecondary}`}>Track expiry dates, upload certificate files, and keep crew records ready for fast review.</p>
              </div>
              <div className={`rounded-[24px] border p-4 md:rounded-[22px] ${darkMode ? "border-[#294038] bg-[#0d1513]/84" : "border-white/80 bg-white/86"}`}>
                <div className="app-kicker">Alert Pressure</div>
                <div className="mt-4 grid grid-cols-1 gap-3 min-[380px]:grid-cols-3">
                  {CERTIFICATE_ALERT_WINDOWS.map((windowDays) => (
                    <div key={windowDays} className="min-w-0">
                      <div className={`app-compact-label ${theme.textSecondary}`}>{windowDays} Days</div>
                      <div className={`mt-2 text-2xl font-semibold ${theme.textPrimary}`}>{withinWindowCount(windowDays)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
          {CERTIFICATE_ALERT_WINDOWS.map((windowDays) => (
            <Card key={windowDays} className={`rounded-[24px] md:rounded-[22px] ${theme.card}`}>
              <CardContent className="p-4">
                <div className="app-kicker">Expiring in {windowDays} days</div>
                <div className={`mt-3 text-2xl font-semibold ${theme.textPrimary}`}>{withinWindowCount(windowDays)}</div>
              </CardContent>
            </Card>
          ))}
      </div>

      {certificateAlerts.length > 0 ? (
        <div className="space-y-3">
          {certificateAlerts.map((item) => (
            <div key={`alert-${item.id}`} className="rounded-[22px] border border-amber-300 bg-amber-50 p-4 text-amber-900 md:rounded-xl">
              <div className="font-semibold">{item.name} for {item.crewName}</div>
              <div className="mt-1 text-sm leading-6">{item.department} - expires {item.expiryDate} - {formatDaysRemaining(item.daysRemaining)}</div>
            </div>
          ))}
        </div>
      ) : null}

      <Card className={`rounded-[26px] md:rounded-[24px] ${theme.card}`}>
        <CardContent className="p-5 md:p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="app-kicker">Register</div>
              <h2 className={`mt-2 text-2xl font-semibold ${theme.textPrimary}`}>Vessel-wide certificate register</h2>
              <p className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>A structured view of crew certificates, expiry dates, and future-ready upload review.</p>
            </div>
            {canEdit ? (
              <Dialog open={newCertificateOpen} onOpenChange={onNewCertificateOpenChange}>
                <DialogTrigger asChild>
                  <Button className="button-vessel-primary w-full rounded-2xl px-4 py-5 text-white sm:w-auto md:rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Certificate
                  </Button>
                </DialogTrigger>
                <DialogContent className={`rounded-lg ${darkMode ? "border-[#2a3a32] bg-[#111a16] text-[#f4fbf6]" : "bg-white"}`}>
                  <DialogHeader><DialogTitle>Upload Certificate</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Select value={newCertificateCrewId || ""} onValueChange={onNewCertificateCrewIdChange}>
                      <SelectTrigger className={`h-12 rounded-lg ${theme.input}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {visibleCrewProfiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>{profile.fullName} - {profile.rank}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Button onClick={() => onAddCertificate(newCertificateCrewId)} disabled={!newCertificateCrewId} className="button-vessel-primary w-full rounded-lg px-4 py-6 text-white disabled:cursor-not-allowed disabled:opacity-70">
                      Save Certificate
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Badge className={neutralBadgeClass(darkMode)}>View-only access</Badge>
            )}
          </div>
          <div className="space-y-3">
            {visibleCertificates.length === 0 ? (
              <div className={`rounded-[22px] border border-dashed p-6 text-center text-sm leading-6 md:rounded-xl ${theme.textSecondary} ${darkMode ? "border-[#294038] bg-[#0d1513]/88" : "border-[#d5e1da] bg-[#f7faf8]"}`}>No visible certificates yet.</div>
            ) : (
              visibleCertificates.map((certificate) => (
                <div id={`item-${certificate.crewId}`} data-jump-target style={{ "--jump-radius": "22px" }} key={`${certificate.crewId}-${certificate.id}`} className={`jump-highlight-target app-card-hover rounded-[22px] border p-4 md:rounded-xl ${darkMode ? "border-[#233630] bg-[#111a17]/88" : "border-white/80 bg-white/88"}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className={`font-semibold ${theme.textPrimary}`}>{certificate.name}</div>
                      <div className={`text-sm ${theme.textSecondary}`}>{certificate.crewName} - {certificate.crewRank} - {certificate.department}</div>
                      <div className={`text-sm ${theme.textSecondary}`}>{certificate.issuingAuthority || "Authority not set"} - Expires {certificate.expiryDate || "not set"}</div>
                      <div className={`mt-1 text-sm ${theme.textSecondary}`}>{certificate.holderName || "Holder not set"} - {certificate.certificateNumber || "Number not set"}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getCertificateStatusBadgeClass(certificate.status)}>{certificate.statusLabel || "Certificate"}</Badge>
                      <Badge className="vessel-pill">
                        {formatDaysRemaining(certificate.daysUntilExpiration)}
                      </Badge>
                      <Badge className={infoBadgeClass(darkMode)}>Confidence {Math.round((certificate.confidenceScore || 0) * 100)}%</Badge>
                      {certificate.needsManualReview ? <Badge className="bg-[#fff3c4] text-[#7a5416]">Manual review</Badge> : null}
                      <Button type="button" variant="outline" onClick={() => onOpenCrewProfile(certificate.crewId)} className={`rounded-2xl px-3 py-2 text-sm md:rounded-xl ${darkMode ? "border-[#284038] bg-[#0f1715]/92 text-[#dce9e1] hover:bg-[#16211d]" : "border-white/70 bg-white/84 text-[#365248] hover:bg-[#f7fbf9]"}`}>
                        Open Crew
                      </Button>
                    </div>
                  </div>
                  <div className={`mt-2 text-sm leading-6 ${theme.textSecondary}`}>{certificate.statusText || "Review certificate details before use."}</div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
