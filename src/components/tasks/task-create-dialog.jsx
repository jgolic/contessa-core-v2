import { Plus } from "../icons.jsx";
import { Button } from "../ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog.jsx";
import { Input } from "../ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select.jsx";
import {
  PRIORITY_OPTIONS,
  TASK_DEPARTMENT_OPTIONS,
  TASK_STATUS_OPTIONS,
  YACHT_AREA_OPTIONS,
  dateStringFromNow,
  formatTaskPriorityLabel,
  formatTaskStatusLabel,
  themeClasses,
  todayDateString,
} from "../../contessa_app_data.mjs";

function FieldLabel({ children, optional = false }) {
  return (
    <div className="task-create-label">
      <span>{children}</span>
      {optional ? <span className="task-create-optional">Optional</span> : null}
    </div>
  );
}

export function TaskCreateDialog({
  open,
  onOpenChange,
  task,
  onTaskChange,
  onSave,
  assigneeOptions = [],
  darkMode = false,
}) {
  const theme = themeClasses(darkMode);
  const crewOptions = Array.isArray(assigneeOptions) ? assigneeOptions.filter(Boolean) : [];
  const canSave = Boolean(String(task?.name || "").trim());
  const datePresets = [
    { label: "Today", value: todayDateString() },
    { label: "Tomorrow", value: dateStringFromNow(1) },
    { label: "In 7 days", value: dateStringFromNow(7) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="button-vessel-primary w-full rounded-[14px] px-5 py-4 text-white md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New task
        </Button>
      </DialogTrigger>
      <DialogContent className={`task-create-dialog max-h-[92dvh] overflow-y-auto rounded-[28px] ${darkMode ? "border-white/10 bg-[#071b22] text-[#f4fbf6]" : "border-[rgba(12,48,54,0.14)] bg-[#fbfaf6] text-[var(--neo-ink)]"}`}>
        <DialogHeader>
          <div className="task-create-kicker">Fast work order</div>
          <DialogTitle>Create a clear, accountable task</DialogTitle>
          <p className="task-create-intro">Name the outcome, choose the owner, and set when it matters. Details can be added later.</p>
        </DialogHeader>

        <div className="task-create-form">
          <label className="task-create-field task-create-field--primary">
            <FieldLabel>What needs to be done?</FieldLabel>
            <Input
              autoFocus
              placeholder="Example: Inspect port generator coolant leak"
              value={task?.name || ""}
              onChange={(event) => onTaskChange?.({ name: event.target.value })}
              className={`h-14 text-base ${theme.input}`}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="task-create-field">
              <FieldLabel>Vessel area</FieldLabel>
              <Input
                list="task-area-options"
                placeholder="Choose or type an area"
                value={task?.area || ""}
                onChange={(event) => onTaskChange?.({ area: event.target.value })}
                className={`h-12 ${theme.input}`}
              />
              <datalist id="task-area-options">
                {YACHT_AREA_OPTIONS.map((option) => <option key={option} value={option} />)}
              </datalist>
            </label>

            <label className="task-create-field">
              <FieldLabel>Assigned to</FieldLabel>
              <Select value={task?.assignee || ""} onValueChange={(value) => onTaskChange?.({ assignee: value })}>
                <SelectTrigger className={`h-12 ${theme.input}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{crewOptions.length ? "Choose crew member" : "No crew added yet"}</SelectItem>
                  {crewOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="task-create-date-block">
            <FieldLabel>Due date</FieldLabel>
            <div className="task-date-presets">
              {datePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onTaskChange?.({ dueDate: preset.value })}
                  aria-pressed={task?.dueDate === preset.value}
                  className={`task-date-preset ${task?.dueDate === preset.value ? "task-date-preset--active" : ""}`}
                >
                  {preset.label}
                </button>
              ))}
              <Input
                type="date"
                aria-label="Custom due date"
                value={task?.dueDate || ""}
                onChange={(event) => onTaskChange?.({ dueDate: event.target.value })}
                className={`task-date-input h-11 ${theme.input}`}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="task-create-field">
              <FieldLabel>Department</FieldLabel>
              <Select value={task?.department || TASK_DEPARTMENT_OPTIONS[0]} onValueChange={(value) => onTaskChange?.({ department: value })}>
                <SelectTrigger className={`h-12 ${theme.input}`}><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_DEPARTMENT_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="task-create-field">
              <FieldLabel>Priority</FieldLabel>
              <Select value={task?.priority || "medium"} onValueChange={(value) => onTaskChange?.({ priority: value })}>
                <SelectTrigger className={`h-12 ${theme.input}`}><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITY_OPTIONS.map((option) => <SelectItem key={option} value={option}>{formatTaskPriorityLabel(option)}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="task-create-field">
              <FieldLabel>Status</FieldLabel>
              <Select value={task?.status || "pending"} onValueChange={(value) => onTaskChange?.({ status: value })}>
                <SelectTrigger className={`h-12 ${theme.input}`}><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_STATUS_OPTIONS.map((option) => <SelectItem key={option} value={option}>{formatTaskStatusLabel(option)}</SelectItem>)}</SelectContent>
              </Select>
            </label>
          </div>

          <label className="task-create-field">
            <FieldLabel optional>Instructions or context</FieldLabel>
            <textarea
              placeholder="Add access notes, parts needed, owner preferences, or completion criteria."
              value={task?.notes || ""}
              onChange={(event) => onTaskChange?.({ notes: event.target.value })}
              className={`min-h-24 w-full border px-4 py-3 outline-none ${theme.input}`}
            />
          </label>

          <div className="task-create-footer">
            <p>The task will be saved to the currently selected vessel.</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} className="app-action-button rounded-[14px] px-5">Cancel</Button>
              <Button type="button" onClick={onSave} disabled={!canSave} className="app-primary-action-button rounded-[14px] px-6 disabled:cursor-not-allowed disabled:opacity-50" data-testid="save-task-button">
                Create task
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
