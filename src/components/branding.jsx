import ContessaLogoMark from "./ContessaLogoMark.jsx";

export const APP_BRAND_NAME = "Contessa";
export const APP_PRODUCT_NAME = "Contessa Operations";

export { ContessaLogoMark };

export function ContessaUiLogo({ className = "", markClassName = "", size = 64 }) {
  return <ContessaLogoMark size={size} className={className} markClassName={markClassName} />;
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
              <path d="M128 26 L46 123 H121" fill="none" stroke="url(#contessa-splash-stroke)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M128 26 L210 123 H159" fill="none" stroke="url(#contessa-splash-stroke)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M128 26 V230" fill="none" stroke="url(#contessa-splash-stroke)" strokeWidth="18" strokeLinecap="round" />
              <path d="M46 133 L123 230" fill="none" stroke="url(#contessa-splash-stroke)" strokeWidth="18" strokeLinecap="round" />
              <path d="M159 148 V214" fill="none" stroke="url(#contessa-splash-stroke)" strokeWidth="18" strokeLinecap="round" />
              <path d="M159 133 H215" fill="none" stroke="url(#contessa-splash-accent)" strokeWidth="18" strokeLinecap="round" />
              <path d="M210 148 L159 214" fill="none" stroke="url(#contessa-splash-accent)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
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
