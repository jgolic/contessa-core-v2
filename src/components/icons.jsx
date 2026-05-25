function makeIcon(label) {
  return function Icon({ className = "" }) {
    return <span className={["inline-flex items-center justify-center", className].filter(Boolean).join(" ")} aria-hidden="true">{label}</span>;
  };
}

export const CheckCircle2 = makeIcon("\u2713");
export const AlertCircle = makeIcon("!");
export const Bell = makeIcon("\u25cb");
export const TriangleAlert = makeIcon("\u26a0");
export const LayoutDashboard = makeIcon("\u25a6");
export const Plus = makeIcon("+");
export const Wallet = makeIcon("\u25a3");
export const Users = makeIcon("\u25ce");
export const Receipt = makeIcon("\u25a4");
export const Moon = makeIcon("\u25d0");
export const Sun = makeIcon("\u263c");
export const WifiOff = makeIcon("\u224b");
export const Wifi = makeIcon("\u224b");
export const Compass = makeIcon("\u2316");
export const Share2 = makeIcon("\u2924");

export function Settings({ className = "" }) {
  return (
    <svg
      className={["inline-flex", className].filter(Boolean).join(" ")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.2 13.25c.05-.4.05-.76 0-1.16l1.55-1.2-1.9-3.3-1.83.73a7.2 7.2 0 0 0-1-.58L15.73 5h-3.8l-.28 1.94c-.36.15-.7.34-1.02.56l-1.8-.72-1.9 3.3 1.52 1.18a7.13 7.13 0 0 0 0 1.18l-1.52 1.18 1.9 3.3 1.8-.72c.32.22.66.41 1.02.56l.28 1.94h3.8l.29-1.94c.35-.15.68-.34 1-.56l1.83.73 1.9-3.3-1.55-1.2Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
    </svg>
  );
}
