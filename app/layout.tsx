/**
 * app/layout.tsx
 *
 * Root layout — wraps every page in the application.
 *
 * Responsibilities:
 *   - Sets the HTML lang attribute (bilingual EN/FR support)
 *   - Loads global CSS (Tailwind base + Afrocentric CSS variables)
 *   - Provides the React Query client to all client components
 *   - Sets default Open Graph metadata for the platform
 */

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// ── Fonts ──────────────────────────────────────────────────────────────────────

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// ── Metadata ───────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "NdoloStitch — Where Cameroonian Fashion Connects",
    template: "%s | NdoloStitch",
  },
  description:
    "AI-powered platform connecting customers with verified Cameroonian fashion designers, vendors, and marketers.",
  keywords: [
    "Cameroon fashion",
    "African fashion",
    "designer directory",
    "fashion marketplace",
    "NdoloStitch",
  ],
  authors: [{ name: "NdoloStitch Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "NdoloStitch",
    title: "NdoloStitch — Where Cameroonian Fashion Connects",
    description:
      "Discover and connect with Cameroonian fashion designers, shop the marketplace, and explore AI-powered outfit inspiration.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NdoloStitch",
    description: "Where Cameroonian Fashion Connects",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFC107", // Kente Gold
  width: "device-width",
  initialScale: 1,
};

// ── Root Layout ────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
