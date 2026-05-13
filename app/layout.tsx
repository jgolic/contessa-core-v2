import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contessa Core v2",
  description: "Deployable yacht operations command system for planning, crew, certificates, expenses, and vessel oversight.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
