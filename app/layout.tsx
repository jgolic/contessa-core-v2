import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
