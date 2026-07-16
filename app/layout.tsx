import type { Metadata } from "next";
import { Cormorant_Garamond, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sansFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const monoFont = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const themeBootstrapScript = `
  (() => {
    const storageKey = "contessa-ui-theme";
    const supportedThemes = ["day", "night", "red"];
    let theme = "night";
    try {
      const storedTheme = window.localStorage.getItem(storageKey);
      if (supportedThemes.includes(storedTheme)) theme = storedTheme;
    } catch {}
    document.documentElement.dataset.theme = theme;
  })();
`;

export const metadata: Metadata = {
  title: "Contessa Operations",
  description: "Premium yacht operations command center for tasks, crew, certificates, expenses, approvals, and passage planning.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="night"
      suppressHydrationWarning
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
