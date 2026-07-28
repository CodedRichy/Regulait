import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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

export const metadata: Metadata = {
  title: "Regulait - EU AI Act Compliance Checker",
  description:
    "Check if your AI system complies with the EU AI Act. Get risk classification, required actions, and compliance reports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${spaceGrotesk.variable} ${plexSans.variable}`}>
        <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
