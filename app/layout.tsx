import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layout/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NdoloStitch",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
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
  themeColor: "#558B2F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans bg-background text-textPrimary antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
