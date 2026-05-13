export function Button({ className = "", children, type = "button", variant: _variant, ...props }) {
  return (
    <button
      type={type}
      className={["inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vessel-ring)] focus-visible:ring-offset-2 disabled:opacity-50", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
