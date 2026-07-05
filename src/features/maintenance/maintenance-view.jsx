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
  MAINTENANCE_AREA_OPTIONS,
  MAINTENANCE_FREQUENCIES,
  clampMaintenanceDueDate,
  daysUntil,
  getScheduledNextDue,
  neutralBadgeClass,
  successBadgeClass,
  themeClasses,
  warningBadgeClass,
} from "../../contessa_app_data.mjs";

function ConfirmableMaintenanceItemRow({
  item,
  darkMode = false,
  canEdit = true,
  onConfirm,
  onCompleteMaintenanceItem,
  onRemoveMaintenanceLog,
  onRestoreMaintenanceLog,
}) {
  const theme = themeClasses(darkMode);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: item.title || "",
    area: item.area || "",
    frequencyMonths: item.frequencyMonths || 1,
    nextDueDate: item.nextDueDate || "",
    notes: item.notes || "",
    alertEnabled: Boolean(item.alertEnabled),
  });
  const remaining = daysUntil(item.nextDueDate);
  const statusText = remaining === null ? "No due date" : remaining < 0 ? `${Math.abs(remaining)} days overdue` : remaining === 0 ? "Due today" : remaining === 1 ? "Due tomorrow" : `Due in ${remaining} days`;
  const statusClass = remaining !== null && remaining <= 1 ? (darkMode ? "bg-[#2d2414] text-[#f5ddb0]" : "bg-amber-100 text-amber-800") : "vessel-pill";
  const extensionText = item.extensionUsed ? "Extension used for this cycle" : "One extension available";
  const isDirty =
    draft.title !== (item.title || "") ||
    draft.area !== (item.area || "") ||
    String(draft.frequencyMonths) !== String(item.frequencyMonths || 1) ||
    draft.nextDueDate !== (item.nextDueDate || "") ||
    draft.notes !== (item.notes || "") ||
    draft.alertEnabled !== Boolean(item.alertEnabled);

  useEffect(() => {
    setIsEditing(false);
    setDraft({
      title: item.title || "",
      area: item.area || "",
      frequencyMonths: item.frequencyMonths || 1,
      nextDueDate: item.nextDueDate || "",
      notes: item.notes || "",
      alertEnabled: Boolean(item.alertEnabled),
    });
  }, [item.id, item.title, item.area, item.frequencyMonths, item.nextDueDate, item.notes, item.alertEnabled]);

  const resetDraft = () => {
    setDraft({
      title: item.title || "",
      area: item.area || "",
      frequencyMonths: item.frequencyMonths || 1,
      nextDueDate: item.nextDueDate || "",
      notes: item.notes || "",
      alertEnabled: Boolean(item.alertEnabled),
    });
  };

  return (
    <div id={`item-${item.id}`} data-jump-target style={{ "--jump-radius": "16px" }} className={`jump-highlight-target rounded-lg border p-4 ${darkMode ? "border-[#2a3a32] bg-[#18211d]/80" : "border-[#d8e7df] bg-white"}`}>
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className={`text-sm ${theme.textSecondary}`}>{item.id}</div>
          <div className={`text-lg font-semibold ${theme.textPrimary}`}>{item.title}</div>
          <div className={`text-sm ${theme.textSecondary}`}>{item.area}</div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge className={statusClass}>{statusText}</Badge>
          {canEdit && !isEditing ? (
            <Button type="button" variant="outline" onClick={() => setIsEditing(true)} className="vessel-outline-button rounded-xl px-4 py-2">
              Edit
            </Button>
          ) : null}
        </div>
      </div>
      <div className={`mb-3 text-sm ${theme.textSecondary}`}>{extensionText}</div>
      {isEditing ? (
        <>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="app-kicker mb-1">Editing Maintenance</div>
              <div className={`text-sm ${theme.textSecondary}`}>Update the reminder, then confirm to save.</div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetDraft();
                setIsEditing(false);
              }}
              className="app-action-button rounded-xl px-4 py-2"
            >
              Cancel
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Input disabled={!canEdit} value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} className={`rounded-lg h-12 ${theme.input}`} />
            <Input disabled={!canEdit} value={draft.area} onChange={(event) => setDraft((prev) => ({ ...prev, area: event.target.value }))} className={`rounded-lg h-12 ${theme.input}`} />
            <Select value={String(draft.frequencyMonths)} onValueChange={(value) => canEdit && setDraft((prev) => ({ ...prev, frequencyMonths: Number(value) }))}>
              <SelectTrigger className={`rounded-lg h-12 ${theme.input}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_FREQUENCIES.map((option) => (
                  <SelectItem key={option.months} value={String(option.months)}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              disabled={!canEdit}
              type="date"
              value={draft.nextDueDate}
              max={getScheduledNextDue(item)}
              onChange={(event) => setDraft((prev) => ({ ...prev, nextDueDate: clampMaintenanceDueDate(item, event.target.value) }))}
              className={`rounded-lg h-12 ${theme.input}`}
            />
          </div>
          <textarea
            disabled={!canEdit}
            value={draft.notes}
            onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Notes"
            className={`mt-3 min-h-20 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--vessel-ring)] ${theme.input}`}
          />
          <div className="mt-3 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center">
            {canEdit ? (
              <Button
                type="button"
                onClick={() => {
                  onConfirm(item.id, draft);
                  setIsEditing(false);
                }}
                disabled={!isDirty}
                className="button-vessel-primary min-h-11 w-full rounded-lg px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-70 min-[420px]:w-auto"
              >
                Confirm
              </Button>
            ) : null}
            {canEdit ? <Button onClick={() => onCompleteMaintenanceItem(item.id)} className="button-vessel-primary min-h-11 w-full rounded-lg px-4 py-3 text-white min-[420px]:w-auto">
              Done - Set Next Date
            </Button> : null}
            {canEdit ? <Button
              variant="outline"
              onClick={() => setDraft((prev) => ({ ...prev, alertEnabled: !prev.alertEnabled }))}
              className="vessel-outline-button min-h-11 w-full rounded-lg px-4 py-3 min-[420px]:w-auto"
            >
              {draft.alertEnabled ? "Alerts On" : "Alerts Off"}
            </Button> : <Badge className={neutralBadgeClass(darkMode)}>View only</Badge>}
            <div className={`text-sm ${theme.textSecondary}`}>{isDirty ? "Changes pending confirmation." : "No unconfirmed changes."}</div>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className={`rounded-xl border p-3 ${darkMode ? "border-white/10 bg-slate-950/35" : "border-slate-200 bg-slate-50"}`}>
              <div className="app-compact-label">Title</div>
              <div className={`mt-2 font-semibold ${theme.textPrimary}`}>{item.title || "Maintenance item"}</div>
            </div>
            <div className={`rounded-xl border p-3 ${darkMode ? "border-white/10 bg-slate-950/35" : "border-slate-200 bg-slate-50"}`}>
              <div className="app-compact-label">Area</div>
              <div className={`mt-2 font-semibold ${theme.textPrimary}`}>{item.area || "Not set"}</div>
            </div>
            <div className={`rounded-xl border p-3 ${darkMode ? "border-white/10 bg-slate-950/35" : "border-slate-200 bg-slate-50"}`}>
              <div className="app-compact-label">Frequency</div>
              <div className={`mt-2 font-semibold ${theme.textPrimary}`}>{MAINTENANCE_FREQUENCIES.find((option) => Number(option.months) === Number(item.frequencyMonths))?.label || `${item.frequencyMonths || 1} month`}</div>
            </div>
            <div className={`rounded-xl border p-3 ${darkMode ? "border-white/10 bg-slate-950/35" : "border-slate-200 bg-slate-50"}`}>
              <div className="app-compact-label">Next Due</div>
              <div className={`mt-2 font-semibold ${theme.textPrimary}`}>{item.nextDueDate || "No due date"}</div>
            </div>
          </div>
          <div className={`mt-3 rounded-xl border p-3 text-sm leading-6 ${darkMode ? "border-white/10 bg-slate-950/35 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
            {item.notes || "No notes recorded."}
          </div>
        </>
      )}
      <div className={`mt-4 rounded-lg p-4 ${theme.subtle}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className={`font-semibold ${theme.textPrimary}`}>Maintenance Log</div>
          {item.removedLogs && item.removedLogs.length > 0 ? <Badge className={neutralBadgeClass(darkMode)}>Undo available</Badge> : null}
        </div>
        {item.logs && item.logs.length > 0 ? (
          <div className="space-y-2">
            {item.logs.map((log) => (
              <div key={log.id} className={`relative rounded-lg border p-3 pr-10 ${darkMode ? "border-[#31443a] bg-[#111a16]" : "border-[#d8e7df] bg-white"}`}>
                {canEdit && isEditing ? <button
                  type="button"
                  onClick={() => onRemoveMaintenanceLog(item.id, log.id)}
                  className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg text-sm font-semibold ${darkMode ? "bg-[#22312a] text-[#f4fbf6] hover:bg-[#2f453b]" : "bg-[#e8eee9] text-[#40534a] hover:bg-[#d7e8df]"}`}
                  aria-label="Remove log"
                >
                  x
                </button> : null}
                <div className={`font-medium ${theme.textPrimary}`}>Completed {log.completedDate}</div>
                <div className={`text-sm ${theme.textSecondary}`}>Previous due {log.previousDueDate || "not set"} - Next due {log.nextDueDate}</div>
                {log.notes ? <div className={`mt-1 text-sm ${theme.textSecondary}`}>{log.notes}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-sm ${theme.textSecondary}`}>No completion records yet.</div>
        )}
        {item.removedLogs && item.removedLogs.length > 0 ? (
          <div className={`mt-4 rounded-lg border p-3 ${darkMode ? "border-[#31443a] bg-[#111a16]" : "border-[#d8e7df] bg-white"}`}>
            <div className={`mb-2 flex items-center gap-2 text-sm font-semibold ${theme.textPrimary}`}>
              Restore Removed Logs
            </div>
            <div className="space-y-2">
              {canEdit ? item.removedLogs.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => onRestoreMaintenanceLog(item.id, log.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${darkMode ? "border-[#31443a] bg-[#18211d]/80 text-[#f4fbf6] hover:bg-[#22312a]" : "border-[#d8e7df] bg-[#f3faf6] text-[#1d2b24] hover:bg-[#e8eee9]"}`}
                >
                  <div className="font-medium">Restore completed {log.completedDate}</div>
                  <div className={`text-sm ${theme.textSecondary}`}>Previous due {log.previousDueDate || "not set"} - Next due {log.nextDueDate}</div>
                </button>
              )) : <div className={`text-sm ${theme.textSecondary}`}>Removed logs can be restored in admin mode.</div>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MaintenanceView({
  darkMode = false,
  canEdit = true,
  maintenanceError,
  maintenanceAlerts,
  maintenanceItems,
  newMaintenanceOpen,
  onNewMaintenanceOpenChange,
  newMaintenance,
  onNewMaintenanceChange,
  onAddMaintenanceItem,
  onRequestMaintenanceNotifications,
  onUpdateMaintenanceItem,
  onCompleteMaintenanceItem,
  onRemoveMaintenanceLog,
  onRestoreMaintenanceLog,
}) {
  const theme = themeClasses(darkMode);
  const usingCustomArea = (newMaintenance.areaOption || "") === "Other";

  return (
    <Card className={`rounded-[26px] md:rounded-[24px] ${theme.card}`}>
      <CardContent className="p-5">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="app-kicker">Maintenance</div>
            <h2 className={`mt-2 text-2xl font-semibold ${theme.textPrimary}`}>Recurring vessel care, scheduled clearly.</h2>
            <p className={`text-sm ${theme.textSecondary}`}>Manual recurring reminders with alerts 1 day before the due date.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="vessel-outline-button rounded-2xl px-4 py-6 md:rounded-xl"
              onClick={onRequestMaintenanceNotifications}
            >
              Enable Alerts
            </Button>
            {canEdit ? <Dialog open={newMaintenanceOpen} onOpenChange={onNewMaintenanceOpenChange}>
              <DialogTrigger asChild>
                <Button className="button-vessel-primary rounded-2xl px-4 py-6 text-white md:rounded-xl">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Maintenance
                </Button>
              </DialogTrigger>
              <DialogContent className={`rounded-lg ${darkMode ? "bg-[#111a16] text-[#f4fbf6] border-[#2a3a32]" : "bg-white"}`}>
                <DialogHeader>
                  <DialogTitle>Add Maintenance Alert</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Objective to maintain" value={newMaintenance.title} onChange={(event) => onNewMaintenanceChange({ title: event.target.value })} className={`h-12 ${theme.input}`} />
                  <div className="space-y-3">
                    <div>
                      <div className={`mb-2 text-sm font-medium ${theme.textPrimary}`}>Area</div>
                      <Select
                        value={newMaintenance.areaOption || MAINTENANCE_AREA_OPTIONS[0]}
                        onValueChange={(value) =>
                          onNewMaintenanceChange({
                            areaOption: value,
                            area: value === "Other" ? (newMaintenance.customArea || "") : value,
                          })
                        }
                      >
                        <SelectTrigger className={`h-12 ${theme.input}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MAINTENANCE_AREA_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {usingCustomArea ? (
                      <Input
                        placeholder="Custom Area"
                        value={newMaintenance.customArea || ""}
                        onChange={(event) => onNewMaintenanceChange({ customArea: event.target.value, area: event.target.value })}
                        className={`h-12 ${theme.input}`}
                      />
                    ) : null}
                  </div>
                  <Select value={String(newMaintenance.frequencyMonths)} onValueChange={(value) => onNewMaintenanceChange({ frequencyMonths: Number(value) })}>
                    <SelectTrigger className={`h-12 ${theme.input}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MAINTENANCE_FREQUENCIES.map((option) => (
                        <SelectItem key={option.months} value={String(option.months)}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="date" value={newMaintenance.nextDueDate} onChange={(event) => onNewMaintenanceChange({ nextDueDate: event.target.value })} className={`h-12 ${theme.input}`} />
                  <textarea
                    placeholder="Notes"
                    value={newMaintenance.notes}
                    onChange={(event) => onNewMaintenanceChange({ notes: event.target.value })}
                    className={`min-h-24 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--vessel-ring)] ${theme.input}`}
                  />
                  <Button onClick={onAddMaintenanceItem} className="button-vessel-primary w-full rounded-lg px-4 py-6 text-white">
                    Save Maintenance Alert
                  </Button>
                  {maintenanceError ? <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{maintenanceError}</div> : null}
                </div>
              </DialogContent>
            </Dialog> : <Badge className={neutralBadgeClass(darkMode)}>View-only access</Badge>}
          </div>
        </div>

        {maintenanceError ? (
          <div className={`mb-4 rounded-lg p-3 text-sm ${darkMode ? "bg-[#381d1f] text-[#ffd8dc]" : "bg-rose-50 text-rose-800"}`}>
            {maintenanceError}
          </div>
        ) : null}

        {maintenanceAlerts.length > 0 && (
          <div className="mb-5 space-y-2">
            {maintenanceAlerts.map((item) => {
              const alertText = item.daysRemaining < 0 ? `${Math.abs(item.daysRemaining)} days overdue` : item.daysRemaining === 0 ? "Due today" : "Due tomorrow";
              return (
                <div id={`item-${item.id}`} data-jump-target style={{ "--jump-radius": "16px" }} key={`${item.id}-alert`} className={`jump-highlight-target rounded-lg border p-4 ${darkMode ? "border-[#5e4920] bg-[#2d2414] text-[#f5ddb0]" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
                  <div className="font-semibold">{alertText}: {item.title}</div>
                  <div className="text-sm">{item.area} - Due {item.nextDueDate}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-3">
          {maintenanceItems.length === 0 ? (
            <div className={`rounded-lg border border-dashed p-6 text-center text-sm ${theme.textSecondary} ${darkMode ? "border-[#31443a]" : "border-[#c9ded3]"}`}>
              No maintenance alerts yet.
            </div>
          ) : (
            maintenanceItems.map((item) => (
              <ConfirmableMaintenanceItemRow
                key={item.id}
                item={item}
                darkMode={darkMode}
                canEdit={canEdit}
                onConfirm={onUpdateMaintenanceItem}
                onCompleteMaintenanceItem={onCompleteMaintenanceItem}
                onRemoveMaintenanceLog={onRemoveMaintenanceLog}
                onRestoreMaintenanceLog={onRestoreMaintenanceLog}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
