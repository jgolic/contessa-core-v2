"use client";

function hashString(value = "") {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function pick(list, seed, offset = 0) {
  return list[(seed + offset) % list.length];
}

export default function PirateCrewAvatar({ person, size = 160, className = "" }) {
  const name =
    person?.name ||
    person?.fullName ||
    [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
    "Crew";

  const seed = hashString(`${person?.id || ""}-${name}`);
  const skin = pick(["#f1c27d", "#d9a066", "#b98055", "#8d5524", "#f3d2a2"], seed);
  const coat = pick(["#071a3a", "#102a43", "#123c4a", "#2f1b46", "#3a2a16"], seed, 1);
  const scarf = pick(["#b45309", "#be123c", "#0e7490", "#7c2d12", "#9333ea"], seed, 2);
  const hatBand = pick(["#d4af37", "#38bdf8", "#f59e0b", "#14b8a6"], seed, 3);
  const beard = pick(["#2b1b12", "#3b2f2f", "#5a3e2b", "#111827"], seed, 4);
  const hasBeard = seed % 3 !== 0;
  const hasEyePatch = seed % 2 === 0;
  const hasMoustache = seed % 4 !== 1;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={[
        "relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]",
        "dark:border-white/10 dark:bg-slate-900",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
      aria-label={`${name} demo pirate avatar`}
      title={`${name} demo pirate avatar`}
    >
      <svg width="100%" height="100%" viewBox="0 0 240 240" role="img" aria-hidden="true">
        <defs>
          <radialGradient id={`sea-${seed}`} cx="50%" cy="34%" r="70%">
            <stop offset="0%" stopColor="#164e63" />
            <stop offset="48%" stopColor="#071a3a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
          <linearGradient id={`glow-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0.38" />
          </linearGradient>
        </defs>

        <rect width="240" height="240" fill={`url(#sea-${seed})`} />
        <circle cx="190" cy="48" r="42" fill={`url(#glow-${seed})`} opacity="0.28" />
        <circle cx="52" cy="198" r="58" fill="#38bdf8" opacity="0.08" />

        <path d="M52 214c10-48 44-72 68-72s58 24 68 72" fill={coat} stroke="#ffffff" strokeOpacity="0.08" strokeWidth="2" />
        <path d="M96 154h48l-12 60h-24z" fill="#f8fafc" opacity="0.92" />
        <path d="M85 154c22 12 48 12 70 0l-13 24c-15 9-29 9-44 0z" fill={scarf} />
        <rect x="101" y="125" width="38" height="38" rx="16" fill={skin} />
        <circle cx="120" cy="96" r="47" fill={skin} />
        <circle cx="72" cy="98" r="10" fill={skin} />
        <circle cx="168" cy="98" r="10" fill={skin} />

        <path d="M58 76c22-37 102-37 124 0-24 10-100 10-124 0z" fill="#020617" />
        <path d="M82 47c17-25 59-25 76 0l18 38H64z" fill="#020617" />
        <rect x="73" y="74" width="94" height="12" rx="6" fill={hatBand} />
        <circle cx="120" cy="80" r="4" fill="#fff7ed" opacity="0.9" />

        {!hasEyePatch && (
          <>
            <circle cx="101" cy="96" r="4" fill="#020617" />
            <circle cx="139" cy="96" r="4" fill="#020617" />
          </>
        )}

        {hasEyePatch && (
          <>
            <circle cx="101" cy="96" r="4" fill="#020617" />
            <path d="M126 85h34l-8 25h-27z" fill="#020617" />
            <path d="M82 76l76 36" stroke="#020617" strokeWidth="4" strokeLinecap="round" />
          </>
        )}

        <path d="M120 98c-4 11-7 18 4 20" fill="none" stroke="#8b5e34" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

        {hasMoustache && (
          <path d="M91 125c16-10 24-8 29 0 5-8 13-10 29 0-16 7-26 6-29 0-3 6-13 7-29 0z" fill={beard} />
        )}

        {hasBeard && (
          <path d="M83 124c7 31 23 48 37 48s30-17 37-48c-16 16-58 16-74 0z" fill={beard} opacity="0.96" />
        )}

        <path d="M104 130c10 7 22 7 32 0" fill="none" stroke="#020617" strokeWidth="3" strokeLinecap="round" opacity="0.65" />

        <circle cx="202" cy="202" r="22" fill="#ffffff" opacity="0.12" />
        <text x="202" y="208" textAnchor="middle" fontSize="15" fontWeight="700" fill="#ffffff" letterSpacing="1">
          {initials}
        </text>
      </svg>
    </div>
  );
}
