import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Regulait - EU AI Act Compliance Checker",
    template: "%s | Regulait",
  },
  description:
    "Classify your AI system under the EU AI Act in minutes. Get your risk tier, required actions, and a compliance report before enforcement begins August 2, 2026.",
  keywords: [
    "EU AI Act",
    "AI compliance",
    "AI risk classification",
    "Annex III",
    "Article 5",
    "high-risk AI system",
    "AI regulation",
  ],
  authors: [{ name: "Regulait" }],
  openGraph: {
    title: "Regulait - EU AI Act Compliance Checker",
    description:
      "Classify your AI system under the EU AI Act in minutes. Get your risk tier, required actions, and a compliance report before enforcement begins August 2, 2026.",
    url: APP_URL,
    siteName: "Regulait",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Regulait - EU AI Act Compliance Checker",
    description:
      "Classify your AI system under the EU AI Act in minutes. Get your risk tier, required actions, and a compliance report.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${plexSans.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
