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
