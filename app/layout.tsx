import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Roboto_Mono, Bricolage_Grotesque } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: process.env.SITE_URL
    ? new URL(process.env.SITE_URL)
    : undefined,
  title: {
    default: "MotionRecap — AI Manga Storyboard Studio & Video Generator",
    template: "%s — MotionRecap",
  },
  description:
    "Turn manga panels and screenplays into cinematic storyboards and narrated videos. AI-powered scene breakdowns, character consistency model sheets, 100+ character voices, and instant animatic video export.",
  keywords: [
    "AI storyboard generator",
    "manga storyboard maker",
    "script to storyboard AI",
    "manga recap video maker",
    "manga to video AI",
    "character consistency model sheet",
    "anime storyboard studio",
    "AI animatic generator",
    "anime recap generator",
    "AI voice manga",
    "manga panel to video",
    "youtube shorts manga tool",
    "visual director AI",
  ],
  authors: [{ name: "MotionRecap" }],
  creator: "MotionRecap",
  publisher: "MotionRecap",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.SITE_URL,
    siteName: "MotionRecap",
    title: "MotionRecap — AI Manga Storyboard Studio & Video Generator",
    description:
      "Turn manga panels and screenplays into cinematic storyboards, character model sheets, and narrated videos in minutes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MotionRecap — AI Manga Storyboard Studio and Animated Video Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MotionRecap — AI Manga Storyboard Studio & Video Generator",
    description:
      "Turn manga panels and screenplays into cinematic storyboards, character model sheets, and narrated videos in minutes.",
    images: ["/og-image.png"],
    creator: "@MotionRecap",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${bricolage.variable}`}>
      <body className="font-sans antialiased bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-XJBVFPSTCC"
        ></script>
        <script>
          {`
    window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XJBVFPSTCC');
  `}
        </script>
        {children}
        <Toaster position="bottom-right" />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
