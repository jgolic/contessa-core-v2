export function Input({ className = "", ...props }) {
  return <input className={["w-full border px-3 py-2 outline-none transition focus:ring-2 focus:ring-[var(--vessel-ring)] focus:ring-offset-1", className].filter(Boolean).join(" ")} {...props} />;
}
