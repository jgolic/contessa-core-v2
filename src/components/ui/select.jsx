import { Children } from "react";

export function Select({ value, onValueChange, children }) {
  const childArray = Children.toArray(children);
  const trigger = childArray.find((child) => child?.type === SelectTrigger);
  const content = childArray.find((child) => child?.type === SelectContent);

  return (
    <select
      value={value || ""}
      onChange={(event) => onValueChange?.(event.target.value)}
      className={`w-full min-w-0 max-w-full appearance-none rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-2.5 text-slate-950 outline-none transition-all duration-200 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-50 dark:placeholder:text-slate-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/35 ${trigger?.props?.className || ""}`.trim()}
      style={{ colorScheme: "light dark" }}
    >
      {content?.props?.children}
    </select>
  );
}

export function SelectTrigger() {
  return null;
}

export function SelectValue() {
  return null;
}

export function SelectContent({ children }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }) {
  return <option value={value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">{children}</option>;
}
