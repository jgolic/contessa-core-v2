"use client";

import { useId } from "react";

const markPaths = [
  "M50 10 L18 48 H47",
  "M50 10 L82 48 H62",
  "M50 10 V90",
  "M18 52 L48 90",
  "M62 58 V84",
];

export default function ContessaLogoMark({
  size = 64,
  className = "",
  markClassName = "",
}) {
  const rawId = useId().replace(/:/g, "");
  const silverId = `contessaSilver-${rawId}`;
  const lightInkId = `contessaLightInk-${rawId}`;
  const goldId = `contessaGold-${rawId}`;

  return (
    <div
      className={[
        "inline-flex shrink-0 items-center justify-center",
        "rounded-[28%] border",
        "border-slate-200/90 bg-white/90",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_34px_rgba(15,23,42,0.10)]",
        "backdrop-blur-xl",
        "dark:border-white/[0.18] dark:bg-[#071321]",
        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_44px_rgba(0,0,0,0.45)]",
        className,
      ].join(" ")}
      style={{
        width: size,
        height: size,
      }}
      aria-label="Contessa"
    >
      <svg
        viewBox="0 0 100 100"
        className={[
          "h-[68%] w-[68%]",
          "overflow-visible",
          markClassName,
        ].join(" ")}
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={silverId} x1="20" y1="15" x2="78" y2="88">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="45%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#7C8A8A" />
          </linearGradient>

          <linearGradient id={lightInkId} x1="20" y1="15" x2="78" y2="88">
            <stop offset="0%" stopColor="#8A9993" />
            <stop offset="55%" stopColor="#6F7E79" />
            <stop offset="100%" stopColor="#4F5F5A" />
          </linearGradient>

          <linearGradient id={goldId} x1="55" y1="45" x2="82" y2="82">
            <stop offset="0%" stopColor="#F9D27A" />
            <stop offset="48%" stopColor="#D7A94A" />
            <stop offset="100%" stopColor="#A97926" />
          </linearGradient>
        </defs>

        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="7.5"
        >
          <g className="dark:hidden">
            {markPaths.map((path) => (
              <path key={`light-${path}`} d={path} stroke={`url(#${lightInkId})`} />
            ))}
          </g>

          <g className="hidden dark:block">
            {markPaths.map((path) => (
              <path key={`dark-${path}`} d={path} stroke={`url(#${silverId})`} />
            ))}
          </g>

          <path d="M62 52 H84" stroke={`url(#${goldId})`} />
          <path d="M82 58 L62 84" stroke={`url(#${goldId})`} />
        </g>
      </svg>
    </div>
  );
}
