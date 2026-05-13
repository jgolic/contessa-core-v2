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
import { Plus, Receipt } from "../../components/icons.jsx";
import { QuoteRow } from "../../contessa_app_components.jsx";
import {
  CURRENCY_OPTIONS,
  MONEY_STATUS_OPTIONS,
  convertedMoney,
  filePreviewCardClass,
  filePreviewPlaceholderClass,
  formatMoney,
  neutralBadgeClass,
  successBadgeClass,
  isPaidMoneyStatus,
  moneyStatusStyles,
  themeClasses,
  titleCase,
  warningBadgeClass,
} from "../../contessa_app_data.mjs";

function ConfirmableCrewExpenseRow({
  item,
  darkMode = false,
  canEdit = true,
  currency,
  exchangeRates,
  onConfirm,
  onAttachmentUpload,
  onDeleteRequest,
}) {
  const theme = themeClasses(darkMode);
  const [draft, setDraft] = useState({
    title: item.title || "",
    amount: item.amount ?? 0,
    currency: item.currency || "USD",
    status: item.status || "requested",
  });
  const isDirty =
    draft.title !== (item.title || "") ||
    String(draft.amount) !== String(item.amount ?? 0) ||
    draft.currency !== (item.currency || "USD") ||
    draft.status !== (item.status || "requested");

  useEffect(() => {
    setDraft({
      title: item.title || "",
      amount: item.amount ?? 0,
      currency: item.currency || "USD",
      status: item.status || "requested",
    });
  }, [item.title, item.amount, item.currency, item.status]);

  return (
    <div className={`relative rounded-lg border p-4 ${darkMode ? "border-[#2a3a32] bg-[#18211d]/80" : "border-[#d8e7df] bg-white"}`}>
      {canEdit ? (
        <button
          type="button"
          onClick={() => onDeleteRequest({ id: item.id, title: item.title })}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-lg font-semibold shadow-sm transition ${
            darkMode ? "bg-[#2b231f] text-[#ffd8cf] hover:bg-[#432d28]" : "bg-[#fff0ed] text-[#9b2c20] hover:bg-[#ffe0da]"
          }`}
          aria-label="Remove crew expense"
        >
          x
        </button>
      ) : null}
      <div className="mb-3 flex items-center justify-between">
        <div className={`pr-10 text-sm font-medium ${theme.textSecondary}`}>{item.id}</div>
        <Badge className={neutralBadgeClass(darkMode)}>{convertedMoney(item.amount, item.currency || "USD", currency, exchangeRates)}</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Input disabled={!canEdit} value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} className={`rounded-lg h-12 ${theme.input}`} />
        <Input disabled={!canEdit} type="number" value={draft.amount} onChange={(event) => setDraft((prev) => ({ ...prev, amount: event.target.value }))} className={`rounded-lg h-12 ${theme.input}`} />
        <Select value={draft.currency || "USD"} onValueChange={(value) => canEdit && setDraft((prev) => ({ ...prev, currency: value }))}>
          <SelectTrigger className={`rounded-lg h-12 ${theme.input}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_OPTIONS.map((option) => (
              <SelectItem key={option.code} value={option.code}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={draft.status} onValueChange={(value) => canEdit && setDraft((prev) => ({ ...prev, status: value }))}>
          <SelectTrigger className={`rounded-lg h-12 ${theme.input}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONEY_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>{titleCase(option)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={moneyStatusStyles[item.status] || moneyStatusStyles.requested}>{titleCase(item.status || "requested")}</Badge>
          <Badge className={isPaidMoneyStatus(item.status) ? successBadgeClass(darkMode) : warningBadgeClass(darkMode)}>
            {isPaidMoneyStatus(item.status) ? "Paid" : "Unpaid"}
          </Badge>
          <div className={`text-sm ${theme.textSecondary}`}>{isDirty ? "Changes pending confirmation." : "No unconfirmed changes."}</div>
        </div>
        {canEdit ? (
          <Button
            type="button"
            onClick={() => onConfirm(item.id, draft)}
            disabled={!isDirty}
            className="button-vessel-primary rounded-lg px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm
          </Button>
        ) : (
          <Badge className={neutralBadgeClass(darkMode)}>View only</Badge>
        )}
      </div>
      <div className={`mt-3 rounded-lg p-3 ${theme.subtle}`}>
        <div className={`mb-2 flex items-center gap-2 text-sm font-medium ${theme.textPrimary}`}>
          <Receipt className="h-4 w-4" />
          Attachments
        </div>
        {canEdit ? <Input type="file" multiple onChange={(event) => onAttachmentUpload(item.id, event.target.files)} className={`rounded-lg h-12 ${theme.input}`} /> : null}
        {item.attachments && item.attachments.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {item.attachments.map((attachment, index) => (
              <a
                key={`${item.id}-attachment-${index}`}
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

export function ExpensesView({
  darkMode = false,
  canEdit = true,
  expenseBucket,
  onExpenseBucketChange,
  stats,
  currency,
  onCurrencyChange,
  tasks,
  newExpenseOpen,
  onNewExpenseOpenChange,
  newExpense,
  onNewExpenseChange,
  onAddExpense,
  boatExpenses,
  exchangeRates,
  onUpdateQuote,
  onQuoteReceiptUpload,
  onQuoteRemoveRequest,
  onOpenLinkedTask,
  crewExpenses,
  newCrewExpenseOpen,
  onNewCrewExpenseOpenChange,
  newCrewExpense,
  onNewCrewExpenseChange,
  onAddCrewExpense,
  onUpdateCrewExpense,
  onCrewExpenseAttachmentUpload,
  onCrewExpenseDeleteRequest,
}) {
  const theme = themeClasses(darkMode);
  const boatPaidCount = boatExpenses.filter((item) => isPaidMoneyStatus(item.status)).length;
  const boatOpenCount = boatExpenses.length - boatPaidCount;
  const crewPaidCount = crewExpenses.filter((item) => isPaidMoneyStatus(item.status)).length;
  const crewOpenCount = crewExpenses.length - crewPaidCount;

  return (
    <div className="grid gap-4">
      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1fr_220px_180px]">
        <button type="button" onClick={() => onExpenseBucketChange("boat")}>
          <div className={expenseBucket === "boat" ? "" : ""}>
            <Card className={`app-card-hover rounded-[24px] md:rounded-[22px] ${theme.card} ${expenseBucket === "boat" ? theme.ring : ""}`}>
              <CardContent className="p-4">
                <div className="app-kicker">Boat Summary</div>
                <div className={`mt-3 text-xl font-semibold tracking-tight md:text-2xl ${theme.textPrimary}`}>{formatMoney(stats.boatTotal, currency)}</div>
                <div className={`mt-1 text-xs ${theme.textSecondary}`}>Selected quotations and approvals driving vessel spend.</div>
              </CardContent>
            </Card>
          </div>
        </button>
        <button type="button" onClick={() => onExpenseBucketChange("crew")}>
          <div className={expenseBucket === "crew" ? "" : ""}>
            <Card className={`app-card-hover rounded-[24px] md:rounded-[22px] ${theme.card} ${expenseBucket === "crew" ? theme.ring : ""}`}>
              <CardContent className="p-4">
                <div className="app-kicker">Crew Total</div>
                <div className={`mt-3 text-xl font-semibold tracking-tight md:text-2xl ${theme.textPrimary}`}>{formatMoney(stats.crewTotal, currency)}</div>
                <div className={`mt-1 text-xs ${theme.textSecondary}`}>Crew-related operational and welfare spending.</div>
              </CardContent>
            </Card>
          </div>
        </button>
        <Card className={`rounded-[24px] md:rounded-[22px] ${theme.card}`}>
          <CardContent className="p-4">
            <div className="app-kicker mb-2">Summary Currency</div>
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger className={`rounded-lg h-12 ${theme.input}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.code} value={option.code}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        {canEdit ? <Dialog open={newExpenseOpen} onOpenChange={onNewExpenseOpenChange}>
          <DialogTrigger asChild>
            <Button className="button-vessel-primary h-full min-h-[104px] w-full rounded-[24px] px-4 py-6 text-white md:rounded-[22px]" disabled={tasks.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className={`rounded-lg ${darkMode ? "bg-[#111a16] text-[#f4fbf6] border-[#2a3a32]" : "bg-white"}`}>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Select value={newExpense.taskId || tasks[0]?.id || ""} onValueChange={(value) => onNewExpenseChange({ taskId: value })}>
                <SelectTrigger className={`h-12 ${theme.input}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>{task.id} - {task.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Supplier or expense name" value={newExpense.supplier} onChange={(event) => onNewExpenseChange({ supplier: event.target.value })} className={`h-12 ${theme.input}`} />
              <Input type="number" placeholder="Amount" value={newExpense.amount} onChange={(event) => onNewExpenseChange({ amount: event.target.value })} className={`h-12 ${theme.input}`} />
              <Select value={newExpense.currency} onValueChange={(value) => onNewExpenseChange({ currency: value })}>
                <SelectTrigger className={`h-12 ${theme.input}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newExpense.status} onValueChange={(value) => onNewExpenseChange({ status: value })}>
                <SelectTrigger className={`h-12 ${theme.input}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONEY_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>{titleCase(option)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={onAddExpense} className="button-vessel-primary w-full rounded-lg px-4 py-6 text-white" disabled={tasks.length === 0}>
                Confirm Expense
              </Button>
              {tasks.length === 0 ? <div className={`text-sm ${theme.textSecondary}`}>Create an objective before adding an expense.</div> : null}
            </div>
          </DialogContent>
        </Dialog> : <Card className={`rounded-[24px] md:rounded-[22px] ${theme.card}`}><CardContent className="flex h-full min-h-[104px] items-center justify-center p-4"><Badge className={neutralBadgeClass(darkMode)}>View-only access</Badge></CardContent></Card>}
      </div>

      {expenseBucket === "boat" ? (
        <Card className={`rounded-[26px] md:rounded-[24px] ${theme.card}`}>
          <CardContent className="p-4 md:p-5">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="app-kicker">Expenses</div>
                <h2 className={`mt-2 text-2xl font-semibold ${theme.textPrimary}`}>Boat Expenses & Quotations</h2>
                <p className={`text-sm ${theme.textSecondary}`}>Enter each item in its original currency. Totals convert to the selected summary currency.</p>
                <p className={`text-xs ${theme.textSecondary}`}>Rates: {exchangeRates.live ? exchangeRates.source : "offline fallback"} - {exchangeRates.date}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={successBadgeClass(darkMode)}>{boatPaidCount} paid</Badge>
                  <Badge className={warningBadgeClass(darkMode)}>{boatOpenCount} unpaid</Badge>
                </div>
              </div>
              <div className={`text-2xl font-semibold ${theme.textPrimary}`}>{formatMoney(stats.boatTotal, currency)}</div>
            </div>
            <div className="space-y-3">
              {boatExpenses.length === 0 ? (
                <div className={`rounded-lg border border-dashed p-6 text-center text-sm ${theme.textSecondary} ${darkMode ? "border-[#31443a]" : "border-[#c9ded3]"}`}>
                  No quotations are selected for the summary yet.
                </div>
              ) : (
                boatExpenses.map((item) => (
                  <div key={`${item.kind}-${item.id}`} className={`rounded-xl border p-4 md:rounded-lg ${darkMode ? "border-[#2a3a32] bg-[#18211d]/80" : "border-[#d8e7df] bg-white"}`}>
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className={`text-sm ${theme.textSecondary}`}>{item.taskId} - Quotation</div>
                        <div className={`font-semibold ${theme.textPrimary}`}>{item.taskName}</div>
                        <div className={`text-sm ${theme.textSecondary}`}>{item.taskArea}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge className={moneyStatusStyles[item.status] || moneyStatusStyles.requested}>{titleCase(item.status || "requested")}</Badge>
                          <Badge className={isPaidMoneyStatus(item.status) ? successBadgeClass(darkMode) : warningBadgeClass(darkMode)}>
                            {isPaidMoneyStatus(item.status) ? "Paid" : "Unpaid"}
                          </Badge>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenLinkedTask(item.taskId)}
                            className={`rounded-lg px-3 py-2 text-xs ${darkMode ? "border-[#31443a] bg-[#111a16] text-[#dce9e1] hover:bg-[#22312a]" : "border-[#c9ded3] bg-[#fbfefd] text-[#40534a] hover:bg-[#f3faf6]"}`}
                          >
                            Open Task
                          </Button>
                        </div>
                      </div>
                      <Badge className={`w-fit ${neutralBadgeClass(darkMode)}`}>{convertedMoney(item.amount, item.currency || "USD", currency, exchangeRates)}</Badge>
                    </div>
                    <QuoteRow
                      quote={item}
                      canEdit={canEdit}
                      onConfirm={(patch) => onUpdateQuote(item.taskId, item.id, patch)}
                      onToggleIncludeInSummary={(includeInSummary) => onUpdateQuote(item.taskId, item.id, { includeInSummary })}
                      onReceiptUpload={(event) => onQuoteReceiptUpload(item.taskId, item.id, event.target.files)}
                      onRemoveRequest={() => onQuoteRemoveRequest({ taskId: item.taskId, quoteId: item.id, supplier: item.supplier })}
                      darkMode={darkMode}
                    />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className={`rounded-[26px] md:rounded-[24px] ${theme.card}`}>
          <CardContent className="p-4 md:p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="app-kicker">Expenses</div>
                <h2 className={`mt-2 text-2xl font-semibold ${theme.textPrimary}`}>Crew Expenses</h2>
                <p className={`text-sm ${theme.textSecondary}`}>Crew amounts convert into the selected summary currency.</p>
                <p className={`text-xs ${theme.textSecondary}`}>Rates: {exchangeRates.live ? exchangeRates.source : "offline fallback"} - {exchangeRates.date}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={successBadgeClass(darkMode)}>{crewPaidCount} paid</Badge>
                  <Badge className={warningBadgeClass(darkMode)}>{crewOpenCount} unpaid</Badge>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className={`text-2xl font-semibold ${theme.textPrimary}`}>{formatMoney(stats.crewTotal, currency)}</div>
                {canEdit ? <Dialog open={newCrewExpenseOpen} onOpenChange={onNewCrewExpenseOpenChange}>
                  <DialogTrigger asChild>
                    <Button className="button-vessel-primary w-full rounded-xl px-4 py-5 text-white sm:w-auto md:rounded-lg md:py-6">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Crew Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`rounded-lg ${darkMode ? "bg-[#111a16] text-[#f4fbf6] border-[#2a3a32]" : "bg-white"}`}>
                    <DialogHeader>
                      <DialogTitle>Add Crew Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input placeholder="Expense title" value={newCrewExpense.title} onChange={(event) => onNewCrewExpenseChange({ title: event.target.value })} className={`h-12 ${theme.input}`} />
                      <Input type="number" placeholder="Amount" value={newCrewExpense.amount} onChange={(event) => onNewCrewExpenseChange({ amount: event.target.value })} className={`h-12 ${theme.input}`} />
                      <Select value={newCrewExpense.currency} onValueChange={(value) => onNewCrewExpenseChange({ currency: value })}>
                        <SelectTrigger className={`h-12 ${theme.input}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCY_OPTIONS.map((option) => (
                            <SelectItem key={option.code} value={option.code}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={newCrewExpense.status} onValueChange={(value) => onNewCrewExpenseChange({ status: value })}>
                        <SelectTrigger className={`h-12 ${theme.input}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONEY_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>{titleCase(option)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={onAddCrewExpense} className="button-vessel-primary w-full rounded-lg px-4 py-6 text-white">
                        Confirm Crew Expense
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog> : null}
              </div>
            </div>

            <div className="space-y-3">
              {crewExpenses.length === 0 ? (
                <div className={`rounded-lg border border-dashed p-6 text-center text-sm ${theme.textSecondary} ${darkMode ? "border-[#31443a]" : "border-[#c9ded3]"}`}>
                  No crew expenses yet.
                </div>
              ) : (
                  crewExpenses.map((item) => (
                    <ConfirmableCrewExpenseRow
                      key={item.id}
                      item={item}
                      darkMode={darkMode}
                      canEdit={canEdit}
                      currency={currency}
                      exchangeRates={exchangeRates}
                      onConfirm={onUpdateCrewExpense}
                      onAttachmentUpload={onCrewExpenseAttachmentUpload}
                      onDeleteRequest={onCrewExpenseDeleteRequest}
                    />
                  ))
                )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
