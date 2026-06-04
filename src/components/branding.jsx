export const APP_BRAND_NAME = "Contessa";
export const APP_PRODUCT_NAME = "Contessa Operations";

function ContessaSymbol({
  stroke = "#7F8C86",
  accent = "#C6A35B",
  strokeWidth = 10,
  accentWidth = 9,
  accentEnabled = true,
  className = "",
}) {
  return (
    <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        d="M128 44 L63 109 H193 Z"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M128 44 V194"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M63 109 H193"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M72 121 L128 194"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M140 123 H186 L128 194"
        fill="none"
        stroke={accentEnabled ? accent : stroke}
        strokeWidth={accentEnabled ? accentWidth : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="logo-gold-triangle"
      />
    </svg>
  );
}

export function ContessaUiLogo({ className = "" }) {
  return (
    <div className={className}>
      <ContessaSymbol className="brand-mark--large" />
    </div>
  );
}

export function BrandWordmark({ className = "", darkMode = false }) {
  return (
    <span
      className={`brand-wordmark ${darkMode ? "brand-wordmark--dark" : "brand-wordmark--light"} ${className}`.trim()}
    >
      {APP_BRAND_NAME}
    </span>
  );
}

export function ContessaSplashLogo({ className = "" }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="contessa-splash-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#13201b" />
            <stop offset="100%" stopColor="#0b110f" />
          </linearGradient>
          <linearGradient id="contessa-splash-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f7fbf8" />
            <stop offset="100%" stopColor="#c7d3cf" />
          </linearGradient>
          <linearGradient id="contessa-splash-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0ca92" />
            <stop offset="100%" stopColor="#9e8753" />
          </linearGradient>
        </defs>
        <rect width="900" height="320" rx="36" fill="url(#contessa-splash-bg)" />
        <g transform="translate(74 48)">
          <rect x="0" y="0" width="206" height="206" rx="52" fill="#0f1714" fillOpacity="0.44" stroke="#ffffff22" strokeWidth="2" />
          <g transform="translate(15 14)">
            <svg viewBox="0 0 256 256" width="176" height="176" x="0" y="0">
              <path d="M128 44 L63 109 H193 Z" fill="none" stroke="url(#contessa-splash-stroke)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M128 44 V194" fill="none" stroke="url(#contessa-splash-stroke)" strokeWidth="11" strokeLinecap="round" />
              <path d="M63 109 H193" fill="none" stroke="url(#contessa-splash-stroke)" strokeWidth="11" strokeLinecap="round" />
              <path d="M72 121 L128 194" fill="none" stroke="url(#contessa-splash-stroke)" strokeWidth="11" strokeLinecap="round" />
              <path d="M140 123 H186 L128 194" fill="none" stroke="url(#contessa-splash-accent)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </g>
        </g>
        <g transform="translate(332 96)">
          <text x="0" y="22" fill="#8fb7aa" fontFamily="'Avenir Next','Segoe UI',sans-serif" fontSize="22" letterSpacing="6">YACHT OPERATIONS</text>
          <text x="0" y="118" fill="#f2f6f4" fontFamily="'Manrope','Inter','Segoe UI',sans-serif" fontSize="92" fontWeight="700" letterSpacing="4">CONTESSA</text>
          <text x="3" y="164" fill="#bdcbc5" fontFamily="'Avenir Next','Segoe UI',sans-serif" fontSize="24" letterSpacing="2.4">Premium command surface for vessel operations</text>
        </g>
      </svg>
    </div>
  );
}
