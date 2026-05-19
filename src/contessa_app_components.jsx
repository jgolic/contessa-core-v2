import { useEffect, useState } from "react";
import { Button } from "./components/ui/button.jsx";
import { Input } from "./components/ui/input.jsx";
import { Badge } from "./components/ui/badge.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select.jsx";
import { Receipt } from "./components/icons.jsx";
import {
  buildAbsolutePublicAppUrl,
  CURRENCY_OPTIONS,
  filePreviewCardClass,
  filePreviewPlaceholderClass,
  getConfiguredPublicAppUrlEnvValue,
  MONEY_STATUS_OPTIONS,
  neutralBadgeClass,
  PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  REJECTION_HOLD_MS,
  TASK_DEPARTMENT_OPTIONS,
  departmentStyles,
  getRejectedAt,
  isPaidMoneyStatus,
  formatTaskPriorityLabel,
  formatTaskStatusLabel,
  moneyStatusStyles,
  priorityStyles,
  statusStyles,
  themeClasses,
  titleCase,
  warningBadgeClass,
} from "./contessa_app_data.mjs";
import { APP_BRAND_NAME, APP_PRODUCT_NAME } from "./components/branding.jsx";

async function copyToClipboard(value) {
  if (typeof window === "undefined" || !value) return false;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const textarea = window.document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.inset = "0";
  window.document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = window.document.execCommand("copy");
  } finally {
    window.document.body.removeChild(textarea);
  }

  return copied;
}

function getShareSupportStatus(url) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return { canUseNativeShare: false, reason: "unavailable" };
  }

  if (typeof navigator.canShare === "function") {
    try {
      if (!navigator.canShare({ url })) {
        return { canUseNativeShare: false, reason: "unsupported" };
      }
    } catch {
      return { canUseNativeShare: false, reason: "unsupported" };
    }
  }

  return { canUseNativeShare: true, reason: null };
}

function getPublicAppUrlFromProcessEnv() {
  return buildAbsolutePublicAppUrl("/", getConfiguredPublicAppUrlEnvValue());
}

export function ShareAppButton({
  mode = "share",
  darkMode = false,
  shareUrlStatus,
  onToast,
  className = "",
  children,
}) {
  const urlStatus = shareUrlStatus || getPublicAppUrlFromProcessEnv();
  const isMissingConfig = !urlStatus.isValid;
  const baseClassName = mode === "share"
    ? "button-vessel-primary text-white"
    : mode === "email"
      ? "border-vessel bg-[var(--vessel-accent-soft)] text-[var(--vessel-text-accent)] hover:-translate-y-0.5 hover:brightness-105"
      : "vessel-outline-button";

  const notify = (type, title, message) => onToast?.({ type, title, message });

  const copyLink = async ({ successMessage = "The public app link is ready to paste." } = {}) => {
    if (!urlStatus.isValid) {
      notify("error", "Unable to share link", urlStatus.message);
      return false;
    }

    try {
      const copied = await copyToClipboard(urlStatus.url);
      if (!copied) throw new Error("Clipboard unavailable");
      notify("success", "Link copied", successMessage);
      return true;
    } catch {
      notify("error", "Unable to share link", "The public app link could not be copied on this device.");
      return false;
    }
  };

  const handleClick = async () => {
    if (mode === "email") {
      if (!urlStatus.isValid) {
        notify("error", "Unable to share link", urlStatus.message);
        return;
      }

      if (typeof window === "undefined") {
        notify("error", "Unable to share link", "Email sharing is not available in this environment.");
        return;
      }

      const subject = APP_PRODUCT_NAME;
      const body = `Open the ${APP_BRAND_NAME} app:\n\n${urlStatus.url}\n\nIf you are not already signed in, open the link in your browser and continue from the login or landing page.`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      notify("success", "Email draft opened", "Your email app was opened with the public app link.");
      return;
    }

    if (mode === "copy") {
      await copyLink();
      return;
    }

    if (!urlStatus.isValid) {
      notify("error", "Unable to share link", urlStatus.message);
      return;
    }

    const shareSupport = getShareSupportStatus(urlStatus.url);
    if (shareSupport.canUseNativeShare) {
      try {
        await navigator.share({
          title: APP_PRODUCT_NAME,
          text: `Open the ${APP_BRAND_NAME} app`,
          url: urlStatus.url,
        });
        notify("success", "Link shared", "The public app link was shared successfully.");
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    const copied = await copyLink({
      successMessage: "Native sharing is unavailable here, so the public app link was copied instead.",
    });
    if (copied) {
      return;
    }

    if (!copied) {
      notify("error", "Unable to share link", "The public app link could not be shared from this device.");
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      onClick={handleClick}
      className={`min-h-[3.5rem] w-full rounded-2xl px-4 py-4 text-sm md:min-h-[3.5rem] md:w-auto md:rounded-lg md:px-4 md:py-5 ${isMissingConfig ? (darkMode ? "border-[#6c5a27] bg-[#2c2515] text-[#ffe7ad] hover:bg-[#3a311d]" : "border-[#ecd28c] bg-[#fff8df] text-[#7a5416] hover:bg-[#fff1c4]") : baseClassName} ${className}`.trim()}
      title={isMissingConfig ? urlStatus.message : undefined}
      aria-disabled={isMissingConfig}
    >
      {children || (mode === "copy" ? "Copy App Link" : mode === "email" ? "Email App Link" : "Share App")}
    </Button>
  );
}

export function ConfirmActionDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  darkMode = false,
}) {
  const theme = themeClasses(darkMode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/55 p-4">
      <div className={`w-full max-w-sm rounded-lg border p-5 shadow-2xl ${darkMode ? "border-[#2a3a32] bg-[#111a16] text-[#f4fbf6]" : "border-[#d7e8df] bg-white text-[#1d2b25]"}`}>
        <h2 className="mb-2 text-xl font-semibold">{title}</h2>
        <p className={`mb-5 text-sm ${theme.textSecondary}`}>{message}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={onConfirm} className="rounded-lg bg-[#9b2c20] px-4 py-5 text-white hover:bg-[#7f231b]">
            {confirmLabel}
          </Button>
          <Button
            onClick={onCancel}
            className={`rounded-lg px-4 py-5 ${darkMode ? "bg-[#22312a] text-[#dce9e1] hover:bg-[#2d4036]" : "bg-[#e8eee9] text-[#40534a] hover:bg-[#d7e8df]"}`}
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TaskListItem({ task, isSelected, onSelect, onStatusChange, darkMode = false, canEdit = true }) {
  const theme = themeClasses(darkMode);
  const containerClass = isSelected ? theme.selectedTask : theme.unselectedTask;
  const areaClass = isSelected ? "text-[#c3d3ca]" : theme.textSecondary;
  const badgeClass = isSelected ? "bg-[#e7f5ef] text-[#10261f]" : statusStyles[task.status] || statusStyles.pending;
  const priorityClass = isSelected ? "bg-[#d9f5ea] text-[#0c3c35]" : priorityStyles[task.priority] || priorityStyles.medium;
  const departmentClass = isSelected ? "bg-[#e7f5ef] text-[#10261f]" : departmentStyles[task.department] || departmentStyles.General;
  const [touchStartX, setTouchStartX] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeOpen = swipeOffset <= -72;
  const clampSwipe = (value) => Math.max(-156, Math.min(0, value));
  const swipeActions = [
    { key: "open", label: "Open", onClick: onSelect, className: darkMode ? "bg-[#143942] text-[#dff6fb]" : "bg-[#e6f7fb] text-[#174f61]" },
    ...(task.status === "pending"
      ? [{ key: "progress", label: "Start", onClick: () => onStatusChange("in_progress"), className: darkMode ? "bg-[#2d341b] text-[#ffe7aa]" : "bg-[#fff4cb] text-[#7a5416]" }]
      : []),
    ...(!["completed", "approved"].includes(task.status)
      ? [{ key: "complete", label: "Done", onClick: () => onStatusChange("completed"), className: darkMode ? "bg-[#193628] text-[#d8f7e8]" : "bg-[#ebf6f1] text-[#166155]" }]
      : []),
    ...(task.status === "completed"
      ? [{ key: "approve", label: "Approve", onClick: () => onStatusChange("approved"), className: darkMode ? "border border-amber-300/25 bg-amber-300/14 text-amber-100" : "border border-amber-300 bg-amber-100 text-amber-950" }]
      : []),
  ].slice(0, 3);

  const closeSwipe = () => setSwipeOffset(0);
  const handleTouchStart = (event) => {
    if (!canEdit) return;
    if (event.target.closest("button")) return;
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };
  const handleTouchMove = (event) => {
    if (!canEdit || touchStartX === null) return;
    const currentX = event.touches[0]?.clientX ?? touchStartX;
    const delta = currentX - touchStartX;
    if (delta > 18) {
      setSwipeOffset(0);
      return;
    }
    setSwipeOffset(clampSwipe(delta));
  };
  const handleTouchEnd = () => {
    if (!canEdit || touchStartX === null) return;
    setSwipeOffset(swipeOffset <= -64 ? -144 : 0);
    setTouchStartX(null);
  };
  const handleSelect = () => {
    if (swipeOffset !== 0) {
      closeSwipe();
      return;
    }
    onSelect();
  };
  const handleSwipeAction = (event, action) => {
    event.stopPropagation();
    closeSwipe();
    action.onClick();
  };

  return (
    <div className="group relative overflow-hidden rounded-xl md:rounded-lg">
      {canEdit ? (
        <div className="absolute inset-y-0 right-0 z-0 flex w-[156px] items-stretch justify-end gap-px px-1.5 py-1.5 md:hidden">
          {swipeActions.map((action) => (
            <button
              key={`${task.id}-${action.key}`}
              type="button"
              onClick={(event) => handleSwipeAction(event, action)}
              className={`flex-1 rounded-[16px] px-2 text-[11px] font-semibold tracking-[0.04em] shadow-sm ${action.className}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
      <div
        onClick={handleSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") handleSelect();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className={`relative z-10 w-full cursor-pointer rounded-xl border p-4 text-left transition md:rounded-lg md:p-5 ${containerClass} ${swipeOpen ? "shadow-[0_18px_40px_-28px_rgba(8,24,30,0.45)]" : ""}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{task.id}</span>
          <Badge className={`capitalize ${badgeClass}`}>{formatTaskStatusLabel(task.status)}</Badge>
        </div>
        <div className="mt-2 font-medium">{task.name}</div>
        <div className={`text-sm ${areaClass}`}>{task.area}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge className={departmentClass}>{TASK_DEPARTMENT_OPTIONS.includes(task.department) ? task.department : "General"}</Badge>
          <Badge className={`capitalize ${priorityClass}`}>{formatTaskPriorityLabel(task.priority)}</Badge>
          {task.assignee ? <Badge className={isSelected ? "bg-[#edf7f3] text-[#173028]" : neutralBadgeClass(darkMode)}>{task.assignee}</Badge> : null}
          {task.dueDate ? <Badge className={isSelected ? "bg-[#edf7f3] text-[#173028]" : neutralBadgeClass(darkMode)}>Due {task.dueDate}</Badge> : null}
        </div>
        {canEdit ? (
          <>
            <div className={`mt-3 text-[11px] font-medium tracking-[0.12em] uppercase md:hidden ${theme.textSecondary}`}>
              Swipe left for quick actions
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 lg:grid-cols-4">
              {TASK_STATUS_OPTIONS.map((status) => {
                const isActive = task.status === status;
                return (
                  <button
                    key={`${task.id}-${status}`}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      closeSwipe();
                      onStatusChange(status);
                    }}
                    className={`min-h-[2.75rem] rounded-lg px-2 py-2 text-xs font-semibold capitalize transition ${
                      isActive
                        ? "button-vessel-primary text-white"
                        : darkMode
                          ? "bg-[#22312a] text-[#c3d3ca] hover:bg-[#2f453b]"
                          : "bg-[#e8eee9] text-[#40534a] hover:bg-[#d7e8df]"
                    }`}
                  >
                    {formatTaskStatusLabel(status)}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function QuoteRow({
  quote,
  canEdit = true,
  onConfirm,
  onToggleIncludeInSummary,
  onReceiptUpload,
  onRemoveRequest,
  darkMode = false,
}) {
  const theme = themeClasses(darkMode);
  const [draft, setDraft] = useState({
    supplier: quote.supplier || "",
    amount: quote.amount ?? 0,
    currency: quote.currency || "USD",
    status: quote.status || "requested",
  });
  const holdHours = quote.rejectedAt
    ? Math.max(0, Math.ceil((REJECTION_HOLD_MS - (Date.now() - getRejectedAt(quote))) / (60 * 60 * 1000)))
    : null;
  const isDirty =
    draft.supplier !== (quote.supplier || "") ||
    String(draft.amount) !== String(quote.amount ?? 0) ||
    draft.currency !== (quote.currency || "USD") ||
    draft.status !== (quote.status || "requested");

  useEffect(() => {
    setDraft({
      supplier: quote.supplier || "",
      amount: quote.amount ?? 0,
      currency: quote.currency || "USD",
      status: quote.status || "requested",
    });
  }, [quote.supplier, quote.amount, quote.currency, quote.status]);

  return (
    <div className={`relative rounded-lg border p-4 ${darkMode ? "border-[#2a3a32] bg-[#18211d]/80" : "border-[#d8e7df] bg-white"}`}>
      {canEdit ? <button
        type="button"
        onClick={onRemoveRequest}
        className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-lg font-semibold shadow-sm transition ${
          darkMode ? "bg-[#2b231f] text-[#ffd8cf] hover:bg-[#432d28]" : "bg-[#fff0ed] text-[#9b2c20] hover:bg-[#ffe0da]"
        }`}
        aria-label="Remove quote"
      >
        x
      </button> : null}
      <div className="mb-3 flex flex-col items-start gap-3 pr-10 min-[420px]:flex-row min-[420px]:justify-between">
        <div className={`text-xs font-semibold uppercase tracking-wide ${theme.textSecondary}`}>Quote</div>
        <label
          className={`flex min-h-[2.5rem] cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            quote.includeInSummary
              ? darkMode
                ? "border-vessel bg-[var(--vessel-primary-soft)] text-[var(--vessel-text-accent)]"
                : "border-vessel bg-[var(--vessel-primary-soft)] text-[var(--vessel-text-accent)]"
              : darkMode
                ? "border-[#31443a] bg-[#111a16] text-[#c7d5cd]"
                : "border-[#d8e7df] bg-[#fbfefd] text-[#40534a]"
          }`}
        >
          <input
            disabled={!canEdit}
            type="checkbox"
            checked={Boolean(quote.includeInSummary)}
            onChange={(event) => onToggleIncludeInSummary?.(event.target.checked)}
            className="h-4 w-4 shrink-0 rounded border-[#9bb8ab]"
          />
          <span>{quote.includeInSummary ? "Include in summary" : "Excluded from summary"}</span>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Input disabled={!canEdit} value={draft.supplier} onChange={(event) => setDraft((prev) => ({ ...prev, supplier: event.target.value }))} placeholder="Supplier" className={`h-12 rounded-lg ${theme.input}`} />
        <Input disabled={!canEdit} type="number" value={draft.amount} onChange={(event) => setDraft((prev) => ({ ...prev, amount: event.target.value }))} placeholder="Amount" className={`h-12 rounded-lg ${theme.input}`} />
        <Select value={draft.currency || "USD"} onValueChange={(value) => canEdit && setDraft((prev) => ({ ...prev, currency: value }))}>
          <SelectTrigger className={`h-12 rounded-lg ${theme.input}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_OPTIONS.map((option) => (
              <SelectItem key={option.code} value={option.code}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={draft.status} onValueChange={(value) => canEdit && setDraft((prev) => ({ ...prev, status: value }))}>
          <SelectTrigger className={`h-12 rounded-lg ${theme.input}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONEY_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {titleCase(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className={`flex items-center justify-center rounded-lg border px-3 text-sm font-semibold ${isPaidMoneyStatus(draft.status) ? (darkMode ? "border-[#285340] bg-[#173126] text-[#ccefdc]" : "border-[#b7dbc9] bg-[#eef8f3] text-[#176342]") : (darkMode ? "border-[#5e4920] bg-[#2d2414] text-[#f5ddb0]" : "border-[#e5d8b4] bg-[#fff9e8] text-[#8a4b13]")}`}>
          {isPaidMoneyStatus(draft.status) ? "Paid" : "Unpaid"}
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className={`text-sm ${theme.textSecondary}`}>{isDirty ? "Changes pending confirmation." : "No unconfirmed changes."}</div>
        {canEdit ? <Button
          type="button"
          onClick={() => onConfirm(draft)}
          disabled={!isDirty}
          className="button-vessel-primary rounded-lg px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirm
        </Button> : <Badge className={neutralBadgeClass(darkMode)}>View only</Badge>}
      </div>
      {quote.status === "declined" && (
        <div className={`mt-3 rounded-lg p-3 text-sm ${darkMode ? "bg-[#2d2414] text-[#f5ddb0]" : "bg-amber-50 text-amber-900"}`}>
          Rejected. Held for reconsideration{holdHours !== null ? ` for about ${holdHours} more hours` : ""}. After 24 hours it leaves Expenses and the value becomes 0 on the task.
        </div>
      )}

      <div className={`mt-3 rounded-lg p-3 ${theme.subtle}`}>
        <div className={`mb-2 flex items-center gap-2 text-sm font-medium ${theme.textPrimary}`}>
          <Receipt className="h-4 w-4" />
          Attachments
        </div>
        {canEdit ? <Input type="file" multiple onChange={onReceiptUpload} className={`h-12 rounded-lg ${theme.input}`} /> : null}
        {quote.attachments && quote.attachments.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-4">
            {quote.attachments.map((attachment, index) => (
              <a
                key={`${quote.id}-attachment-${index}`}
                href={attachment.dataUrl}
                download={attachment.name}
                className={filePreviewCardClass(darkMode)}
              >
                {attachment.dataUrl?.startsWith("data:image") ? (
                  <img src={attachment.dataUrl} alt={attachment.name || `Attachment ${index + 1}`} className="h-24 w-full rounded-md object-cover" />
                ) : (
                  <div className={filePreviewPlaceholderClass(darkMode)}>
                    {attachment.name || `Attachment ${index + 1}`}
                  </div>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className={`mt-2 text-sm ${theme.textSecondary}`}>No attachments uploaded.</div>
        )}
      </div>
    </div>
  );
}

export function ExpenseRow({
  expense,
  onTitleChange,
  onAmountChange,
  onCurrencyChange,
  onStatusChange,
  onReceiptUpload,
  onConfirm,
  darkMode = false,
}) {
  const theme = themeClasses(darkMode);
  const holdHours = expense.rejectedAt
    ? Math.max(0, Math.ceil((REJECTION_HOLD_MS - (Date.now() - getRejectedAt(expense))) / (60 * 60 * 1000)))
    : null;

  return (
    <div className={`rounded-lg border p-4 ${darkMode ? "border-[#2a3a32] bg-[#18211d]/80" : "border-[#d8e7df] bg-white"}`}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Input value={expense.title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Expense title" className={`h-12 rounded-lg ${theme.input}`} />
        <Input type="number" value={expense.amount} onChange={(event) => onAmountChange(event.target.value)} placeholder="Amount" className={`h-12 rounded-lg ${theme.input}`} />
        <Select value={expense.currency || "USD"} onValueChange={onCurrencyChange}>
          <SelectTrigger className={`h-12 rounded-lg ${theme.input}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_OPTIONS.map((option) => (
              <SelectItem key={option.code} value={option.code}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={expense.status || "requested"} onValueChange={onStatusChange}>
          <SelectTrigger className={`h-12 rounded-lg ${theme.input}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONEY_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {titleCase(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className={`flex items-center justify-center rounded-lg border px-3 text-sm font-semibold ${isPaidMoneyStatus(expense.status) ? (darkMode ? "border-[#285340] bg-[#173126] text-[#ccefdc]" : "border-[#b7dbc9] bg-[#eef8f3] text-[#176342]") : (darkMode ? "border-[#5e4920] bg-[#2d2414] text-[#f5ddb0]" : "border-[#e5d8b4] bg-[#fff9e8] text-[#8a4b13]")}`}>
          {isPaidMoneyStatus(expense.status) ? "Paid" : "Unpaid"}
        </div>
      </div>
      {expense.status === "declined" && (
        <div className={`mt-3 rounded-lg p-3 text-sm ${darkMode ? "bg-[#2d2414] text-[#f5ddb0]" : "bg-amber-50 text-amber-900"}`}>
          Rejected. Held for reconsideration{holdHours !== null ? ` for about ${holdHours} more hours` : ""}. After 24 hours it leaves Expenses and the value becomes 0 on the task.
        </div>
      )}
      {expense.confirmed === false && (
        <div className="mt-3 rounded-lg border border-vessel bg-[var(--vessel-primary-soft)] p-3 text-[var(--vessel-text-accent)]">
          <div className="mb-3 text-sm">
            This expense is saved on the task, but it will not be added to Expenses until you confirm it.
          </div>
          <Button onClick={onConfirm} className="button-vessel-primary w-full rounded-lg px-4 py-5 text-white">
            Confirm Expense
          </Button>
        </div>
      )}

      <div className={`mt-3 rounded-lg p-3 ${theme.subtle}`}>
        <div className={`mb-2 flex items-center gap-2 text-sm font-medium ${theme.textPrimary}`}>
          <Receipt className="h-4 w-4" />
          Expense Attachments
        </div>
        <Input type="file" multiple onChange={onReceiptUpload} className={`h-12 rounded-lg ${theme.input}`} />
        {expense.attachments && expense.attachments.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-4">
            {expense.attachments.map((attachment, index) => (
              <a
                key={`${expense.id}-attachment-${index}`}
                href={attachment.dataUrl}
                download={attachment.name}
                className={filePreviewCardClass(darkMode)}
              >
                {attachment.dataUrl?.startsWith("data:image") ? (
                  <img src={attachment.dataUrl} alt={attachment.name || `Expense attachment ${index + 1}`} className="h-24 w-full rounded-md object-cover" />
                ) : (
                  <div className={filePreviewPlaceholderClass(darkMode)}>
                    {attachment.name || `Attachment ${index + 1}`}
                  </div>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className={`mt-2 text-sm ${theme.textSecondary}`}>No expense attachments uploaded.</div>
        )}
      </div>
    </div>
  );
}
