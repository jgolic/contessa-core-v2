import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contessa Core v2",
  description: "Deployable yacht operations command system for planning, crew, certificates, expenses, and vessel oversight.",
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
