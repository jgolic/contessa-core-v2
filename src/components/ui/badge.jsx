export function Badge({ className = "", children }) {
  return <span data-ui="badge" className={["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", className].filter(Boolean).join(" ")}>{children}</span>;
}
